import React, {useEffect,useRef,useState} from 'react';
import {ArrowRight,Camera,Check,ChevronDown,Flag,Headphones,Pause,Play,Radio,RotateCcw,SkipForward,Volume2,VolumeX,X} from 'lucide-react';
import {CIRCUIT,PIT_LANE,DRIVERS,decisionPause,replayFrame,radioMessage} from './replay.js';
import './racing.css';
import PitOutlook from './pit-outlook.jsx';
import {BattleHUD,BattleDebrief} from './battle.jsx';

const fmt=(n,d=2)=>Number(n||0).toFixed(d);
const frac=n=>((n%1)+1)%1;
const compounds=['SOFT','MEDIUM','HARD'];
const localCar=id=>DRIVERS[id]||{name:id,team:'INDEPENDENT',color:'#fff'};

function CarIcon({color='#ddff70'}) {
  return <g><rect x="-11" y="-10" width="8" height="5" rx="1" fill="#070a10"/><rect x="-11" y="5" width="8" height="5" rx="1" fill="#070a10"/><rect x="5" y="-10" width="7" height="5" rx="1" fill="#070a10"/><rect x="5" y="5" width="7" height="5" rx="1" fill="#070a10"/><path d="M-13-7H-9V-4L3-4 10-2V2L3 4H-9V7H-13Z" fill={color}/><rect x="10" y="-8" width="3" height="16" rx="1" fill={color}/><ellipse cx="-1" cy="0" rx="3" ry="2.7" fill="#eef4f5"/><path d="M-8 0H-4" stroke="#141a23" strokeWidth="2"/></g>;
}

