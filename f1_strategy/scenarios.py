"""Authored closing-stint battles; all outcomes still come from the simulator."""
from dataclasses import replace
from importlib.resources import files
import json

from .config import load_config
from .simulator import RaceSimulator
from .strategies import baseline_actions


def specification():
    return json.loads(files('f1_strategy').joinpath('podium_scenario.json').read_text(encoding='utf-8'))


def create_podium(seed):
    spec = specification()
    config = replace(load_config(), cars=len(spec['cars']), laps=spec['laps'], equivalent_laps=spec['equivalent_laps'],
                     fuel_start_kg=spec['fuel_start_kg'], sc_start_probability=spec['sc_start_probability'])
    race = RaceSimulator(config)
    starts = [row['compound'] for row in spec['cars']]
    race.reset(seed, starts)
    race.scenario_id = spec['id']
    for car, row in zip(race.cars, spec['cars']):
        car.elapsed_s, car.tyre_age = row['gap'], row['age']
        # This is a snapshot after earlier stints, not a fresh six-lap race.
        car.used_compounds = {'MEDIUM', 'HARD'}
    return race, starts


def actions_for(race):
    actions = baseline_actions(race)
    if not getattr(race, 'scenario_id', None):
        return actions
    spec = specification()
    rival = next(car for car in race.cars if car.car_id == spec['rival_id'])
    stopped = any(row.car_id == rival.car_id and row.pitted for row in race.log)
    player_last = next((row for row in reversed(race.log) if row.car_id == 'car_01'), None)
    # React only to the previous completed lap, never the player's pending call.
    cover = player_last and player_last.pitted and rival.tyre_age >= spec['rival_cover_min_age']
    pit = not stopped and (cover or race.lap >= spec['rival_planned_pit_turn'])
    actions.pop(rival.car_id, None)
    if pit:
        actions[rival.car_id] = spec['rival_compound']
    return actions


def battle_state(race, decisions):
    if not getattr(race, 'scenario_id', None):
        return None
    spec = specification()
    player = race.cars[0]
    rival = next(car for car in race.cars if car.car_id == spec['rival_id'])
    position = race.order().index(player) + 1
    result = next(row for row in race.classification() if row['car_id'] == 'car_01')
    gap = player.elapsed_s - rival.elapsed_s
    cost = race.config.pit_loss_sc_s if race.safety_car else race.config.pit_loss_green_s
    timeline = []
    previous_gap = spec['cars'][0]['gap'] - spec['cars'][1]['gap']
    for decision in decisions:
        rows = {e['car_id']: e['actual'] for e in decision['effects']}
        p, r = rows['car_01'], rows[spec['rival_id']]
        now_gap = p['elapsed_s'] - r['elapsed_s']
        timeline.append({'lap': decision['lap'], 'race_lap': spec['lap_offset'] + decision['lap'],
                         'action': decision['chosen_action'], 'position': p['position'],
                         'gap_s': now_gap, 'gap_gain_s': previous_gap - now_gap,
                         'pit_loss_s': p['pit_loss_s'], 'rival_pitted': r['pitted'],
                         'rival_response': decision.get('rival_response', '')})
        previous_gap = now_gap
    last = timeline[-1] if timeline else None
    if race.done:
        radio = f"You finished P{result['position']}, {abs(gap):.2f}s {'ahead of' if gap < 0 else 'behind'} Vega. Review the gap timeline, then rewind a call to test a different plan."
    elif last and last['rival_pitted']:
        radio = 'Vega has boxed. This is the pit-cycle crossover. Watch the gap when the positions settle.'
    elif last and last['action']:
        radio = f"You paid {last['pit_loss_s']:g}s for fresh {last['action'].lower()}s. Vega can react on the next lap. Make this tyre advantage count."
    elif last:
        gained = last['gap_gain_s']
        radio = f"You {'gained' if gained >= 0 else 'lost'} {abs(gained):.2f}s against Vega that lap. {'You are ahead: protect the advantage.' if gap < 0 else 'Check the next stint before committing again.'}"
    else:
        radio = 'You are 1.80s from the podium. The Mediums are almost at the cliff. A stop costs 22s; fresh tyres need time to repay it.'
    return {**{key: spec[key] for key in ('id', 'title', 'briefing', 'objective', 'lap_offset',
                                         'rival_id', 'rival_name', 'rival_style')},
            'gap_s': gap, 'position': position, 'remaining_laps': race.config.laps - race.lap,
            'won': race.done and result['status'] == 'FINISHED' and result['position'] <= 3 and gap < 0,
            'projected_pit_exit_position': 1 + sum(c.elapsed_s < player.elapsed_s + cost
                                                  for c in race.cars if c.car_id != 'car_01'),
            'radio': radio, 'timeline': timeline,
            'rules_note': 'Both dry compounds were already used before this closing-stint snapshot. No random safety cars in this authored battle.'}
