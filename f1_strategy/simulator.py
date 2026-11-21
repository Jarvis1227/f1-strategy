"""Synchronous lap simulation, independent of Gymnasium, HTTP and policy code."""
import csv
import random
import copy
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Mapping, Sequence

from .config import COMPOUNDS, RaceConfig
from .tyres import driving_components


@dataclass
class CarState:
    car_id: str
    compound: str
    elapsed_s: float
    fuel_kg: float
    pace_delta_s: float
    tyre_age: float = 0
    used_compounds: set[str] = field(default_factory=set)


@dataclass(frozen=True)
class LapRecord:
    lap: int
    car_id: str
    position: int
    lap_time_s: float
    elapsed_s: float
    tyre_age: float
    compound: str
    fuel_kg: float
    pitted: bool
    pit_loss_s: float
    traffic_loss_s: float
    safety_car: bool
    position_before: int = 0
    front_car_id: str = ""
    gap_ahead_s: float | None = None
    base_time_s: float = 0.0
    pace_delta_s: float = 0.0
    tyre_delta_s: float = 0.0
    fuel_effect_s: float = 0.0
    noise_s: float = 0.0
    queue_loss_s: float = 0.0
    time_floor_adjustment_s: float = 0.0


class RaceSimulator:
    """None means stay out; a compound name means pit for a fresh set.

    SC is drawn once before the turn and observable to all policies. Pitting
    occurs at the start of the simulated lap, including the final lap.
    """

    def __init__(self, config: RaceConfig):
        self.config = config
        self.reset()

    def reset(self, seed: int | None = None, starting_compounds: Sequence[str] | None = None):
        c = self.config
        starts = list(starting_compounds) if starting_compounds is not None else ["MEDIUM"] * c.cars
        if len(starts) != c.cars or any(s not in COMPOUNDS for s in starts):
            raise ValueError("Provide one valid starting compound per car")
        self.seed = seed if seed is not None else random.SystemRandom().getrandbits(64)
        self.rng = random.Random(self.seed)
        self.lap = 0
        self.sc_remaining = 0
        self.cars = [CarState(f"car_{i + 1:02d}", s, i * c.grid_gap_s,
                              c.fuel_start_kg, i * c.car_pace_step_s)
                     for i, s in enumerate(starts)]
        self.log: list[LapRecord] = []
        # Independent event and per-car noise streams; draw noise even under SC.
        # Comparisons therefore keep each car's lap variations fixed despite passes.
        self._noise_rngs = {car.car_id: random.Random(f"{self.seed}:noise:{car.car_id}")
                            for car in self.cars}
        self._prepare_turn()
        return self.observe()

    @property
    def done(self) -> bool:
        return self.lap >= self.config.laps

    @property
    def safety_car(self) -> bool:
        return self.sc_remaining > 0

    def _prepare_turn(self):
        c = self.config
        if not self.done and not self.safety_car and self.rng.random() < 1 - (1 - c.sc_start_probability) ** c.distance_per_lap:
            self.sc_remaining = max(1, math.ceil(self.rng.randint(c.sc_min_laps, c.sc_max_laps) / c.distance_per_lap))

    def order(self) -> list[CarState]:
        return sorted(self.cars, key=lambda car: (car.elapsed_s, car.car_id))

    def fork(self):
        """Independent snapshot for one-lap what-if analysis; shares immutable config."""
        other = copy.copy(self)
        other.cars = copy.deepcopy(self.cars)
        other.log = list(self.log)
        other.rng = random.Random()
        other.rng.setstate(self.rng.getstate())
        other._noise_rngs = {}
        for car_id, rng in self._noise_rngs.items():
            other._noise_rngs[car_id] = random.Random()
            other._noise_rngs[car_id].setstate(rng.getstate())
        return other

    def observe(self) -> dict:
        """Detached JSON-ready state; safety_car applies to the NEXT lap."""
        return {"completed_laps": self.lap, "remaining_laps": self.config.laps - self.lap,
                "safety_car": self.safety_car, "done": self.done,
                "cars": [{"car_id": car.car_id, "position": i + 1,
                          "elapsed_s": car.elapsed_s, "compound": car.compound,
                          "tyre_age": car.tyre_age, "fuel_kg": car.fuel_kg,
                          "used_compounds": sorted(car.used_compounds)}
                         for i, car in enumerate(self.order())]}

    def step(self, actions: Mapping[str, str | None] | None = None) -> list[LapRecord]:
        if self.done:
            raise RuntimeError("Race finished; call reset()")
        actions = dict(actions or {})
        ids = {car.car_id for car in self.cars}
        if actions.keys() - ids or any(a is not None and a not in COMPOUNDS for a in actions.values()):
            raise ValueError("Invalid car ID or compound; race state was not changed")
        c = self.config
        sc = self.safety_car
        previous = self.order()
        before = {car.car_id: car.elapsed_s for car in previous}
        details = {}
        noise = {car.car_id: self._noise_rngs[car.car_id].gauss(0, c.lap_noise_std_s * math.sqrt(c.distance_per_lap))
                 for car in self.cars}
        # Compute traffic from a single immutable pre-lap snapshot, never update order in-place.
        for i, car in enumerate(previous):
            action = actions.get(car.car_id)
            pitted = action is not None
            if pitted:
                car.compound = action
                car.tyre_age = 0
            age = car.tyre_age
            fuel = car.fuel_kg
            traffic = 0.0
            front_id = previous[i - 1].car_id if i else ""
            gap = before[car.car_id] - before[front_id] if i else None
            if i and not sc and not pitted and actions.get(previous[i - 1].car_id) is None:
                if gap < c.traffic_gap_s:
                    traffic = c.traffic_penalty_s * c.distance_per_lap
            pit_loss = (c.pit_loss_sc_s if sc else c.pit_loss_green_s) if pitted else 0.0
            expected = driving_components(c, car.compound, age, fuel, car.pace_delta_s, sc)
            base, pace, tyre, fuel_effect = (expected[k] for k in
                ("base_time_s", "pace_delta_s", "tyre_delta_s", "fuel_effect_s"))
            variation = 0.0 if sc else noise[car.car_id]
            raw = base + pace + tyre + fuel_effect + traffic + variation
            driving = max(0.001, raw)
            car.elapsed_s += driving + pit_loss
            car.used_compounds.add(car.compound)  # Must actually complete a lap on it.
            car.tyre_age = round(car.tyre_age + c.distance_per_lap, 9)
            car.fuel_kg = max(0, fuel - c.fuel_burn_kg_per_lap * c.distance_per_lap)
            details[car.car_id] = dict(tyre_age=age, fuel_kg=fuel, pitted=pitted,
                pit_loss_s=pit_loss, traffic_loss_s=traffic, position_before=i + 1,
                front_car_id=front_id, gap_ahead_s=gap, base_time_s=base,
                pace_delta_s=pace, tyre_delta_s=tyre, fuel_effect_s=fuel_effect,
                noise_s=variation, time_floor_adjustment_s=driving - raw)
        if sc:
            # No on-track passes: preserve relative order of each pit/non-pit group.
            # Pitters may lose places to non-pitters. Queue spacing is a minimum;
            # no artificial teleporting or instantaneous gap compression.
            for group in (False, True):
                group_cars = [car for car in previous if details[car.car_id]["pitted"] == group]
                for front, rear in zip(group_cars, group_cars[1:]):
                    rear.elapsed_s = max(rear.elapsed_s, front.elapsed_s + c.sc_queue_gap_s)
            self.sc_remaining -= 1
        self.lap += 1
        records = []
        for position, car in enumerate(self.order(), 1):
            detail = details[car.car_id]
            total = car.elapsed_s - before[car.car_id]
            calculated = sum(detail[key] for key in ("base_time_s", "pace_delta_s",
                "tyre_delta_s", "fuel_effect_s", "noise_s", "traffic_loss_s",
                "pit_loss_s", "time_floor_adjustment_s"))
            detail["queue_loss_s"] = max(0.0, total - calculated) if sc else 0.0
            records.append(LapRecord(lap=self.lap, car_id=car.car_id, position=position,
                lap_time_s=total, elapsed_s=car.elapsed_s, compound=car.compound,
                safety_car=sc, **detail))
        self.log.extend(records)
        self._prepare_turn()
        return records

    def classification(self) -> list[dict]:
        """At finish, noncompliant cars are disqualified and rank below all finishers."""
        ranked = sorted(self.cars, key=lambda car: (
            self.done and len(car.used_compounds) < self.config.required_compounds, car.elapsed_s, car.car_id))
        return [{"position": i + 1, "car_id": car.car_id, "elapsed_s": car.elapsed_s,
                 "used_compounds": sorted(car.used_compounds),
                 "status": ("RUNNING" if not self.done else
                            "FINISHED" if len(car.used_compounds) >= self.config.required_compounds else "DSQ")}
                for i, car in enumerate(ranked)]

    def write_csv(self, path: str | Path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(LapRecord.__dataclass_fields__))
            writer.writeheader()
            writer.writerows(asdict(row) for row in self.log)
