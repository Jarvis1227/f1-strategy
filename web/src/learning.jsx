import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronDown, Flag, Lightbulb, Sparkles, Target, Trophy, X } from 'lucide-react';
import { BADGES, EMPTY_PROFILE, LESSONS, completeLesson, learnFromRace, normalizeProfile, personalBest, rankFor } from './progression.js';
import './learning.css';

const PROFILE_KEY = 'f1-strategy-learning-v1';
const COACH_KEY = 'f1-strategy-coach';
const fmt = (n, digits = 2) => Number(n || 0).toFixed(digits);
const sign = n => `${n > 0 ? '+' : ''}${fmt(n)}s`;
const carName = id => `Car ${id?.replace('car_', '')}`;
export const FOCUSES = {
  clean: { title: 'Finish with a plan', description: 'Your first goal: complete 20 game laps (42 equivalent) and use two compounds.' },
  tyres: { title: 'Explore the tyre trade', description: 'Watch the estimate, pit for fresh tyres, then inspect the next laps.' },
  baseline: { title: 'Challenge the baseline', description: 'Try to beat the bot strategy under the same race conditions.' },
};
export const INTENTS = { position: 'Protect track position', pace: 'Invest in future pace', opportunity: 'Use a cheaper pit window' };

export function useLearningProgress(race) {
  const [profile, setProfile] = useState(() => {
    try { return normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_KEY))); }
    catch { return { ...EMPTY_PROFILE, badges: [], races: [] }; }
  });
  const current = useRef(profile);
  const [unlocks, setUnlocks] = useState([]);
  const [storageIssue, setStorageIssue] = useState(false);
  const [coach, setCoach] = useState(() => { try { return localStorage.getItem(COACH_KEY) !== 'off'; } catch { return true; } });
  function commit(result) {
    current.current = result.profile;
    setProfile(result.profile);
    if (result.fresh.length) setUnlocks(result.fresh);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(result.profile)); }
    catch { setStorageIssue(true); }
  }
  useEffect(() => { if (race) commit(learnFromRace(current.current, race)); }, [race]);
  function toggleCoach() {
    setCoach(old => {
      try { localStorage.setItem(COACH_KEY, old ? 'off' : 'on'); } catch { setStorageIssue(true); }
      return !old;
    });
  }
  return { profile, coach, toggleCoach, unlocks, dismissUnlocks: () => setUnlocks([]), storageIssue,
    completeLesson: (lesson, answer) => commit(completeLesson(current.current, lesson, answer)) };
}

export function LearningBar({ progress, onLearn }) {
  const { points, rank, next, progress: fraction } = rankFor(progress.profile);
  return <section className="learning-bar" aria-label="Your learning progress"><div className="rank-emblem"><Trophy size={18}/></div><div className="rank-summary"><span>YOUR STRATEGY JOURNEY</span><strong>{rank.name} <small>{points} XP</small></strong><div className="rank-track"><i style={{ width: `${fraction * 100}%` }}/></div></div><div className="learning-count"><strong>{progress.profile.badges.length}<span> / {BADGES.length}</span></strong><small>SKILLS EARNED</small></div><p>{next ? `${next.points - points} XP to ${next.name}` : 'All ranks unlocked. Keep experimenting.'}<span>Fixed milestones · saved in this browser</span></p><button className="secondary learn-button" onClick={onLearn}><BookOpen size={15}/> Strategy school</button><button className={`coach-switch ${progress.coach ? 'on' : ''}`} onClick={progress.toggleCoach} aria-pressed={progress.coach}><span/><span>Coach {progress.coach ? 'on' : 'off'}</span></button></section>;
}

export function UnlockToast({ ids, onClose }) {
  if (!ids.length) return null;
  const badges = BADGES.filter(badge => ids.includes(badge.id));
  return <div className="unlock-toast" role="status"><div className="unlock-icon"><Sparkles size={22}/></div><div><span>SKILL UNLOCKED</span><strong>{badges.map(badge => badge.title).join(' · ')}</strong><small>+{badges.reduce((sum, badge) => sum + badge.points, 0)} XP · yours to keep</small></div><button aria-label="Dismiss skill celebration" onClick={onClose}><X size={16}/></button></div>;
}

