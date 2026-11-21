import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BookOpen, ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleGauge, Flag, Gauge, Info, Layers, LoaderCircle, Plus, Radio, RotateCcw, Timer, TriangleAlert, X } from 'lucide-react';
import { Academy, CoachRibbon, FOCUSES, LearningBar, MoveReplay, PlanSelector, RaceGoals, ThinkAhead, UnlockToast, useLearningProgress } from './learning.jsx';
import './styles.css';
import RaceExperience from './racing.jsx';
import {BattleLobby} from './battle.jsx';

const COMPOUNDS = ['SOFT', 'MEDIUM', 'HARD'];
const COLORS = ['#ddff70','#55deed','#789bff','#ff9860','#ba9aff','#50dfb0','#fa6c83','#83bff5','#e2e7ee','#f1cf6a'];
const KEY = 'f1-strategy-race';
const money = (value, digits = 3) => Number(value || 0).toFixed(digits);
const signed = (value, digits = 3) => `${value > 0 ? '+' : ''}${money(value, digits)}`;
const actionName = value => value ? `Pit ${value[0]}${value.slice(1).toLowerCase()}` : 'Stay out';
const short = id => id?.replace('car_', '') || '—';
const color = id => COLORS[(Number(short(id)) - 1) % COLORS.length];
const initialCars = Array.from({ length: 10 }, (_, i) => ({ car_id: `car_${String(i + 1).padStart(2, '0')}`, position: i + 1 }));

async function request(url, options) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : 'Check your input and try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function Tyre({ compound, small = false }) {
  return <span className={`tyre ${compound?.toLowerCase() || 'unknown'} ${small ? 'small' : ''}`} title={compound || 'Not selected'}>{compound?.[0] || '–'}</span>;
}

