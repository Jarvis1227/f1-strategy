# Calibrating with FastF1

This is a proposed statistical workflow, not an executed calibration. Fit one
track/season regime at a time and validate on held-out races. The model is an
approximation of strategy tradeoffs, not a telemetry physics model.

## 1. Collect and clean

Install the optional tools into your project virtual environment:

```powershell
python -m pip install -e ".[calibration]"
```

Starter extraction recipe (requires internet; choose your event and year):

```python
from pathlib import Path
import fastf1

cache = Path(".fastf1-cache")
cache.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(cache))
session = fastf1.get_session(2024, "Bahrain", "R")
session.load(telemetry=False, weather=True, messages=True)
laps = session.laps.copy()
mask = (
    laps["IsAccurate"].fillna(False)
    & laps["LapTime"].notna()
    & laps["PitInTime"].isna()
    & laps["PitOutTime"].isna()
    & laps["TrackStatus"].eq("1")
    & laps["Compound"].isin(["SOFT", "MEDIUM", "HARD"])
    & ~laps["Deleted"].fillna(False)
    & ~laps["FastF1Generated"].fillna(False)
)
clean = laps.loc[mask].copy()
clean["lap_s"] = clean["LapTime"].dt.total_seconds()
# TyreLife counts the current completed lap and may include earlier sessions.
clean["age_before"] = (clean["TyreLife"] - 1).clip(lower=0)
clean.to_csv("clean_laps.csv", index=False)
# Keep the unfiltered data for pit and safety-car analysis.
laps.to_pickle("all_laps.pkl")
```

