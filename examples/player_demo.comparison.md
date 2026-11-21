# Race comparison

Before: `player_demo.baseline.csv`; after: `player_demo.csv`.
Positive time differences mean slower. Positions below are on-track positions;
check results JSON separately for compound-rule DSQs. Reports describe observed
mechanisms, not proof that a decision is globally optimal.

| Car | Position before → after | Total change (s) | Pit-cost change (s) | Traffic change (s) |
| --- | --- | ---: | ---: | ---: |
| car_01 | 2 → 1 | -5.225 | -15.000 | +2.100 |
| car_02 | 1 → 2 | -1.050 | +0.000 | -1.050 |
| car_03 | 6 → 6 | +0.000 | +0.000 | +0.000 |
| car_04 | 4 → 4 | +0.350 | +0.000 | +0.350 |
| car_05 | 8 → 8 | +0.000 | +0.000 | +0.000 |
| car_06 | 3 → 3 | +0.350 | +0.000 | +0.350 |
| car_07 | 10 → 10 | +0.000 | +0.000 | +0.000 |
| car_08 | 5 → 5 | +0.000 | +0.000 | +0.000 |
| car_09 | 9 → 9 | +0.000 | +0.000 | +0.000 |
| car_10 | 7 → 7 | +0.000 | +0.000 | +0.000 |

## car_01

