# Play Pit Wall Rivals

Open the game and choose **Battle menu → Enter the Battle**. You inherit P4 on
worn Mediums with six calls remaining. The goal is P3 or better, ahead of Vega.
The other eight cars still matter: traffic and their stops can change the chase.
Both dry compounds were used before this authored snapshot; no random SC is drawn.

Choose Stay out or a fresh compound, then **Commit call**. Watch the lap and the
rival-gap swing. Vega responds to a stop seen on the previous completed lap; he
never reads your pending choice. 1×/2×/4× replay speed and Skip are available.

At the finish, **Race debrief** shows the six calls and actual gap timeline.
Choose a call and **Try another move** to create a new branch before that call.
It preserves the starting state and random streams, replays earlier calls, and
lets rivals respond to your changed future calls. The original stays available
until session expiry/eviction. A completed branch compares both results and
provides the original result download. Repeated rewinds do not farm fixed XP.

Choose **20-lap Grand Prix** in the menu for the previous 42-equivalent-lap mode.
Battle menu lets you revisit the lobby; Race control returns to your active race.

# 20 game laps / 42 equivalent laps

Every turn now represents 2.1 equivalent laps of driving, tyre wear and fuel.
The HUD and tyre labels distinguish game laps from equivalent age. A pit stop
still costs 22 seconds under green or 15 under SC.

After each replay, the banner shows pit cost and next-game-lap wear cost.
Click **1 / 3 / 5 lap forecast** to see tyre condition and cumulative losses.
**Pit vs stay** includes the stop: negative means boxing saves time over that
period. The dropdown only changes the comparison; use the pit-wall tyre buttons
to select an actual stop. Forecasts exclude traffic and future random events.

The server update requires starting a new race; old in-memory races are not
converted. Browser learning progress is preserved and personal bests remain
separate because the config signature and simulation version changed.

# Play F1 Strategy in the browser

**Racing update:** make a call, watch a short animated lap, then decide again.
Use Circuit or Follow camera, select a rival in the timing tower, and watch the
pit lane when you box. Replays offer 1×/2×/4× speed and Skip animation; they do
not change race results. Sound is optional and muted initially.

**Run up to 3 laps** stays out and pauses for safety cars, tyres near the cliff,
or a late compound-rule deadline. Pause after this lap cancels queued laps.
Space races one lap when focus is outside a control. The race waits between calls.

Radio messages describe the current situation. **Why did that happen?** opens a
short explanation; **Decision analysis** shows every car and a collapsible
3/5/10-lap tyre forecast. **Strategy school** holds optional lessons, earned badges,
and your local race journal. See [LEARNING.md](LEARNING.md) for assumptions.

The React UI and FastAPI backend are built and installed on this PC. Run this
from the VS Code terminal in the project folder:

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy.webserver --open
```

Keep the terminal open, then use **http://127.0.0.1:8000** in your browser.
Alternatively double-click **Start UI.cmd**, or choose **Terminal → Run Task →
F1: Open browser game**. In Run and Debug, choose **Play in browser (React +
FastAPI)** and press F5. Press Ctrl+C in the server terminal to stop it.

If port 8000 is already in use, stop your earlier server or run:

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy.webserver --port 8001 --open
```

## First race

1. Choose a starting compound. Medium is balanced; Soft is quicker initially;
   Hard lasts longer. The labels describe the current illustrative model.
2. Keep seed 42 for repeatable conditions and click **Start race**.
3. Before each lap, inspect the flag, tyre age, compound-use rule and pit cost.
4. Select **Stay out**, or a fresh Soft/Medium/Hard set, then click the large
   green lap button. Exactly one lap advances. There is no automatic timer.
5. Select a driver in the timing tower to follow that car. Switch to Circuit for the full track.
6. Open **Decision analysis** to compare all ten cars and inspect earlier laps.
7. At lap 20, see your classification and download lap CSV, results JSON, and
   decision JSON. The new-race dialog also lets you download partial logs.

Use at least two compounds by completing laps on them. Replacing a set with the
same compound does not satisfy the rule. The final card explicitly reports DSQ
when this rule is missed. There is no hardcoded winning strategy or forced pit.

## What the explanations mean

