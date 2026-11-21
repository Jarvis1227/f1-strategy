import csv
from dataclasses import replace
from pathlib import Path
import tempfile
import unittest

from f1_strategy.config import load_config
from f1_strategy.simulator import RaceSimulator
from f1_strategy.strategies import baseline_actions


class RaceTests(unittest.TestCase):
    def setUp(self):
        self.config = replace(load_config(), laps=50, equivalent_laps=50, fuel_start_kg=100, lap_noise_std_s=0, sc_start_probability=0)
        self.race = RaceSimulator(self.config)
        self.race.reset(7)

    def test_green_pit_cost_and_fresh_tyres(self):
        self.race.step()
        rows = self.race.step({"car_01": "SOFT"})
        row = next(r for r in rows if r.car_id == "car_01")
        expected = self.config.base_lap_s - 1 + .09/2 + 97 * self.config.fuel_s_per_kg + 22
        self.assertAlmostEqual(row.lap_time_s, expected)
        self.assertEqual(row.tyre_age, 0)
        self.assertEqual(self.race.cars[0].tyre_age, 1)
        self.assertEqual(row.compound, "SOFT")
        self.assertEqual(self.race.cars[0].used_compounds, {"MEDIUM", "SOFT"})

    def test_sc_cheaper_pit(self):
        self.race.sc_remaining = 2
        row = next(r for r in self.race.step({"car_01": "HARD"}) if r.car_id == "car_01")
        self.assertTrue(row.safety_car)
        self.assertEqual(row.pit_loss_s, self.config.pit_loss_sc_s)
        self.assertEqual(row.lap_time_s, self.config.sc_lap_s + self.config.pit_loss_sc_s)
        self.assertLess(row.pit_loss_s, self.config.pit_loss_green_s)

    def test_same_compound_pit_resets_age_but_not_rule(self):
        self.race.step()
        self.race.step({"car_01": "MEDIUM"})
        self.assertEqual(self.race.cars[0].tyre_age, 1)
        self.assertEqual(self.race.cars[0].used_compounds, {"MEDIUM"})

    def test_invalid_actions_are_atomic(self):
        state = self.race.observe()
        rng_state = self.race.rng.getstate()
        for action in ({"unknown": "SOFT"}, {"car_01": "WET"},
                       {"car_01": "SOFT", "car_02": "invalid"}):
            with self.assertRaises(ValueError):
                self.race.step(action)
            self.assertEqual(state, self.race.observe())
            self.assertEqual(rng_state, self.race.rng.getstate())

    def test_two_compound_rule_and_final_lap_pit(self):
        for _ in range(49):
            self.race.step()
        self.race.step({"car_02": "HARD"})
        result = self.race.classification()
        self.assertEqual(result[0]["car_id"], "car_02")
        self.assertEqual(result[0]["status"], "FINISHED")
        self.assertTrue(all(row["status"] == "DSQ" for row in result[1:]))
        self.assertEqual(self.race.log[-10].lap, 50)

    def test_fuel_burn(self):
        self.race.step()
        self.assertEqual(self.race.cars[0].fuel_kg, 98)
        first = next(r for r in self.race.log if r.car_id == "car_01")
        second = next(r for r in self.race.step() if r.car_id == "car_01")
        expected_change = self.config.tyres["MEDIUM"].degradation_s_per_lap - 2 * self.config.fuel_s_per_kg
        self.assertAlmostEqual(second.lap_time_s - first.lap_time_s, expected_change)

    def test_traffic_threshold_and_pitting_exclusion(self):
        self.race.cars[1].elapsed_s = 1.0
        self.race.cars[2].elapsed_s = 2.5
        rows = {r.car_id: r for r in self.race.step()}
        self.assertEqual(rows["car_02"].traffic_loss_s, 0)
        race = RaceSimulator(self.config)
        rows = {r.car_id: r for r in race.step({"car_02": "HARD"})}
        self.assertEqual(rows["car_02"].traffic_loss_s, 0)
        self.assertEqual(rows["car_03"].traffic_loss_s, 0)
        self.assertEqual(rows["car_04"].traffic_loss_s, self.config.traffic_penalty_s)

    def test_sc_event_duration_and_visibility(self):
        race = RaceSimulator(replace(self.config, sc_start_probability=1, sc_min_laps=2, sc_max_laps=2))
        self.assertTrue(race.observe()["safety_car"])
        self.assertEqual(race.sc_remaining, 2)
        self.assertTrue(all(r.safety_car for r in race.step()))
        self.assertEqual(race.sc_remaining, 1)
        self.assertTrue(all(r.safety_car for r in race.step()))
        # A new event can start immediately after one ends (documented Bernoulli model).
        self.assertEqual(race.sc_remaining, 2)

    def test_sc_no_on_track_passes(self):
        self.race.sc_remaining = 1
        before = [c.car_id for c in self.race.order()]
        self.race.step()
        self.assertEqual(before, [c.car_id for c in self.race.order()])

    def test_race_csv_and_time_accounting(self):
        while not self.race.done:
            self.race.step(baseline_actions(self.race))
        self.assertEqual(len(self.race.log), 500)
        self.assertTrue(all(row["status"] == "FINISHED" for row in self.race.classification()))
        for lap in range(1, 51):
            self.assertEqual(sorted(r.position for r in self.race.log if r.lap == lap), list(range(1, 11)))
        for i, car in enumerate(self.race.cars):
            self.assertAlmostEqual(sum(r.lap_time_s for r in self.race.log if r.car_id == car.car_id)
                                   + i * self.config.grid_gap_s, car.elapsed_s)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "laps.csv"
            self.race.write_csv(path)
            with path.open(newline="", encoding="utf-8") as stream:
                self.assertEqual(len(list(csv.DictReader(stream))), 500)
        with self.assertRaises(RuntimeError):
            self.race.step()

    def test_seeded_replay_and_reset(self):
        race = RaceSimulator(load_config())
        def run():
            race.reset(123)
            while not race.done:
                race.step(baseline_actions(race))
            return list(race.log)
        first = run()
        self.assertEqual(first, run())
        race.reset(124)
        race.step()
        self.assertNotEqual(first[:10], race.log)

    def test_observation_is_detached(self):
        observation = self.race.observe()
        observation["cars"][0]["used_compounds"].append("HARD")
        self.assertFalse(self.race.cars[0].used_compounds)

    def test_invalid_config(self):
        for changes in ({"laps": 0}, {"cars": True}, {"sc_start_probability": 1.1},
                        {"fuel_start_kg": 1}, {"base_lap_s": float("nan")},
                        {"pit_loss_sc_s": 30}, {"required_compounds": 4}):
            with self.assertRaises(ValueError):
                replace(self.config, **changes)
