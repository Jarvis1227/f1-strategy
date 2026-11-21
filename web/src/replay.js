export const DRIVERS = {
  car_01: {name:'YOU',team:'VECTOR RACING',color:'#ddff70'},
  car_02: {name:'VEGA',team:'LUMEN GP',color:'#55deed'},
  car_03: {name:'RUIZ',team:'ATLAS',color:'#789bff'},
  car_04: {name:'KATO',team:'SOL MOTORSPORT',color:'#ff9860'},
  car_05: {name:'NOVAK',team:'NOVA',color:'#ba9aff'},
  car_06: {name:'SILVA',team:'APEX',color:'#50dfb0'},
  car_07: {name:'REED',team:'METEOR',color:'#fa6c83'},
  car_08: {name:'ROSSI',team:'ARROW',color:'#83bff5'},
  car_09: {name:'CHEN',team:'ARGON',color:'#e2e7ee'},
  car_10: {name:'MOREAU',team:'NIMBUS',color:'#f1cf6a'},
};

export const CIRCUIT = 'M 190 430 L 665 430 Q 730 430 730 365 L 730 320 Q 730 290 690 280 L 620 260 Q 585 250 610 220 L 660 170 Q 690 135 640 115 L 560 85 Q 525 75 500 105 L 470 150 Q 450 180 420 150 L 350 90 Q 325 70 300 105 L 250 180 Q 230 210 180 180 L 145 160 Q 100 140 95 190 L 85 385 Q 85 430 135 430 Z';
export const PIT_LANE = 'M 165 430 Q 190 485 250 485 L 320 485 Q 345 485 360 430';

export function decisionPause(race) {
  if (!race || race.done) return 'The race is complete.';
  const player = race.cars.find(car=>car.car_id==='car_01');
  if (race.safety_car) return 'Safety car. A pit window needs your call.';
  if (player.tyre_age >= player.cliff_laps - 2 * (race.distance_per_lap||1)) return 'Your tyres are approaching the cliff. Review the next stint.';
  if (race.total_laps-race.completed_laps <= 3 && player.used_compounds.length < race.required_compounds) return 'Protect your classification: you still need another compound.';
  return null;
}

export function replayFrame(before, after, phase) {
  const t=Math.max(0,Math.min(1,phase));
  const records=Object.fromEntries((after.last_decision?.effects||[]).map(e=>[e.car_id,e.actual]));
  const rows=after.cars.map(car=>{
    const old=before.cars.find(item=>item.car_id===car.car_id)||car;
    const record=records[car.car_id];
    const pit=record?.pitted?record.pit_loss_s:0;
    const delayStart=.09;
    const delayLength=Math.max(.03,pit/after.base_lap_s);
    const pitFraction=pit?Math.max(0,Math.min(1,(t-delayStart)/delayLength)):0;
    const gap=old.gap_to_leader_s+(car.gap_to_leader_s-old.gap_to_leader_s-pit)*t+pit*pitFraction;
    const start=.04, stop=delayStart+delayLength, end=stop+.08;
    let pitPhase=null;
    if(pit && t>=start && t<end){
      pitPhase=t<delayStart? .38*(t-start)/(delayStart-start):t<stop ? .38 : .38+.62*(t-stop)/.08;
    }
    return {...car,compound:t<1&&(!pit||t<stop)?old.compound:car.compound,tyre_age:t<1?old.tyre_age:car.tyre_age,gap_to_leader_s:gap,progress:t-gap/after.base_lap_s,pitPhase,
      stopped:pitPhase!==null && t>=delayStart && t<stop,
      pitCountdown:pitPhase!==null?Math.max(0,pit*(1-pitFraction)):0};
  }).sort((a,b)=>b.progress-a.progress||a.car_id.localeCompare(b.car_id));
  const leaderGap=rows[0]?.gap_to_leader_s||0;
  return rows.map((car,i)=>({...car,position:i+1,gap_to_leader_s:Math.max(0,car.gap_to_leader_s-leaderGap)}));
}

export function radioMessage(race) {
  if(!race) return {tag:'ON THE GRID',headline:'This is your race.',body:'Choose the opening tyre. We will take it one call at a time.'};
  const player=race.cars.find(car=>car.car_id==='car_01');
  const rows=race.last_decision?.effects||[];
  const effect=rows.find(item=>item.car_id==='car_01');
  const row=effect?.actual;
  if(race.done){
    const result=race.classification.find(car=>car.car_id==='car_01');
    return result.status==='DSQ'?{tag:'CHEQUERED FLAG',headline:'We missed the compound rule.',body:'The distance is done. Next race, complete a lap on a second compound before the flag.'}:
      {tag:'CHEQUERED FLAG',headline:`P${result.position}. Bring it home.`,body:'That is the race. Let us find the call that made the difference.'};
  }
  if(row?.pitted) return {tag:'PIT EXIT',headline:`You are out P${row.position}. Fresh ${row.compound.toLowerCase()} tyres.`,body:`The stop cost ${row.pit_loss_s}s. ${race.safety_car?`Safety car is still out; this saved ${race.green_pit_cost_s-row.pit_loss_s}s against a green stop.`:"Now watch the pace and the gap. The tyre benefit must repay the stop."}`};
  if(race.safety_car) return {tag:'SAFETY CAR',headline:`Pit loss is ${race.sc_pit_cost_s} seconds.`,body:`That saves ${race.green_pit_cost_s-race.sc_pit_cost_s}s. Tyres still young? You can keep position. Need a new set? This may be your window.`};
  if(player.tyre_age>player.cliff_laps) return {tag:'TYRE WARNING',headline:'The old tyres are starting to cost us.',body:`Equivalent age ${player.tyre_age.toFixed(1)}, beyond the model cliff at ${player.cliff_laps}. A fresh set costs time now; staying out is getting more expensive.`};
  const rival=race.cars.find(car=>car.position===player.position-1);
  if(rival){
    const gap=player.elapsed_s-rival.elapsed_s;
    return {tag:gap<1?'IN THE FIGHT':'NEXT TARGET',headline:`${DRIVERS[rival.car_id].name}, ${gap.toFixed(2)} seconds ahead.`,body:gap<1?'We are in close-following range. That can cost lap time. Watch whether the rival pits before choosing your response.':'Keep an eye on the gap. Fresh tyres may help close it, but another stop has a price.'};
  }
  return {tag:'CLEAR TRACK',headline:'You have the lead. Protect the plan.',body:`${player.compound[0]+player.compound.slice(1).toLowerCase()} tyres, ${(player.tyre_age_game_laps??player.tyre_age).toFixed(1)} game laps on this set. You can keep going or trade position for a fresh stint.`};
}

// Above the zero line means behind; below it means ahead of the rival.
export const battleGapY=(gap,range)=>60-gap/Math.max(1,range)*48;
