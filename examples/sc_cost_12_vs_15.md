# Race comparison

Before: `race1_sc12.csv`; after: `race2_sc15.csv`.
Positive time differences mean slower. Positions below are on-track positions;
check results JSON separately for compound-rule DSQs. Reports describe observed
mechanisms, not proof that a decision is globally optimal.

| Car | Position before → after | Total change (s) | Pit-cost change (s) | Traffic change (s) |
| --- | --- | ---: | ---: | ---: |
| car_01 | 1 → 1 | +0.000 | +0.000 | +0.000 |
| car_02 | 3 → 3 | +0.574 | +0.000 | +0.700 |
| car_03 | 2 → 2 | +0.000 | +0.000 | +0.000 |
| car_04 | 5 → 5 | -0.542 | +0.000 | -0.700 |
| car_05 | 4 → 4 | +1.469 | +0.000 | +1.750 |
| car_06 | 9 → 9 | +3.482 | +3.000 | +0.000 |
| car_07 | 6 → 6 | -1.663 | +0.000 | -1.050 |
| car_08 | 8 → 8 | -0.585 | +0.000 | -0.350 |
| car_09 | 7 → 7 | +1.085 | +0.000 | +0.700 |
| car_10 | 10 → 10 | +0.579 | +0.000 | +0.350 |

Legacy logs: front cars/gaps reconstructed from previous lap times.
Lap 1 assumes grid spacing 0.35 s. Noise and queue components were
not logged, so any remaining time difference cannot be separated using these files.

## car_01

