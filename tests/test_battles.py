import importlib.util
import unittest

from f1_strategy.scenarios import create_podium, actions_for
from f1_strategy.player import take_turn


class RivalTests(unittest.TestCase):
    def test_warm_start_and_reaction_only_after_observed_stop(self):
        race, _ = create_podium(42)
        self.assertEqual(race.order().index(race.cars[0]) + 1, 4)
        self.assertEqual(race.cars[0].tyre_age, 22)
        self.assertEqual(race.cars[0].used_compounds, {'MEDIUM', 'HARD'})
        self.assertNotIn('car_02', actions_for(race))
        chosen = take_turn(race, 'SOFT', actions_for(race))
        self.assertNotIn('car_02', chosen['opponent_actions'])
        self.assertEqual(actions_for(race)['car_02'], 'SOFT')
        fork = race.fork()
        self.assertEqual(fork.scenario_id, race.scenario_id)
        self.assertEqual(actions_for(fork), actions_for(race))


@unittest.skipUnless(importlib.util.find_spec('fastapi'), 'Install web extra')
class BattleApiTests(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        from f1_strategy.api import app, sessions
        sessions.clear()
        self.client = TestClient(app)

    def new(self, **extra):
        response = self.client.post('/api/races', json={'mode':'podium','seed':42,**extra})
        self.assertEqual(response.status_code,201)
        return response.json()

    def finish(self, race, pit_turn=None):
        for lap in range(race['completed_laps'],6):
            response = self.client.post(f"/api/races/{race['race_id']}/turn",
                                       json={'expected_lap':lap,'compound':'SOFT' if lap==pit_turn else None})
            self.assertEqual(response.status_code,200)
            race=response.json()
        return race

    def test_battle_outcomes_depend_on_calls_and_grand_prix_stays_available(self):
        race=self.new()
        self.assertEqual(race['total_laps'],6)
        self.assertAlmostEqual(race['distance_per_lap'],2.1)
        self.assertAlmostEqual(race['battle']['gap_s'],1.8)
        self.assertEqual(race['battle']['projected_pit_exit_position'],10)
        win=self.finish(race,0)
        loss=self.finish(self.new())
        self.assertTrue(win['battle']['won'])
        self.assertEqual(win['battle']['position'],3)
        self.assertFalse(loss['battle']['won'])
        self.assertGreater(loss['battle']['gap_s'],0)
        self.assertTrue(win['battle']['timeline'][1]['rival_pitted'])
        gp=self.new(mode='grand_prix')
        self.assertEqual(gp['total_laps'],20)
        self.assertIsNone(gp['battle'])

    def test_baseline_uses_identical_inherited_state(self):
        data=self.finish(self.new(),0)
        expected,_=create_podium(42)
        while not expected.done:
            expected.step(actions_for(expected))
        summary=next(row for row in data['summary'] if row['car_id']=='car_01')
        actual=next(row for row in data['classification'] if row['car_id']=='car_01')
        self.assertAlmostEqual(summary['time_change_s'],actual['elapsed_s']-expected.cars[0].elapsed_s)
        for row in data['summary']:
            self.assertAlmostEqual(row['time_change_s'],sum(row['component_changes_s'].values()))

    def test_rewind_branches_before_call_preserves_original_and_can_change_result(self):
        start=self.new()
        second=self.client.post(f"/api/races/{start['race_id']}/turn",json={'expected_lap':0}).json()
        original=self.finish(second)
        url=f"/api/races/{original['race_id']}"
        response=self.client.post(url+'/rewind',json={'lap':2})
        self.assertEqual(response.status_code,201)
        branch=response.json()
        self.assertNotEqual(branch['race_id'],original['race_id'])
        self.assertEqual(branch['completed_laps'],1)
        self.assertEqual(branch['branch_from']['position'],original['battle']['position'])
        self.assertIn('finished', original['battle']['radio'])
        self.assertEqual(branch['cars'],second['cars'])
        self.assertEqual(branch['last_decision'],second['last_decision'])
        replay=self.finish(branch)
        self.assertEqual(replay['cars'],original['cars'])
        new_branch=self.client.post(url+'/rewind',json={'lap':1}).json()
        alternate=self.finish(new_branch,0)
        self.assertTrue(alternate['battle']['won'])
        self.assertEqual(self.client.get(url).json()['cars'],original['cars'])

    def test_rewind_validation_and_bounded_store(self):
        from f1_strategy.api import MAX_SESSIONS,sessions
        race=self.new()
        url=f"/api/races/{race['race_id']}/rewind"
        self.assertEqual(self.client.post(url,json={'lap':1}).status_code,409)
        self.assertEqual(self.client.post(url,json={'lap':True}).status_code,422)
        finished=self.finish(race)
        for _ in range(MAX_SESSIONS+2):
            response=self.client.post(url,json={'lap':1})
            self.assertEqual(response.status_code,201)
        self.assertLessEqual(len(sessions),MAX_SESSIONS)
        self.assertIn(finished['race_id'],sessions)
