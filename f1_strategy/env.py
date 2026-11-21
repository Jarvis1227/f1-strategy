"""Optional single-player Gymnasium adapter. No learning code or trained agents."""
import gymnasium as gym
import numpy as np
from gymnasium import spaces

from .config import COMPOUNDS, load_config
from .simulator import RaceSimulator
from .strategies import baseline_actions


class RaceEnv(gym.Env):
    """Actions: 0 stay, 1 Soft, 2 Medium, 3 Hard. Player is car_01.

    Observation rows have stable car-ID order; columns are position, elapsed
    time, compound index, completed tyre laps, fuel, and three compound-use bits.
    Global features: laps remaining and safety-car flag for the coming turn.
    """
    metadata = {"render_modes": []}

    def __init__(self, config=None):
        self.race = RaceSimulator(config or load_config())
        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Dict({
            "cars": spaces.Box(0, np.inf, shape=(self.race.config.cars, 8), dtype=np.float32),
            "race": spaces.Box(0, np.inf, shape=(2,), dtype=np.float32),
        })
        self._has_reset = False

    def _observation(self):
        positions = {car.car_id: i + 1 for i, car in enumerate(self.race.order())}
        return {
            "cars": np.array([[positions[car.car_id], car.elapsed_s,
                               COMPOUNDS.index(car.compound), car.tyre_age, car.fuel_kg,
                               *[int(name in car.used_compounds) for name in COMPOUNDS]]
                              for car in self.race.cars], dtype=np.float32),
            "race": np.array([self.race.config.laps - self.race.lap,
                              int(self.race.safety_car)], dtype=np.float32),
        }

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        options = options or {}
        start = options.get("starting_compound", "MEDIUM")
        starts = [start] + ["MEDIUM" if i % 2 else "SOFT"
                            for i in range(1, self.race.config.cars)]
        # Derive simulator seeds from Gym's RNG, including seed=None resets.
        race_seed = int(self.np_random.integers(0, 2**63))
        self.race.reset(race_seed, starts)
        self._has_reset = True
        return self._observation(), {"player_id": "car_01"}

    def step(self, action):
        if not self._has_reset:
            raise RuntimeError("Call reset() before step()")
        if not self.action_space.contains(action):
            raise ValueError("Action must be 0, 1, 2 or 3")
        actions = baseline_actions(self.race)
        actions["car_01"] = None if action == 0 else COMPOUNDS[int(action) - 1]
        rows = self.race.step(actions)
        done = self.race.done
        reward = 0.0
        info = {"lap_log": [vars(row).copy() for row in rows]}
        if done:
            results = self.race.classification()
            player = next(row for row in results if row["car_id"] == "car_01")
            reward = (-1.0 if player["status"] == "DSQ" else
                      (self.race.config.cars - player["position"]) / max(1, self.race.config.cars - 1))
            info["classification"] = results
        return self._observation(), reward, done, False, info