function App() {
  const [race, setRace] = useState(null);
  const progress = useLearningProgress(race);
  const [focus, setFocus] = useState('clean');
  const [mode, setMode] = useState('podium');
  const [intent, setIntent] = useState('position');
  const [busy, setBusy] = useState(true);
  const [playback, setPlayback] = useState(false);
  const currentRace = useRef(null); currentRace.current = race;
  const [error, setError] = useState('');
  const [tab, setTab] = useState('lobby');
  const [starting, setStarting] = useState('MEDIUM');
  const [seed, setSeed] = useState('42');
  const [choice, setChoice] = useState(null);
  const [newDialog, setNewDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState('car_01');
  const [decision, setDecision] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const selectionRequest = useRef(0);

  function openNewRace() {
    if (playback) return;
    setError('');
    setNewDialog(true);
  }

  function showRace() {
    selectionRequest.current += 1;
    setDecisionBusy(false); setDecision(race?.last_decision || null); setTab('race');
  }

  function accept(data) {
    selectionRequest.current += 1;
    setRace(data); setDecision(data.last_decision); setChoice(null); setDecisionBusy(false);
    sessionStorage.setItem(KEY, data.race_id);
  }
  useEffect(() => {
    const id = sessionStorage.getItem(KEY);
    if (!id) { setBusy(false); return; }
    request(`/api/races/${id}`).then(accept).catch(err => {
      if (err.status === 404) sessionStorage.removeItem(KEY);
      setError(err.status === 404 ? 'Your previous session ended. Choose tyres to start a new race.' : 'Could not reconnect. Check that the local server is running, then refresh.');
    }).finally(() => setBusy(false));
  }, []);

  async function start(requestedMode = mode) {
    const selectedMode = typeof requestedMode === 'string' ? requestedMode : mode;
    if (!/^\d+$/.test(seed) || Number(seed) > 2147483647) { setError('Use a whole-number seed from 0 to 2147483647.'); return; }
    setBusy(true); setError('');
    try {
      const data = await request('/api/races', { method: 'POST', body: JSON.stringify({ seed: Number(seed), starting_compound: starting, focus, mode: selectedMode }) });
      accept(data); setTab('race'); setNewDialog(false); setSelectedCar('car_01'); setIntent('position'); progress.dismissUnlocks();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function advance(compound = choice) {
    const race = currentRace.current;
    if (!race || race.done || busy) return null;
    setBusy(true); setError('');
    try { const data = await request(`/api/races/${race.race_id}/turn`, { method: 'POST', body: JSON.stringify({ expected_lap: race.completed_laps, compound, intent: progress.coach ? intent : null }) }); accept(data); return data; }
    catch (err) {
      setError(`${err.message} Reconnecting to check the current lap…`);
      try { accept(await request(`/api/races/${race.race_id}`)); setError('Race state refreshed. Review the current lap before your next call.'); }
      catch { setError('Connection lost. Keep this page open, restart the local server if needed, and refresh.'); }
    } finally { setBusy(false); }
    return null;
  }
  async function rewindBattle(lap) {
    if (busy || playback || !race?.done) return;
    setBusy(true); setError('');
    try { const data = await request(`/api/races/${race.race_id}/rewind`, {method:'POST',body:JSON.stringify({lap})}); accept(data);setTab('race'); }
    catch(err){setError(err.message);} finally{setBusy(false);}
  }
  async function selectLap(lap) {
    if (!race || !lap) return;
    const serial = ++selectionRequest.current;
    setDecisionBusy(true); setError('');
    try {
      const data = await request(`/api/races/${race.race_id}/decisions/${lap}`);
      if (serial === selectionRequest.current) setDecision(data);
    } catch (err) { if (serial === selectionRequest.current) setError(err.message); }
    finally { if (serial === selectionRequest.current) setDecisionBusy(false); }
  }

  const cars = race?.cars || initialCars;
  const player = cars.find(car => car.car_id === 'car_01');
  const playerResult = race?.classification?.find(car => car.car_id === 'car_01');
  const displayedPosition = playerResult?.status === 'DSQ' ? 'DSQ' : race ? `P${playerResult?.position || player.position}` : '—';
  const effects = decision?.effects || [];
  const effect = effects.find(item => item.car_id === selectedCar);
  const activeLap = race ? Math.min(race.completed_laps + 1, race.total_laps) : 1;
  const setup = <>
    <div className="mode-switch"><button disabled={busy} aria-pressed={mode==='podium'} onClick={()=>setMode('podium')}>Six-lap battle</button><button disabled={busy} aria-pressed={mode==='grand_prix'} onClick={()=>setMode('grand_prix')}>Grand Prix</button></div>
    {mode==='podium'?<div className="battle-modal-copy"><span className="eyebrow">PIT WALL / RIVALS</span><h2>Steal the Podium.</h2><p>You inherit P4 on worn Mediums. Vega is 1.8 seconds ahead. Six calls to finish on the podium, ahead of him.</p><p>Both compounds are already used. Vega reacts to your previous stop. This authored battle has no random safety cars.</p><label className="seed-label" htmlFor="battle-seed">Battle seed <span>Same seed, same lap variations</span></label><input id="battle-seed" type="number" min="0" max="2147483647" value={seed} onChange={e=>setSeed(e.target.value)} disabled={busy}/><button className="primary full" disabled={busy} onClick={()=>start('podium')}>Enter the battle <ArrowRight size={18}/></button></div>:<>

    <div className="eyebrow">YOUR FIRST CALL</div><h2>Choose your starting tyre.</h2>
    <p className="muted setup-copy">One car. Nine rivals. Every pit call counts.</p>
    <div className="compound-options">{COMPOUNDS.map(compound => <button key={compound} aria-pressed={starting === compound} className={`compound-option ${starting === compound ? 'selected' : ''}`} onClick={() => setStarting(compound)} disabled={busy}>
      <Tyre compound={compound}/><strong>{compound[0] + compound.slice(1).toLowerCase()}</strong><small>{compound === 'SOFT' ? 'Fast · short stint' : compound === 'MEDIUM' ? 'Balanced pace' : 'Durable · long stint'}</small>{starting === compound && <Check size={13} className="compound-check"/>}
    </button>)}</div>
    <label className="focus-label" htmlFor={newDialog ? 'focus-modal' : 'race-focus'}>YOUR RACE FOCUS</label>
    <select className="focus-select" id={newDialog ? 'focus-modal' : 'race-focus'} value={focus} onChange={event => setFocus(event.target.value)} disabled={busy}>{Object.entries(FOCUSES).map(([value, item]) => <option key={value} value={value}>{item.title}</option>)}</select>
    <p className="focus-description">{FOCUSES[focus].description}</p>
    <label className="seed-label" htmlFor={newDialog ? 'seed-modal' : 'seed'}>Race seed <span>Repeatable conditions</span></label>
    <input id={newDialog ? 'seed-modal' : 'seed'} type="number" min="0" max="2147483647" step="1" value={seed} onChange={event => setSeed(event.target.value)} disabled={busy}/>
    <div className="setup-rule"><Layers size={17}/><span>Complete laps on at least <strong>two different compounds</strong> to be classified.</span></div>
    <button className="primary full" onClick={start} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <Flag size={17}/>} Start race <ArrowRight size={18}/></button>
    <p className="fineprint">Turn-based · 20 laps / 42 equivalent · 10 cars · Dry conditions</p>
    </>}
  </>;

  return <div className={`app-shell ${tab === 'race' || tab === 'lobby' ? 'racing-mode' : ''}`}>
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="F1 Strategy home" onClick={event => { event.preventDefault(); showRace(); }}><span className="brand-mark">F<span>1</span></span><span>STRATEGY<span className="brand-sub">THE PIT WALL</span></span></a>
      <div className="sidebar-label">RACE OPERATIONS</div>
      <button className={`nav-item ${tab === 'lobby' ? 'active' : ''}`} disabled={playback} onClick={()=>setTab('lobby')} aria-label="Battle menu"><Flag size={18}/> Battle menu</button>
      <button className={`nav-item ${tab === 'race' ? 'active' : ''}`} onClick={showRace}><CircleGauge size={18}/> Race control <span className="nav-dot"/></button>
      <button className={`nav-item ${tab === 'analysis' ? 'active' : ''}`} disabled={!race?.completed_laps} onClick={() => setTab('analysis')}><Activity size={18}/> Decision analysis</button>
      <button className="nav-item" onClick={openNewRace} disabled={busy || playback}><Plus size={18}/> New race</button>
      <button className={`nav-item ${tab === 'learn' ? 'active' : ''}`} onClick={() => setTab('learn')}><BookOpen size={18}/> Strategy school</button>
      <div className="sidebar-bottom"><div className="build-label"><span className="status-dot"/> LOCAL SIMULATION</div><p>Built for the decisions<br/>that decide the race.</p><div className="version">PROTOTYPE 02 <span>DRY / 20L</span></div></div>
    </aside>

    <main>
      <header className="topbar"><div className="breadcrumb">RACE OPERATIONS <span>/</span> <strong>{tab === 'race' ? 'RACE CONTROL' : tab === 'learn' ? 'STRATEGY SCHOOL' : 'DECISION ANALYSIS'}</strong></div><div className="topbar-right"><span className="prototype-label">UNCALIBRATED MODEL</span><span className="avatar">01</span></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">YOUR CALL. THEIR RACE.</div><h1>{tab === 'race' ? 'The pit wall' : tab === 'learn' ? 'Learn. Race. Grow' : 'Every decision, explained'}<span className="heading-dot">.</span></h1><p>{tab === 'race' ? 'Read the race. Pick your moment. Make the call.' : tab === 'learn' ? 'Build a toolkit, one useful idea at a time.' : 'Trace the seconds gained and lost, car by car.'}</p></div><button className="secondary" onClick={openNewRace} disabled={busy || playback}><RotateCcw size={15}/> New race</button></div>
        <LearningBar progress={progress} onLearn={() => setTab('learn')}/>
        {progress.storageIssue && <p role="status" className="storage-notice">Browser storage is unavailable. You can keep playing, but export your progress before closing this page.</p>}
        {error && <div role="alert" className="error-banner"><TriangleAlert size={17}/><span>{error}</span><button aria-label="Dismiss message" onClick={() => setError('')}><X size={16}/></button></div>}
        <div className="race-strip"><div className="circuit-name"><Flag size={19}/><div><strong>PROTOTYPE CIRCUIT</strong><small>SINGLE TRACK · DRY RACE</small></div></div><div className="strip-stat"><span>LAP</span><strong>{String(race?.completed_laps || 0).padStart(2, '0')}<i> / {race?.total_laps || 20}</i></strong></div><div className="strip-stat"><span>YOUR POSITION</span><strong>{displayedPosition}<i> / 10</i></strong></div><div className="strip-stat seed-stat"><span>RACE SEED</span><strong>{race?.seed ?? '—'}</strong></div><div className={`race-condition ${race?.done ? 'finished' : race?.safety_car ? 'sc' : ''}`}><span className="status-dot"/>{race?.done ? 'CHEQUERED FLAG' : race ? race.safety_car ? 'SAFETY CAR' : 'GREEN FLAG' : 'AWAITING START'}</div></div>

        {tab === 'learn' ? <Academy progress={progress} race={race} onRace={showRace}/> : tab === 'lobby' || !race ? <BattleLobby busy={busy} onBattle={()=>start('podium')} onGrandPrix={()=>{setMode('grand_prix');setNewDialog(true);}}/> : tab === 'race' ? <RaceExperience race={race} busy={busy} choice={choice} onChoice={setChoice} onAdvance={advance} onRewind={rewindBattle} onPlaybackChange={setPlayback} onNew={openNewRace} onReview={() => { setDecision(race?.last_decision); setTab('analysis'); }} onLearn={() => setTab('learn')} setup={setup} coach={progress.coach}/> : <>
          {race && !race.done && <details className="panel"><summary>Explore the next stint</summary><ThinkAhead race={race} choice={choice} onChoice={setChoice} busy={busy}/></details>}
          <div className="analysis-toolbar"><div><span className="eyebrow">THE DECISION ROOM</span><h2>{decision ? `Lap ${decision.lap}: ${actionName(decision.chosen_action)}` : 'No decision selected'}</h2><p>Immediate alternative: {decision ? actionName(decision.alternative_action).toLowerCase() : '—'}. Same conditions, same opponent calls.</p></div><label htmlFor="inspect-lap">Inspect lap <select id="inspect-lap" value={decision?.lap || ''} onChange={event => selectLap(Number(event.target.value))} disabled={decisionBusy || busy}>{race?.decision_history.map(item => <option key={item.lap} value={item.lap}>Lap {item.lap} · {actionName(item.chosen_action)}</option>)}</select></label></div>
          <div className="notice"><Info size={17}/><span>This comparison isolates <strong>one lap</strong>. Positive time change means your chosen action was slower than the stated alternative. Later tyre benefits and traffic effects are not predicted here.</span></div>
          <div className="race-bottom-grid"><section className="panel effect-panel"><div className="panel-title"><h2>Impact on every car</h2><span className="quiet-label">CHOSEN − ALTERNATIVE</span></div><div className="table-wrap"><table><thead><tr><th>CAR</th><th>POSITION¹</th><th>LAP CHANGE</th><th>PIT Δ</th><th>TRAFFIC Δ</th></tr></thead><tbody>{effects.map(item => <tr key={item.car_id} className={selectedCar === item.car_id ? 'selected-row' : ''} onClick={() => setSelectedCar(item.car_id)}><td><button className="car-select" onClick={() => setSelectedCar(item.car_id)}><span className="car-color" style={{ background: color(item.car_id) }}/><strong>Car {short(item.car_id)}</strong>{item.car_id === 'car_01' && <span className="you-label">YOU</span>}</button></td><td>P{item.alternative.position} → P{item.actual.position}</td><td className={item.lap_delta_s < -0.0005 ? 'positive' : item.lap_delta_s > 0.0005 ? 'negative' : ''}>{signed(item.lap_delta_s)}s</td><td>{signed(item.component_deltas_s.pit_loss_s, 2)}s</td><td>{signed(item.component_deltas_s.traffic_loss_s, 2)}s</td></tr>)}</tbody></table></div><p className="table-note">¹ Alternative position → chosen-action position at the end of this lap. Select a car for its full breakdown.</p></section><Insight decision={decision} effect={effect} selectedCar={selectedCar} cars={cars} onSelect={setSelectedCar}/></div>
          {race?.done && <BaselineSummary race={race} selectedCar={selectedCar} onSelect={setSelectedCar}/>}
          <PositionChart race={race} selectedCar={selectedCar} onSelect={setSelectedCar}/>
        </>}
        <footer className="page-footer"><span><span className="status-dot"/> F1 STRATEGY <i> / </i> LAP-BASED SIMULATION</span><span>Illustrative parameters. Real decisions.</span></footer>
      </div>
    </main>
    <UnlockToast ids={progress.unlocks} onClose={progress.dismissUnlocks}/>
    {newDialog && <div className="modal-backdrop" onClick={() => !busy && setNewDialog(false)}><section className="panel setup-modal" role="dialog" aria-modal="true" aria-label="Start a new race" onClick={event => event.stopPropagation()}><button className="close-modal" onClick={() => setNewDialog(false)} disabled={busy} aria-label="Close new race"><X size={20}/></button>{race && <p className="modal-note">Starting a new race replaces the race shown in this tab. Download your current results first if you want to keep them.</p>}{race && <div className="download-links"><a className="secondary" href={`/api/races/${race.race_id}/export/laps`} download>Save current lap CSV</a><a className="secondary" href={`/api/races/${race.race_id}/export/results`} download>Save current results</a></div>}{error && <p role="alert" className="negative">{error}</p>}{setup}</section></div>}
  </div>;
}

const TRACK = 'M 160 112 L 410 112 Q 450 112 458 148 L 481 231 Q 486 250 508 250 L 557 250 Q 589 250 589 280 Q 588 309 558 309 L 509 309 Q 483 309 469 289 L 439 248 Q 425 229 405 246 L 371 276 Q 355 290 333 278 L 294 255 Q 273 241 264 264 L 249 305 Q 242 324 218 317 L 178 304 Q 160 298 170 280 L 191 239 Q 202 218 180 207 L 139 185 Q 103 167 119 138 Q 130 112 160 112 Z';
function Track({ cars, lap, baseLap, selectedCar, onSelect }) {
  const pathRef = useRef(null);
  const [dots, setDots] = useState([]);
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !cars.length) { setDots([]); return; }
    const length = path.getTotalLength();
    setDots([...cars].reverse().map(car => {
      const progress = ((0.02 - (car.gap_to_leader_s || 0) / baseLap) % 1 + 1) % 1;
      const point = path.getPointAtLength(length * progress);
      return { ...car, x: point.x, y: point.y };
    }));
  }, [cars, lap, baseLap]);
  return <div className="track-map"><svg viewBox="75 65 555 305" role="img" aria-label="Circuit schematic showing approximate field spacing, not exact car telemetry">
    <defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#526154" opacity=".3"/></pattern></defs>
    <rect x="75" y="65" width="555" height="305" fill="url(#grid)"/>
    <path d={TRACK} fill="none" stroke="#253028" strokeWidth="27" strokeLinejoin="round"/>
    <path ref={pathRef} d={TRACK} fill="none" stroke="#758277" strokeWidth="2"/>
    <path d="M 160 99 L 160 125" stroke="#d6ff62" strokeWidth="3"/>
    <text x="145" y="91" fill="#8a988d" fontSize="9" fontFamily="monospace" letterSpacing="2">START / FINISH</text>
    <path d="M 184 95 L 209 95 L 205 91 M 209 95 L 205 99" stroke="#68796c" fill="none"/>
    <text x="331" y="185" fill="#d6ff62" fontSize="13" textAnchor="middle" letterSpacing="4" fontWeight="600">PROTOTYPE</text>
    <text x="331" y="203" fill="#66766b" fontSize="9" textAnchor="middle" letterSpacing="3">CIRCUIT / 01</text>
    <text x="527" y="342" fill="#607164" fontSize="9" letterSpacing="2">SECTOR 03</text>
    {dots.map(car => <g key={car.car_id} role="button" tabIndex="0" aria-label={`Inspect car ${short(car.car_id)}`} onClick={() => onSelect(car.car_id)} onKeyDown={event => ['Enter', ' '].includes(event.key) && onSelect(car.car_id)} className="track-car">
      {car.car_id === selectedCar && <circle cx={car.x} cy={car.y} r="13" fill={color(car.car_id)} opacity=".18"/>}
      <circle cx={car.x} cy={car.y} r={car.car_id === 'car_01' ? 6 : 4.5} fill={color(car.car_id)} stroke="#111713" strokeWidth="2"/>
      {car.car_id === selectedCar && <text x={car.x} y={car.y - 18} textAnchor="middle" fill={color(car.car_id)} fontSize="10" fontFamily="monospace">{short(car.car_id)}</text>}
    </g>)}
  </svg></div>;
}