These fields and their caveats are described in FastF1's
[timing data reference](https://github.com/theOehrly/Fast-F1/blob/main/docs/api_reference/timing_data.rst).
In particular, `IsAccurate` is a basic timing consistency check, not a guarantee
that a lap is representative free-air pace. `TyreLife` includes previous usage;
do not restart age at zero merely because the stint number changes.

Remove opening laps, restarts, obvious damage/retirement laps and wet conditions.
Join weather by session time and inspect track-temperature effects. Identify
clear-air laps using aligned timing/telemetry, exclude close traffic for tyre
fits, and retain those laps for a separate traffic fit. Avoid merely discarding
every slow lap: that can erase the cliff you want to estimate. Audit residuals
and record exclusion reasons. Soft/Medium/Hard are event-relative labels; record
the nominated physical compounds if pooling events.

## 2. Fit a joint pace model

Use the simulator's own zero-based tyre age and seconds throughout. A suggested
robust regression is:

```text
lap_s = track_intercept + driver/team_effect
        + fuel_coefficient * assumed_remaining_fuel
        + compound_offset + compound_slope * age_before
        + compound_cliff_coefficient * max(0, age_before - threshold)^exponent
        + track_evolution + weather_effect + error
```

Fix Medium offset to zero to identify the intercept. Fit nonnegative degradation
and cliff coefficients. Initially fix exponent to 2; search plausible integer
thresholds and fit the remaining coefficients with bounded robust least squares.
Select thresholds using validation across stints/races, not the training residual
alone. Vary fuel/evolution assumptions and report uncertainty. Use a driver/team
effect or a common-car normalization rather than learning car advantage as tyre
performance. Long stints are strategy-selected: a lack of old tyres makes the
cliff weakly identified. Keep a conservative prior rather than inventing a fit.

Fuel burn and tyre ageing act in opposite directions and are confounded within
each stint; elapsed race lap also correlates with track evolution. FastF1 lap
times alone do not uniquely identify fuel mass, burn rate and seconds per kg.
Use an external fuel assumption and sensitivity analysis, and label it as such.
The same caution applies to interpreting residual traffic penalties causally.

## 3. Map estimates into every configuration field

The following are proposed estimators/model choices, not facts supplied directly
by FastF1:

| Config field | Calibration or selection |
| --- | --- |
| `track` | Session circuit identifier plus season/model version. |
| `laps`, `cars` | Use the 20-turn/10-car game format, with `equivalent_laps=42`. Actual session lengths/grid sizes inform calibration but need not override game dimensions. |
| `base_lap_s` | Fitted clean-air intercept, with Medium offset fixed to zero and fuel contribution removed. Avoid using the raw fastest lap as a race baseline. |
| `car_pace_step_s` | Estimate driver/team residual effects after controlling for compounds/fuel. This v0.1 uses a regular grid of offsets: approximate the desired spread with a step, or set zero for equal cars. Real team effects need a future per-car config. |
| `grid_gap_s` | Chosen initial time-offset approximation. Compare first green-lap field gaps, but do not mistake qualifying time gaps for physical grid gaps. |
| `lap_noise_std_s` | Robust residual dispersion on clean laps after all fitted effects; exclude incidents/pits. Check whether Gaussian independent noise is adequate. |
| `tyres.*.base_delta_s` | Compound intercept differences at comparable fuel, age and conditions; Medium = 0. |
| `tyres.*.degradation_s_per_lap` | Nonnegative age coefficient before the fitted cliff. |
| `tyres.*.cliff_laps` | Held-out-selected integer hinge point; needs long-stint evidence. |
| `tyres.*.cliff_coefficient` | Nonnegative excess-age coefficient; inspect old-tyre residuals and uncertainty. |
| `tyres.*.cliff_exponent` | Start with 2. Only fit it jointly with the threshold when data support the extra flexibility. |
| `fuel_start_kg` | External assumption/prior; not directly observed here. Scale to 42 equivalent laps (84 kg at the current 2 kg/lap prior). |
| `fuel_burn_kg_per_lap` | External engineering prior; check against assumed starting mass. This version burns the same amount under SC. |
| `fuel_s_per_kg` | External prior or constrained estimate using multiple stints; run sensitivity sweeps. Never claim a unique estimate from lap slope alone. |
| `pit_loss_green_s` | Sum excess time over a window containing in-lap and out-lap against predicted non-pit pace. Separate slow service/incidents; use a robust typical loss. Pit-lane duration alone omits the counterfactual racing time. |
| `pit_loss_sc_s` | Repeat the counterfactual pit analysis on SC windows; exclude changing SC/VSC states and restarts. Compare with cars staying out. |
| `required_compounds` | A game-rule choice (2), not a fitted pace parameter. |
| `traffic_gap_s` | Align car crossing/session times and estimate front-car gap. Compare residual losses across gap bins; 1 s is the starting game threshold. Remove lapped-car and pit/restart ambiguity. |
| `traffic_penalty_s` | Typical conditional residual loss inside the threshold, matched by car, tyre age, lap and weather. Validate on separate laps; faster cars catching slower cars create selection bias. |
| `sc_start_probability` | SC starts / eligible non-SC lap opportunities, pooled over several comparable races. Use uncertainty intervals for rare events. |
| `sc_min_laps`, `sc_max_laps` | Duration range from SC episodes, mapped to full simulated laps. Uniform durations are a v0.1 approximation; validate their mean and tails. |
| `sc_lap_s` | Typical complete SC lap time after excluding pit, deployment-transition and restart laps. |
| `sc_queue_gap_s` | Lower-tail stable following gaps in an established SC train; this simulator enforces a minimum gap but does not recreate catch-up dynamics. |

Use `session.track_status` and session-time transitions to identify SC periods
from unfiltered data. A lap containing an SC status does not imply the whole
lap was under SC; this engine deliberately rounds events to lap boundaries.
Keep VSC separate because its dynamics differ and v0.1 does not implement it.

## 4. Validate strategy behavior

Split by race/session or whole stint, never random adjacent laps. Check lap-time
error by compound and age, residuals versus race lap/temperature, predicted stint
lengths, typical pit losses, SC frequency/duration, and the distribution of race
times. Bootstrap across stints or races for uncertainty rather than treating
correlated laps as independent samples.

Replay one-stop and two-stop schedules using identical seeds. Sweep fuel,
degradation and pit-cost assumptions and check that winning strategies change
plausibly. Compare observed strategies as evidence, not proof of optimality:
real teams have information and constraints this engine omits. A fitted result
must beat a simple linear-wear baseline on held-out data before replacing the
defaults. Save the source session list, cleaning rules, fit code, uncertainty
and resulting JSON together. No actual calibration is bundled with v0.1.


All fitted pace, degradation, fuel-burn and SC-probability parameters retain
physical-lap units. `laps=20` and `equivalent_laps=42` apply the distance
compression centrally; do not multiply fitted degradation again. Pit-loss
seconds and the one-second following threshold do not scale. SC durations are
rounded up to game turns, so event timing/positions are coarser than a full race.