Traffic: 9 affected laps / 3.15 s → 9 affected laps / 3.15 s.
Before stops: L24 HARD (22.0 s, green).
After stops: L24 HARD (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 2 | car_02 / 0.339995 s / 0.35 s / close following | car_02 / 0.339995 s / 0.35 s / close following |
| 3 | car_04 / 0.328708 s / 0.35 s / close following | car_04 / 0.328708 s / 0.35 s / close following |
| 4 | car_06 / 0.579252 s / 0.35 s / close following | car_06 / 0.579252 s / 0.35 s / close following |
| 7 | car_08 / 0.098054 s / 0.35 s / close following | car_08 / 0.098054 s / 0.35 s / close following |
| 8 | car_10 / 0.051260 s / 0.35 s / close following | car_10 / 0.051260 s / 0.35 s / close following |
| 9 | car_10 / 0.887317 s / 0.35 s / close following | car_10 / 0.887317 s / 0.35 s / close following |
| 31 | car_08 / 0.464487 s / 0.35 s / close following | car_08 / 0.464487 s / 0.35 s / close following |
| 32 | car_08 / 0.193193 s / 0.35 s / close following | car_08 / 0.193193 s / 0.35 s / close following |
| 33 | car_08 / 0.066982 s / 0.35 s / close following | car_08 / 0.066982 s / 0.35 s / close following |

## car_02

Traffic: 1 affected laps / 0.35 s → 3 affected laps / 1.05 s.
Before stops: L14 HARD (22.0 s, green), L46 SOFT (22.0 s, green).
After stops: L14 HARD (22.0 s, green), L46 SOFT (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_01 / 0.350000 s / 0.35 s / close following | car_01 / 0.350000 s / 0.35 s / close following |
| 47 | car_05 / 3.648113 s / 0.00 s / gap outside traffic threshold | car_07 / 0.850588 s / 0.35 s / close following |
| 48 | car_05 / 1.350742 s / 0.00 s / gap outside traffic threshold | car_05 / 0.106094 s / 0.35 s / close following |

## car_03

Traffic: 10 affected laps / 3.50 s → 10 affected laps / 3.50 s.
Before stops: L22 HARD (22.0 s, green).
After stops: L22 HARD (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_02 / 0.350000 s / 0.35 s / close following | car_02 / 0.350000 s / 0.35 s / close following |
| 2 | car_06 / 0.089712 s / 0.35 s / close following | car_06 / 0.089712 s / 0.35 s / close following |
| 4 | car_08 / 0.245310 s / 0.35 s / close following | car_08 / 0.245310 s / 0.35 s / close following |
| 5 | car_10 / 0.066088 s / 0.35 s / close following | car_10 / 0.066088 s / 0.35 s / close following |
| 6 | car_10 / 0.583256 s / 0.35 s / close following | car_10 / 0.583256 s / 0.35 s / close following |
| 7 | car_10 / 0.968784 s / 0.35 s / close following | car_10 / 0.968784 s / 0.35 s / close following |
| 10 | car_01 / 0.651490 s / 0.35 s / close following | car_01 / 0.651490 s / 0.35 s / close following |
| 26 | car_10 / 0.279607 s / 0.35 s / close following | car_10 / 0.279607 s / 0.35 s / close following |
| 34 | car_08 / 0.739360 s / 0.35 s / close following | car_08 / 0.739360 s / 0.35 s / close following |
| 35 | car_08 / 0.127001 s / 0.35 s / close following | car_08 / 0.127001 s / 0.35 s / close following |

## car_04

Traffic: 4 affected laps / 1.40 s → 2 affected laps / 0.70 s.
Before stops: L15 HARD (22.0 s, green), L48 SOFT (22.0 s, green).
After stops: L15 HARD (22.0 s, green), L48 SOFT (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_03 / 0.350000 s / 0.35 s / close following | car_03 / 0.350000 s / 0.35 s / close following |
| 2 | car_01 / 0.618151 s / 0.35 s / close following | car_01 / 0.618151 s / 0.35 s / close following |
| 49 | car_09 / 0.148097 s / 0.35 s / close following | car_07 / 3.820259 s / 0.00 s / gap outside traffic threshold |
| 50 | car_07 / 0.106180 s / 0.35 s / close following | car_07 / 1.576464 s / 0.00 s / gap outside traffic threshold |

## car_05

Traffic: 11 affected laps / 3.85 s → 16 affected laps / 5.60 s.
Before stops: L23 HARD (22.0 s, green).
After stops: L23 HARD (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_04 / 0.350000 s / 0.35 s / close following | car_04 / 0.350000 s / 0.35 s / close following |
| 2 | car_03 / 0.634602 s / 0.35 s / close following | car_03 / 0.634602 s / 0.35 s / close following |
| 3 | car_08 / 0.649500 s / 0.35 s / close following | car_08 / 0.649500 s / 0.35 s / close following |
| 4 | car_10 / 0.469229 s / 0.35 s / close following | car_10 / 0.469229 s / 0.35 s / close following |
| 6 | car_03 / 0.870950 s / 0.35 s / close following | car_03 / 0.870950 s / 0.35 s / close following |
| 33 | car_10 / 0.989861 s / 0.35 s / close following | car_10 / 0.989861 s / 0.35 s / close following |
| 34 | car_10 / 0.514204 s / 0.35 s / close following | car_10 / 0.514204 s / 0.35 s / close following |
| 35 | car_10 / 0.209888 s / 0.35 s / close following | car_10 / 0.209888 s / 0.35 s / close following |
| 36 | car_10 / 0.212069 s / 0.35 s / close following | car_10 / 0.212069 s / 0.35 s / close following |
| 37 | car_10 / 0.476009 s / 0.35 s / close following | car_10 / 0.476009 s / 0.35 s / close following |
| 38 | car_06 / 1.525293 s / 0.00 s / gap outside traffic threshold | car_10 / 0.416694 s / 0.35 s / close following |
| 39 | car_06 / 2.138111 s / 0.00 s / gap outside traffic threshold | car_10 / 0.429512 s / 0.35 s / close following |
| 40 | car_08 / 2.339343 s / 0.00 s / gap outside traffic threshold | car_10 / 0.616867 s / 0.35 s / close following |
| 41 | car_08 / 1.993358 s / 0.00 s / gap outside traffic threshold | car_06 / 0.409283 s / 0.35 s / close following |
| 42 | car_08 / 1.466541 s / 0.00 s / gap outside traffic threshold | car_10 / 0.556604 s / 0.35 s / close following |
| 43 | car_08 / 1.217559 s / 0.00 s / gap outside traffic threshold | car_10 / 0.114527 s / 0.35 s / close following |
| 45 | car_08 / 0.440761 s / 0.35 s / close following | car_06 / 2.173231 s / 0.00 s / gap outside traffic threshold |

## car_06

Traffic: 15 affected laps / 5.25 s → 15 affected laps / 5.25 s.
Before stops: L13 HARD (22.0 s, green), L28 MEDIUM (12.0 s, SC), L49 SOFT (22.0 s, green).
After stops: L13 HARD (22.0 s, green), L28 MEDIUM (15.0 s, SC), L49 SOFT (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_05 / 0.350000 s / 0.35 s / close following | car_05 / 0.350000 s / 0.35 s / close following |
| 2 | car_04 / 0.359911 s / 0.35 s / close following | car_04 / 0.359911 s / 0.35 s / close following |
| 3 | car_01 / 0.078042 s / 0.35 s / close following | car_01 / 0.078042 s / 0.35 s / close following |
| 4 | car_04 / 0.632366 s / 0.35 s / close following | car_04 / 0.632366 s / 0.35 s / close following |
| 9 | car_04 / 0.955296 s / 0.35 s / close following | car_04 / 0.955296 s / 0.35 s / close following |
| 31 | car_07 / 0.618649 s / 0.35 s / close following | car_09 / 0.101339 s / 0.35 s / close following |
| 32 | car_07 / 0.345107 s / 0.35 s / close following | car_07 / 2.802313 s / 0.00 s / gap outside traffic threshold |
| 35 | car_05 / 0.904850 s / 0.35 s / close following | car_07 / 0.718367 s / 0.35 s / close following |
| 36 | car_05 / 0.165538 s / 0.35 s / close following | car_07 / 0.617724 s / 0.35 s / close following |
| 37 | car_08 / 3.004081 s / 0.00 s / gap outside traffic threshold | car_07 / 0.471274 s / 0.35 s / close following |
| 38 | car_08 / 1.529705 s / 0.00 s / gap outside traffic threshold | car_07 / 0.279007 s / 0.35 s / close following |
| 39 | car_08 / 0.689301 s / 0.35 s / close following | car_07 / 0.209486 s / 0.35 s / close following |
| 40 | car_03 / 2.648238 s / 0.00 s / gap outside traffic threshold | car_05 / 0.282454 s / 0.35 s / close following |
| 41 | car_03 / 2.158821 s / 0.00 s / gap outside traffic threshold | car_10 / 0.511600 s / 0.35 s / close following |
| 44 | car_03 / 1.036232 s / 0.00 s / gap outside traffic threshold | car_08 / 0.822340 s / 0.35 s / close following |
| 45 | car_03 / 0.432865 s / 0.35 s / close following | car_08 / 0.519242 s / 0.35 s / close following |
| 46 | car_03 / 0.479426 s / 0.35 s / close following | car_08 / 0.237406 s / 0.00 s / car ahead pitting |
| 47 | car_03 / 0.417673 s / 0.35 s / close following | car_03 / 4.950112 s / 0.00 s / gap outside traffic threshold |
| 48 | car_03 / 0.209850 s / 0.35 s / close following | car_03 / 4.392288 s / 0.00 s / gap outside traffic threshold |
| 50 | car_08 / 0.801886 s / 0.35 s / close following | car_08 / 5.219145 s / 0.00 s / gap outside traffic threshold |

## car_07

Traffic: 15 affected laps / 5.25 s → 12 affected laps / 4.20 s.
Before stops: L24 HARD (22.0 s, green).
After stops: L24 HARD (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_06 / 0.350000 s / 0.35 s / close following | car_06 / 0.350000 s / 0.35 s / close following |
| 2 | car_08 / 0.652086 s / 0.35 s / close following | car_08 / 0.652086 s / 0.35 s / close following |
| 3 | car_10 / 0.690089 s / 0.35 s / close following | car_10 / 0.690089 s / 0.35 s / close following |
| 5 | car_05 / 0.923020 s / 0.35 s / close following | car_05 / 0.923020 s / 0.35 s / close following |
| 10 | car_05 / 0.706143 s / 0.35 s / close following | car_05 / 0.706143 s / 0.35 s / close following |
| 11 | car_05 / 0.768372 s / 0.35 s / close following | car_05 / 0.768372 s / 0.35 s / close following |
| 33 | car_06 / 0.117494 s / 0.35 s / close following | car_05 / 2.766585 s / 0.00 s / gap outside traffic threshold |
| 39 | car_10 / 1.220197 s / 0.00 s / gap outside traffic threshold | car_05 / 0.579798 s / 0.35 s / close following |
| 40 | car_10 / 0.618169 s / 0.35 s / close following | car_06 / 0.187542 s / 0.35 s / close following |
| 41 | car_10 / 0.322298 s / 0.35 s / close following | car_05 / 0.032388 s / 0.35 s / close following |
| 42 | car_10 / 0.676366 s / 0.35 s / close following | car_05 / 0.476457 s / 0.35 s / close following |
| 43 | car_10 / 0.447955 s / 0.35 s / close following | car_05 / 0.338046 s / 0.35 s / close following |
| 44 | car_10 / 0.608906 s / 0.35 s / close following | car_10 / 0.432789 s / 0.35 s / close following |
| 45 | car_10 / 0.509473 s / 0.35 s / close following | car_05 / 1.175926 s / 0.00 s / gap outside traffic threshold |
| 46 | car_10 / 0.561900 s / 0.35 s / close following | car_05 / 1.408743 s / 0.00 s / gap outside traffic threshold |
| 47 | car_10 / 0.362565 s / 0.35 s / close following | car_05 / 1.328561 s / 0.00 s / gap outside traffic threshold |

## car_08

Traffic: 10 affected laps / 3.50 s → 9 affected laps / 3.15 s.
Before stops: L14 HARD (22.0 s, green), L46 SOFT (22.0 s, green).
After stops: L14 HARD (22.0 s, green), L46 SOFT (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_07 / 0.350000 s / 0.35 s / close following | car_07 / 0.350000 s / 0.35 s / close following |
| 2 | car_05 / 0.347831 s / 0.35 s / close following | car_05 / 0.347831 s / 0.35 s / close following |
| 3 | car_03 / 0.192871 s / 0.35 s / close following | car_03 / 0.192871 s / 0.35 s / close following |
| 4 | car_01 / 0.867230 s / 0.35 s / close following | car_01 / 0.867230 s / 0.35 s / close following |
| 5 | car_01 / 0.500202 s / 0.35 s / close following | car_01 / 0.500202 s / 0.35 s / close following |
| 6 | car_01 / 0.026082 s / 0.35 s / close following | car_01 / 0.026082 s / 0.35 s / close following |
| 34 | car_01 / 0.261779 s / 0.35 s / close following | car_01 / 0.261779 s / 0.35 s / close following |
| 36 | car_03 / 0.050337 s / 0.35 s / close following | car_03 / 0.050337 s / 0.35 s / close following |
| 37 | car_03 / 0.847064 s / 0.35 s / close following | car_03 / 0.847064 s / 0.35 s / close following |
| 40 | car_06 / 0.211122 s / 0.35 s / close following | car_03 / 2.859360 s / 0.00 s / gap outside traffic threshold |

## car_09

Traffic: 6 affected laps / 2.10 s → 8 affected laps / 2.80 s.
Before stops: L22 HARD (22.0 s, green).
After stops: L22 HARD (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_08 / 0.350000 s / 0.35 s / close following | car_08 / 0.350000 s / 0.35 s / close following |
| 2 | car_10 / 0.677131 s / 0.35 s / close following | car_10 / 0.677131 s / 0.35 s / close following |
| 3 | car_07 / 0.673803 s / 0.35 s / close following | car_07 / 0.673803 s / 0.35 s / close following |
| 4 | car_07 / 0.625143 s / 0.35 s / close following | car_07 / 0.625143 s / 0.35 s / close following |
| 6 | car_07 / 0.642573 s / 0.35 s / close following | car_07 / 0.642573 s / 0.35 s / close following |
| 7 | car_07 / 0.784984 s / 0.35 s / close following | car_07 / 0.784984 s / 0.35 s / close following |
| 32 | car_06 / 2.456522 s / 0.00 s / gap outside traffic threshold | car_06 / 0.542112 s / 0.35 s / close following |
| 49 | car_07 / 2.009482 s / 0.00 s / gap outside traffic threshold | car_04 / 0.744698 s / 0.35 s / close following |

## car_10

Traffic: 15 affected laps / 5.25 s → 16 affected laps / 5.60 s.
Before stops: L15 HARD (22.0 s, green), L48 SOFT (22.0 s, green).
After stops: L15 HARD (22.0 s, green), L48 SOFT (22.0 s, green).

Every affected lap is shown, including unchanged ones. A penalty applies
only on green laps when neither car is pitting and the pre-lap gap is below the configured threshold.

| Lap | Before: car ahead / gap / penalty / reason | After: car ahead / gap / penalty / reason |
| --- | --- | --- |
| 1 | car_09 / 0.350000 s / 0.35 s / close following | car_09 / 0.350000 s / 0.35 s / close following |
| 2 | car_07 / 0.078339 s / 0.35 s / close following | car_07 / 0.078339 s / 0.35 s / close following |
| 3 | car_05 / 0.219739 s / 0.35 s / close following | car_05 / 0.219739 s / 0.35 s / close following |
| 4 | car_03 / 0.438997 s / 0.35 s / close following | car_03 / 0.438997 s / 0.35 s / close following |
| 5 | car_08 / 0.652274 s / 0.35 s / close following | car_08 / 0.652274 s / 0.35 s / close following |
| 6 | car_08 / 0.895128 s / 0.35 s / close following | car_08 / 0.895128 s / 0.35 s / close following |
| 7 | car_01 / 0.694629 s / 0.35 s / close following | car_01 / 0.694629 s / 0.35 s / close following |
| 9 | car_08 / 0.948729 s / 0.35 s / close following | car_08 / 0.948729 s / 0.35 s / close following |
| 25 | car_01 / 0.128113 s / 0.35 s / close following | car_01 / 0.128113 s / 0.35 s / close following |
| 26 | car_01 / 0.898055 s / 0.35 s / close following | car_01 / 0.898055 s / 0.35 s / close following |
| 27 | car_03 / 0.193562 s / 0.35 s / close following | car_03 / 0.193562 s / 0.35 s / close following |
| 37 | car_06 / 0.172835 s / 0.35 s / close following | car_08 / 3.176916 s / 0.00 s / gap outside traffic threshold |
| 38 | car_05 / 0.003227 s / 0.35 s / close following | car_08 / 2.677540 s / 0.00 s / gap outside traffic threshold |
| 39 | car_05 / 0.653613 s / 0.35 s / close following | car_08 / 2.787136 s / 0.00 s / gap outside traffic threshold |
| 42 | car_05 / 1.794613 s / 0.00 s / gap outside traffic threshold | car_06 / 0.150218 s / 0.35 s / close following |
| 44 | car_05 / 2.491802 s / 0.00 s / gap outside traffic threshold | car_05 / 0.156207 s / 0.35 s / close following |
| 45 | car_05 / 3.178164 s / 0.00 s / gap outside traffic threshold | car_07 / 0.016643 s / 0.35 s / close following |
| 46 | car_05 / 3.450981 s / 0.00 s / gap outside traffic threshold | car_07 / 0.849069 s / 0.35 s / close following |
| 47 | car_02 / 0.112685 s / 0.35 s / close following | car_02 / 0.579147 s / 0.35 s / close following |