Traffic: 4 affected laps / 1.40 s → 10 affected laps / 3.50 s.
Before stops: L11 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).
After stops: L20 HARD (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +7.675 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +2.100 s; pit_loss_s: -15.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 28 | leader / — / 0.00 s / leader | car_04 / 0.567864 s / 0.35 s / close following |
| 29 | leader / — / 0.00 s / leader | car_04 / 0.231069 s / 0.35 s / close following |
| 30 | leader / — / 0.00 s / leader | car_04 / 0.257615 s / 0.35 s / close following |
| 31 | leader / — / 0.00 s / leader | car_04 / 0.076565 s / 0.35 s / close following |
| 32 | leader / — / 0.00 s / leader | car_04 / 0.163934 s / 0.35 s / close following |
| 33 | leader / — / 0.00 s / leader | car_04 / 0.403133 s / 0.35 s / close following |
| 34 | leader / — / 0.00 s / leader | car_04 / 0.264247 s / 0.35 s / close following |
| 35 | leader / — / 0.00 s / leader | car_04 / 0.327947 s / 0.35 s / close following |
| 36 | leader / — / 0.00 s / leader | car_04 / 0.342676 s / 0.35 s / close following |
| 37 | leader / — / 0.00 s / leader | car_04 / 0.298556 s / 0.35 s / close following |
| 45 | car_02 / 0.504224 s / 0.35 s / close following | leader / — / 0.00 s / leader |
| 46 | car_02 / 0.493348 s / 0.35 s / close following | leader / — / 0.00 s / leader |
| 47 | car_02 / 0.764854 s / 0.35 s / close following | leader / — / 0.00 s / leader |
| 49 | car_02 / 0.786853 s / 0.35 s / close following | leader / — / 0.00 s / leader |

## car_02

Traffic: 5 affected laps / 1.75 s → 2 affected laps / 0.70 s.
Before stops: L11 HARD (15.0 s, SC), L43 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L43 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: -1.050 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_01 / 0.350000 s / 0.35 s / close following | car_01 / 0.350000 s / 0.35 s / close following |
| 5 | car_01 / 0.831100 s / 0.35 s / close following | car_01 / 0.831100 s / 0.35 s / close following |
| 26 | car_01 / 0.969506 s / 0.35 s / close following | leader / — / 0.00 s / leader |
| 30 | car_01 / 0.965643 s / 0.35 s / close following | leader / — / 0.00 s / leader |
| 37 | car_01 / 0.931075 s / 0.35 s / close following | leader / — / 0.00 s / leader |

## car_03

Traffic: 30 affected laps / 10.50 s → 30 affected laps / 10.50 s.
Before stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_02 / 0.350000 s / 0.35 s / close following | car_02 / 0.350000 s / 0.35 s / close following |
| 5 | car_04 / 0.859459 s / 0.35 s / close following | car_04 / 0.859459 s / 0.35 s / close following |
| 6 | car_06 / 0.317155 s / 0.35 s / close following | car_06 / 0.317155 s / 0.35 s / close following |
| 7 | car_08 / 0.313348 s / 0.35 s / close following | car_08 / 0.313348 s / 0.35 s / close following |
| 8 | car_08 / 0.855931 s / 0.35 s / close following | car_08 / 0.855931 s / 0.35 s / close following |
| 9 | car_10 / 0.645932 s / 0.35 s / close following | car_10 / 0.645932 s / 0.35 s / close following |
| 19 | car_10 / 0.877030 s / 0.35 s / close following | car_10 / 0.877030 s / 0.35 s / close following |
| 21 | car_10 / 0.748419 s / 0.35 s / close following | car_10 / 0.748419 s / 0.35 s / close following |
| 22 | car_10 / 0.994266 s / 0.35 s / close following | car_10 / 0.994266 s / 0.35 s / close following |
| 24 | car_10 / 0.696375 s / 0.35 s / close following | car_10 / 0.696375 s / 0.35 s / close following |
| 25 | car_10 / 0.720473 s / 0.35 s / close following | car_10 / 0.720473 s / 0.35 s / close following |
| 26 | car_10 / 0.566683 s / 0.35 s / close following | car_10 / 0.566683 s / 0.35 s / close following |
| 27 | car_10 / 0.621316 s / 0.35 s / close following | car_10 / 0.621316 s / 0.35 s / close following |
| 28 | car_10 / 0.712655 s / 0.35 s / close following | car_10 / 0.712655 s / 0.35 s / close following |
| 29 | car_10 / 0.810706 s / 0.35 s / close following | car_10 / 0.810706 s / 0.35 s / close following |
| 30 | car_10 / 0.989814 s / 0.35 s / close following | car_10 / 0.989814 s / 0.35 s / close following |
| 32 | car_10 / 0.728429 s / 0.35 s / close following | car_10 / 0.728429 s / 0.35 s / close following |
| 33 | car_10 / 0.588923 s / 0.35 s / close following | car_10 / 0.588923 s / 0.35 s / close following |
| 34 | car_10 / 0.825398 s / 0.35 s / close following | car_10 / 0.825398 s / 0.35 s / close following |
| 35 | car_10 / 0.739796 s / 0.35 s / close following | car_10 / 0.739796 s / 0.35 s / close following |
| 36 | car_10 / 0.874655 s / 0.35 s / close following | car_10 / 0.874655 s / 0.35 s / close following |
| 37 | car_10 / 0.930665 s / 0.35 s / close following | car_10 / 0.930665 s / 0.35 s / close following |
| 39 | car_10 / 0.946692 s / 0.35 s / close following | car_10 / 0.946692 s / 0.35 s / close following |
| 41 | car_10 / 0.577050 s / 0.35 s / close following | car_10 / 0.577050 s / 0.35 s / close following |
| 44 | car_08 / 0.381378 s / 0.35 s / close following | car_08 / 0.381378 s / 0.35 s / close following |
| 45 | car_08 / 0.870163 s / 0.35 s / close following | car_08 / 0.870163 s / 0.35 s / close following |
| 46 | car_08 / 0.948284 s / 0.35 s / close following | car_08 / 0.948284 s / 0.35 s / close following |
| 48 | car_08 / 0.861545 s / 0.35 s / close following | car_08 / 0.861545 s / 0.35 s / close following |
| 49 | car_08 / 0.849005 s / 0.35 s / close following | car_08 / 0.849005 s / 0.35 s / close following |
| 50 | car_08 / 0.850128 s / 0.35 s / close following | car_08 / 0.850128 s / 0.35 s / close following |

## car_04

Traffic: 9 affected laps / 3.15 s → 10 affected laps / 3.50 s.
Before stops: L11 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.350 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_03 / 0.350000 s / 0.35 s / close following | car_03 / 0.350000 s / 0.35 s / close following |
| 5 | car_02 / 0.584474 s / 0.35 s / close following | car_02 / 0.584474 s / 0.35 s / close following |
| 6 | car_02 / 0.587192 s / 0.35 s / close following | car_02 / 0.587192 s / 0.35 s / close following |
| 7 | car_02 / 0.897674 s / 0.35 s / close following | car_02 / 0.897674 s / 0.35 s / close following |
| 38 | car_02 / 3.004100 s / 0.00 s / gap outside traffic threshold | car_01 / 0.120814 s / 0.35 s / close following |
| 39 | car_02 / 3.030709 s / 0.00 s / gap outside traffic threshold | car_01 / 0.976561 s / 0.35 s / close following |
| 45 | car_06 / 0.683968 s / 0.35 s / close following | car_06 / 1.033968 s / 0.00 s / gap outside traffic threshold |
| 46 | car_06 / 0.835180 s / 0.35 s / close following | car_06 / 0.835180 s / 0.35 s / close following |
| 47 | car_06 / 0.834636 s / 0.35 s / close following | car_06 / 0.834636 s / 0.35 s / close following |
| 48 | car_06 / 0.738581 s / 0.35 s / close following | car_06 / 0.738581 s / 0.35 s / close following |
| 49 | car_06 / 0.897905 s / 0.35 s / close following | car_06 / 0.897905 s / 0.35 s / close following |

## car_05

Traffic: 22 affected laps / 7.70 s → 22 affected laps / 7.70 s.
Before stops: L12 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).
After stops: L12 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_04 / 0.350000 s / 0.35 s / close following | car_04 / 0.350000 s / 0.35 s / close following |
| 5 | car_08 / 0.500000 s / 0.35 s / close following | car_08 / 0.500000 s / 0.35 s / close following |
| 6 | car_10 / 0.435236 s / 0.35 s / close following | car_10 / 0.435236 s / 0.35 s / close following |
| 7 | car_10 / 0.892897 s / 0.35 s / close following | car_10 / 0.892897 s / 0.35 s / close following |
| 10 | car_03 / 0.861685 s / 0.35 s / close following | car_03 / 0.861685 s / 0.35 s / close following |
| 17 | car_03 / 0.798781 s / 0.35 s / close following | car_03 / 0.798781 s / 0.35 s / close following |
| 20 | car_03 / 0.716270 s / 0.35 s / close following | car_03 / 0.716270 s / 0.35 s / close following |
| 22 | car_03 / 0.792112 s / 0.35 s / close following | car_03 / 0.792112 s / 0.35 s / close following |
| 23 | car_03 / 0.823263 s / 0.35 s / close following | car_03 / 0.823263 s / 0.35 s / close following |
| 28 | car_03 / 0.741688 s / 0.35 s / close following | car_03 / 0.741688 s / 0.35 s / close following |
| 29 | car_03 / 0.735390 s / 0.35 s / close following | car_03 / 0.735390 s / 0.35 s / close following |
| 30 | car_03 / 0.579663 s / 0.35 s / close following | car_03 / 0.579663 s / 0.35 s / close following |
| 31 | car_03 / 0.744214 s / 0.35 s / close following | car_03 / 0.744214 s / 0.35 s / close following |
| 33 | car_03 / 0.856143 s / 0.35 s / close following | car_03 / 0.856143 s / 0.35 s / close following |
| 34 | car_03 / 0.845373 s / 0.35 s / close following | car_03 / 0.845373 s / 0.35 s / close following |
| 36 | car_03 / 0.981411 s / 0.35 s / close following | car_03 / 0.981411 s / 0.35 s / close following |
| 38 | car_03 / 0.626915 s / 0.35 s / close following | car_03 / 0.626915 s / 0.35 s / close following |
| 40 | car_03 / 0.681298 s / 0.35 s / close following | car_03 / 0.681298 s / 0.35 s / close following |
| 46 | car_09 / 0.155643 s / 0.35 s / close following | car_09 / 0.155643 s / 0.35 s / close following |
| 47 | car_10 / 0.902991 s / 0.35 s / close following | car_10 / 0.902991 s / 0.35 s / close following |
| 48 | car_10 / 0.978299 s / 0.35 s / close following | car_10 / 0.978299 s / 0.35 s / close following |
| 50 | car_10 / 0.675136 s / 0.35 s / close following | car_10 / 0.675136 s / 0.35 s / close following |

