# Pit Wall Rivals — playable vertical slice

One complete authored battle: **Steal the Podium**. Six closing game laps,
representing 12.6 physical laps after race lap 14 of the 20-turn Grand Prix.
You inherit P4 on Mediums aged 22 equivalent laps, 1.8s behind Vega on older
Hards. Both compounds have already been used. All ten cars are simulated.
The starting gaps are relative offsets; the displayed time is a closing-stint
clock, not a fabricated full Grand Prix time.

## Rival behavior

Vega is a deterministic counterpuncher. His planned stop is call 3. If he sees
you pit earlier, he covers on the next call, provided his tyres meet the authored
age condition. He does not peek at the action you are about to take. He changes
to Softs once; the remaining cars use the existing threshold policy. There is
no trained RL model. Authored setup and behavior parameters live in
`f1_strategy/podium_scenario.json`; SC probability is zero in this challenge.
Lap variations use the normal per-car seeded streams. Outcomes are simulated.

## Learning and replay

The duel HUD tracks your actual gap to Vega and the swing on each lap. A pit
exit estimate holds the other cars stationary and is labelled accordingly.
The existing tyre forecasts remain available below the race. Radio messages
refer to actual stops and gap changes. A lead immediately after a rival's stop
does not itself satisfy the objective: finish classified P3 or better and ahead.

POST `/api/races` accepts mode `podium` or `grand_prix` (API default Grand Prix).
Podium mode supplies its own inherited tyres/state; it ignores starting-compound
selection. POST `/api/races/{id}/rewind` accepts `{ "lap": 1 }` after a battle
finishes. It creates a new session before that call, replays previous calls from
the immutable initial fork, and preserves independent event/noise streams.
The source race remains unchanged. API results exports include inherited state,
battle metadata and branch origin. In-memory retention limits still apply.
Full-race baseline comparisons also start from the identical inherited snapshot.

## Validation and limits

49 Python tests cover both modes, an early-stop podium and stay-out loss under
seed 42, no-peeking rival responses, unchanged Grand Prix behavior, warm-state
baseline accounting, deterministic rewinds, changed branch outcomes, validation
and bounded sessions. 12 JavaScript tests and the production build pass.
Browser QA plays a six-call undercut, finishes P3, rewinds, and observes a
stay-out P7 finish. This is one scenario, not a full career/multiplayer product.
Movement between lap endpoints remains an illustrative 2D replay. Push/defend
commands, tyre temperature, racing incidents and additional scenarios are not
part of this slice. Restart loses sessions; export wanted results first.
