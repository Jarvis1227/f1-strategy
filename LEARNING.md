# Learn through the race

The learning update adds an optional coach, transparent short-horizon tyre
estimates, a move replay, lessons, and browser-local progression. The simulation
remains revision 2: focus, intent, lessons and XP do not alter car performance,
events or the opponents' rules.

## A first learning session

1. Open the game at **http://127.0.0.1:8000** and leave **Coach on**.
2. Open **Strategy school**. Try “Buy pace with time”, then check your answer.
   Wrong answers receive an explanation and can be reconsidered without cost.
3. Return to the pit wall. Choose Medium and the **Finish with a plan** focus.
4. Use **Quick guide** to walk through Observe → Plan → Commit → Review.
   There is no countdown, and the guide can be closed at any point.
5. Before a lap, state your plan: protect position, invest in future pace, or
   use a cheaper pit window. This is a reflection aid, not a scored prediction.
6. Explore the **Think Ahead** lines before committing. Selecting a line
   chooses the corresponding next action; it does not advance the race.
7. Commit explicitly. The move replay records your plan and explains the
   observed trade: positions, pit cost, tyre-age reset and effects on rivals.
8. Watch later laps. At the finish, compare the whole race with the baseline.
   The journal keeps the result even if it was a race that taught you what to
   change rather than a podium.

Switch **Coach off** for the original compact race interface. The school and
earned progress remain available. The preference persists in the browser.

## Forecasts are a thinking aid

The backend computes each compound's projected lap times and cumulative time
change versus keeping the current set, over up to 10 remaining laps. Select a
3-, 5- or 10-lap display horizon; the end of the race caps the choices.

These estimates include the current pit cost, base/car pace, current fuel and
burn, compound pace, ageing and the nonlinear cliff. They use the current flag
on the first projected lap and **assume green afterward**. They exclude random
lap variation, traffic, rival pit calls, later player stops and future SC events.
They do not inspect future random draws or mutate race state. The zero line is
staying out; lower on the chart is quicker relative to it. The payback text
refers to the full available forecast horizon, which can exceed the selected
display horizon.

A locally quicker forecast is not a recommendation or a promise of positions.
The original one-lap fork still compares actual player and alternative actions
with fixed opponents' calls and common random variations. The final baseline
comparison still compares the entire strategy sequence. Those are three
different comparisons and are labelled separately.

## Progression

XP comes from fixed, one-time milestones. Repeating an answer, replaying a race
or refreshing a finish does not repeatedly award the same badge.

| Milestone | XP |
| --- | ---: |
| Tyre economics concept check | 15 |
| Safety-car cost concept check | 15 |
| Traffic concept check | 15 |
| Long-game concept check | 15 |
| Complete all 20 game laps (including a DSQ) | 20 |
| Finish classified with the required compounds | 30 |
| Experience a discounted SC stop | 20 |
| Finish legally and beat a legally finishing baseline car's total time | 40 |

An SC badge records an experience; it does not certify that the stop was
strategically good. The rank names (Rookie, Race reader, Strategist, Pit wall
thinker) reflect accumulated milestones, not a competitive skill rating or a
scientific assessment. Thresholds are 0, 30, 80 and 140 XP.

The design uses visible progress, a small earned-skill celebration and a clear
decision/review loop. No streaks, randomized reward drops, loss of XP for errors,
daily obligations, forced replays or time limits are introduced. Subtle motion
respects the system's reduced-motion preference. There is no sound autoplay.

## What is saved

The local profile stores earned badges and the last 12 completed race summaries
in `localStorage` at the browser origin. The coach setting is also local.
Profiles are distinct for different browsers/addresses/ports; consistently use
**127.0.0.1:8000** for your main game. Clearing browser storage clears this
profile. **Export progress** downloads a JSON backup/reference; there is no
import feature or account synchronization yet. A storage failure produces a
visible notice and still permits play.

The journal records position/status, seed, starting compound, race time,
baseline-time difference, focus, and a config fingerprint. Personal-best
comparisons require matching config, seed and starting compound and a legal
finish. Config/seed changes are not treated as comparable performance runs.

The journal survives server restarts, but unfinished races still live only in
server memory as documented in WEB_UI.md. Local XP is not a tamper-proof online
ranking system.

## Implementation and checks

- `f1_strategy/coaching.py`: pure estimates and factual move recaps.
- `f1_strategy/api.py`: optional `focus` on new races, optional `intent` on turns,
  coaching/experience metadata, and unchanged simulation actions.
- `web/src/learning.jsx` / `learning.css`: guided interface, school, glossary,
  replay, progress and journal components.
- `web/src/progression.js`: profile normalization, deterministic awards, rank
  thresholds, deduplication and comparable personal bests.

```powershell
& .\.venv\Scripts\python.exe -m unittest discover -s tests -v
cd web
npm.cmd test
npm.cmd run build
```

Verification: **49 Python tests and 12 JavaScript tests pass**, and the production
build succeeds. Tests cover read-only forecasts/no RNG consumption, fresh-set
costs, SC costs, old-tyre payback, last-lap horizon/rules, neutral metadata,
incorrect/duplicate lesson attempts, race reward deduplication, DSQ handling,
rank calculation, bounded journals and like-for-like personal bests.

Browser QA exercised incorrect/correct answers, skill unlocks, persistent
progress, planning without advancing, a stated-intent pit, move replays, a full
earlier full race, a saved journal entry and unchanged XP after refresh. The commit
control is inline so it does not cover forecast controls on narrow screens.

Next improvements can add authored scenario puzzles, richer rival behavior and
a longer-horizon strategy planner after player feedback on this learning loop.

## Compressed-race forecast update

The current game lasts 20 turns with 42 equivalent laps of wear and fuel.
One game lap is 2.1 equivalent laps. The always-visible banner reports immediate
pit cost and next-lap wear. The 1/3/5-lap outlook is on the race screen, with
remaining-distance clipping and working/near-cliff/beyond-cliff status.

Wear cost compares the existing set with a fresh set of the same compound,
both ageing over the same period, without charging a pit. Pit-vs-stay uses the
selected comparison compound and includes a single pit loss. It is not a ranking
prediction. Tyre pace and fuel are integrated over each game turn; tests compare
forecasts with actual no-traffic/no-noise simulator forks. Under SC the first
turn suppresses tyre pace differences, and later turns assume green.
