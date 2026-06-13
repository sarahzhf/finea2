import type { QuizQuestionRow } from "@/lib/quiz/types";

// --- Adaptive selection / lightweight "ML" ---
// We use a simple online logistic model (Elo-style update).
// theta: learner ability (overall or per-theme)
// b: item difficulty (mapped from difficulty_level 1..5)
// P(correct) = sigmoid(theta - b)

export type ThemeTheta = Record<string, number>;

export const DEFAULT_THETA = 0;

function sigmoid(x: number): number {
  // safe sigmoid
  if (x > 20) return 1;
  if (x < -20) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function difficultyToB(difficultyLevel: number): number {
  // Map 1..5 to roughly [-2, 2]
  const lvl = Math.min(5, Math.max(1, difficultyLevel));
  return (lvl - 3) * 1.0;
}

export function predictCorrectProb(theta: number, difficultyLevel: number): number {
  const b = difficultyToB(difficultyLevel);
  return sigmoid(theta - b);
}

export function updateThetaElo(opts: {
  theta: number;
  difficultyLevel: number;
  correct: boolean;
  k?: number;
}): { theta: number; p: number; delta: number } {
  const { theta, difficultyLevel, correct } = opts;
  const k = typeof opts.k === "number" ? opts.k : 0.35;
  const p = predictCorrectProb(theta, difficultyLevel);
  const y = correct ? 1 : 0;
  const delta = k * (y - p);
  return { theta: theta + delta, p, delta };
}

export function pickWeakestTheme(themeTheta: ThemeTheta): string | null {
  const entries = Object.entries(themeTheta);
  if (entries.length === 0) return null;
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0]![0];
}

export function selectNextQuestion(opts: {
  candidates?: QuizQuestionRow[];
  askedIds: Set<string>;
  thetaOverall: number;
  themeTheta: ThemeTheta;
  preferredTheme?: string | null;
  targetDifficultyLevel?: number;
  epsilon?: number;
}): QuizQuestionRow | null {
  const {
    candidates = [],
    askedIds,
    thetaOverall,
    themeTheta,
  } = opts;
  const epsilon = typeof opts.epsilon === "number" ? opts.epsilon : 0.15;

  const pool = Array.isArray(candidates)
    ? candidates.filter((q) => !askedIds.has(q.id))
    : [];

  if (pool.length === 0) return null;

  // Exploration: random pick with probability epsilon
  if (Math.random() < epsilon) {
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  const weakestTheme = pickWeakestTheme(themeTheta);
  const targetTheta = weakestTheme ? themeTheta[weakestTheme] ?? thetaOverall : thetaOverall;

  // Exploitation: pick the item whose difficulty is closest to targetTheta.
  // Small theme bonus if it matches weakestTheme.
  let best: QuizQuestionRow | null = null;
  let bestScore = -Infinity;
  for (const q of pool) {
    const b = difficultyToB(q.difficulty_level);
    const closeness = -Math.abs(b - targetTheta);
    const themeBonus = weakestTheme && q.theme === weakestTheme ? 0.25 : 0;
    const score = closeness + themeBonus;
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}
