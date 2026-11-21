# Pit Wall Rivals / F1 Strategy

**New playable battle: Steal the Podium.** Enter a six-call closing stint at P4,
1.8s behind Vega. He reacts to your previous stop. Chase P3, inspect the gap
timeline, then rewind a call into a new branch. The 20-lap Grand Prix remains
available from the battle menu. See [RIVALS.md](RIVALS.md).

**Learn while playing:** the optional coach now adds move plans, transparent
tyre-investment estimates, move replays, four short strategy lessons, earned
milestones and a browser-local race journal. See [LEARNING.md](LEARNING.md).

**Browser game available:** see [WEB_UI.md](WEB_UI.md). On this prepared PC:

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy.webserver --open
```

Choose tyres, make each lap's pit call, inspect all ten cars' decision effects,
and download results. The built React UI is served by FastAPI on one local port.

**Simulation revision 2:** playable terminal mode, independent randomness for
events/per-car lap variations, and detailed decision/comparison explanations.
Your SC pit-cost setting of **15 seconds** is preserved.

**This PC is prepared:** see [LOCAL_SETUP.md](LOCAL_SETUP.md) for the VS Code
launcher, race/debug shortcuts, and project-local Python environment.

A turn-based, 20-game-lap (42 equivalent laps), 10-car dry race on a single prototype circuit. The core
uses only Python's standard library. All model values are **illustrative,
uncalibrated defaults**, not measured F1 performance data.

## Run

Use Python 3.11 or newer (3.12 recommended for this project). From this folder:

```powershell
python -m f1_strategy --seed 42 --output examples/new_race.csv
python -m unittest discover -s tests -v
```

No install or network access is needed for those commands. If `python` is not on
PATH, substitute the full path to a working Python executable. To install as a
package, optionally use a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -e .
.venv\Scripts\python -m f1_strategy --seed 42
```

The CLI writes a lap CSV, `.results.json` classification and `.config.json`
parameter snapshot. Historical revision-1 examples are preserved under
`examples/history/`; `examples/player_demo.*` demonstrates revision 2.
Without `--play` the demonstration uses ten rule-based cars.

## Play now in the VS Code terminal

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy --play --seed 42 --output examples/player_race.csv
```

Choose starting tyres, then press Enter to stay out or S/M/H to pit before
each lap. Q (or end of input) saves a partial race; partial classifications
are marked RUNNING. There is no resume feature yet. Default opponents remain
the nine baseline bots. The terminal shows positions, gaps, tyre ages, the
coming lap's SC flag, and the pit cost before you decide.

After each decision all ten cars get a breakdown: position movement, pit cost,
tyre/fuel effects, traffic loss with the pre-lap car ahead/gap and reason,
noise, and SC queue delay. A pit call is compared with staying out. Staying out
is compared with the baseline bot's pit recommendation, or Hard (Medium if
already on Hard). This alternative is stated before the prompt. Opponents'
calls are held fixed and the fork uses identical random variations. These are
**immediate, one-lap effects**, not a full-race evaluation of the alternative.

Exports use the chosen CSV stem:

- `.decisions.json`: chosen/alternative action and every car's component changes
  for each turn.
- `.baseline.csv`: baseline strategy replay with the same starting tyres, config,
  seed and number of completed laps.
- `.comparison.md`: full-race (or played-distance) comparison with that replay,
  including every traffic-affected lap, front car, gap and penalty reason.
- `.config.json` and `.results.json`: parameters, seed, starting tyres,
  simulation revision, completion state and classification.

The baseline report compares the entire sequence of your choices with the bot
strategy. It does not isolate the long-run causal effect of each individual
choice. The one-lap forks isolate immediate effects conditional on the current
state and opponent calls. A locally slower pit stop may still help later.

Compare two saved races:

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy --compare examples/history/race1_sc12.csv examples/history/race2_sc15.csv --output examples/sc_cost_12_vs_15.md
```