function Standings({ cars, race, selectedCar, onSelect }) {
  const final = race?.classification;
  const ordered = final ? final.map(item => ({ ...cars.find(car => car.car_id === item.car_id), ...item })) : cars;
  return <section className="panel standings"><div className="panel-title"><div><span className="eyebrow">THE FIELD</span><h2>{race?.done ? 'Final classification' : 'Live standings'}</h2></div><span className="quiet-label">{race ? `AFTER LAP ${race.completed_laps}` : 'STARTING GRID'}</span></div><div className="table-wrap"><table><thead><tr><th>POS</th><th>DRIVER</th><th>GAP</th><th>LAST LAP</th><th>TYRE / AGE</th><th>STOPS</th></tr></thead><tbody>{ordered.map(car => <tr key={car.car_id} className={`${car.car_id === 'car_01' ? 'player-row' : ''} ${selectedCar === car.car_id ? 'selected-row' : ''}`} onClick={() => onSelect(car.car_id)}><td className="position-number">{String(car.position).padStart(2, '0')}</td><td><button className="car-select" onClick={() => onSelect(car.car_id)}><span className="car-color" style={{ background: color(car.car_id) }}/><strong>Car {short(car.car_id)}</strong>{car.car_id === 'car_01' && <span className="you-label">YOU</span>}{car.status === 'DSQ' && <span className="dsq">DSQ</span>}</button></td><td className="mono">{!race ? '—' : car.gap_to_leader_s < .001 ? 'LEADER' : `+${money(car.gap_to_leader_s)}`}</td><td className="mono">{car.last_lap_s ? `${money(car.last_lap_s)}s` : '—'}</td><td><span className="tyre-cell"><Tyre compound={car.compound} small/><span>{car.tyre_age ?? '—'} <small>laps</small></span></span></td><td className="mono">{car.pit_stops ?? '—'}</td></tr>)}</tbody></table></div><p className="table-note"><Info size={13}/> Select any car to inspect its last-lap decision impact.</p></section>;
}

