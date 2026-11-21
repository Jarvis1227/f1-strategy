"""Validated, immutable configuration. All times are seconds, fuel is kilograms."""
from dataclasses import dataclass
from importlib.resources import files
from pathlib import Path
from types import MappingProxyType
from typing import Mapping
import json
import math

COMPOUNDS = ("SOFT", "MEDIUM", "HARD")


@dataclass(frozen=True)
class TyreConfig:
    base_delta_s: float
    degradation_s_per_lap: float
    cliff_laps: int
    cliff_coefficient: float
    cliff_exponent: float


@dataclass(frozen=True)
class RaceConfig:
    track: str
    laps: int
    cars: int
    base_lap_s: float
    grid_gap_s: float
    car_pace_step_s: float
    lap_noise_std_s: float
    fuel_start_kg: float
    fuel_burn_kg_per_lap: float
    fuel_s_per_kg: float
    pit_loss_green_s: float
    pit_loss_sc_s: float
    required_compounds: int
    traffic_gap_s: float
    traffic_penalty_s: float
    sc_start_probability: float
    sc_min_laps: int
    sc_max_laps: int
    sc_lap_s: float
    sc_queue_gap_s: float
    tyres: Mapping[str, TyreConfig]

    equivalent_laps: float = 0  # Zero means one physical lap per game turn.

    @property
    def distance_per_lap(self):
        return (self.equivalent_laps or self.laps) / self.laps

    def __post_init__(self):
        for key, value in vars(self).items():
            if key in {"track", "tyres"}:
                continue
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError(f"{key} must be a finite number")
            if value < 0:
                raise ValueError(f"{key} must be nonnegative")
        for key in ("laps", "cars", "required_compounds", "sc_min_laps", "sc_max_laps"):
            if type(getattr(self, key)) is not int or getattr(self, key) < 1:
                raise ValueError(f"{key} must be a positive integer")
        if not isinstance(self.track, str) or not self.track:
            raise ValueError("track must be a nonempty string")
        if self.base_lap_s <= 0 or self.sc_lap_s < self.base_lap_s:
            raise ValueError("SC pace must be at least the positive base lap time")
        if self.required_compounds > min(3, self.laps):
            raise ValueError("Required compounds must be achievable within the race")
        if self.sc_start_probability > 1 or self.sc_max_laps < self.sc_min_laps:
            raise ValueError("Invalid safety car probability/duration")
        if self.pit_loss_sc_s > self.pit_loss_green_s:
            raise ValueError("SC pit loss must not exceed green pit loss")
        if self.fuel_start_kg + 1e-9 < self.laps * self.distance_per_lap * self.fuel_burn_kg_per_lap:
            raise ValueError("Starting fuel must cover the race")
        if set(self.tyres) != set(COMPOUNDS):
            raise ValueError("Exactly SOFT, MEDIUM and HARD tyre configs are required")
        for tyre in self.tyres.values():
            if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v)
                   for v in vars(tyre).values()):
                raise ValueError("Tyre parameters must be finite numbers")
            if type(tyre.cliff_laps) is not int or tyre.cliff_laps < 0:
                raise ValueError("cliff_laps must be a nonnegative integer")
            if min(tyre.degradation_s_per_lap, tyre.cliff_coefficient) < 0 or tyre.cliff_exponent <= 1:
                raise ValueError("Wear must be nonnegative and cliff exponent > 1")
            if self.base_lap_s + tyre.base_delta_s <= 0:
                raise ValueError("Fresh tyre lap time must be positive")
        object.__setattr__(self, "tyres", MappingProxyType(dict(self.tyres)))


def load_config(path: str | Path | None = None) -> RaceConfig:
    raw = json.loads(Path(path).read_text(encoding="utf-8") if path else
                     files("f1_strategy").joinpath("default_config.json").read_text(encoding="utf-8"))
    raw["tyres"] = {name: TyreConfig(**values) for name, values in raw["tyres"].items()}
    return RaceConfig(**raw)

