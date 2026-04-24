import { clamp } from './utils';

export function calcSkillRating(skills) {
  if (!skills) return 0;
  const vals = ['technical', 'brawling', 'aerial', 'strongStyle', 'lucha', 'physical', 'athleticism', 'psychology']
    .map(k => skills[k] ?? 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function calcEntertainmentRating(skills) {
  if (!skills) return 0;
  const vals = [skills.microphone ?? 0, skills.acting ?? 0];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Star power is integer 0-5. Bonus tiers (% of base):
// 0 → -5%  |  1 → -2.5%  |  2 → 0%  |  3 → 0%  |  4 → +2.5%  |  5 → +5%
const SP_MULTIPLIER = [0.95, 0.975, 1.0, 1.0, 1.025, 1.05];

export function calcOverallRating(talent) {
  const skill = calcSkillRating(talent.skills);
  const ent   = calcEntertainmentRating(talent.skills);
  const sp    = clamp(Math.round(talent.starPower ?? 0), 0, 5);

  const base       = skill * 0.7 + ent * 0.3;
  const multiplier = SP_MULTIPLIER[sp] ?? 1.0;

  return Math.round(clamp(base * multiplier, 0, 100));
}

// ─── Random helpers ───────────────────────────────────────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min; }
function roundQ(n)       { return Math.round(n * 4) / 4; }  // nearest 0.25

// ─── Match simulation ─────────────────────────────────────────────────────────
export function simulateMatch(match, talents, stipulations, isPPV, championship) {
  const participants = (match.participants || [])
    .map(id => talents.find(t => t.id === id)).filter(Boolean);
  if (!participants.length) return null;

  const stip = stipulations.find(s => s.id === match.stipulationId) || { risk: 0, drawingPower: 0 };

  const avgSkill     = participants.reduce((a, t) => a + calcSkillRating(t.skills), 0) / participants.length;
  const maxPsych     = Math.max(...participants.map(t => t.skills?.psychology ?? 0));
  const avgStarPower = participants.reduce((a, t) => a + clamp(Math.round(t.starPower ?? 0), 0, 5), 0) / participants.length;

  const stipBonus     = (stip.drawingPower / 10) * 0.5;
  const psychBonus    = (maxPsych / 100) * 0.5;
  const starPowerBonus = (avgStarPower / 5) * 1.0;
  const champBonus    = championship ? (championship.prestigeLevel / 10) * 0.5 : 0;

  const rawScore  = (avgSkill / 100) * 3 + stipBonus + psychBonus + starPowerBonus + champBonus;
  const finalRating = clamp(roundQ(rawScore + rand(-0.25, 0.25)), 0, 5);

  // Impressions
  let impressions = 0;
  if (finalRating < 2)       impressions = -(3 - finalRating) * rand(500, 2000);
  else if (finalRating >= 3) impressions =  (finalRating - 2) * rand(1000, 5000);
  impressions *= (1 + avgStarPower / 5);
  if (isPPV) impressions *= 1.5;

  // Championship buzz
  if (championship) {
    const currentIds = Array.isArray(championship.currentChampion)
      ? championship.currentChampion : championship.currentChampion ? [championship.currentChampion] : [];
    const winnerId   = match.winnerId;
    const winnerIds  = Array.isArray(winnerId) ? winnerId : winnerId ? [winnerId] : [];
    const isChange   = winnerIds.length > 0 && !winnerIds.every(id => currentIds.includes(id));
    impressions *= isChange ? 1.3 : 1.1;
  }
  impressions = Math.round(impressions);

  // Injuries
  const injuries = [];
  for (const p of participants) {
    const chance = (stip.risk / 10) * 0.03;
    if (Math.random() < chance) {
      injuries.push({ talentId: p.id, weeksOut: Math.max(1, Math.floor(rand(1, Math.max(2, stip.risk / 2.5)))) });
    }
  }

  // Skill growth (combat only, 5-15% chance per wrestler)
  const combatSkills = ['technical', 'brawling', 'aerial', 'strongStyle', 'lucha', 'physical', 'athleticism', 'psychology'];
  const skillGrowth  = [];
  for (const p of participants) {
    if (Math.random() < rand(0.05, 0.15)) {
      const sk = combatSkills[Math.floor(Math.random() * combatSkills.length)];
      skillGrowth.push({ talentId: p.id, skill: sk, amount: 1 });
    }
  }

  // Star power changes (integer, with probability)
  // 4+ stars → 20% chance +1 SP (PPV: 30%) | 3+ → 5% (PPV: 10%) | <2 → 10% -1 SP
  const starPowerChanges = participants.map(p => {
    const current = clamp(Math.round(p.starPower ?? 0), 0, 5);
    let newSP = current;
    if (finalRating >= 4) {
      if (Math.random() < (isPPV ? 0.30 : 0.20)) newSP = Math.min(5, current + 1);
    } else if (finalRating >= 3) {
      if (Math.random() < (isPPV ? 0.10 : 0.05)) newSP = Math.min(5, current + 1);
    } else if (finalRating < 2) {
      if (Math.random() < 0.10) newSP = Math.max(0, current - 1);
    }
    return { talentId: p.id, newSP };
  });

  return { finalRating, impressions, injuries, skillGrowth, starPowerChanges, isPPV };
}

// ─── Segment simulation ───────────────────────────────────────────────────────
export function simulateSegment(segment, talents) {
  const participants = (segment.participants || [])
    .map(id => talents.find(t => t.id === id)).filter(Boolean);
  if (!participants.length) return null;

  const avgEnt       = participants.reduce((a, t) => a + calcEntertainmentRating(t.skills), 0) / participants.length;
  const avgStarPower = participants.reduce((a, t) => a + clamp(Math.round(t.starPower ?? 0), 0, 5), 0) / participants.length;

  const finalRating = clamp(roundQ((avgEnt / 100) * 5 + rand(-0.5, 0.5)), 0, 5);

  let impressions = 0;
  if (finalRating < 2)       impressions = -(3 - finalRating) * rand(500, 2000);
  else if (finalRating >= 3) impressions =  (finalRating - 2) * rand(1000, 5000);
  impressions *= (1 + avgStarPower / 5) * 0.7;
  impressions = Math.round(impressions);

  const starPowerChanges = participants.map(p => {
    const current = clamp(Math.round(p.starPower ?? 0), 0, 5);
    let newSP = current;
    if (finalRating >= 4 && Math.random() < 0.10) newSP = Math.min(5, current + 1);
    else if (finalRating < 2 && Math.random() < 0.08) newSP = Math.max(0, current - 1);
    return { talentId: p.id, newSP };
  });

  return { finalRating, impressions, starPowerChanges };
}