function Insight({ decision, effect, selectedCar, cars, onSelect, onAnalysis }) {
  const row = effect?.actual;
  const front = decision?.effects.find(item => item.car_id === row?.front_car_id)?.actual;
  let reason = effect?.traffic_reason;
  if (row && !reason) reason = row.traffic_loss_s ? 'close following' : row.safety_car ? 'SC suspends traffic penalty' : row.pitted ? 'car pitting' : !row.front_car_id ? 'leader' : front?.pitted ? 'car ahead pitting' : 'gap outside traffic threshold';
  return <section className="panel insight"><div className="panel-title"><div><span className="eyebrow">RACE ENGINEER</span><h2>Behind the decision</h2></div><Radio size={18} className="lime"/></div>{!row ? <div className="empty-insight"><div className="engineer-icon"><Radio size={26}/></div><h3>Your race, explained.</h3><p>Complete a lap to see how your call changed each car’s time, traffic and position.</p><span className="quiet-label">NO GUESSWORK. FOLLOW THE SECONDS.</span></div> : <>
    <div className="insight-selector"><label htmlFor="inspect-car">INSPECT CAR</label><select id="inspect-car" value={selectedCar} onChange={event => onSelect(event.target.value)}>{cars.map(car => <option key={car.car_id} value={car.car_id}>Car {short(car.car_id)}{car.car_id === 'car_01' ? ' · YOU' : ''}</option>)}</select></div>
    <div className="decision-tag">LAP {decision.lap}<span>{actionName(decision.chosen_action)} <ArrowRight size={12}/> vs {actionName(decision.alternative_action)}</span></div>
    <div className="impact-number"><strong className={effect.lap_delta_s < -.0005 ? 'positive' : effect.lap_delta_s > .0005 ? 'negative' : ''}>{signed(effect.lap_delta_s)}<small>s</small></strong><span>for Car {short(selectedCar)} this lap<br/><small>chosen action − alternative</small></span></div>
    <div className="engineer-message"><span className="message-label">TRAFFIC EXPLAINED</span><p>{row.traffic_loss_s > 0 ? <>Car {short(selectedCar)} started <strong>{money(row.gap_ahead_s)}s behind Car {short(row.front_car_id)}</strong>. Close following added <strong>{money(row.traffic_loss_s, 2)}s</strong> to its lap.</> : <>No traffic penalty: <strong>{reason}</strong>.{row.front_car_id && <> Pre-lap gap to Car {short(row.front_car_id)}: {money(row.gap_ahead_s)}s.</>}</>}</p></div>
    <div className="breakdown"><div><span>Pit loss</span><strong>{money(row.pit_loss_s, 2)}s</strong></div><div><span>Tyre pace effect</span><strong>{signed(row.tyre_delta_s, 2)}s</strong></div><div><span>Traffic loss</span><strong>{money(row.traffic_loss_s, 2)}s</strong></div><div><span>Position on this lap</span><strong>P{row.position_before} → P{row.position}</strong></div></div>
    <details className="full-breakdown"><summary>Full lap-time breakdown <ChevronDown size={13}/></summary><div className="breakdown"><div><span>Base pace</span><strong>{money(row.base_time_s, 3)}s</strong></div><div><span>Car pace offset</span><strong>{signed(row.pace_delta_s)}s</strong></div><div><span>Fuel effect</span><strong>{signed(row.fuel_effect_s)}s</strong></div><div><span>Lap variation</span><strong>{signed(row.noise_s)}s</strong></div><div><span>SC queue delay</span><strong>{money(row.queue_loss_s)}s</strong></div><div><span>Time floor adjustment</span><strong>{money(row.time_floor_adjustment_s)}s</strong></div><div className="breakdown-total"><span>Total lap time</span><strong>{money(row.lap_time_s)}s</strong></div></div></details>
    {onAnalysis && <button className="text-button" onClick={onAnalysis}>Compare all 10 cars <ArrowRight size={15}/></button>}
    <p className="fineprint">One-lap comparison. A pit call can cost time now and recover it later.</p>
  </>}</section>;
}

