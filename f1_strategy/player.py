"""Terminal player loop with explicit one-lap counterfactual explanations."""
from dataclasses import asdict

from .analysis import COMPONENTS, traffic_reason
from .config import COMPOUNDS
from .strategies import baseline_actions
from .tyres import tyre_delta

ALIASES = {"s": "SOFT", "m": "MEDIUM", "h": "HARD",
           "soft": "SOFT", "medium": "MEDIUM", "hard": "HARD"}


def choose_start(input_fn=input, output_fn=print):
    while True:
        try:
            answer = input_fn("Starting tyre [S/M/H, Enter=Medium, Q=quit]: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            return None
        if answer == "q":
            return None
        if answer == "":
            return "MEDIUM"
        if answer in ALIASES:
            return ALIASES[answer]
        output_fn("Choose S, M or H.")


def decision_effects(actual, alternative):
    other = {r.car_id: r for r in alternative}
    return [{"car_id": r.car_id, "actual": asdict(r), "alternative": asdict(other[r.car_id]),
             "lap_delta_s": r.lap_time_s - other[r.car_id].lap_time_s,
             "position_delta": r.position - other[r.car_id].position,
             "component_deltas_s": {key: getattr(r, key) - getattr(other[r.car_id], key)
                                    for key in COMPONENTS}} for r in actual]


def take_turn(race, chosen, actions=None):
    """Shared terminal/web turn: opponents held fixed in the immediate fork."""
    actions = dict(baseline_actions(race) if actions is None else actions)
    player = race.cars[0]
    pit_reference = actions.get(player.car_id) or ("HARD" if player.compound != "HARD" else "MEDIUM")
    reference = None if chosen is not None else pit_reference
    alternative = race.fork()
    alternative_actions = dict(actions)
    alternative_actions[player.car_id] = reference
    alternate_rows = alternative.step(alternative_actions)
    actions[player.car_id] = chosen
    actual_rows = race.step(actions)
    return {"lap": race.lap, "chosen_action": chosen, "alternative_action": reference,
            "opponent_actions": {key: value for key, value in actions.items() if key != player.car_id},
            "effects": decision_effects(actual_rows, alternate_rows)}


def play(race, input_fn=input, output_fn=print):
    decisions = []
    output_fn("You drive car_01. Enter=stay out; S/M/H=pit; Q=save and quit.")
    output_fn("Each turn compares one lap only, with opponents' pit calls held fixed.")
    while not race.done:
        player = race.cars[0]
        actions = baseline_actions(race)
        # For a stay-out choice, use the bot recommendation or a contrasting compound.
        pit_reference = actions.get(player.car_id) or ("HARD" if player.compound != "HARD" else "MEDIUM")
        c = race.config
        output_fn(f"\nLAP {race.lap + 1}/{c.laps} | {'SAFETY CAR' if race.safety_car else 'GREEN'} | "
                  f"pit cost {c.pit_loss_sc_s if race.safety_car else c.pit_loss_green_s:.1f} s")
        output_fn(f"Your tyres: {player.compound}, age {player.tyre_age}; "
                  f"pace delta {tyre_delta(c.tyres[player.compound], player.tyre_age):+.2f} s (green pace). "
                  f"Compounds used: {', '.join(sorted(player.used_compounds)) or 'none yet'}.")
        if len(player.used_compounds) < c.required_compounds:
            output_fn(f"Rule: complete laps on at least {c.required_compounds} different compounds by the finish.")
        order = race.order()
        leader = order[0].elapsed_s
        output_fn("Position  Car       Gap to leader   Tyre     Age")
        for i, car in enumerate(order, 1):
            output_fn(f"P{i:<8} {car.car_id:<9} +{car.elapsed_s - leader:8.3f}s   {car.compound:<8} {car.tyre_age}")
        output_fn(f"Stay out will be compared with pit {pit_reference}; a pit choice will be compared with stay out.")
        while True:
            try:
                answer = input_fn("Your call [Enter/S/M/H/Q]: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                return decisions
            if answer == "q":
                return decisions
            if answer in ("", "stay", "0") or answer in ALIASES:
                break
            output_fn("Invalid choice. Enter stays out; S/M/H pits; Q saves and quits.")
        chosen = ALIASES.get(answer)
        decision = take_turn(race, chosen, actions)
        reference = decision["alternative_action"]
        effects = decision["effects"]
        actual_by_id = {r["actual"]["car_id"]: r["actual"] for r in effects}
        decisions.append(decision)
        output_fn(f"\nLap {race.lap}: {'PIT ' + chosen if chosen else 'STAY OUT'} vs "
                  f"{'PIT ' + reference if reference else 'STAY OUT'}. "
                  "Positive delta = this choice was slower on this lap.")
        for effect in effects:
            row = effect["actual"]
            front = (f"behind {row['front_car_id']} at {row['gap_ahead_s']:.3f}s"
                     if row["front_car_id"] else "race leader before lap")
            traffic = (f"traffic +{row['traffic_loss_s']:.2f}s ({front})"
                       if row["traffic_loss_s"] else f"traffic 0s ({front})")
            front_row = actual_by_id.get(row["front_car_id"])
            traffic += ": " + traffic_reason(row, front_row is not None and front_row["pitted"])
            action = f"pit {row['compound']} +{row['pit_loss_s']:.1f}s" if row["pitted"] else "stayed out"
            output_fn(f"{row['car_id']}: P{row['position_before']} -> P{row['position']}; "
                f"lap {row['lap_time_s']:.3f}s; {action}; {traffic}; "
                f"tyre {row['tyre_delta_s']:+.2f}s, fuel {row['fuel_effect_s']:+.2f}s, "
                f"noise {row['noise_s']:+.3f}s, SC queue {row['queue_loss_s']:+.3f}s; "
                f"vs alternative {effect['lap_delta_s']:+.3f}s, "
                f"P{effect['alternative']['position']} -> P{row['position']}.")
        output_fn("These are immediate effects. Later gaps, traffic and pit calls can change the final outcome.")
    return decisions
