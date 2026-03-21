// FILE: server/utils/badge.utils.js
// STATUS: NEW
// PURPOSE: Compute learner badge levels using canonical Learnova thresholds.

const BADGE_LEVELS = [
  { level: 'Master', min: 101 },
  { level: 'Expert', min: 81 },
  { level: 'Specialist', min: 61 },
  { level: 'Achiever', min: 41 },
  { level: 'Explorer', min: 21 },
  { level: 'Newbie', min: 0 },
];

const computeBadge = (totalPoints = 0) => {
  for (const badge of BADGE_LEVELS) {
    if (totalPoints >= badge.min) {
      return badge.level;
    }
  }
  return 'Newbie';
};

const getNextBadge = (totalPoints = 0) => {
  const current = computeBadge(totalPoints);
  const currentIdx = BADGE_LEVELS.findIndex((b) => b.level === current);
  return currentIdx > 0 ? BADGE_LEVELS[currentIdx - 1] : null;
};

export { BADGE_LEVELS, computeBadge, getNextBadge };
