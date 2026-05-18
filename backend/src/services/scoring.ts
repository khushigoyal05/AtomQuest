type UoMType =
  | 'NUMERIC_HIGHER'
  | 'NUMERIC_LOWER'
  | 'TIMELINE'
  | 'ZERO_BASED';

/**
 * Compute score for a goal based on UoM type.
 * Returns a percentage (0–150 range, clamped).
 */
export function computeScore(uom: UoMType | string, target: number, actual: number): number {
  let score = 0;

  switch (uom) {
    case 'NUMERIC_HIGHER':
      // Higher is better: actual / target * 100
      if (target === 0) return actual === 0 ? 100 : 0;
      score = (actual / target) * 100;
      break;

    case 'NUMERIC_LOWER':
      // Lower is better: target / actual * 100
      if (actual === 0) return 150; // Perfect — zero achieved
      score = (target / actual) * 100;
      break;

    case 'TIMELINE':
      // actual represents % completion (0-100)
      score = Math.min(actual, 100);
      break;

    case 'ZERO_BASED':
      // Zero-based: if actual === 0, score = 100%, else 0%
      score = actual === 0 ? 100 : 0;
      break;

    default:
      score = target > 0 ? (actual / target) * 100 : 0;
  }

  // Clamp between 0 and 150
  return Math.min(150, Math.max(0, Math.round(score * 10) / 10));
}

/**
 * Compute overall weighted score across all goals
 */
export function computeOverallScore(goals: { weightage: number; computedScore?: number | null }[]): number {
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage === 0) return 0;

  const weighted = goals.reduce((sum, g) => {
    const score = g.computedScore ?? 0;
    return sum + (score * g.weightage) / 100;
  }, 0);

  return Math.round(weighted * 10) / 10;
}