function PositionChart({ race, selectedCar, onSelect }) {
  const history = race?.position_history || [];
  const width = 1000, height = 160, left = 28, right = 18, top = 14, bottom = 24;
  const x = lap => left + lap / (race?.total_laps || 20) * (width - left - right);
  const y = position => top + (position - 1) / 9 * (height - top - bottom);
  return <section className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">THE LONG GAME</span><h2>Position through the race</h2></div><span className="quiet-label">LAP BY LAP</span></div><div className="position-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Car positions over completed race laps"><title>Position by lap; P1 is at the top</title>{[1, 5, 10].map(pos => <g key={pos}><line x1={left} y1={y(pos)} x2={width - right} y2={y(pos)} stroke="#2a332d" strokeDasharray="3 5"/><text x="0" y={y(pos) + 3} fill="#8a978e" fontSize="10">P{pos}</text></g>)}{Array.from({length:5},(_,i)=>i*(race?.total_laps||20)/4).map(lap => <text key={lap} x={x(lap)} y={height - 3} fill="#7c8a80" fontSize="10" textAnchor="middle">{lap}</text>)}{history.length ? (race?.cars || []).map(car => {
    const initialPosition = Number(short(car.car_id));
    const points = [[0, initialPosition], ...history.map(row => [row.lap, row.positions[car.car_id]])];
    return <polyline key={car.car_id} points={points.map(([lap, pos]) => `${x(lap)},${y(pos)}`).join(' ')} fill="none" stroke={color(car.car_id)} strokeWidth={car.car_id === selectedCar ? 2.8 : 1.2} opacity={car.car_id === selectedCar ? 1 : .28}/>;
  }) : <text x={width / 2} y={height / 2} textAnchor="middle" fill="#7e8a82" fontSize="12">Your position story starts after the first lap.</text>}</svg></div><div className="chart-legend">{initialCars.map(car => <button key={car.car_id} className={selectedCar === car.car_id ? 'highlight' : ''} onClick={() => onSelect(car.car_id)} aria-pressed={selectedCar === car.car_id}><span style={{ background: color(car.car_id) }}/>{short(car.car_id)}{car.car_id === 'car_01' && ' YOU'}</button>)}</div></section>;
}

