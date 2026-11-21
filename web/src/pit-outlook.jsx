import React,{useState} from 'react';
const f=n=>Number(n||0).toFixed(2);
export default function PitOutlook({race,choice,onReview}){
  const [reference,setReference]=useState('HARD');
  const coach=race?.coaching, state=coach?.tyre_status;
  if(!race||race.done||!state)return null;
  const compound=choice||reference;
  const forecast=coach.forecasts.find(row=>row.compound===compound);
  const horizons=[...new Set([1,3,5].map(n=>Math.min(n,coach.horizon)))];
  const next=state.stay_out[0];
  return <section id="pit-outlook" className="pit-outlook" aria-label="Pit or stay forecast">
    <div className="outlook-heading"><div><span>YOUR NEXT DECISION · AFTER LAP {race.completed_laps}</span><h2>Pit now, or keep this set?</h2></div><span className={`tyre-condition ${state.status==='beyond cliff'?'worn':''}`}>{state.status}</span></div>
    <div className="outlook-layout"><div className="outlook-facts"><div><span>PIT LOSS RIGHT NOW</span><strong>+{f(race.pit_cost_s)}s</strong><small>{race.safety_car?`Safety car · saves ${f(race.green_pit_cost_s-race.pit_cost_s)}s`:'Green flag · one stop'}</small></div><div><span>KEEP TYRES · NEXT GAME LAP</span><strong>+{f(next.wear_loss_s)}s</strong><small>Wear cost vs a fresh set of the same compound, excluding a stop</small></div><p>Set age <b>{f(state.age_game_laps)} game laps</b> ({f(state.age_equivalent_laps)} equivalent). Model cliff at {f(state.cliff_equivalent_laps/race.distance_per_lap)} game laps. {state.turns_to_cliff>0?`About ${f(state.turns_to_cliff)} game laps to the cliff.`:'Beyond the cliff: wear now grows nonlinearly.'}</p></div>
    <div className="outlook-comparison"><label>Compare pit for <select aria-label="Forecast pit compound" value={compound} disabled={!!choice} onChange={e=>setReference(e.target.value)}>{coach.forecasts.map(row=><option key={row.compound}>{row.compound}</option>)}</select><small>{choice?'Your selected pit call':'Forecast only · does not select your pit call'}</small></label><table><thead><tr><th>STAY OUT</th><th>TYRE STATUS THEN</th><th>WEAR COST¹</th><th>PIT VS STAY²</th></tr></thead><tbody>{horizons.map(n=>{
      const row=state.stay_out[n-1],delta=forecast.cumulative_changes_s[n-1];
      return <tr key={n}><th>{n} {n===1?'lap':'laps'}</th><td>{row.status}<small>Age {f(row.age_game_laps)} game laps</small></td><td>+{f(row.cumulative_wear_loss_s)}s</td><td className={delta<0?'outlook-gain':'outlook-loss'}>{delta>=0?'+':''}{f(delta)}s<small>Pit {delta<0?'faster':'slower'}</small></td></tr>;
    })}</tbody></table><p>¹ Cumulative wear loss vs starting that period on a fresh set of your current compound; no pit cost. ² Pit {compound.toLowerCase()} now minus stay out, including the stop. Negative means pitting saves time over that period.</p></div></div>
    <div className="outlook-note"><span>Estimate: free air, current flag for one game lap then green; no future stops, traffic or random events. Tyre life is a model, not a failure countdown.</span><button onClick={onReview}>Explore all compounds →</button></div>
  </section>;
}