const TOUR = [
  ['Read the board.', 'The flag tells you the pit cost. Your tyre age tells you what you are spending by staying out. The gaps tell you who you may meet.'],
  ['Choose a purpose.', 'Protect position, invest in pace, or use a pit window. The same action can make sense for different reasons. Set a plan before committing.'],
  ['Think beyond this lap.', 'The Think Ahead board estimates your next few laps. It assumes free air and no future incidents. It is a thinking aid, not an oracle.'],
  ['Review the consequence.', 'After your move, read the replay. A stop may lose positions now. Inspect later laps and the full-race baseline before judging the investment.'],
];

export function CoachRibbon({ race, onLearn }) {
  const [tour, setTour] = useState(null);
  const coach = race?.coaching;
  return <section className="coach-ribbon"><div className="coach-light"><Lightbulb size={20}/></div><div className="coach-ribbon-copy"><span className="eyebrow">{race ? 'READ THE POSITION' : 'NEW HERE? YOU BELONG ON THE PIT WALL.'}</span><h3>{coach?.headline || 'A good move starts with a reason.'}</h3><p>{coach?.message || 'Learn the tradeoffs as you play. There is no countdown. Start with one goal: finish on two different compounds.'}</p>{tour !== null && <div className="quick-tour"><span>THE FIRST-RACE GUIDE · {tour + 1} / {TOUR.length}</span><h3>{TOUR[tour][0]}</h3><p>{TOUR[tour][1]}</p><div><button className="text-button" onClick={() => setTour(null)}>Close guide</button><button className="secondary" onClick={() => setTour(tour === TOUR.length - 1 ? null : tour + 1)}>{tour === TOUR.length - 1 ? 'Ready to think' : 'Next idea'} <ArrowRight size={13}/></button></div></div>}</div><div className="coach-actions"><button className="secondary" onClick={() => setTour(tour === null ? 0 : null)}>{tour === null ? 'Quick guide' : 'Hide guide'}</button><button className="text-button" onClick={onLearn}>Learn one idea <ArrowRight size={13}/></button></div></section>;
}