## car_06

Traffic: 3 affected laps / 1.05 s → 4 affected laps / 1.40 s.
Before stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.350 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_05 / 0.350000 s / 0.35 s / close following | car_05 / 0.350000 s / 0.35 s / close following |
| 5 | car_03 / 0.500000 s / 0.35 s / close following | car_03 / 0.500000 s / 0.35 s / close following |
| 9 | car_04 / 0.948904 s / 0.35 s / close following | car_04 / 0.948904 s / 0.35 s / close following |
| 21 | car_04 / 2.973661 s / 0.00 s / gap outside traffic threshold | car_01 / 0.626305 s / 0.35 s / close following |

## car_07

Traffic: 9 affected laps / 3.15 s → 9 affected laps / 3.15 s.
Before stops: L12 HARD (15.0 s, SC), L45 SOFT (22.0 s, green).
After stops: L12 HARD (15.0 s, SC), L45 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_06 / 0.350000 s / 0.35 s / close following | car_06 / 0.350000 s / 0.35 s / close following |
| 5 | car_10 / 0.500000 s / 0.35 s / close following | car_10 / 0.500000 s / 0.35 s / close following |
| 6 | car_05 / 0.821585 s / 0.35 s / close following | car_05 / 0.821585 s / 0.35 s / close following |
| 8 | car_05 / 0.681356 s / 0.35 s / close following | car_05 / 0.681356 s / 0.35 s / close following |
| 24 | car_05 / 0.951487 s / 0.35 s / close following | car_05 / 0.951487 s / 0.35 s / close following |
| 27 | car_05 / 0.901917 s / 0.35 s / close following | car_05 / 0.901917 s / 0.35 s / close following |
| 32 | car_05 / 0.814545 s / 0.35 s / close following | car_05 / 0.814545 s / 0.35 s / close following |
| 35 | car_05 / 0.818849 s / 0.35 s / close following | car_05 / 0.818849 s / 0.35 s / close following |
| 39 | car_05 / 0.972222 s / 0.35 s / close following | car_05 / 0.972222 s / 0.35 s / close following |

