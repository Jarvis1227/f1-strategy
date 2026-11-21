export const LESSONS = [
  { id: 'tyres', title: 'Buy pace with time', label: '01 / TYRE ECONOMICS', minutes: '1 minute',
    intro: 'Softs are quick when fresh. Hards last longer. A pit stop buys a fresh set, but you pay for it before you earn anything back.',
    principle: 'Compare the pit cost with the pace you can recover over the remaining laps.',
    question: 'A stop costs 22 seconds. Fresh tyres save exactly 1 second every lap. Ignoring everything else, when do you recover the stop?',
    answers: ['After 1 lap', 'After about 22 laps', 'Fresh tyres always pay back immediately'], correct: 1,
    explanation: '22 seconds ÷ 1 second per lap = 22 laps to break even. In a race, wear, traffic and safety cars change that calculation.',
    badge: 'Tyre economist' },
  { id: 'window', title: 'Read the opportunity', label: '02 / SAFETY CAR', minutes: '1 minute',
    intro: 'A safety car slows the field. In this model, a stop under it costs less time relative to rivals. Cheaper does not mean free.',
    principle: 'Use an opportunity when it fits the stint you need, rather than stopping just because a discount exists.',
    question: 'A green-flag stop costs 22 seconds and an SC stop costs 15 seconds. How much does the SC save per stop?',
    answers: ['7 seconds', '15 seconds', '22 seconds'], correct: 0,
    explanation: '22 − 15 = 7 seconds saved. You still spend 15 seconds and can lose positions. Tyre age and the remaining distance still matter.',
    badge: 'Window reader' },
  { id: 'traffic', title: 'Find the hidden seconds', label: '03 / TRAFFIC', minutes: '1 minute',
    intro: 'A gap is the time between two cars. Close following can slow the car behind. A different pit call can change who you meet later.',
    principle: 'Trace a time change to the lap, the car ahead and the gap. Position alone is not the full story.',
    question: 'On a green lap, neither car pits. You are 0.6 seconds behind a rival. With a 1-second threshold and a 0.35-second penalty, what happens?',
    answers: ['No penalty because you are behind', 'Your lap receives a 0.35-second traffic penalty', 'Your pit stop becomes cheaper'], correct: 1,
    explanation: '0.6 is below 1.0, so close following adds 0.35 seconds. Under SC, or when either car pits, this simplified traffic penalty is suspended.',
    badge: 'Gap detective' },
  { id: 'longgame', title: 'Trade now, recover later', label: '04 / THE LONG GAME', minutes: '1 minute',
    intro: 'Like a positional move in chess, a pit stop can give something up now to improve what comes next. One lap is evidence, not a verdict.',
    principle: 'Judge a strategy across the stint and the race. Keep the immediate comparison separate from the full-race comparison.',
    question: 'You lose four positions during a stop for fresh tyres. Does that alone prove the stop was a mistake?',
    answers: ['Yes. Every position loss is a mistake', 'No. A pit stop is always good', 'No. Check later pace, traffic, remaining laps and the final outcome'], correct: 2,
    explanation: 'The lost positions are the cost. Fresh-tyre pace is the possible return. Some stops recover their cost; others do not. Test the plan against a comparable baseline.',
    badge: 'Long-game thinker' },
];

export const BADGES = [
  ...LESSONS.map(lesson => ({ id: `lesson-${lesson.id}`, title: lesson.badge, points: 15, description: `Complete “${lesson.title}”.` })),
  { id: 'distance', title: 'Full distance', points: 20, description: 'Complete a race or a closing-stint battle, whatever the result.' },
  { id: 'legal', title: 'Clean finish', points: 30, description: 'Finish classified after using the required compounds.' },
  { id: 'sc-stop', title: 'SC explorer', points: 20, description: 'Experience a discounted safety-car stop. This is experience, not a claim the stop was optimal.' },
  { id: 'baseline', title: 'Plan with a payoff', points: 40, description: 'Finish legally and beat a legally finishing baseline car on total race time.' },
];
export const RANKS = [{ points: 0, name: 'Rookie' }, { points: 30, name: 'Race reader' }, { points: 80, name: 'Strategist' }, { points: 140, name: 'Pit wall thinker' }];
export const EMPTY_PROFILE = { version: 1, badges: [], races: [] };
const validIds = new Set(BADGES.map(badge => badge.id));

export function normalizeProfile(value) {
  if (!value || value.version !== 1) return { ...EMPTY_PROFILE, badges: [], races: [] };
  const badges = Array.isArray(value.badges) ? [...new Set(value.badges.filter(id => validIds.has(id)))] : [];
  const races = Array.isArray(value.races) ? value.races.filter(row => row && typeof row.race_id === 'string'
    && Number.isFinite(row.time) && row.time > 0 && Number.isInteger(row.position)
    && row.position >= 1 && row.position <= 10 && ['FINISHED', 'DSQ'].includes(row.status)
    && typeof row.signature === 'string' && Number.isInteger(row.seed)
    && ['SOFT', 'MEDIUM', 'HARD'].includes(row.starting)).slice(0, 12) : [];
  return { version: 1, badges, races };
}

export function award(profile, ids) {
  const clean = normalizeProfile(profile);
  const fresh = [...new Set(ids)].filter(id => validIds.has(id) && !clean.badges.includes(id));
  return { profile: { ...clean, badges: [...clean.badges, ...fresh] }, fresh };
}

export function completeLesson(profile, lessonId, answer) {
  const lesson = LESSONS.find(item => item.id === lessonId);
  return lesson && answer === lesson.correct ? award(profile, [`lesson-${lessonId}`]) : { profile, fresh: [] };
}

export function learnFromRace(profile, race) {
  if (!race) return { profile, fresh: [] };
  const ids = [];
  if (race.experiences?.sc_stop || race.last_decision?.recap?.pit_savings_s > 0) ids.push('sc-stop');
  let result = award(profile, ids);
  if (!race.done) return result;
  const player = race.classification?.find(car => car.car_id === 'car_01');
  if (!player) return result;
  const awards = ['distance'];
  if (player.status === 'FINISHED') awards.push('legal');
  const baseline = race.summary?.find(car => car.car_id === 'car_01');
  if (player.status === 'FINISHED' && baseline?.baseline_status === 'FINISHED' && baseline.time_change_s < -.0005) awards.push('baseline');
  const finished = award(result.profile, awards);
  const row = { race_id: race.race_id, position: player.position, time: player.elapsed_s, status: player.status,
    seed: race.seed, starting: race.starting_compound, signature: race.config_signature,
    baseline_change: baseline?.time_change_s ?? null, focus: race.focus || 'clean' };
  const races = finished.profile.races.some(item => item.race_id === race.race_id) ? finished.profile.races
    : [row, ...finished.profile.races].slice(0, 12);
  return { profile: { ...finished.profile, races }, fresh: [...result.fresh, ...finished.fresh] };
}

export function rankFor(profile) {
  const points = BADGES.filter(badge => profile.badges.includes(badge.id)).reduce((sum, badge) => sum + badge.points, 0);
  const rank = [...RANKS].reverse().find(item => points >= item.points) || RANKS[0];
  const next = RANKS.find(item => item.points > points);
  const progress = next ? (points - rank.points) / (next.points - rank.points) : 1;
  return { points, rank, next, progress };
}

export function personalBest(profile, race) {
  const matching = profile.races.filter(row => row.status === 'FINISHED' && row.signature === race.config_signature
    && row.seed === race.seed && row.starting === race.starting_compound && row.race_id !== race.race_id);
  return matching.length ? Math.min(...matching.map(row => row.time)) : null;
}
