import test from 'node:test';
import assert from 'node:assert/strict';
import {replayFrame,decisionPause,radioMessage,battleGapY} from '../src/replay.js';

const car=(id,pos,gap)=>({car_id:id,position:pos,gap_to_leader_s:gap,elapsed_s:100+gap,compound:'MEDIUM',tyre_age:5,cliff_laps:23,used_compounds:['MEDIUM']});
const before={cars:[car('car_01',1,0),car('car_02',2,.5)],base_lap_s:90};
const after={...before,cars:[car('car_02',1,0),car('car_01',2,21.5)],last_decision:{effects:[{car_id:'car_01',actual:{pitted:true,pit_loss_s:22}},{car_id:'car_02',actual:{pitted:false,pit_loss_s:0}}]}};
test('replay starts and ends at the recorded standings',()=>{
  const start=replayFrame(before,after,0),end=replayFrame(before,after,1);
  assert.deepEqual(start.map(c=>c.car_id),['car_01','car_02']);
  assert.deepEqual(end.map(c=>c.car_id),['car_02','car_01']);
  assert.equal(end.find(c=>c.car_id==='car_01').gap_to_leader_s,21.5);
});
test('a pit stop has a visible stopped phase and finishes off pit lane',()=>{
  const middle=replayFrame(before,after,.2).find(c=>c.car_id==='car_01');
  assert.equal(middle.stopped,true);
  assert.ok(middle.pitPhase!==null && middle.pitCountdown>0);
  assert.equal(replayFrame(before,after,1).find(c=>c.car_id==='car_01').pitPhase,null);
});
test('stint running pauses for SC, tyre cliff and the compound deadline',()=>{
  const base={cars:before.cars,safety_car:false,total_laps:50,completed_laps:10,required_compounds:2};
  assert.equal(decisionPause(base),null);
  assert.match(decisionPause({...base,safety_car:true}),/Safety car/);
  assert.match(decisionPause({...base,cars:[{...base.cars[0],tyre_age:22},base.cars[1]]}),/tyres/);
  assert.match(decisionPause({...base,completed_laps:49}),/classification/);
});
test('radio uses the observed rival gap, not an invented overtake',()=>{
  const race={...after,done:false,safety_car:false,last_decision:null};
  const message=radioMessage(race);
  assert.match(message.headline,/VEGA/);
  assert.match(message.headline,/21.50/);
});

test('battle gap chart puts a rival lead above zero and a player lead below',()=>{
  assert.equal(battleGapY(0,20),60);
  assert.ok(battleGapY(10,20)<60);
  assert.ok(battleGapY(-10,20)>60);
});
