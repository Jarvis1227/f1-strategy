"""Tyre ages and distances use equivalent physical laps; fresh age is zero."""
import math
from .config import TyreConfig


def tyre_delta(config: TyreConfig, age: float) -> float:
    if isinstance(age, bool) or not isinstance(age, (int, float)) or not math.isfinite(age) or age < 0:
        raise ValueError("Tyre age must be a finite nonnegative number")
    excess = max(0, age - config.cliff_laps)
    return (config.base_delta_s + config.degradation_s_per_lap * age
            + config.cliff_coefficient * excess ** config.cliff_exponent)


def tyre_time(config: TyreConfig, age: float, distance: float) -> float:
    """Integral of tyre pace over a turn, including a cliff crossed mid-turn."""
    tyre_delta(config, age)  # Validate the starting age.
    if not math.isfinite(distance) or distance <= 0:
        raise ValueError("Distance must be positive and finite")
    power = config.cliff_exponent + 1
    return (config.base_delta_s * distance
            + config.degradation_s_per_lap * (age * distance + distance ** 2 / 2)
            + config.cliff_coefficient / power *
              (max(0, age + distance - config.cliff_laps) ** power
               - max(0, age - config.cliff_laps) ** power))


def driving_components(config, compound, age, fuel, pace_delta=0, safety_car=False):
    """Expected seconds per game turn, shared by simulator and forecasts."""
    d = config.distance_per_lap
    return dict(base_time_s=(config.sc_lap_s if safety_car else config.base_lap_s) * d,
                pace_delta_s=0 if safety_car else pace_delta * d,
                tyre_delta_s=0 if safety_car else tyre_time(config.tyres[compound], age, d),
                fuel_effect_s=0 if safety_car else max(0, fuel - config.fuel_burn_kg_per_lap * d / 2)
                    * config.fuel_s_per_kg * d)