export function PlanSelector({ intent, onIntent, focus }) {
  return <div className="plan-selector"><div><Target size={15}/><label htmlFor="move-intent">WHAT IS YOUR PLAN?</label></div><select id="move-intent" value={intent} onChange={event => onIntent(event.target.value)}>{Object.entries(INTENTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p>{focus === 'baseline' ? 'Your focus: compare the whole race with the baseline.' : focus === 'tyres' ? 'Your focus: observe the cost now and the pace later.' : 'Your focus: finish the race legally. Every later lesson builds on that.'}</p></div>;
}

export function ThinkAhead({ race, choice, onChoice, busy }) {
  const [length, setLength] = useState(10);
  const coach = race.coaching;
  if (!coach?.forecasts.length) return null;
  const horizon = Math.min(length, coach.horizon);
  const selected = coach.forecasts.find(row => row.compound === choice);
  const selectedDelta = selected?.cumulative_changes_s[horizon - 1] ?? 0;
  const max = Math.max(1, ...coach.forecasts.flatMap(row => row.cumulative_changes_s.slice(0, horizon).map(Math.abs)));
  const x = i => 30 + i / Math.max(1, horizon) * 610;
  const y = value => 78 - value / max * 52;
  return <section className="panel thinking-board"><div className="panel-title"><div><span className="eyebrow">THINK A FEW MOVES AHEAD</span><h2>The tyre investment</h2></div><div className="horizon-controls" aria-label="Forecast horizon">{[...new Set([3, 5, 10].map(value => Math.min(value, coach.horizon)))].map(value => <button key={value} onClick={() => setLength(value)} className={Math.min(length, coach.horizon) === value ? 'selected' : ''} aria-pressed={Math.min(length, coach.horizon) === value}>{Math.min(value, coach.horizon)} laps</button>)}</div></div><div className="thinking-layout"><div className="thinking-options"><p>Choose a line to explore. It also selects your next pit call.</p><button onClick={() => onChoice(null)} disabled={busy} aria-pressed={choice === null} className={choice === null ? 'selected' : ''}><span>Keep current tyres</span><strong>Reference: 0.00s</strong></button>{coach.forecasts.map(row => {
    const delta = row.cumulative_changes_s[horizon - 1];
    const compound = row.compound.toLowerCase();
    return <button key={compound} disabled={busy} onClick={() => onChoice(row.compound)} className={choice === row.compound ? 'selected' : ''} aria-pressed={choice === row.compound}><span><i className={`compound-dot ${compound}`}/>Pit {compound}<small>{row.adds_required_compound ? 'Adds an unused compound' : 'Already used this compound'}</small></span><strong className={delta < 0 ? 'positive' : ''}>{sign(delta)}<small>over {horizon} laps</small></strong></button>;
  })}</div><div className="thinking-visual"><div className="forecast-verdict"><span>{choice ? `FRESH ${choice} VS STAYING OUT` : 'STAYING OUT IS YOUR REFERENCE'}</span><strong>{choice ? `${fmt(Math.abs(selectedDelta))}s ${selectedDelta < 0 ? 'quicker' : 'slower'}` : 'Protect now. Spend tyre life.'}</strong><p>{choice ? `Over the next ${horizon} laps in this estimate. ${selected.payback_laps ? `Pit cost is recovered by projected lap ${selected.payback_laps} in the full ${coach.horizon}-lap estimate.` : `Pit cost is not recovered within ${coach.horizon} projected laps.`}` : 'The fresh-set lines show when tyre pace could repay a stop. Keeping position can still be worth more than a small pace gain.'}</p></div><svg viewBox="0 0 670 165" role="img" aria-label="Estimated cumulative time change for fresh tyres versus staying out; lower is faster"><line x1="30" y1="78" x2="640" y2="78" stroke="#71866b" strokeDasharray="4 4"/><text x="30" y="15" fill="#98ac8f" fontSize="9">SLOWER THAN STAYING OUT</text><text x="30" y="156" fill="#98ac8f" fontSize="9">QUICKER THAN STAYING OUT</text>{coach.forecasts.map(row => <polyline key={row.compound} points={[[0, 0], ...row.cumulative_changes_s.slice(0, horizon).map((value, i) => [i + 1, value])].map(([i, value]) => `${x(i)},${y(value)}`).join(' ')} fill="none" stroke={row.compound === 'SOFT' ? '#f17170' : row.compound === 'MEDIUM' ? '#edcf62' : '#e2e6de'} strokeWidth={row.compound === choice ? 3 : 1.5} opacity={!choice || row.compound === choice ? 1 : .35}/>)}</svg><p className="forecast-warning"><InfoIcon/>Estimate, not a recommendation: {coach.assumptions}</p></div></div></section>;
}
function InfoIcon() { return <Lightbulb size={13}/>; }

export function MoveReplay({ decision, onReview }) {
  if (!decision?.recap) return null;
  const recap = decision.recap;
  const player = decision.effects.find(row => row.car_id === 'car_01');
  const field = decision.effects.filter(row => row.car_id !== 'car_01' && (Math.abs(row.lap_delta_s) > .0005 || row.position_delta !== 0));
  return <section className="move-replay" key={decision.lap} aria-live="polite"><div className="move-number">{String(decision.lap).padStart(2, '0')}<span>YOUR MOVE</span></div><div className="move-story"><span className="eyebrow">{decision.intent ? `YOUR PLAN: ${INTENTS[decision.intent]}` : 'OBSERVE → PLAN → COMMIT → REVIEW'}</span><h3>{recap.headline}</h3><p>{recap.message}</p><div className="move-facts"><span>P{player.actual.position_before} → P{player.actual.position}</span><span>{sign(player.lap_delta_s)} vs immediate alternative</span>{recap.pit_savings_s > 0 && <span className="positive">SC saved {fmt(recap.pit_savings_s, 0)}s on the stop</span>}<span>{field.length} rivals changed time or position vs alternative</span></div></div><button className="secondary" onClick={onReview}>Review the move <ArrowRight size={14}/></button></section>;
}

export function RaceGoals({ race, focus }) {
  const player = race?.cars.find(car => car.car_id === 'car_01');
  const completed = race?.done;
  const legal = completed && race.classification.find(car => car.car_id === 'car_01').status === 'FINISHED';
  return <div className="race-goals"><div><Flag size={15}/><strong>{FOCUSES[focus]?.title || FOCUSES.clean.title}</strong></div><p>{FOCUSES[focus]?.description || FOCUSES.clean.description}</p><ul><li className={completed ? 'complete' : ''}>{completed ? <Check size={13}/> : <span className="goal-circle"/>}Complete the race <small>{race?.completed_laps || 0}/{race?.total_laps||20}</small></li><li className={player?.used_compounds.length >= 2 ? 'complete' : ''}>{player?.used_compounds.length >= 2 ? <Check size={13}/> : <span className="goal-circle"/>}Use two compounds <small>{Math.min(2, player?.used_compounds.length || 0)}/2</small></li><li className={legal ? 'complete' : ''}>{legal ? <Check size={13}/> : <span className="goal-circle"/>}Finish classified <small>{completed ? legal ? 'Done' : 'Try next race' : 'At the flag'}</small></li></ul></div>;
}

export function Academy({ progress, onRace, race }) {
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const lesson = LESSONS.find(item => item.id === lessonId);
  const earned = progress.profile.badges.includes(`lesson-${lessonId}`);
  const correct = answer === lesson.correct;
  function chooseLesson(id) { setLessonId(id); setAnswer(null); setChecked(false); }
  function check() { if (answer !== null) { setChecked(true); progress.completeLesson(lessonId, answer); } }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress.profile, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'f1-strategy-learning.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const best = race ? personalBest(progress.profile, race) : null;
  return <div className="academy"><div className="academy-intro"><div className="academy-icon"><BookOpen size={28}/></div><div><span className="eyebrow">SMALL IDEAS. BETTER DECISIONS.</span><h2>Think like a strategist.</h2><p>Learn one concept, try it on track, then look for the evidence. No timer. No lost progress.</p></div><button className="secondary" onClick={onRace}>Back to the pit wall <ArrowRight size={14}/></button></div><div className="lesson-layout"><div className="lesson-menu">{LESSONS.map(item => <button key={item.id} className={item.id === lessonId ? 'selected' : ''} onClick={() => chooseLesson(item.id)}><span>{item.label}</span><strong>{item.title}</strong><small>{progress.profile.badges.includes(`lesson-${item.id}`) ? <><Check size={12}/> Concept learned</> : <>{item.minutes} · 15 XP once</>}</small></button>)}</div><section className="panel lesson-card"><span className="eyebrow">{lesson.label}</span><h2>{lesson.title}{earned && <Check size={19} className="lime"/>}</h2><p>{lesson.intro}</p><div className="lesson-principle"><Lightbulb size={18}/><span>{lesson.principle}</span></div><h3>Test your thinking</h3><p>{lesson.question}</p><div className="quiz-options" role="group" aria-label="Choose your answer">{lesson.answers.map((text, i) => <button key={text} onClick={() => { setAnswer(i); setChecked(false); }} className={answer === i ? 'selected' : ''} aria-pressed={answer === i}><span>{String.fromCharCode(65 + i)}</span>{text}</button>)}</div><button className="primary" onClick={check} disabled={answer === null}>Check my thinking <ArrowRight size={15}/></button>{checked && <div className={`quiz-feedback ${correct ? 'correct' : ''}`} role="status"><strong>{correct ? earned ? 'You have this concept.' : 'That is the idea. A skill earned.' : 'A useful thing to reconsider.'}</strong><p>{lesson.explanation}</p>{!correct && <small>Try another answer whenever you are ready. You lose nothing.</small>}</div>}<div className="lesson-next"><button className="text-button" onClick={onRace}>Try this in a race <ArrowRight size={14}/></button><button className="secondary" onClick={() => chooseLesson(LESSONS[(LESSONS.findIndex(item => item.id === lessonId) + 1) % LESSONS.length].id)}>Next concept <ArrowRight size={13}/></button></div></section></div>
  <section className="panel skill-collection"><div className="panel-title"><div><span className="eyebrow">EARNED, NEVER LOST</span><h2>Your strategy toolkit</h2></div><span className="quiet-label">{progress.profile.badges.length} / {BADGES.length} SKILLS</span></div><div className="badge-grid">{BADGES.map(badge => <div key={badge.id} className={`skill-badge ${progress.profile.badges.includes(badge.id) ? 'earned' : ''}`}><span className="skill-icon">{progress.profile.badges.includes(badge.id) ? <Check size={18}/> : <Target size={18}/>}</span><h3>{badge.title}</h3><p>{badge.description}</p><span>{progress.profile.badges.includes(badge.id) ? 'EARNED' : `${badge.points} XP · one-time milestone`}</span></div>)}</div></section>
  <section className="panel race-journal"><div className="panel-title"><div><span className="eyebrow">YOUR RACE JOURNAL</span><h2>Experience you can build on</h2></div><button className="secondary" onClick={download}><ArrowDownToLine size={14}/> Export progress</button></div><p>Saved in this browser. The last 12 completed races stay here, including the ones that taught you what to change.</p>{best !== null && <div className="journal-best">Previous best under this race's seed, starting tyre and model: <strong>{fmt(best, 3)}s</strong></div>}{progress.profile.races.length ? <div className="table-wrap"><table><thead><tr><th>RESULT</th><th>SEED / START</th><th>RACE TIME</th><th>VS BASELINE</th><th>FOCUS</th></tr></thead><tbody>{progress.profile.races.map(item => <tr key={item.race_id}><td>{item.status === 'FINISHED' ? `P${item.position}` : 'Rule missed'}</td><td>{item.seed} / {item.starting.toLowerCase()}</td><td>{fmt(item.time, 3)}s</td><td>{item.baseline_change === null ? '—' : sign(item.baseline_change)}</td><td>{FOCUSES[item.focus]?.title || 'Explore'}</td></tr>)}</tbody></table></div> : <div className="journal-empty"><Flag size={22}/><p>Your first completed race will start the story. Finishing last can still teach you something useful.</p></div>}</section>
  <section className="panel glossary"><div className="panel-title"><h2>The language of the pit wall</h2></div>{[['Stint', 'The consecutive laps you drive on one tyre set. A pit stop starts a new stint.'], ['Compound', 'The tyre type: Soft, Medium or Hard. Each trades fresh pace against durability.'], ['Cliff', 'The model tyre age after which wear starts increasing nonlinearly. It is not a real tyre-failure forecast.'], ['Undercut', 'Pitting before a rival to use fresh-tyre pace while they stay out. It only works when the gained pace repays the stop and traffic cooperates.'], ['Overcut', 'Staying out longer than a rival and trying to gain with clear air or stronger pace before your own stop.'], ['Payback', 'How long the estimated pace gain takes to recover the time spent pitting.'], ['Track position', 'Where you are relative to rivals. Protecting it can have value even when another tyre looks faster.']].map(([term, definition]) => <details key={term}><summary>{term}<ChevronDown size={14}/></summary><p>{definition}</p></details>)}</section></div>;
}
