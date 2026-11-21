import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PROFILE, award, normalizeProfile, completeLesson, learnFromRace, rankFor, personalBest } from '../src/progression.js';

const race = {race_id: 'a', done: true, seed: 42, starting_compound: 'MEDIUM', config_signature: 'config-a', focus: 'clean',
  classification: [{car_id:'car_01',position:2,elapsed_s:4800,status:'FINISHED'}],
  summary:[{car_id:'car_01',baseline_status:'FINISHED',time_change_s:-2}],
  last_decision:{recap:{pit_savings_s:7}}};

test('malformed or old progress recovers to a safe profile', () => {
  assert.deepEqual(normalizeProfile(null), EMPTY_PROFILE);
  assert.deepEqual(normalizeProfile({version: 9}), EMPTY_PROFILE);
  assert.deepEqual(normalizeProfile({version: 1, badges:['fake','legal','legal'],races:[{}]}), {version:1,badges:['legal'],races:[]});
});
test('lessons award only a correct answer and only once', () => {
  assert.equal(completeLesson(EMPTY_PROFILE, 'tyres', 0).fresh.length,0);
  const first=completeLesson(EMPTY_PROFILE,'tyres',1);
  assert.deepEqual(first.fresh,['lesson-tyres']);
  assert.deepEqual(completeLesson(first.profile,'tyres',1).fresh,[]);
});
test('race milestones persist without refresh farming', () => {
  const first=learnFromRace(EMPTY_PROFILE,race);
  assert.equal(first.fresh.length,4);
  assert.equal(first.profile.races.length,1);
  const again=learnFromRace(first.profile,race);
  assert.deepEqual(again.fresh,[]);
  assert.equal(again.profile.races.length,1);
});
test('DSQ earns full-distance experience but no clean-finish or baseline badge', () => {
  const dsq={...race,last_decision:null,classification:[{...race.classification[0],status:'DSQ'}]};
  assert.deepEqual(learnFromRace(EMPTY_PROFILE,dsq).fresh,['distance']);
});
test('rank points are derived from earned fixed milestones', () => {
  const p=award(EMPTY_PROFILE,['legal','distance']).profile;
  assert.equal(rankFor(p).points,50);
  assert.equal(rankFor(p).rank.name,'Race reader');
});
test('personal best compares only like-for-like conditions', () => {
  const p=learnFromRace(EMPTY_PROFILE,race).profile;
  assert.equal(personalBest(p,{...race,race_id:'b'}),4800);
  assert.equal(personalBest(p,{...race,race_id:'b',seed:7}),null);
  assert.equal(personalBest(p,{...race,race_id:'b',config_signature:'other'}),null);
});
test('the local journal has a bounded history', () => {
  let p=EMPTY_PROFILE;
  for(let i=0;i<20;i++) p=learnFromRace(p,{...race,race_id:String(i)}).profile;
  assert.equal(p.races.length,12);
  assert.equal(p.races[0].race_id,'19');
});