export default function RaceExperience({race,busy,choice,onChoice,onAdvance,onRewind,onNew,onReview,onLearn,onPlaybackChange,setup,coach}) {
  const [replay,setReplay]=useState(null);
  const [phase,setPhase]=useState(1);
  const [running,setRunning]=useState(false);
  const [runLeft,setRunLeft]=useState(0);
  const [notice,setNotice]=useState('');
  const [speed,setSpeed]=useState(1);
  const [camera,setCamera]=useState('follow');
  const [selected,setSelected]=useState('car_01');
  const [explain,setExplain]=useState(false);
  const [sound,setSound]=useState(false);
  const [lights,setLights]=useState(0);
  const path=useRef(null),pit=useRef(null),svg=useRef(null),raceRef=useRef(race),frame=useRef(null);
  const mounted=useRef(true),locked=useRef(false),stop=useRef(false),skip=useRef(false),speedRef=useRef(speed),audio=useRef(null);
  const previousId=useRef(null);
  const finishAnimation=useRef(null);
  const reduce=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  raceRef.current=race; speedRef.current=speed;
  useEffect(()=>()=>{mounted.current=false;stop.current=true;cancelAnimationFrame(frame.current);finishAnimation.current?.();onPlaybackChange(false);audio.current?.context.close();},[]);
  useEffect(()=>{
    if(race?.race_id && race.race_id!==previousId.current){
      previousId.current=race.race_id;window.scrollTo({top:0,behavior:'instant'});setReplay(null);setNotice('');setExplain(false);setSelected('car_01');setCamera('follow');
      if(race.completed_laps===0&&!reduce.current){setLights(1);let count=1;const timer=setInterval(()=>{count++;setLights(count);if(count>5){clearInterval(timer);setTimeout(()=>mounted.current&&setLights(0),500);}},230);return()=>clearInterval(timer);}
    }
  },[race?.race_id]);
  useEffect(()=>{
    if(!audio.current)return;
    const {context,gain,osc}=audio.current;
    gain.gain.setTargetAtTime(sound && running ? .018 : 0,context.currentTime,.1);
    osc.frequency.setTargetAtTime(90+phase*100+Math.sin(phase*38)*24,context.currentTime,.1);
  },[sound,running,phase]);

  async function toggleSound(){
    if(!sound){
      try{
        if(!audio.current){const context=new(window.AudioContext||window.webkitAudioContext)();const osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=330;gain.gain.value=0;osc.connect(filter);filter.connect(gain);gain.connect(context.destination);osc.start();audio.current={context,osc,gain};}
        await audio.current.context.resume();setSound(true);
      }catch{setNotice('Sound effects are unavailable here. The race can continue muted.');}
    }else setSound(false);
  }
  function animate(before,after){
    setReplay({before,after});setPhase(0);skip.current=false;
    return new Promise(resolve=>{
      finishAnimation.current=resolve;
      let last=null,value=0;
      const tick=now=>{
        if(!mounted.current){resolve();return;}
        const dt=last===null?0:Math.min(150,now-last);last=now;
        value=skip.current||reduce.current?1:Math.min(1,value+dt*speedRef.current/4500);
        setPhase(value);
        if(value>=1)resolve();else frame.current=requestAnimationFrame(tick);
      };
      frame.current=requestAnimationFrame(tick);
    });
  }
  async function drive(count=1){
    if(locked.current||busy||!raceRef.current||raceRef.current.done||lights)return;
    locked.current=true;onPlaybackChange(true);stop.current=false;setRunning(true);setNotice('');setExplain(false);
    let current=raceRef.current;
    try{
      for(let i=0;i<count;i++){
        if(!mounted.current||stop.current||current.done)break;
        if(i>0&&decisionPause(current)){setNotice(decisionPause(current));break;}
        setRunLeft(count-i);
        const after=await onAdvance(i===0?choice:null);
        if(!mounted.current)break;
        if(!after)break;
        await animate(current,after);current=after;
        if(decisionPause(after)&&count>1){setNotice(decisionPause(after));break;}
      }
    }finally{locked.current=false;onPlaybackChange(false);if(mounted.current){setRunLeft(0);setRunning(false);}}
  }
  useEffect(()=>{
    const key=e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('button,input,select,textarea,details,[role="dialog"]')){e.preventDefault();drive(1);}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[race,busy,choice,lights]);

  const animating=running&&replay&&phase<1;
  const shown=animating?replay.before:race;
  const rawCars=animating?replayFrame(replay.before,replay.after,phase):race?.cars||Object.keys(DRIVERS).map((id,i)=>({car_id:id,position:i+1,compound:i%2?'SOFT':'MEDIUM',tyre_age:0,gap_to_leader_s:i*.35,elapsed_s:i*.35,progress:-i*.004}));
  const cars=race?.done&&!animating?race.classification.map(item=>({...rawCars.find(c=>c.car_id===item.car_id),...item})):rawCars;
  const player=cars.find(c=>c.car_id==='car_01');
  const actualPlayer=shown?.cars.find(c=>c.car_id==='car_01');
  const front=shown?.battle?cars.find(c=>c.car_id===shown.battle.rival_id):cars.find(c=>c.position===player.position-1)||cars.find(c=>c.position===player.position+1);
  const defending=shown?.battle?player.gap_to_leader_s<front.gap_to_leader_s:player.position===1;
  const battleGap=front?Math.abs(player.gap_to_leader_s-front.gap_to_leader_s):0;
  const result=race?.classification?.find(c=>c.car_id==='car_01');
  const completed=race?.done&&!animating;
  const currentLap=animating?replay.after.completed_laps:race?Math.min(race.total_laps,race.completed_laps+1):1;
  const sc=animating?!!replay.after.last_decision?.effects[0].actual.safety_car:!!race?.safety_car;
  const message=shown?.battle?{tag:shown.done?'BATTLE COMPLETE':'PODIUM BATTLE',headline:shown.done?(shown.battle.won?'The podium is yours.':'There is another move to try.'):shown.battle.gap_s<0?`Vega is ${fmt(Math.abs(shown.battle.gap_s))}s behind. Hold the advantage.`:`Vega. ${fmt(shown.battle.gap_s)}s to the podium.`,body:shown.battle.radio}:radioMessage(shown);
  const selectedCar=cars.find(c=>c.car_id===selected)||player;
  const totalLength=path.current?.getTotalLength()||1;
  const pitLength=pit.current?.getTotalLength()||1;
  const markers=cars.map(car=>{
    let progress=car.progress??-(car.gap_to_leader_s||0)/(race?.base_lap_s||90);
    const route=car.pitPhase!==null&&car.pitPhase!==undefined?pit.current:path.current;
    const length=route===pit.current?pitLength:totalLength;
    const distance=route===pit.current?car.pitPhase*length:frac(progress)*length;
    const point=route?.getPointAtLength(distance)||{x:190,y:430};
    const next=route?.getPointAtLength(Math.min(length,distance+2))||point;
    const angle=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
    return {...car,x:point.x,y:point.y,angle};
  });
  const marker=markers.find(car=>car.car_id===selected)||markers[0];
  const view=camera==='follow'&&marker?`${Math.max(-20,Math.min(440,marker.x-200))} ${Math.max(25,Math.min(280,marker.y-150))} 420 300`:'35 40 770 485';
  // Re-render once after the SVG paths mount so the initial grid is visible.
  const [,pathsReady]=useState(false);
  useEffect(()=>pathsReady(true),[]);
  const disabled=busy||running||!!lights;
  const pause=decisionPause(race);

  return <div className={`race-experience ${sc?'under-sc':''} ${animating?'is-replaying':''} ${race?.battle?'battle-race':''}`}>
    <div className="broadcast-hud"><div className="event-title"><span className="event-slash"/><div><span>{race?.battle?'PIT WALL / RIVALS':'F1 STRATEGY / ROUND 01'}</span><h1>{race?.battle?'Steal the Podium':'Prototype Grand Prix'}<span>{race?.battle?'CLOSING STINT / PODIUM CHALLENGE':`DRY · ${race?.total_laps||20} LAPS / ${race?.equivalent_laps||42} EQUIVALENT`}</span></h1></div></div><div className="broadcast-lap"><span>{animating?'REPLAYING':race?.battle?'CALL':'LAP'}</span><strong>{String(completed?race.total_laps:currentLap).padStart(2,'0')}<small>/ {race?.total_laps||20}</small></strong></div><div className={`broadcast-flag ${completed?'flag-finish':sc?'flag-sc':''}`}><i/>{completed?'CHEQUERED FLAG':sc?'SAFETY CAR':!race?'GRID OPEN':animating?'LAP IN PROGRESS':'AWAITING YOUR CALL'}</div><button className="broadcast-icon" aria-label={sound?'Mute race sound':'Enable race sound'} title="Optional synthesized race sound" onClick={toggleSound}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></div>

    {shown&&!shown.done&&!animating&&shown.coaching?.tyre_status&&<div className="lap-decision-brief"><span>Pit now <b>+{fmt(shown.pit_cost_s)}s</b></span><span>Keep this set · next lap wear cost <b>+{fmt(shown.coaching.tyre_status.stay_out[0].wear_loss_s)}s</b><small> vs fresh same compound, before pit cost</small></span><button onClick={()=>document.getElementById('pit-outlook')?.scrollIntoView({behavior:'smooth',block:'center'})}>1 / 3 / 5 lap forecast ↓</button></div>}
    <BattleHUD race={shown}/>
    <div className="race-arena">
      <aside className="timing-tower"><div className="tower-header"><strong>CLASSIFICATION</strong><span>GAP</span></div>{cars.map(car=><button key={car.car_id} className={`tower-row ${car.car_id==='car_01'?'your-car':car.car_id===race?.battle?.rival_id?'rival-car':''} ${selected===car.car_id?'watched':''}`} onClick={()=>setSelected(car.car_id)} aria-label={`Watch ${localCar(car.car_id).name}`}><span className="tower-position">{car.position}</span><i style={{background:localCar(car.car_id).color}}/><strong>{localCar(car.car_id).name}</strong><span className={`tower-tyre ${car.compound?.toLowerCase()}`}>{car.compound?.[0]}</span><span className="tower-gap">{car.status==='DSQ'?'DSQ':car.stopped?'BOX':car.position===1?'LEADER':`+${fmt(car.gap_to_leader_s,1)}`}</span></button>)}<div className="tower-bottom"><span className="tower-pulse"/><span>{animating?'LAP REPLAY':race?'TURN-BASED RACING':'PRE-RACE'}</span></div><div className="your-number"><span>YOUR CAR</span><strong>01</strong><small>VECTOR RACING</small></div></aside>

      <section className="race-theatre" aria-label="Animated race circuit"><div className="track-topline"><span><i/> {camera==='follow'?`FOLLOW CAM / ${localCar(selected).name}`:'CIRCUIT CAM / 01'}</span><div><button aria-pressed={camera==='track'} onClick={()=>setCamera('track')}><Camera size={13}/> Circuit</button><button aria-pressed={camera==='follow'} onClick={()=>setCamera('follow')}>Follow {localCar(selected).name}</button></div></div>
        <svg ref={svg} viewBox={view} className="racing-circuit" role="img" aria-label="Animated top-down race replay; car motion is reconstructed from lap-end timing">
          <defs><pattern id="asphalt-grain" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#303b49"/><circle cx="2" cy="1" r=".5" fill="#65717c" opacity=".3"/></pattern><pattern id="world-grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#273640" strokeWidth=".7"/></pattern><pattern id="stands" width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="7" fill="#23303c"/><rect x="1" y="1" width="3" height="2" fill="#52717f"/><rect x="5" y="4" width="2" height="2" fill="#8b6570"/></pattern><pattern id="chequer" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#dce6e4"/><rect width="5" height="5" fill="#252c35"/><rect x="5" y="5" width="5" height="5" fill="#252c35"/></pattern><filter id="car-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter></defs>
          <rect x="-500" y="-500" width="2000" height="1500" fill="#142029"/><rect x="-500" y="-500" width="2000" height="1500" fill="url(#world-grid)"/>
          <path d={CIRCUIT} fill="#1a3035" stroke="#29424a" strokeWidth="105"/><path d={CIRCUIT} fill="none" stroke="#3f555d" strokeWidth="69"/>
          <path d={CIRCUIT} fill="none" stroke="#c9d3d1" strokeWidth="53"/><path d={CIRCUIT} fill="none" stroke="#d75c58" strokeWidth="53" strokeDasharray="14 16"/>
          <path ref={path} d={CIRCUIT} fill="none" stroke="url(#asphalt-grain)" strokeWidth="43" strokeLinejoin="round"/>
          <path d={CIRCUIT} fill="none" stroke="#a9b6bd" strokeWidth=".8" strokeDasharray="8 14" opacity=".42"/>
          <path d={PIT_LANE} fill="none" stroke="#60737b" strokeWidth="20"/><path ref={pit} d={PIT_LANE} fill="none" stroke="#283544" strokeWidth="15"/>
          <path d="M220 470H320" stroke="#ecdb75" strokeWidth="2" strokeDasharray="5 6"/>
          <rect x="230" y="489" width="63" height="21" rx="2" fill="#303b43" stroke="#70838a"/><text x="261" y="503" fontSize="7" fill="#e4ebdf" textAnchor="middle" letterSpacing="1.5">VECTOR BOX</text>
          <rect x="178" y="409" width="10" height="42" fill="url(#chequer)"/>
          <rect x="346" y="465" width="285" height="22" fill="url(#stands)" rx="3"/><rect x="369" y="493" width="230" height="8" fill="#334552" rx="2"/>
          <path d="M110 317L125 214 M265 153L301 93 M518 71L590 100" stroke="#76aab3" strokeWidth="3" strokeDasharray="2 7" opacity=".65"/>
          <text x="392" y="282" fill="#b6cacf" fontSize="21" fontWeight="750" textAnchor="middle" letterSpacing="5" transform="rotate(-10 392 282)">PROTOTYPE</text><text x="397" y="305" fill="#64808b" fontSize="9" textAnchor="middle" letterSpacing="5" transform="rotate(-10 397 305)">GRAND PRIX / 01</text>
          <text x="750" y="380" fill="#8ca4b0" fontSize="9">T1</text><text x="682" y="161" fill="#8ca4b0" fontSize="9">T4</text><text x="329" y="61" fill="#8ca4b0" fontSize="9">T7</text><text x="53" y="229" fill="#8ca4b0" fontSize="9">T10</text>
          <path d="M300 400H340L333 395 M340 400L333 405" stroke="#94b7bd" fill="none"/>
          {[...markers].reverse().map(car=><g key={car.car_id} className="replay-car" onClick={()=>setSelected(car.car_id)} role="button" tabIndex="0" aria-label={`Follow ${localCar(car.car_id).name}`} onKeyDown={e=>e.key==='Enter'&&setSelected(car.car_id)}>
            {car.car_id===selected&&<circle cx={car.x} cy={car.y} r="18" fill={localCar(car.car_id).color} opacity=".28" filter="url(#car-glow)"/>}
            <g transform={`translate(${car.x} ${car.y}) rotate(${car.angle}) scale(${camera==='follow' ? .67 : .72})`}><CarIcon color={localCar(car.car_id).color}/></g>
            {(car.car_id===selected||car.car_id==='car_01'||car.car_id===race?.battle?.rival_id)&&<g transform={`translate(${car.x} ${car.y-24})`}><rect x="-24" y="-10" width="48" height="16" rx="3" fill="#101824" stroke={localCar(car.car_id).color} strokeWidth=".7"/><text textAnchor="middle" y="1" fontSize="8" fontWeight="700" fill={localCar(car.car_id).color}>{localCar(car.car_id).name}</text></g>}
          </g>)}
        </svg>
        {lights>0&&<div className="start-lights"><span>{race?.battle?'TAKE THE PIT WALL':'READY ON THE GRID'}</span><div>{[1,2,3,4,5].map(i=><i key={i} className={lights<=5&&i<=lights?'red':''}/>)}</div><strong>{lights>5?'LIGHTS OUT. YOUR CALL.':'FIND YOUR MOMENT.'}</strong></div>}
        {animating&&markers.find(c=>c.car_id==='car_01')?.stopped&&<div className="pit-live"><span className="pit-spinner"/><div><span>BOX. BOX.</span><strong>{fmt(markers.find(c=>c.car_id==='car_01').pitCountdown,1)}s</strong><small>Modelled pit-loss replay</small></div></div>}
        {animating&&<div className="replay-controls"><span>LAP {currentLap} REPLAY</span><div>{[1,2,4].map(n=><button key={n} aria-pressed={speed===n} onClick={()=>setSpeed(n)}>{n}×</button>)}<button onClick={()=>{skip.current=true;}}><SkipForward size={13}/> Skip animation</button></div></div>}
        {!animating&&race&&<div className="battle-strip"><div><span>{defending?'DEFEND FROM':'NEXT TARGET'}</span><strong>{front?localCar(front.car_id).name:'CLEAR TRACK'}</strong></div><div className="battle-meter"><i style={{width:`${Math.max(4,100-battleGap/5*100)}%`}}/></div><strong>{front?`${fmt(battleGap)}s`:'—'}</strong><small>{battleGap<1&&front?'WITHIN TRAFFIC RANGE':'WATCH THE GAP'}</small></div>}
        <div className="circuit-credit">SCHEMATIC LAP REPLAY · TIMING-BASED MOTION</div>
      </section>

      <aside className="race-pitwall">{!race?<div className="grid-setup">{setup}</div>:completed?<div className="race-finish"><span className="pit-kicker">CHEQUERED FLAG</span><Flag size={34}/><h2>{race.battle?(race.battle.won?'PODIUM.':`P${result.position}`):result.status==='DSQ'?'Rule missed.':`P${result.position}`}</h2><p>{race.battle?(race.battle.won?'You beat Vega. Your calls made the difference.':'The podium got away. Rewind a call below and try a different line.'):result.status==='DSQ'?'Next time, complete a lap on another compound.':result.position<=3?'That is a podium. Every call brought you here.':'A race to build on. Find the call that changed it.'}</p><strong className="finish-seconds">{fmt(result.elapsed_s,3)}s{race.battle&&<small> Closing-stint clock</small>}</strong><button className="race-primary" onClick={()=>race.battle?document.getElementById('battle-debrief')?.scrollIntoView({behavior:'smooth',block:'center'}):onReview()}>Race debrief <ArrowRight size={15}/></button><button className="race-secondary" onClick={onNew}><RotateCcw size={14}/>Race again</button><div className="race-downloads"><a href={`/api/races/${race.race_id}/export/laps`} download>Lap CSV</a><a href={`/api/races/${race.race_id}/export/results`} download>Results</a><a href={`/api/races/${race.race_id}/export/decisions`} download>Decisions</a></div></div>:<>
        <div className="pitwall-title"><span className="pit-kicker">VECTOR / PIT WALL</span><strong>YOUR NEXT CALL</strong><span className="paused-pill">{running?'REPLAYING':'PAUSED FOR YOU'}</span></div>
        <div className="driver-status"><span className={`race-tyre ${actualPlayer.compound.toLowerCase()}`}>{actualPlayer.compound[0]}</span><div><strong>{actualPlayer.compound.toLowerCase()} tyres</strong><span>{fmt(actualPlayer.tyre_age_game_laps??actualPlayer.tyre_age,1)} game laps on this set</span></div><strong>P{player.position}</strong></div>
        <div className="stint-gauge"><span style={{width:`${Math.min(100,actualPlayer.tyre_age/actualPlayer.cliff_laps*100)}%`,background:actualPlayer.tyre_age>actualPlayer.cliff_laps?'#ff846b':undefined}}/></div><div className="stint-label"><span>{actualPlayer.tyre_age>actualPlayer.cliff_laps?'PAST MODEL CLIFF':actualPlayer.tyre_age>=actualPlayer.cliff_laps-2*(race.distance_per_lap||1)?'PIT WINDOW APPROACHING':'TYRES IN THE STINT'}</span><span>EQ AGE {fmt(actualPlayer.tyre_age,1)}/{actualPlayer.cliff_laps}</span></div>
        <button disabled={disabled} onClick={()=>onChoice(null)} aria-pressed={choice===null} className={`race-stay ${choice===null?'selected':''}`}><div><strong>Stay out</strong><span>Keep these tyres. Avoid pit loss.</span></div>{choice===null?<Check size={16}/>:<ArrowRight size={16}/>}</button>
        <div className="box-choice"><span>BOX THIS LAP</span><strong>+{shown.pit_cost_s}s</strong></div><div className="race-compounds">{compounds.map(c=><button key={c} disabled={disabled} aria-pressed={choice===c} className={choice===c?'selected':''} onClick={()=>onChoice(c)}><span className={`race-tyre ${c.toLowerCase()}`}>{c[0]}</span><strong>{c.toLowerCase()}</strong></button>)}</div>
        <button className="race-primary" disabled={disabled} onClick={()=>drive(1)}><Play size={16} fill="currentColor"/>{running?'LAP IN MOTION':choice?`BOX FOR ${choice}`:race.battle?`COMMIT CALL ${currentLap}`:`RACE LAP ${currentLap}`}<ArrowRight size={16}/></button>
        {running?<button className="race-secondary" onClick={()=>{stop.current=true;setNotice('The stint will pause after this replay.');}}><Pause size={13}/>Pause after this lap{runLeft>1?` · ${runLeft-1} queued`:''}</button>:race.battle?<p className="battle-call-hint">One call at a time. Watch how Vega responds.</p>:<button className="race-secondary" disabled={busy||!!lights||!!pause||choice!==null} onClick={()=>drive(3)}><SkipForward size={14}/>Run up to 3 laps</button>}
        <p className="stint-helper">{notice||pause||(choice?'Pit calls run one lap so you can assess the exit.':'Short stints pause for SC, tyre wear or the compound deadline.')}</p>
        <div className={`compound-checkline ${actualPlayer.used_compounds.length>=race.required_compounds?'complete':''}`}><LayersIcon/>{actualPlayer.used_compounds.length>=race.required_compounds?'Two-compound rule met':`${actualPlayer.used_compounds.length}/2 compounds used · change before finish`}</div>
        {coach&&<button className="pit-learning-link" onClick={onLearn}>New to strategy? One useful idea <ArrowRight size={12}/></button>}
      </>}</aside>
    </div>

    {completed&&race.battle&&<BattleDebrief key={race.race_id} race={race} busy={busy} onRewind={onRewind} onAgain={onNew}/>}
    {!animating&&<PitOutlook race={race} choice={choice} onReview={onReview}/>}
    <section className={`race-radio ${sc?'amber':''}`} aria-live="polite"><div className="engineer-avatar"><Headphones size={23}/><i/></div><div className="radio-copy"><span>RACE ENGINEER <i/> {animating?'ON TRACK':message.tag}</span><h2>{animating?(replay.after.last_decision?.chosen_action?'Box, box. Watch the pit exit.':'Eyes on the gap. Let the lap unfold.'):message.headline}</h2><p>{animating?'Replay in progress. Positions settle at the end of the lap.':message.body}</p></div><div className="radio-actions">{race?.last_decision&&!animating&&<button onClick={()=>setExplain(!explain)} aria-expanded={explain}>{explain?'Close explanation':'Why did that happen?'}<ChevronDown size={13}/></button>}<span><Radio size={11}/> TEAM RADIO</span></div></section>
    {explain&&!animating&&race?.last_decision&&<div className="radio-explainer"><span>THE CALL, IN PLAIN ENGLISH</span><p>{race.last_decision.recap?.message}</p><p>Compare this with the next laps: a pit loss is immediate, while the tyre benefit accumulates. Traffic can change for every car.</p><button onClick={onReview}>Inspect the move for all ten cars <ArrowRight size={13}/></button></div>}
    <div className="race-session-footer"><span>{running?'WATCHING THE LAP':'THE RACE WAITS FOR YOUR DECISION'}<i/>Space: race one lap</span><span>Seed {race?.seed??'42'} · model parameters illustrative</span></div>
  </div>;
}
function LayersIcon(){return <span className="mini-tyres">◉ ◉</span>;}