function Finish({ race, onNew }) {
  const player = race.classification.find(car => car.car_id === 'car_01');
  return <div className="finish-panel"><div className="eyebrow">CHEQUERED FLAG</div><Flag size={32} className="lime"/><h2>{player.status === 'DSQ' ? 'Rule missed.' : `You finished P${player.position}.`}</h2><p>{player.status === 'DSQ' ? 'You needed to complete laps on two different compounds. Try a different-compound stop next race.' : 'Fifty laps, one strategy. Review the decisions that shaped your race.'}</p><div className="finish-time"><span>TOTAL RACE TIME</span><strong>{money(player.elapsed_s)}s</strong></div><div className="download-links"><a className="secondary" href={`/api/races/${race.race_id}/export/laps`} download><ArrowDownToLine size={15}/> Lap CSV</a><a className="secondary" href={`/api/races/${race.race_id}/export/results`} download><ArrowDownToLine size={15}/> Results</a><a className="secondary" href={`/api/races/${race.race_id}/export/decisions`} download><ArrowDownToLine size={15}/> Decisions</a></div><button className="primary full" onClick={onNew}>Race again <ArrowRight size={18}/></button></div>;
}

function BaselineSummary({ race, selectedCar, onSelect }) {
  const selected = race.summary.find(car => car.car_id === selectedCar);
  const before = new Set(selected.baseline_traffic_laps.map(row => row.lap));
  const after = new Set(selected.actual_traffic_laps.map(row => row.lap));
  const gained = [...after].filter(lap => !before.has(lap));
  const avoided = [...before].filter(lap => !after.has(lap));
  return <section className="panel baseline-panel"><div className="panel-title"><div><span className="eyebrow">POST-RACE REVIEW</span><h2>Your strategy vs the baseline</h2></div><Layers size={18}/></div><p className="muted">Same starting tyres, events and per-car lap variations. This compares your whole race with the bot strategy.</p><div className="table-wrap"><table><thead><tr><th>CAR</th><th>BASELINE → YOUR RACE</th><th>TIME CHANGE</th><th>TRAFFIC BEFORE → AFTER</th></tr></thead><tbody>{race.summary.map(car => <tr key={car.car_id} className={selectedCar === car.car_id ? 'selected-row' : ''} onClick={() => onSelect(car.car_id)}><td><button className="car-select" onClick={() => onSelect(car.car_id)}><span className="car-color" style={{ background: color(car.car_id) }}/><strong>Car {short(car.car_id)}</strong></button></td><td>{car.baseline_status === 'DSQ' ? 'DSQ' : `P${car.baseline_position}`} → {car.status === 'DSQ' ? 'DSQ' : `P${car.position}`}</td><td className={car.time_change_s < 0 ? 'positive' : 'negative'}>{signed(car.time_change_s)}s</td><td>{money(car.baseline_traffic_s, 2)}s → {money(car.actual_traffic_s, 2)}s</td></tr>)}</tbody></table></div><div className="traffic-review"><h3>Car {short(selectedCar)}: follow the traffic</h3><p>{selected.baseline_traffic_laps.length} affected laps ({money(selected.baseline_traffic_s, 2)}s) in the baseline → {selected.actual_traffic_laps.length} affected laps ({money(selected.actual_traffic_s, 2)}s) in your race.</p><p>Added traffic on laps: <strong>{gained.join(', ') || 'none'}</strong>. Avoided traffic on laps: <strong>{avoided.join(', ') || 'none'}</strong>.</p><details><summary>See each traffic encounter <ChevronDown size={13}/></summary><div className="table-wrap"><table><thead><tr><th>RUN</th><th>LAP</th><th>CAR AHEAD</th><th>PRE-LAP GAP</th><th>PENALTY</th></tr></thead><tbody>{[['Baseline', selected.baseline_traffic_laps], ['Your race', selected.actual_traffic_laps]].flatMap(([name, rows]) => rows.map(row => <tr key={`${name}-${row.lap}`}><td>{name}</td><td>{row.lap}</td><td>Car {short(row.front_car_id)}</td><td>{money(row.gap_ahead_s, 6)}s</td><td>{money(row.traffic_loss_s, 2)}s</td></tr>))}</tbody></table></div></details></div></section>;
}

createRoot(document.getElementById('root')).render(<App/>);
