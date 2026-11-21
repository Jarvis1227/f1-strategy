"""Local, single-worker API and built React frontend. Sessions live in memory."""
from dataclasses import asdict, dataclass, field
from pathlib import Path
from threading import RLock
from typing import Literal
from uuid import uuid4
import csv
import io
import json
import time
import hashlib

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, StrictInt

from .analysis import COMPONENTS, traffic_reason
from .config import load_config
from .player import take_turn
from .simulator import LapRecord, RaceSimulator
from .strategies import baseline_actions
from .tyres import tyre_delta
from .coaching import coaching, move_recap
from .scenarios import create_podium, actions_for, battle_state

MAX_SESSIONS = 32
SESSION_TTL_S = 4 * 60 * 60
DIST = Path(__file__).resolve().parent.parent / "web" / "dist"
Compound = Literal["SOFT", "MEDIUM", "HARD"]


class NewRace(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seed: StrictInt = Field(default=42, ge=0, le=2**31 - 1)
    starting_compound: Compound = "MEDIUM"
    focus: Literal["clean", "tyres", "baseline"] = "clean"
    mode: Literal["grand_prix", "podium"] = "grand_prix"


class Turn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_lap: StrictInt = Field(ge=0)
    compound: Compound | None = None
    intent: Literal["position", "pace", "opportunity"] | None = None


class Rewind(BaseModel):
    model_config = ConfigDict(extra="forbid")
    lap: StrictInt = Field(ge=1, le=6)


@dataclass
class Session:
    race: RaceSimulator
    starts: list[str]
    decisions: list[dict] = field(default_factory=list)
    updated: float = field(default_factory=time.monotonic)
    lock: RLock = field(default_factory=RLock)
    summary: list | None = None
    focus: str = "clean"
    initial: RaceSimulator | None = None
    branch_from: dict | None = None


sessions: dict[str, Session] = {}
store_lock = RLock()
app = FastAPI(title="F1 Strategy", version="0.2.0")


def get_session(race_id):
    with store_lock:
        session = sessions.get(race_id)
        if session is None or time.monotonic() - session.updated > SESSION_TTL_S:
            sessions.pop(race_id, None)
            raise HTTPException(404, "Race no longer available. Start a new race.")
        session.updated = time.monotonic()
        return session


def config_data(config):
    return {**{k: v for k, v in vars(config).items() if k != "tyres"},
            "tyres": {k: asdict(v) for k, v in config.tyres.items()}}


def baseline_summary(session):
    if session.summary is not None:
        return session.summary
    race = session.race
    baseline = session.initial.fork() if session.initial else RaceSimulator(race.config)
    if session.initial is None:
        baseline.reset(race.seed, session.starts)
    while not baseline.done:
        baseline.step(actions_for(baseline))
    baseline_results = {r["car_id"]: r for r in baseline.classification()}
    result = []
    for car in race.classification():
        cid = car["car_id"]
        a = [r for r in baseline.log if r.car_id == cid]
        b = [r for r in race.log if r.car_id == cid]
        baseline_traffic = [asdict(r) for r in a if r.traffic_loss_s > 0]
        player_traffic = [asdict(r) for r in b if r.traffic_loss_s > 0]
        result.append({"car_id": cid, "position": car["position"], "status": car["status"],
            "baseline_position": baseline_results[cid]["position"],
            "baseline_status": baseline_results[cid]["status"],
            "time_change_s": car["elapsed_s"] - baseline_results[cid]["elapsed_s"],
            "baseline_traffic_s": sum(r.traffic_loss_s for r in a),
            "actual_traffic_s": sum(r.traffic_loss_s for r in b),
            "baseline_traffic_laps": baseline_traffic, "actual_traffic_laps": player_traffic,
            "component_changes_s": {key: sum(getattr(r, key) for r in b)
                                    - sum(getattr(r, key) for r in a) for key in COMPONENTS}})
    session.summary = result
    return result


def payload(race_id, session):
    race = session.race
    c = race.config
    latest = {r.car_id: r for r in race.log[-c.cars:]}
    leader = race.order()[0].elapsed_s
    cars = []
    for car in race.observe()["cars"]:
        cid = car["car_id"]
        last = latest.get(cid)
        rows = [r for r in race.log if r.car_id == cid]
        cars.append({**car, "gap_to_leader_s": car["elapsed_s"] - leader,
                     "last_lap_s": last.lap_time_s if last else None,
                     "pit_stops": sum(r.pitted for r in rows),
                     "traffic_total_s": sum(r.traffic_loss_s for r in rows),
                     "tyre_pace_delta_s": tyre_delta(c.tyres[car["compound"]], car["tyre_age"]),
                     "tyre_age_game_laps": car["tyre_age"] / c.distance_per_lap,
                     "cliff_game_laps": c.tyres[car["compound"]].cliff_laps / c.distance_per_lap,
                     "cliff_laps": c.tyres[car["compound"]].cliff_laps})
    selected = session.decisions[-1] if session.decisions else None
    # Enrich copies only; raw decision exports remain compatible with terminal mode.
    if selected:
        selected = {**selected, "effects": [dict(effect) for effect in selected["effects"]]}
        actual = {e["car_id"]: e["actual"] for e in selected["effects"]}
        for effect in selected["effects"]:
            row = effect["actual"]
            front = actual.get(row["front_car_id"])
            effect["traffic_reason"] = traffic_reason(row, front is not None and front["pitted"])
    history = [{"lap": lap, "positions": {r.car_id: r.position for r in race.log if r.lap == lap}}
               for lap in range(1, race.lap + 1)]
    player = race.cars[0]
    reference = actions_for(race).get(player.car_id) or ("HARD" if player.compound != "HARD" else "MEDIUM")
    signature = hashlib.sha256(json.dumps({"config": config_data(c), "scenario": getattr(race, "scenario_id", None)}, sort_keys=True).encode()).hexdigest()[:16]
    return {"race_id": race_id, "seed": race.seed, "track": c.track,
            "focus": session.focus, "coaching": coaching(race),
            "battle": battle_state(race, session.decisions), "branch_from": session.branch_from,
            "experiences": {"sc_stop": any(next(e for e in d["effects"] if e["car_id"] == "car_01")["actual"]["pitted"]
                and next(e for e in d["effects"] if e["car_id"] == "car_01")["actual"]["safety_car"] for d in session.decisions)},
            "config_signature": signature, "starting_compound": session.starts[0],
            "simulation_version": 3, "completed_laps": race.lap, "total_laps": c.laps,
            "equivalent_laps": c.laps * c.distance_per_lap, "distance_per_lap": c.distance_per_lap,
            "done": race.done, "safety_car": race.safety_car,
            "pit_cost_s": c.pit_loss_sc_s if race.safety_car else c.pit_loss_green_s,
            "green_pit_cost_s": c.pit_loss_green_s, "sc_pit_cost_s": c.pit_loss_sc_s,
            "required_compounds": c.required_compounds, "base_lap_s": c.base_lap_s * c.distance_per_lap,
            "traffic_gap_s": c.traffic_gap_s, "traffic_penalty_s": c.traffic_penalty_s * c.distance_per_lap,
            "tyres": {key: asdict(value) for key, value in c.tyres.items()},
            "cars": cars, "last_decision": selected,
            "decision_history": [{"lap": d["lap"], "chosen_action": d["chosen_action"],
                                  "alternative_action": d["alternative_action"]} for d in session.decisions],
            "position_history": history, "stay_out_alternative": reference,
            "classification": race.classification() if race.done else None,
            "summary": baseline_summary(session) if race.done else None}


@app.get("/api/health")
def health():
    return {"status": "ok", "simulation_version": 3}


@app.post("/api/races", status_code=201)
def new_race(request: NewRace):
    config = load_config()
    starts = [request.starting_compound] + ["MEDIUM" if i % 2 == 0 else "SOFT" for i in range(1, config.cars)]
    race = RaceSimulator(config)
    race.reset(request.seed, starts)
    if request.mode == "podium":
        race, starts = create_podium(request.seed)
    session = Session(race, starts, focus=request.focus, initial=race.fork())
    race_id = uuid4().hex
    with store_lock:
        now = time.monotonic()
        expired = [key for key, item in sessions.items() if now - item.updated > SESSION_TTL_S]
        for key in expired:
            del sessions[key]
        if len(sessions) >= MAX_SESSIONS:
            del sessions[min(sessions, key=lambda key: sessions[key].updated)]
        sessions[race_id] = session
    return payload(race_id, session)


@app.get("/api/races/{race_id}")
def read_race(race_id: str):
    session = get_session(race_id)
    with session.lock:
        return payload(race_id, session)


@app.post("/api/races/{race_id}/turn")
def advance(race_id: str, request: Turn):
    session = get_session(race_id)
    with session.lock:
        if session.race.done:
            raise HTTPException(409, "Race finished. Start a new race.")
        if request.expected_lap != session.race.lap:
            raise HTTPException(409, "This lap has already changed. Refresh the race before deciding again.")
        before_age = session.race.cars[0].tyre_age
        before_compound = session.race.cars[0].compound
        planned = actions_for(session.race)
        result = take_turn(session.race, request.compound, planned)
        if getattr(session.race, "scenario_id", None):
            result["rival_response"] = ("Vega covered your previous stop." if session.decisions and session.decisions[-1]["chosen_action"] else "Vega reached his planned pit window.") if "car_02" in planned else "Vega stayed out."
        result["intent"] = request.intent
        result["recap"] = move_recap(session.race, result, before_age, before_compound)
        session.decisions.append(result)
        return payload(race_id, session)


@app.post("/api/races/{race_id}/rewind", status_code=201)
def rewind(race_id: str, request: Rewind):
    source = get_session(race_id)
    with source.lock:
        if not getattr(source.race, 'scenario_id', None) or not source.race.done:
            raise HTTPException(409, "Finish a battle before rewinding a call.")
        if request.lap > len(source.decisions):
            raise HTTPException(422, "That call has not been completed.")
        race = source.initial.fork()
        decisions = []
        for old in source.decisions[:request.lap - 1]:
            before_age, before_compound = race.cars[0].tyre_age, race.cars[0].compound
            result = take_turn(race, old['chosen_action'], actions_for(race))
            result['intent'] = old.get('intent')
            result['rival_response'] = old.get('rival_response', '')
            result['recap'] = move_recap(race, result, before_age, before_compound)
            decisions.append(result)
        branch = Session(race, list(source.starts), decisions=decisions,
                         focus=source.focus, initial=source.initial.fork(),
                         branch_from={"race_id": race_id, "lap": request.lap,
                             "position": battle_state(source.race, source.decisions)["position"],
                             "elapsed_s": source.race.cars[0].elapsed_s,
                             "gap_s": battle_state(source.race, source.decisions)["gap_s"]})
    new_id = uuid4().hex
    with store_lock:
        if len(sessions) >= MAX_SESSIONS:
            candidates = [key for key in sessions if key != race_id]
            if candidates:
                del sessions[min(candidates, key=lambda key: sessions[key].updated)]
        sessions[new_id] = branch
    return payload(new_id, branch)


@app.get("/api/races/{race_id}/decisions/{lap}")
def decision(race_id: str, lap: int):
    session = get_session(race_id)
    with session.lock:
        if not 1 <= lap <= len(session.decisions):
            raise HTTPException(404, "Decision not found.")
        return session.decisions[lap - 1]


@app.get("/api/races/{race_id}/export/{kind}")
def export(race_id: str, kind: Literal["laps", "decisions", "results"]):
    session = get_session(race_id)
    with session.lock:
        if kind == "laps":
            stream = io.StringIO(newline="")
            writer = csv.DictWriter(stream, fieldnames=list(LapRecord.__dataclass_fields__))
            writer.writeheader()
            writer.writerows(asdict(r) for r in session.race.log)
            return Response(stream.getvalue(), media_type="text/csv", headers={
                "Content-Disposition": f'attachment; filename="f1-{race_id[:8]}-laps.csv"'})
        data = session.decisions if kind == "decisions" else {
            "seed": session.race.seed, "simulation_version": 3, "complete": session.race.done,
            "completed_laps": session.race.lap, "starting_compounds": session.starts,
            "focus": session.focus, "battle": battle_state(session.race, session.decisions),
            "branch_from": session.branch_from,
            "initial_state": session.initial.observe() if session.initial else None,
            "config": config_data(session.race.config), "classification": session.race.classification(),
            "summary": baseline_summary(session) if session.race.done else None}
        return Response(json.dumps(data, indent=2), media_type="application/json", headers={
            "Content-Disposition": f'attachment; filename="f1-{race_id[:8]}-{kind}.json"'})


if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
else:
    @app.get("/")
    def missing_frontend():
        return JSONResponse({"detail": "Frontend not built. Run npm.cmd install and npm.cmd run build in web/."}, status_code=503)
