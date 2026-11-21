import unittest
from f1_strategy.config import load_config
from f1_strategy.tyres import tyre_delta


class TyreTests(unittest.TestCase):
    def setUp(self):
        self.tyres = load_config().tyres

    def test_fresh_base_pace(self):
        for tyre in self.tyres.values():
            self.assertEqual(tyre_delta(tyre, 0), tyre.base_delta_s)

    def test_linear_before_cliff(self):
        for tyre in self.tyres.values():
            age = tyre.cliff_laps
            self.assertAlmostEqual(tyre_delta(tyre, age), tyre.base_delta_s + age * tyre.degradation_s_per_lap)

    def test_nonlinear_cliff(self):
        for tyre in self.tyres.values():
            first = tyre_delta(tyre, tyre.cliff_laps + 1) - tyre_delta(tyre, tyre.cliff_laps)
            second = tyre_delta(tyre, tyre.cliff_laps + 2) - tyre_delta(tyre, tyre.cliff_laps + 1)
            self.assertGreater(first, tyre.degradation_s_per_lap)
            self.assertGreater(second, first)

    def test_invalid_age(self):
        for age in (-1, float("nan"), float("inf"), True):
            with self.assertRaises(ValueError):
                tyre_delta(self.tyres["SOFT"], age)