## car_08

Traffic: 4 affected laps / 1.40 s → 4 affected laps / 1.40 s.
Before stops: L11 HARD (15.0 s, SC), L43 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L43 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_07 / 0.350000 s / 0.35 s / close following | car_07 / 0.350000 s / 0.35 s / close following |
| 5 | car_06 / 0.500000 s / 0.35 s / close following | car_06 / 0.500000 s / 0.35 s / close following |
| 6 | car_03 / 0.416847 s / 0.35 s / close following | car_03 / 0.416847 s / 0.35 s / close following |
| 13 | car_06 / 0.963176 s / 0.35 s / close following | car_06 / 0.963176 s / 0.35 s / close following |

## car_09

Traffic: 11 affected laps / 3.85 s → 11 affected laps / 3.85 s.
Before stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L42 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_08 / 0.350000 s / 0.35 s / close following | car_08 / 0.350000 s / 0.35 s / close following |
| 5 | car_07 / 0.500000 s / 0.35 s / close following | car_07 / 0.500000 s / 0.35 s / close following |
| 6 | car_07 / 0.605444 s / 0.35 s / close following | car_07 / 0.605444 s / 0.35 s / close following |
| 7 | car_07 / 0.547194 s / 0.35 s / close following | car_07 / 0.547194 s / 0.35 s / close following |
| 9 | car_07 / 0.681936 s / 0.35 s / close following | car_07 / 0.681936 s / 0.35 s / close following |
| 10 | car_07 / 0.759289 s / 0.35 s / close following | car_07 / 0.759289 s / 0.35 s / close following |
| 45 | car_10 / 0.130558 s / 0.35 s / close following | car_10 / 0.130558 s / 0.35 s / close following |
| 46 | car_10 / 0.777421 s / 0.35 s / close following | car_10 / 0.777421 s / 0.35 s / close following |
| 47 | car_05 / 0.088991 s / 0.35 s / close following | car_05 / 0.088991 s / 0.35 s / close following |
| 48 | car_05 / 0.139893 s / 0.35 s / close following | car_05 / 0.139893 s / 0.35 s / close following |
| 49 | car_05 / 0.258408 s / 0.35 s / close following | car_05 / 0.258408 s / 0.35 s / close following |

## car_10

Traffic: 5 affected laps / 1.75 s → 5 affected laps / 1.75 s.
Before stops: L11 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).
After stops: L11 HARD (15.0 s, SC), L44 SOFT (22.0 s, green).

Component differences (after minus before): base_time_s: +0.000 s; pace_delta_s: +0.000 s; tyre_delta_s: +0.000 s; fuel_effect_s: +0.000 s; noise_s: +0.000 s; traffic_loss_s: +0.000 s; pit_loss_s: +0.000 s; queue_loss_s: +0.000 s; time_floor_adjustment_s: +0.000 s.

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_09 / 0.350000 s / 0.35 s / close following | car_09 / 0.350000 s / 0.35 s / close following |
| 5 | car_05 / 0.500000 s / 0.35 s / close following | car_05 / 0.500000 s / 0.35 s / close following |
| 6 | car_08 / 0.780306 s / 0.35 s / close following | car_08 / 0.780306 s / 0.35 s / close following |
| 7 | car_03 / 0.563687 s / 0.35 s / close following | car_03 / 0.563687 s / 0.35 s / close following |
| 8 | car_03 / 0.178325 s / 0.35 s / close following | car_03 / 0.178325 s / 0.35 s / close following |
