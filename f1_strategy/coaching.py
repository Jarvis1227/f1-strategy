"""Transparent teaching estimates. Never evaluate hidden future events or noise."""
from .config import COMPOUNDS
from .tyres import tyre_delta, tyre_time, driving_components


def coaching(race):
    c = race.config
    player = race.cars[0]
    if race.done:
        return {"horizon": 0, "forecasts": [], "headline": "The race is your lesson.",
                "message": "Compare the whole race, then pick one idea to try next time."}
    horizon = min(10, c.laps - race.lap)
    pit_cost = c.pit_loss_sc_s if race.safety_car else c.pit_loss_green_s
    order = race.order()
    position = next(i for i, car in enumerate(order) if car.car_id == player.car_id)
    ahead = order[position - 1] if position else None
    gap = player.elapsed_s - ahead.elapsed_s if ahead else None

    def projection(compound=None):
        rows = []
        for offset in range(horizon):
            # Only the current flag is used. All later laps assume green.
            sc = offset == 0 and race.safety_car
            age = offset * c.distance_per_lap if compound else player.tyre_age + offset * c.distance_per_lap
            tyre = compound or player.compound
            fuel = max(0, player.fuel_kg - offset * c.fuel_burn_kg_per_lap * c.distance_per_lap)
            pace = sum(driving_components(c, tyre, age, fuel, player.pace_delta_s, sc).values())
            rows.append(pace + (pit_cost if compound and offset == 0 else 0))
        return rows

    stay = projection()
    forecasts = []
    for compound in COMPOUNDS:
        pit = projection(compound)
        cumulative = []
        delta = 0
        for offset in range(horizon):
            delta += pit[offset] - stay[offset]
            cumulative.append(delta)
        forecasts.append({"compound": compound, "pit_loss_s": pit_cost,
            "first_lap_change_s": pit[0] - stay[0], "horizon_change_s": delta,
            "cumulative_changes_s": cumulative,
            "payback_laps": next((i + 1 for i, value in enumerate(cumulative) if value <= 0), None),
            "fresh_pace_gain_s": tyre_time(c.tyres[player.compound], player.tyre_age, c.distance_per_lap)
                                  - tyre_time(c.tyres[compound], 0, c.distance_per_lap),
            "adds_required_compound": compound not in player.used_compounds})
    fresh_same = projection(player.compound)
    wear_rows = []
    running_loss = 0.0
    for i in range(horizon):
        loss = stay[i] - (fresh_same[i] - (pit_cost if i == 0 else 0))
        running_loss += loss
        next_age = player.tyre_age + (i + 1) * c.distance_per_lap
        wear_rows.append({"laps": i + 1, "age_equivalent_laps": next_age,
            "age_game_laps": next_age / c.distance_per_lap,
            "lap_time_s": stay[i], "wear_loss_s": loss, "cumulative_wear_loss_s": running_loss,
            "status": "beyond cliff" if next_age > c.tyres[player.compound].cliff_laps else
                      "near cliff" if next_age + c.distance_per_lap >= c.tyres[player.compound].cliff_laps else "in working range"})
    tyre_status = {"age_equivalent_laps": player.tyre_age,
        "age_game_laps": player.tyre_age / c.distance_per_lap,
        "cliff_equivalent_laps": c.tyres[player.compound].cliff_laps,
        "turns_to_cliff": max(0, (c.tyres[player.compound].cliff_laps - player.tyre_age) / c.distance_per_lap),
        "status": "beyond cliff" if player.tyre_age > c.tyres[player.compound].cliff_laps else
                  "near cliff" if player.tyre_age + c.distance_per_lap >= c.tyres[player.compound].cliff_laps else "in working range",
        "stay_out": wear_rows}
    missing = len(player.used_compounds) < c.required_compounds
    if missing and c.laps - race.lap <= c.required_compounds - len(player.used_compounds):
        headline = "One last rule to protect."
        message = "Complete a lap on an unused compound now to stay eligible. A fresh set of the same compound does not count."
    elif race.safety_car:
        headline = "A cheaper stop. Still a real decision."
        message = (f"The safety car saves {c.pit_loss_green_s - c.pit_loss_sc_s:g}s per stop. "
                   "But stopping still costs track position. Ask whether you need fresh tyres yet.")
    elif player.tyre_age > c.tyres[player.compound].cliff_laps:
        headline = "Your tyres are asking the question."
        message = "You are beyond this compound's model cliff. Compare the growing stay-out cost with a fresh set over several laps."
    elif ahead and gap < c.traffic_gap_s:
        headline = "The car ahead changes the equation."
        message = (f"You are {gap:.3f}s behind {ahead.car_id.replace('car_', 'Car ')}. "
                   "Close following can cost time. Pitting can find fresh air, but the exit gap matters too.")
    elif race.lap == 0:
        headline = "Think in stints, not single laps."
        message = "A stint is the laps you drive on one tyre set. Fresh tyres are an investment: a stop costs time now to buy pace later."
    else:
        headline = "Every quiet lap is part of the plan."
        message = "Staying out spends tyre life to protect position. Check your age, the gap ahead and how many laps remain before changing the plan."
    return {"horizon": horizon, "tyre_status": tyre_status, "forecasts": forecasts, "headline": headline,
            "message": message, "rival_id": ahead.car_id if ahead else None, "gap_ahead_s": gap,
            "assumptions": "Free air, no lap variation or further stops; current flag on the first lap, then green. Rivals and future safety cars are not predicted."}


def move_recap(race, decision, before_age, before_compound):
    player = next(e for e in decision["effects"] if e["car_id"] == "car_01")
    row = player["actual"]
    places = row["position_before"] - row["position"]
    if row["pitted"]:
        headline = f"Fresh {row['compound'].lower()}s. The investment is made."
        message = (f"You paid {row['pit_loss_s']:g}s in the pits and reset tyre age from {before_age:g} equivalent laps to 0 for that lap. "
                   f"Your position went from P{row['position_before']} to P{row['position']}. "
                   "That is the immediate trade. Watch the next laps for the return.")
    elif places > 0:
        headline = f"{places} place{'s' if places != 1 else ''} gained. Find the reason."
        message = ("You stayed out. Rivals' stops, pace and gaps all influence position; "
                   "a gain alone does not prove a move is optimal. Inspect the field to see who stopped.")
    else:
        headline = "You kept the stint alive."
        message = (f"You finished this lap on {row['compound'].lower()}s, with {(row['tyre_age'] + race.config.distance_per_lap) / race.config.distance_per_lap:g} game laps on the set. "
                   "Keep an eye on the tyre cliff and the gap ahead.")
    return {"headline": headline, "message": message, "places_gained": places,
            "tyre_age_before": before_age, "compound_before": before_compound,
            "pit_savings_s": (race.config.pit_loss_green_s - row["pit_loss_s"])
                              if row["pitted"] and row["safety_car"] else 0,
            "rule_satisfied": len(race.cars[0].used_compounds) >= race.config.required_compounds}
