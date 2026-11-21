from dataclasses import replace
import unittest

from f1_strategy.coaching import coaching, move_recap
from f1_strategy.config import load_config
from f1_strategy.player import take_turn
from f1_strategy.simulator import RaceSimulator


class CoachingTests(unittest.TestCase):
    def setUp(self):
        self.race = RaceSimulator(replace(load_config(), sc_start_probability=0, lap_noise_std_s=0))
        self.race.reset(42)

    def test_forecast_is_read_only_and_does_not_use_hidden_noise(self):
        state = self.race.observe()
        rng = self.race.rng.getstate()
        noise = {key: value.getstate() for key, value in self.race._noise_rngs.items()}
        result = coaching(self.race)
        self.assertEqual(result['horizon'], 10)
        self.assertEqual(len(result['forecasts']), 3)
        self.assertEqual(self.race.observe(), state)
        self.assertEqual(self.race.rng.getstate(), rng)
        self.assertEqual({key: value.getstate() for key, value in self.race._noise_rngs.items()}, noise)

    def test_fresh_same_compound_only_adds_pit_loss(self):
        forecast = next(row for row in coaching(self.race)['forecasts'] if row['compound'] == 'MEDIUM')
        self.assertTrue(all(abs(value - self.race.config.pit_loss_green_s) < 1e-8 for value in forecast['cumulative_changes_s']))
        self.assertIsNone(forecast['payback_laps'])

    def test_sc_first_lap_cost_and_recap_are_correct(self):
        self.race.sc_remaining = 2
        result = coaching(self.race)
        self.assertTrue(all(row['first_lap_change_s'] == self.race.config.pit_loss_sc_s for row in result['forecasts']))
        decision = take_turn(self.race, 'HARD')
        recap = move_recap(self.race, decision, 0, 'MEDIUM')
        self.assertEqual(recap['pit_savings_s'], self.race.config.pit_loss_green_s - self.race.config.pit_loss_sc_s)
        self.assertEqual(recap['tyre_age_before'], 0)
        self.assertIn('investment', recap['headline'])

    def test_old_tyres_can_repay_a_stop_without_promising_a_race_win(self):
        self.race.cars[0].compound = 'SOFT'
        self.race.cars[0].tyre_age = 28
        result = coaching(self.race)
        forecast = next(row for row in result['forecasts'] if row['compound'] == 'HARD')
        self.assertLess(forecast['horizon_change_s'], 0)
        self.assertIsNotNone(forecast['payback_laps'])
        self.assertIn('model cliff', result['message'])
        self.assertIn('not predicted', result['assumptions'])

    def test_horizon_respects_race_distance_and_rule_warning(self):
        self.race.lap = self.race.config.laps - 1
        self.race.cars[0].used_compounds = {'MEDIUM'}
        result = coaching(self.race)
        self.assertEqual(result['horizon'], 1)
        self.assertEqual(len(result['forecasts'][0]['cumulative_changes_s']), 1)
        self.assertIn('unused compound', result['message'])
        self.race.lap = self.race.config.laps
        self.assertEqual(coaching(self.race)['forecasts'], [])
