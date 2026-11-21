"""Small deterministic demonstration policies; no training or RL agent."""
from .simulator import RaceSimulator


def baseline_actions(race: RaceSimulator) -> dict[str, str]:
    actions = {}
    c = race.config
    remaining = c.laps - race.lap
    for i, car in enumerate(race.cars):
        # Alternate opening compounds in CLI; stagger pit timing by car.
        threshold = c.tyres[car.compound].cliff_laps - i % 3
        missing = c.required_compounds - len(car.used_compounds)
        must_change = missing > 0 and remaining <= missing
        if car.tyre_age + c.distance_per_lap > max(1, threshold) or must_change or (race.safety_car and car.tyre_age >= max(1, threshold // 2)):
            candidates = [name for name in c.tyres if name != car.compound]
            unused = [name for name in candidates if name not in car.used_compounds]
            if missing > 0 and unused:
                candidates = unused
            actions[car.car_id] = min(candidates, key=lambda name: abs(c.tyres[name].cliff_laps - remaining * c.distance_per_lap))
    return actions
