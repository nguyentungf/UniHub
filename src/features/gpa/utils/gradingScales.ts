import type { GradingScale, GradeScaleTier } from '../../../types/index.ts';

export const DEFAULT_GRADING_SCALES: GradingScale[] = [
  {
    id: 'scale-4.0-us',
    name: 'Standard 4.0 Scale (US / North America)',
    scaleType: '4.0',
    maxGpa: 4.0,
    isCustom: false,
    tiers: [
      { letter: 'A+', gradePoint: 4.0, minPercentage: 97, maxPercentage: 100, description: 'Highest Honors' },
      { letter: 'A', gradePoint: 4.0, minPercentage: 93, maxPercentage: 96.99, description: 'Superior' },
      { letter: 'A-', gradePoint: 3.7, minPercentage: 90, maxPercentage: 92.99, description: 'Excellent' },
      { letter: 'B+', gradePoint: 3.3, minPercentage: 87, maxPercentage: 89.99, description: 'Very Good' },
      { letter: 'B', gradePoint: 3.0, minPercentage: 83, maxPercentage: 86.99, description: 'Good' },
      { letter: 'B-', gradePoint: 2.7, minPercentage: 80, maxPercentage: 82.99, description: 'Above Average' },
      { letter: 'C+', gradePoint: 2.3, minPercentage: 77, maxPercentage: 79.99, description: 'Average' },
      { letter: 'C', gradePoint: 2.0, minPercentage: 73, maxPercentage: 76.99, description: 'Satisfactory' },
      { letter: 'C-', gradePoint: 1.7, minPercentage: 70, maxPercentage: 72.99, description: 'Below Average' },
      { letter: 'D+', gradePoint: 1.3, minPercentage: 67, maxPercentage: 69.99, description: 'Poor' },
      { letter: 'D', gradePoint: 1.0, minPercentage: 60, maxPercentage: 66.99, description: 'Minimum Passing' },
      { letter: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 59.99, description: 'Failing' },
    ],
  },
  {
    id: 'scale-4.33',
    name: 'Standard 4.33 Scale (Honors / Canadian)',
    scaleType: '4.33',
    maxGpa: 4.33,
    isCustom: false,
    tiers: [
      { letter: 'A+', gradePoint: 4.33, minPercentage: 95, maxPercentage: 100, description: 'Exceptional' },
      { letter: 'A', gradePoint: 4.0, minPercentage: 90, maxPercentage: 94.99, description: 'Excellent' },
      { letter: 'A-', gradePoint: 3.67, minPercentage: 85, maxPercentage: 89.99, description: 'Very Good' },
      { letter: 'B+', gradePoint: 3.33, minPercentage: 80, maxPercentage: 84.99, description: 'Good' },
      { letter: 'B', gradePoint: 3.0, minPercentage: 75, maxPercentage: 79.99, description: 'Above Average' },
      { letter: 'B-', gradePoint: 2.67, minPercentage: 70, maxPercentage: 74.99, description: 'Average' },
      { letter: 'C+', gradePoint: 2.33, minPercentage: 65, maxPercentage: 69.99, description: 'Satisfactory' },
      { letter: 'C', gradePoint: 2.0, minPercentage: 60, maxPercentage: 64.99, description: 'Adequate' },
      { letter: 'D', gradePoint: 1.0, minPercentage: 50, maxPercentage: 59.99, description: 'Marginal Pass' },
      { letter: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 49.99, description: 'Failure' },
    ],
  },
  {
    id: 'scale-4.0-hust',
    name: 'Vietnam 4.0 Letter Scale (HUST / VNU)',
    scaleType: '4.0',
    maxGpa: 4.0,
    isCustom: false,
    tiers: [
      { letter: 'A', gradePoint: 4.0, minPercentage: 85, maxPercentage: 100, description: 'Xuất sắc / Giỏi (8.5 - 10.0)' },
      { letter: 'B+', gradePoint: 3.5, minPercentage: 80, maxPercentage: 84.99, description: 'Khá giỏi (8.0 - 8.4)' },
      { letter: 'B', gradePoint: 3.0, minPercentage: 70, maxPercentage: 79.99, description: 'Khá (7.0 - 7.9)' },
      { letter: 'C+', gradePoint: 2.5, minPercentage: 65, maxPercentage: 69.99, description: 'Trung bình khá (6.5 - 6.9)' },
      { letter: 'C', gradePoint: 2.0, minPercentage: 55, maxPercentage: 64.99, description: 'Trung bình (5.5 - 6.4)' },
      { letter: 'D+', gradePoint: 1.5, minPercentage: 50, maxPercentage: 54.99, description: 'Trung bình yếu (5.0 - 5.4)' },
      { letter: 'D', gradePoint: 1.0, minPercentage: 40, maxPercentage: 49.99, description: 'Yếu - Đạt (4.0 - 4.9)' },
      { letter: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 39.99, description: 'Kém - Không đạt (< 4.0)' },
    ],
  },
  {
    id: 'scale-10.0',
    name: '10.0 Decimal Scale (European / Vietnam)',
    scaleType: '10.0',
    maxGpa: 10.0,
    isCustom: false,
    tiers: [
      { letter: 'Xuất sắc (A+)', gradePoint: 10.0, minPercentage: 90, maxPercentage: 100, description: 'Xuất sắc (9.0 - 10.0)' },
      { letter: 'Giỏi (A)', gradePoint: 8.5, minPercentage: 80, maxPercentage: 89.99, description: 'Giỏi (8.0 - 8.9)' },
      { letter: 'Khá (B)', gradePoint: 7.0, minPercentage: 70, maxPercentage: 79.99, description: 'Khá (7.0 - 7.9)' },
      { letter: 'Trung bình (C)', gradePoint: 5.5, minPercentage: 55, maxPercentage: 69.99, description: 'Trung bình (5.5 - 6.9)' },
      { letter: 'Trung bình yếu (D)', gradePoint: 4.0, minPercentage: 40, maxPercentage: 54.99, description: 'Trung bình yếu (4.0 - 5.4)' },
      { letter: 'Kém (F)', gradePoint: 0.0, minPercentage: 0, maxPercentage: 39.99, description: 'Không đạt (< 4.0)' },
    ],
  },
];

export const DEFAULT_ACTIVE_SCALE_ID = 'scale-4.0-us';

/**
 * Resolves a percentage score (0-100) to the corresponding tier in a given scale.
 */
export function findTierForPercentage(percentage: number, scale: GradingScale): GradeScaleTier {
  const clamped = Math.max(0, Math.min(100, percentage));
  // Sort tiers descending by minPercentage
  const sorted = [...scale.tiers].sort((a, b) => b.minPercentage - a.minPercentage);

  for (const tier of sorted) {
    if (clamped >= tier.minPercentage) {
      return tier;
    }
  }

  // Fallback to lowest tier
  return sorted[sorted.length - 1];
}

/**
 * Resolves a letter label to its tier.
 */
export function findTierForLetter(letter: string, scale: GradingScale): GradeScaleTier | undefined {
  const clean = letter.trim().toLowerCase();
  return scale.tiers.find(
    (t) => t.letter.trim().toLowerCase() === clean
  );
}

/**
 * Resolves a grade point to the closest tier.
 */
export function findTierForGradePoint(point: number, scale: GradingScale): GradeScaleTier {
  const sorted = [...scale.tiers].sort((a, b) => b.gradePoint - a.gradePoint);
  for (const tier of sorted) {
    if (point >= tier.gradePoint) {
      return tier;
    }
  }
  return sorted[sorted.length - 1];
}