Use distinct filenames to retain runs. Comparison requires matching car/lap
pairs. Old CSVs lack component/front-gap fields; the report reconstructs front
gaps from the prior lap (lap 1 assumes the supplied config's grid spacing) and
explicitly leaves unrecorded components unattributed.

### Randomness revision

Revision 2 separates the event RNG from per-car lap-noise RNGs. Noise is drawn
once per car per lap, including SC laps where it is ignored. Running order and
pit choices therefore cannot redistribute noise or change the event schedule
under a common seed. This changes the seed-42 race relative to revision 1;
compare runs **within the same revision**, never treat the old and new seed-42
results as the same conditions. Existing historical CSVs are retained.

## Structure

| File | Responsibility |
| --- | --- |
| `f1_strategy/default_config.json` | All race/track/tyre model parameters |
| `f1_strategy/config.py` | Typed configuration and validation |
| `f1_strategy/tyres.py` | Pure tyre pace function |
| `f1_strategy/simulator.py` | State, lap transitions, rules and CSV export |
| `f1_strategy/strategies.py` | Deterministic baseline decisions |
| `f1_strategy/env.py` | Optional Gymnasium interface; no learning code |
| `f1_strategy/cli.py` | Complete demonstration race |
| `f1_strategy/player.py` | Player prompts and one-lap decision alternatives |
| `f1_strategy/analysis.py` | Component accounting and per-car traffic reports |
| `tests/` | Tyre, pit, race, event and optional environment tests |
| `CALIBRATION.md` | FastF1 fitting workflow and parameter mapping |

Copy the JSON file to make an alternative configuration:

```powershell
python -m f1_strategy --config my_track.json --seed 42
```

## Playing one turn

```python
from f1_strategy import RaceSimulator, load_config
from f1_strategy.strategies import baseline_actions

race = RaceSimulator(load_config())
state = race.reset(seed=42, starting_compounds=["SOFT"] + ["MEDIUM"] * 9)
while not race.done:
    state = race.observe()  # Includes SC status for the coming lap.
    actions = baseline_actions(race)
    # Replace this condition with user input later.
    actions["car_01"] = "HARD" if state["completed_laps"] == 18 else None
    lap_records = race.step(actions)
race.write_csv("my_race.csv")
print(race.classification())
```

Car IDs are stable (`car_01` through `car_10`). Actions are `None` (stay out),
`SOFT`, `MEDIUM`, or `HARD`. Omitted car IDs stay out. Reset chooses starting
tyres at no pit cost. A call on turn 19 means pit **before driving lap 19**;
that lap uses the fresh compound and pays the pit loss. This is a deliberate
lap-level approximation, including when pitting on lap 1 or lap 20.

Invalid car IDs/compounds fail before changing race state. `observe()` returns
a detached JSON-ready snapshot; `step()` returns that lap's immutable records.
Use a separate simulator instance per future API game/session.

## Model and timing

Each game lap covers `equivalent_laps / laps = 42 / 20 = 2.1` physical laps.
Base pace, car pace and traffic seconds scale with this distance. Fuel starts at
84 kg and burns 4.2 kg per game lap. Noise standard deviation scales with the
square root of distance; a pit stop is charged once without scaling.

```text
tyre_pace(age) = base_delta + degradation * age
              + cliff_coefficient * max(0, age - cliff_laps) ** cliff_exponent
driving_time = (base_lap + car_pace_delta) * distance
             + integral(tyre_pace, age, age + distance)
             + mean_fuel_during_turn * fuel_s_per_kg * distance
lap_time = driving_time + traffic + noise + pit_loss
```

- Tyre age uses **equivalent physical laps before the turn**. A fresh set logs
  age 0 and reaches 2.1 after one game lap. The integral includes a cliff crossed
  inside a turn. The UI also displays game-lap age to avoid mixing units.
- Fuel burn and tyre wear continue under SC; no refuelling is supported.
- Configs without `equivalent_laps` use one equivalent lap per turn.
- Elapsed time starts with a configurable grid offset. Positions are sorted by
  elapsed time, with stable car-ID tie breaking. Faster cars can pass between
  lap boundaries. Traffic adds a fixed penalty if the pre-lap gap to the car
  ahead is strictly below one second. Neither car may be pitting that lap.
- A safety car starts with a Bernoulli draw before an eligible turn and lasts
  a sampled duration in equivalent laps, rounded up to whole game turns. The
  per-turn event chance is `1 - (1 - probability) ** distance`. Players see the flag before acting.
  During SC, all cars use the configured SC pace, pit losses fall, and no
  on-track passes occur among non-pitting cars. Pitters can lose positions.
  Queue spacing is enforced by delaying cars; existing large gaps do not
  instantly shrink. Back-to-back events are possible. This version does not
  model a realistic SC train catching the leader.
- Fuel and tyre age advance normally under SC; tyre pace differences, noise
  and traffic penalties are suspended. A lap-time floor prevents negative times
  under extreme noise settings. SC queue delays are included in lap time.
- A compound counts only after completing a lap on it. At the finish, cars that
  used fewer than `required_compounds` are marked **DSQ**, ranked below legal
  finishers. They receive no forced strategy correction. This is the game's
  simplified dry-race rule, not a full sporting-regulation implementation.

The CSV has one row per car per lap (200 for the defaults): `lap`, `car_id`,
`position`, `lap_time_s`, `elapsed_s`, `tyre_age`, `compound`, `fuel_kg`,
`pitted`, `pit_loss_s`, `traffic_loss_s`, `safety_car`. Position is the on-track
lap-end position; final DSQ classification is stored separately in JSON.
`fuel_kg` is fuel before burn. Summed lap times plus grid offset equal elapsed
time. Full precision is retained.

Revision-2 logs additionally record `position_before`, `front_car_id`,
`gap_ahead_s`, `base_time_s`, `pace_delta_s`, `tyre_delta_s`, `fuel_effect_s`,
`noise_s`, `queue_loss_s`, and `time_floor_adjustment_s`. The nine time
components (base, pace, tyre, fuel, noise, traffic, pit, queue, floor adjustment)
sum to the logged lap time, within floating-point tolerance. Tyre and fuel
effects are zero under SC because their pace effect is suspended then.

Optional plotting after installing the calibration extra:

```python
import pandas as pd
import matplotlib.pyplot as plt

laps = pd.read_csv("examples/race_log.csv")
laps.pivot(index="lap", columns="car_id", values="position").plot()
plt.gca().invert_yaxis()
plt.ylabel("Position")
plt.show()
```

## Gymnasium compatibility

```powershell
python -m pip install -e ".[gym]"
python -m unittest discover -s tests -v
```

```python
from f1_strategy.env import RaceEnv
env = RaceEnv()
obs, info = env.reset(seed=42, options={"starting_compound": "SOFT"})
obs, reward, terminated, truncated, info = env.step(0)
```

Actions: 0 stay out, 1 Soft, 2 Medium, 3 Hard. The other nine cars follow the
baseline. Observations have stable car-ID rows and contain position, elapsed
time, compound, age, fuel, compound-use bits, laps remaining and the SC flag.
Future event duration is hidden. Arrays are fresh on every call.

Rewards are zero until the finish, then normalized finishing position in [0, 1]
or -1 for DSQ. This is a starter interface reward; race-time shaping can be
evaluated when training is requested. Race completion returns `terminated=True`,
`truncated=False`. Reset is required before stepping and after the finish.
The five-value step signature follows the [Gymnasium API](https://gymnasium.farama.org/api/env/).
No PPO agent is included. The optional `web` extra adds the FastAPI/React UI;
the core and Gymnasium adapter can still run independently.

## Verification and current limits

Core tests cover fresh pace, linear wear, cliff curvature, invalid ages, pit
costs, fresh-set resets, repeated compounds, compound-rule disqualification,
last-lap stops, fuel, traffic, safety-car timing/order, invalid-action atomicity,
seeded replay, CSV length, time accounting and configuration validation.
Optional tests run Gymnasium's `check_env` and a full environment episode.

On the prepared project-local Python 3.12 environment: **all 49 tests passed**,
including Gymnasium's environment checker and a complete episode. The sample race
and calibration-library import checks passed; `pip check` found no broken
requirements. The checker emits an advisory warning about unbounded observation
space maxima. FastF1 data downloads/fits have not been executed; no fitted
parameters or real-data accuracy claims are included.

Regression checks include a full 20-turn API race and Gymnasium episode,
exports, component accounting, and read-only forecasts. Controlled 20-turn and
42-turn runs agree on tyre age, fuel, and total time, including a matched pit stop.
The frontend passes 12 JavaScript tests and builds successfully.

Scope limits: no rain/VSC/DNFs, lap-1 congestion, blue flags/lapping, detailed
overtaking, tyre warmup/temperature, used-set inventory, team pit-box conflicts,
or sector timing. Every car completes 20 synchronized game laps even if its time
gap exceeds a lap. These are explicit approximations for the first playable
strategy core.

## Open-source stack and next inputs

The standard-library core runs locally on a normal CPU and needs no cloud
service or GPU. Keep calibration and optional training dependencies outside
the runtime loop. `pyproject.toml` declares Python and optional dependency
ranges. `requirements-local.lock.txt` records the resolved Windows/Python 3.12
dependency versions from this setup; revalidate on other platforms before
shared deployment or training.

| Component | Use | Upstream license |
| --- | --- | --- |
| FastF1 | Offline calibration | [MIT](https://github.com/theOehrly/Fast-F1/blob/main/LICENSE) |
| Gymnasium | Environment contract | [MIT](https://github.com/Farama-Foundation/Gymnasium/blob/main/LICENSE) |
| Stable-Baselines3 | Later PPO training | [MIT](https://github.com/DLR-RM/stable-baselines3/blob/master/LICENSE) |
| FastAPI | Later API | [MIT](https://github.com/fastapi/fastapi/blob/master/LICENSE) |
| React | Later UI | [MIT](https://github.com/react/react/blob/main/LICENSE) |

Choose a license for your own project before publishing. Preserve dependency
license notices when distributing them. FastF1's software license is separate
from permissions for underlying data, branding and assets.

Nothing else is needed to run the prototype. For the calibration phase, choose
a circuit and seasons (for example, a Bahrain dry race dataset), a common car
performance model versus unequal teams, and a realism target. For reproducible
experiments, save the JSON config, seed, Python/dependency versions and source
session identifiers alongside each run. The first browser-playable milestone
can follow terminal playtesting: a FastAPI session/turn API and React race screen
using these existing bots and explanations. PPO and real-data calibration are
not prerequisites for that prototype UI; keep the parameters labeled as
uncalibrated. Calibration, strategy benchmarking and PPO can follow without
replacing the core turn interface. The local API and browser UI are now
implemented; see [WEB_UI.md](WEB_UI.md) for running, limits and validation.

### Racing presentation

The race screen now has animated lap replays, a timing tower, follow camera,
visible pit-lane stops, optional sound and short stints that pause at decisions.
Radio explanations are optional to expand; detailed forecasts and car-by-car
comparisons live in Decision analysis. Movement between lap endpoints is
illustrative, not continuous car physics. See [WEB_UI.md](WEB_UI.md).

Validation: 49 Python unit/API/environment checks and 12 JavaScript tests.

### Pit-or-stay outlook

After every lap, the race banner shows the current pit loss and next-turn wear
cost. The forecast below the circuit compares 1/3/5 more game laps, clipped to
the remaining distance. Wear cost is relative to a fresh set of the same
compound at the start of that period, without a stop. Pit-vs-stay includes one
stop and the selected new compound; negative seconds mean pitting is faster.
The reference selector is for forecasting only. Selecting a pit tyre in the
pit wall makes the forecast follow that actual choice.

Forecasts share the simulator's distance, fuel and integrated tyre calculations.
They assume free air, current SC status on the first turn and green afterwards,
with no noise, rivals or future stops. They estimate time, not finishing position.
