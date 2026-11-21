from dataclasses import replace
import unittest
from f1_strategy.config import load_config
from f1_strategy.simulator import RaceSimulator
from f1_strategy.coaching import coaching
from f1_strategy.tyres import tyre_time

class CompressedRaceTests(unittest.TestCase):
    def config(self, **changes):
        return replace(load_config(), cars=1, sc_start_probability=0,
                       lap_noise_std_s=0, traffic_penalty_s=0, **changes)

    def test_twenty_turns_equal_42_laps_of_distance_wear_fuel_and_time(self):
        short=RaceSimulator(self.config())
        full=RaceSimulator(self.config(laps=42))
        for race in (short,full):
            while not race.done: race.step()
        self.assertEqual(short.lap,20)
        self.assertEqual(short.cars[0].tyre_age,42)
        self.assertAlmostEqual(short.cars[0].fuel_kg,0)
        self.assertAlmostEqual(short.cars[0].elapsed_s,full.cars[0].elapsed_s)

    def test_pit_loss_not_multiplied_and_stint_reset_equivalent(self):
        short=RaceSimulator(self.config())
        full=RaceSimulator(self.config(laps=42))
        for race, pit_turn in ((short,10),(full,21)):
            while not race.done:
                race.step({'car_01':'HARD'} if race.lap==pit_turn else {})
            self.assertEqual(sum(r.pit_loss_s for r in race.log),22)
            self.assertEqual(race.cars[0].used_compounds,{'MEDIUM','HARD'})
        self.assertEqual(short.cars[0].tyre_age,21)
        self.assertAlmostEqual(short.cars[0].elapsed_s,full.cars[0].elapsed_s)

    def test_integral_accounts_for_cliff_crossed_inside_turn(self):
        tyre=load_config().tyres['SOFT']
        whole=tyre_time(tyre,13,2.1)
        self.assertAlmostEqual(whole,tyre_time(tyre,13,1)+tyre_time(tyre,14,1.1))
        self.assertGreater(whole,tyre.base_delta_s*2.1+tyre.degradation_s_per_lap*(13*2.1+2.1**2/2))

    def test_forecasts_match_no_traffic_simulated_future(self):
        race=RaceSimulator(self.config())
        for _ in range(6):race.step()
        info=coaching(race)
        stay=race.fork()
        stays=[stay.step()[0].lap_time_s for _ in range(5)]
        for forecast in info['forecasts']:
            pit=race.fork(); delta=0
            for i in range(5):
                row=pit.step({'car_01':forecast['compound']} if i==0 else {})[0]
                delta+=row.lap_time_s-stays[i]
                self.assertAlmostEqual(delta,forecast['cumulative_changes_s'][i])
        fresh=race.fork();fresh.cars[0].tyre_age=0
        wear=0
        for i in range(5):
            wear+=stays[i]-fresh.step()[0].lap_time_s
            self.assertAlmostEqual(wear,info['tyre_status']['stay_out'][i]['cumulative_wear_loss_s'])

    def test_sc_is_current_turn_only_in_forecast_and_horizon_is_clipped(self):
        race=RaceSimulator(self.config())
        race.sc_remaining=1
        info=coaching(race)
        self.assertEqual(info['tyre_status']['stay_out'][0]['wear_loss_s'],0)
        self.assertTrue(all(r['first_lap_change_s']==15 for r in info['forecasts']))
        self.assertEqual(info['tyre_status']['stay_out'][0]['lap_time_s'],125*2.1)
        race.lap=19
        self.assertEqual(len(coaching(race)['tyre_status']['stay_out']),1)
        race.step()
        self.assertEqual(coaching(race)['forecasts'],[])
