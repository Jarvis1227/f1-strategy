import csv
from dataclasses import asdict, replace
from pathlib import Path
import tempfile
import unittest

from f1_strategy.analysis import COMPONENTS, comparison_report, traffic_context
from f1_strategy.config import load_config
from f1_strategy.player import choose_start, play
from f1_strategy.simulator import RaceSimulator
from f1_strategy.strategies import baseline_actions


class ExplanationTests(unittest.TestCase):
    def test_noise_fixed_by_car_and_lap_despite_order(self):
        config = replace(load_config(), sc_start_probability=0)
        first, second = RaceSimulator(config), RaceSimulator(config)
        first.reset(42)
        second.reset(42)
        # Deliberately reverse the order while preserving car IDs.
        for i, car in enumerate(second.cars):
            car.elapsed_s = (config.cars - i) * 2
        a = {r.car_id: r.noise_s for r in first.step()}
        b = {r.car_id: r.noise_s for r in second.step()}
        self.assertEqual(a, b)

    def test_event_stream_independent_of_pit_calls_and_noise_scale(self):
        config = load_config()
        first, second = RaceSimulator(config), RaceSimulator(replace(config, lap_noise_std_s=2))
        first.reset(42)
        second.reset(42)
        while not first.done:
            a = first.step(baseline_actions(first))
            b = second.step({"car_01": "SOFT" if first.lap % 2 else "HARD"})
            self.assertEqual(a[0].safety_car, b[0].safety_car)

    def test_fork_does_not_mutate_original_or_future_randomness(self):
        race = RaceSimulator(load_config())
        race.reset(99)
        state = race.observe()
        snapshot = race.fork()
        snapshot.step({"car_01": "HARD"})
        self.assertEqual(race.observe(), state)
        actual = race.step({"car_01": "HARD"})
        self.assertEqual(actual, snapshot.log)

    def test_components_account_for_every_lap(self):
        race = RaceSimulator(replace(load_config(), sc_start_probability=0.3))
        race.reset(42)
        while not race.done:
            for row in race.step(baseline_actions(race)):
                self.assertAlmostEqual(sum(getattr(row, key) for key in COMPONENTS), row.lap_time_s)

    def test_legacy_gap_reconstruction(self):
        rows = [dict(lap="1", car_id="car_01", elapsed_s="90"),
                dict(lap="1", car_id="car_02", elapsed_s="90.7"),
                dict(lap="2", car_id="car_01", elapsed_s="180"),
                dict(lap="2", car_id="car_02", elapsed_s="181")]
        index = traffic_context(rows)
        self.assertEqual(index[2, "car_02"]["front_car_id"], "car_01")
        self.assertAlmostEqual(float(index[2, "car_02"]["gap_ahead_s"]), 0.7)

    def test_report_explains_traffic_and_rejects_unmatched_logs(self):
        race = RaceSimulator(replace(load_config(), sc_start_probability=0, lap_noise_std_s=0))
        race.reset(42)
        other = race.fork()
        race.step()
        other.step({"car_01": "HARD"})
        with tempfile.TemporaryDirectory() as folder:
            a, b, report = (Path(folder) / name for name in ("a.csv", "b.csv", "report.md"))
            race.write_csv(a)
            other.write_csv(b)
            comparison_report(a, b, report)
            content = report.read_text(encoding="utf-8")
            self.assertIn("## car_02", content)
            self.assertIn(f"{race.config.grid_gap_s:.6f} s / {race.config.traffic_penalty_s * race.config.distance_per_lap:.2f} s", content)
            self.assertIn("Component differences", content)
            other.step()
            other.write_csv(b)
            with self.assertRaises(ValueError):
                comparison_report(a, b, report)

    def test_player_invalid_input_and_every_car_explanation(self):
        race = RaceSimulator(replace(load_config(), laps=3, cars=2, sc_start_probability=0))
        race.reset(42, ["SOFT", "MEDIUM"])
        answers = iter(["bad", "", "h", ""])
        output = []
        decisions = play(race, lambda _: next(answers), output.append)
        self.assertTrue(race.done)
        self.assertEqual(len(decisions), 3)
        self.assertEqual(race.cars[0].used_compounds, {"SOFT", "HARD"})
        self.assertIn("Invalid choice", "\n".join(output))
        for decision in decisions:
            self.assertEqual(len(decision["effects"]), 2)
            for effect in decision["effects"]:
                self.assertAlmostEqual(sum(effect["component_deltas_s"].values()), effect["lap_delta_s"])

    def test_quit_and_starting_choice(self):
        answers = iter(["bad", "s"])
        self.assertEqual(choose_start(lambda _: next(answers), lambda _: None), "SOFT")
        race = RaceSimulator(load_config())
        self.assertEqual(play(race, lambda _: "q", lambda _: None), [])
        self.assertEqual(race.lap, 0)