The engineer panel follows a car from its pre-lap position to its lap-end
position. A close-following penalty states the car ahead, the pre-lap gap and
seconds added; no-penalty explanations distinguish the leader, gaps outside the
threshold, pitting cars, and safety-car laps. Expand the full lap breakdown for
base pace, car offset, tyre, fuel, variation, traffic, pit, SC queue and floor
adjustment. These components sum to the lap time.

The alternative for a pit call is staying out. The alternative for staying out
is the bot's pit recommendation, or Hard (Medium when already on Hard). It is
stated in Decision analysis. Opponents' calls, events and lap variations are held
fixed for that immediate comparison. A positive time change is slower than the
alternative **on that lap**; it does not predict the rest of the race.

At the finish, the analysis tab adds a separate full-race comparison against the
baseline strategy, with common starting tyres, seed, config and per-car lap
variations. Select a car to see traffic totals, added/avoided traffic laps, and
each traffic encounter's front car and exact gap. This compares the entire
strategy sequence; it does not assign every later effect to one earlier action.

The circuit is fictional. Animated movement is reconstructed from recorded
lap-end gaps, with a modelled pit-stop pause. Intermediate positions and passes
are illustrative; the simulator resolves exact positions at each lap end.
The chart shows actual logged lap-end positions.

## Session behavior

- The tab remembers its race ID in browser session storage. Refresh restores
  the current race **while the same server is running**.
- Server restart loses in-memory sessions. A missing/expired race produces a
  clear new-race message. Download results before stopping if you need them.
- At most 32 races are retained; sessions expire after four hours without API
  activity. New races can evict the least recently used session at capacity.
- The UI disables pending actions, and the server rejects a repeated/stale turn
  using `expected_lap`, so a duplicate click cannot silently skip a lap.
- The launcher binds only to 127.0.0.1 and uses one worker. This is a local
  prototype with no accounts, database or public hosting configuration.
- Config changes apply to newly created races. Existing races retain their
  original config. Your SC pit-loss setting remains 15 seconds.

## Source and development

`web/src/main.jsx` contains React components and client state. `styles.css`
contains the responsive visual system. `f1_strategy/api.py` owns local sessions
and API routes. Both terminal and web modes use `player.take_turn`, so their
opponents and immediate comparisons share the same simulator logic.

The included `web/dist` build can run without Node at runtime. Node is needed
only to install/rebuild the frontend. On a new machine:

```powershell
python -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -e ".[web,gym,calibration]"
cd web
npm.cmd ci
npm.cmd run build
cd ..
& .\.venv\Scripts\python.exe -m f1_strategy.webserver --open
```

The current frontend uses React 19 and Vite 7. Use Node 22.12+ or a compatible
newer version; this PC uses Node 24.16.0. `web/package-lock.json` locks the JS
dependencies. `requirements-local.lock.txt` captures the Python versions used
here. Build output is shipped in the source ZIP, but ignored in Git by default;
rebuild it before running a fresh source checkout.

For frontend hot reload, start the API at port 8000, then run `npm.cmd run dev`
in `web/` and visit Vite's printed URL. Vite proxies `/api` to FastAPI. The normal
launcher uses a single origin and requires neither a second server nor CORS.
FastAPI's API explorer is at `/docs`.

## REST endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Readiness and simulation revision |
| POST | `/api/races` | Create `{seed, starting_compound, focus?}` |
| GET | `/api/races/{id}` | Restore standings/history/latest explanation |
| POST | `/api/races/{id}/turn` | Advance `{expected_lap, compound, intent?}`; null compound stays out |
| GET | `/api/races/{id}/decisions/{lap}` | Inspect a completed decision |
| GET | `/api/races/{id}/export/laps` | Download CSV |
| GET | `/api/races/{id}/export/results` | Download config/classification/summary JSON |
| GET | `/api/races/{id}/export/decisions` | Download per-turn explanations JSON |

Invalid inputs return 422, missing sessions/decisions 404, and stale turns or
finished-race actions 409. API tests cover these cases, independent sessions,
repeatable results, full races, DSQs, session bounds, component accounting and
exports. Browser QA covers starting tyres, stay/pit actions, an SC pit, history
inspection, all 20 game laps, final results, baseline analysis and refresh recovery.

FastF1 fitting and PPO remain future work. The UI continues to use the nine
rule-based opponents and clearly labels the model as uncalibrated.
