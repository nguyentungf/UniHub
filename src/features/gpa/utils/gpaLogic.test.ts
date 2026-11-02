import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQualityPoints,
  calculateSemesterGpa,
  calculateCumulativeGpa,
  getAcademicStanding,
  getGpaProgressionHistory,
  simulateProjectedGpa,
  resolveEffectiveGradePoint,
} from './gpaLogic.ts';
import {
  DEFAULT_GRADING_SCALES,
  findTierForPercentage,
  findTierForLetter,
} from './gradingScales.ts';
import type { GradeRecord, Semester } from '../../../types/index.ts';

const scale40 = DEFAULT_GRADING_SCALES[0]; // US 4.0
const scale433 = DEFAULT_GRADING_SCALES[1]; // 4.33
const scaleHust = DEFAULT_GRADING_SCALES[2]; // Vietnam 4.0
const scale10 = DEFAULT_GRADING_SCALES[3]; // 10.0

describe('GPA Calculation & Logic Tests', () => {
  describe('calculateQualityPoints', () => {
    it('correctly calculates points for standard credits and grade points', () => {
      assert.equal(calculateQualityPoints(4.0, 3), 12.0);
      assert.equal(calculateQualityPoints(3.7, 4), 14.8);
      assert.equal(calculateQualityPoints(3.3, 3), 9.9);
      assert.equal(calculateQualityPoints(0.0, 4), 0.0);
    });

    it('safely handles zero or negative credits', () => {
      assert.equal(calculateQualityPoints(4.0, 0), 0);
      assert.equal(calculateQualityPoints(3.7, -2), 0);
    });

    it('safely handles NaN values', () => {
      assert.equal(calculateQualityPoints(NaN, 3), 0);
      assert.equal(calculateQualityPoints(4.0, NaN), 0);
    });
  });

  describe('findTierForPercentage & Scale Conversions', () => {
    it('converts percentage to correct US 4.0 grade point and letter', () => {
      const tier95 = findTierForPercentage(95, scale40);
      assert.equal(tier95.letter, 'A');
      assert.equal(tier95.gradePoint, 4.0);

      const tier91 = findTierForPercentage(91, scale40);
      assert.equal(tier91.letter, 'A-');
      assert.equal(tier91.gradePoint, 3.7);

      const tier88 = findTierForPercentage(88, scale40);
      assert.equal(tier88.letter, 'B+');
      assert.equal(tier88.gradePoint, 3.3);

      const tier55 = findTierForPercentage(55, scale40);
      assert.equal(tier55.letter, 'F');
      assert.equal(tier55.gradePoint, 0.0);
    });

    it('converts percentage in Vietnam 4.0 (HUST/VNU) scale', () => {
      const tier85 = findTierForPercentage(85, scaleHust);
      assert.equal(tier85.letter, 'A');
      assert.equal(tier85.gradePoint, 4.0);

      const tier82 = findTierForPercentage(82, scaleHust);
      assert.equal(tier82.letter, 'B+');
      assert.equal(tier82.gradePoint, 3.5);

      const tier75 = findTierForPercentage(75, scaleHust);
      assert.equal(tier75.letter, 'B');
      assert.equal(tier75.gradePoint, 3.0);

      const tier45 = findTierForPercentage(45, scaleHust);
      assert.equal(tier45.letter, 'D');
      assert.equal(tier45.gradePoint, 1.0);
    });

    it('converts percentage in 10.0 scale', () => {
      const tier92 = findTierForPercentage(92, scale10);
      assert.equal(tier92.gradePoint, 10.0);

      const tier85 = findTierForPercentage(85, scale10);
      assert.equal(tier85.gradePoint, 8.5);

      const tier30 = findTierForPercentage(30, scale10);
      assert.equal(tier30.gradePoint, 0.0);
    });

    it('clamps out of bound percentages', () => {
      const tierOver = findTierForPercentage(150, scale40);
      assert.equal(tierOver.letter, 'A+');

      const tierUnder = findTierForPercentage(-20, scale40);
      assert.equal(tierUnder.letter, 'F');
    });

    it('finds tier for letter grade case-insensitively', () => {
      const tierA = findTierForLetter('a', scale40);
      assert.ok(tierA);
      assert.equal(tierA?.gradePoint, 4.0);

      const tierBPlus = findTierForLetter('b+', scale40);
      assert.ok(tierBPlus);
      assert.equal(tierBPlus?.gradePoint, 3.3);

      const unknown = findTierForLetter('XYZ', scale40);
      assert.equal(unknown, undefined);
    });
  });

  describe('calculateSemesterGpa', () => {
    it('computes accurate credit-weighted GPA for standard graded courses', () => {
      const sampleRecords: GradeRecord[] = [
        {
          id: '1',
          courseId: 'c1',
          courseCode: 'CS101',
          courseName: 'Intro to CS',
          semesterId: 'sem1',
          credits: 4,
          gradePoint: 4.0,
          percentageScore: 95,
          status: 'completed',
        },
        {
          id: '2',
          courseId: 'c2',
          courseCode: 'MATH101',
          courseName: 'Calculus',
          credits: 4,
          gradePoint: 3.7,
          percentageScore: 91,
          status: 'completed',
        },
        {
          id: '3',
          courseId: 'c3',
          courseCode: 'ENG101',
          courseName: 'English',
          credits: 2,
          gradePoint: 3.0,
          percentageScore: 84,
          status: 'completed',
        },
      ];

      // QP: 4*4.0 (16.0) + 4*3.7 (14.8) + 2*3.0 (6.0) = 36.8
      // Credits: 10
      // GPA = 36.8 / 10 = 3.68
      const summary = calculateSemesterGpa(sampleRecords, scale40, 'sem1', 'Fall 2025');
      assert.equal(summary.gpa, 3.68);
      assert.equal(summary.qualityPoints, 36.8);
      assert.equal(summary.earnedCredits, 10);
      assert.equal(summary.attemptedCredits, 10);
      assert.equal(summary.gradedCoursesCount, 3);
      assert.equal(summary.ungradedCoursesCount, 0);

      // Weighted Percentage: (95*4 + 91*4 + 84*2) / 10 = (380 + 364 + 168) / 10 = 91.2%
      assert.equal(summary.weightedPercentage, 91.2);
    });

    it('CRITICAL: excludes missing/ungraded courses from GPA calculation (does NOT penalize as 0.0)', () => {
      const recordsWithMissing: GradeRecord[] = [
        {
          id: '1',
          courseId: 'c1',
          courseCode: 'CS201',
          courseName: 'Data Structures',
          semesterId: 'sem2',
          credits: 4,
          gradePoint: 4.0,
          status: 'enrolled',
        },
        {
          id: '2',
          courseId: 'c2',
          courseCode: 'CS210',
          courseName: 'Architecture',
          credits: 3,
          gradePoint: undefined, // Missing grade!
          status: 'enrolled',
        },
        {
          id: '3',
          courseId: 'c3',
          courseCode: 'MATH205',
          courseName: 'Linear Algebra',
          credits: 3,
          gradePoint: undefined, // Missing grade!
          status: 'enrolled',
        },
      ];

      const summary = calculateSemesterGpa(recordsWithMissing, scale40, 'sem2', 'Fall 2026');
      // Only CS201 is graded (4 credits at 4.0 = 16 QP).
      // CS210 and MATH205 have missing grades, so attempted credits should be 4, NOT 10!
      // GPA must be 4.00, NOT 1.60!
      assert.equal(summary.gpa, 4.0);
      assert.equal(summary.qualityPoints, 16.0);
      assert.equal(summary.attemptedCredits, 4);
      assert.equal(summary.totalCredits, 10);
      assert.equal(summary.gradedCoursesCount, 1);
      assert.equal(summary.ungradedCoursesCount, 2);
    });

    it('excludes dropped courses from both credits and GPA', () => {
      const recordsWithDropped: GradeRecord[] = [
        {
          id: '1',
          courseId: 'c1',
          courseCode: 'CS101',
          courseName: 'Intro to CS',
          semesterId: 'sem1',
          credits: 4,
          gradePoint: 4.0,
          status: 'completed',
        },
        {
          id: '2',
          courseId: 'c2',
          courseCode: 'MATH101',
          courseName: 'Calculus',
          credits: 4,
          gradePoint: 2.0,
          status: 'dropped', // DROPPED
        },
      ];

      const summary = calculateSemesterGpa(recordsWithDropped, scale40);
      assert.equal(summary.gpa, 4.0);
      assert.equal(summary.attemptedCredits, 4);
      assert.equal(summary.totalCredits, 4);
      assert.equal(summary.coursesCount, 1);
    });

    it('includes failing courses in attempted credits with 0 quality points', () => {
      const recordsWithFail: GradeRecord[] = [
        {
          id: '1',
          courseId: 'c1',
          courseCode: 'CS101',
          courseName: 'Intro to CS',
          semesterId: 'sem1',
          credits: 4,
          gradePoint: 4.0,
          status: 'completed',
        },
        {
          id: '2',
          courseId: 'c2',
          courseCode: 'PHYS101',
          courseName: 'Physics',
          credits: 4,
          gradePoint: 0.0, // F
          status: 'completed',
        },
      ];

      // QP = 4*4 + 4*0 = 16
      // Attempted Credits = 8
      // Earned Credits = 4 (physics not earned)
      // GPA = 16 / 8 = 2.00
      const summary = calculateSemesterGpa(recordsWithFail, scale40);
      assert.equal(summary.gpa, 2.0);
      assert.equal(summary.attemptedCredits, 8);
      assert.equal(summary.earnedCredits, 4);
      assert.equal(summary.qualityPoints, 16.0);
    });

    it('safely handles empty records list without division by zero', () => {
      const summary = calculateSemesterGpa([], scale40);
      assert.equal(summary.gpa, 0);
      assert.equal(summary.attemptedCredits, 0);
      assert.equal(summary.qualityPoints, 0);
      assert.equal(summary.weightedPercentage, null);
    });
  });

  describe('calculateCumulativeGpa', () => {
    it('aggregates multiple semesters with differing credit loads accurately', () => {
      const semesters: Semester[] = [
        {
          id: 'sem1',
          name: 'Fall 2025',
          startDate: '2025-09-01',
          endDate: '2025-12-28',
          isCurrent: false,
          targetGpa: 3.7,
        },
        {
          id: 'sem2',
          name: 'Spring 2026',
          startDate: '2026-01-15',
          endDate: '2026-05-30',
          isCurrent: false,
          targetGpa: 3.8,
        },
      ];

      // Sem 1: 15 credits, GPA 3.60 -> QP = 54.0
      // Sem 2: 18 credits, GPA 3.85 -> QP = 69.3
      // Total QP = 123.3, Total Credits = 33
      // Cumulative GPA = 123.3 / 33 = 3.736 -> 3.74
      const records: GradeRecord[] = [
        // Sem 1
        { id: '1', courseId: 'c1', courseCode: 'C1', courseName: 'C1', semesterId: 'sem1', credits: 5, gradePoint: 4.0, status: 'completed' },
        { id: '2', courseId: 'c2', courseCode: 'C2', courseName: 'C2', semesterId: 'sem1', credits: 5, gradePoint: 3.5, status: 'completed' },
        { id: '3', courseId: 'c3', courseCode: 'C3', courseName: 'C3', semesterId: 'sem1', credits: 5, gradePoint: 3.3, status: 'completed' },
        // Sem 2
        { id: '4', courseId: 'c4', courseCode: 'C4', courseName: 'C4', semesterId: 'sem2', credits: 6, gradePoint: 4.0, status: 'completed' },
        { id: '5', courseId: 'c5', courseCode: 'C5', courseName: 'C5', semesterId: 'sem2', credits: 6, gradePoint: 4.0, status: 'completed' },
        { id: '6', courseId: 'c6', courseCode: 'C6', courseName: 'C6', semesterId: 'sem2', credits: 6, gradePoint: 3.55, status: 'completed' },
      ];

      const cumulative = calculateCumulativeGpa(records, semesters, scale40);
      assert.equal(cumulative.totalCreditsAttempted, 33);
      assert.equal(cumulative.totalCreditsEarned, 33);
      assert.equal(cumulative.cumulativeGpa, 3.74);
      assert.equal(cumulative.academicStanding.title, 'Summa Cum Laude');
    });

    it('returns 0 when no courses have been graded', () => {
      const semesters: Semester[] = [
        { id: 'sem1', name: 'Fall 2026', startDate: '2026-09-01', endDate: '2026-12-28', isCurrent: true },
      ];
      const records: GradeRecord[] = [
        { id: '1', courseId: 'c1', courseCode: 'C1', courseName: 'C1', semesterId: 'sem1', credits: 4, status: 'enrolled' },
      ];

      const cumulative = calculateCumulativeGpa(records, semesters, scale40);
      assert.equal(cumulative.cumulativeGpa, 0);
      assert.equal(cumulative.totalCreditsAttempted, 0);
      assert.equal(cumulative.totalCreditsInProgress, 4);
    });
  });

  describe('getAcademicStanding', () => {
    it('accurately identifies Summa Cum Laude', () => {
      const standing = getAcademicStanding(3.9, 4.0);
      assert.equal(standing.title, 'Summa Cum Laude');
    });

    it('accurately identifies Magna Cum Laude', () => {
      const standing = getAcademicStanding(3.55, 4.0);
      assert.equal(standing.title, 'Magna Cum Laude');
    });

    it('accurately identifies Cum Laude', () => {
      const standing = getAcademicStanding(3.1, 4.0);
      assert.equal(standing.title, 'Cum Laude');
    });

    it('accurately identifies Good Academic Standing', () => {
      const standing = getAcademicStanding(2.7, 4.0);
      assert.equal(standing.title, 'Good Academic Standing');
    });

    it('accurately identifies Academic Warning and Probation', () => {
      const warning = getAcademicStanding(2.1, 4.0);
      assert.equal(warning.title, 'Academic Warning');

      const probation = getAcademicStanding(1.8, 4.0);
      assert.equal(probation.title, 'Academic Probation');
    });

    it('supports 10.0 scale scaling', () => {
      const standing10 = getAcademicStanding(9.3, 10.0);
      assert.equal(standing10.title, 'Summa Cum Laude');

      const standing10Good = getAcademicStanding(7.5, 10.0);
      assert.equal(standing10Good.title, 'Cum Laude');
    });
  });

  describe('simulateProjectedGpa', () => {
    it('simulates scenario grades for enrolled courses and calculates what-if projected GPA', () => {
      const semesters: Semester[] = [
        { id: 'sem1', name: 'Spring 2026', startDate: '2026-01-15', endDate: '2026-05-30', isCurrent: false },
        { id: 'sem2', name: 'Fall 2026', startDate: '2026-09-01', endDate: '2026-12-28', isCurrent: true },
      ];

      const records: GradeRecord[] = [
        // Past semester: 10 credits at 4.0 = 40 QP
        { id: '1', courseId: 'past-1', courseCode: 'P1', courseName: 'P1', semesterId: 'sem1', credits: 10, gradePoint: 4.0, status: 'completed' },
        // Current semester: 2 enrolled courses (4 credits and 4 credits) without grades yet
        { id: '2', courseId: 'cur-1', courseCode: 'C1', courseName: 'C1', semesterId: 'sem2', credits: 4, status: 'enrolled' },
        { id: '3', courseId: 'cur-2', courseCode: 'C2', courseName: 'C2', semesterId: 'sem2', credits: 4, status: 'enrolled' },
      ];

      // What if student gets 3.7 in cur-1 and 3.3 in cur-2?
      // Semester QP = 4*3.7 (14.8) + 4*3.3 (13.2) = 28.0
      // Semester GPA = 28.0 / 8 = 3.50
      // Cumulative QP = 40 + 28 = 68.0
      // Total Credits = 18
      // Cumulative GPA = 68 / 18 = 3.777 -> 3.78
      const simulation = simulateProjectedGpa(
        records,
        semesters,
        {
          'cur-1': 3.7,
          'cur-2': 3.3,
        },
        scale40
      );

      assert.equal(simulation.projectedSemesterGpa, 3.5);
      assert.equal(simulation.projectedCumulativeGpa, 3.78);
      assert.equal(simulation.totalSimulatedCredits, 18);
    });
  });

  describe('getGpaProgressionHistory', () => {
    it('computes progression curve chronologically', () => {
      const semesters: Semester[] = [
        { id: 'sem1', name: 'Fall 2025', startDate: '2025-09-01', endDate: '2025-12-28', isCurrent: false, targetGpa: 3.7 },
        { id: 'sem2', name: 'Spring 2026', startDate: '2026-01-15', endDate: '2026-05-30', isCurrent: false, targetGpa: 3.8 },
      ];

      const records: GradeRecord[] = [
        { id: '1', courseId: 'c1', courseCode: 'C1', courseName: 'C1', semesterId: 'sem1', credits: 10, gradePoint: 3.5, status: 'completed' },
        { id: '2', courseId: 'c2', courseCode: 'C2', courseName: 'C2', semesterId: 'sem2', credits: 10, gradePoint: 3.9, status: 'completed' },
      ];

      const history = getGpaProgressionHistory(semesters, records, scale40);
      assert.equal(history.length, 2);
      assert.equal(history[0].semesterName, 'Fall 2025');
      assert.equal(history[0].semesterGpa, 3.5);
      assert.equal(history[0].cumulativeGpa, 3.5);

      assert.equal(history[1].semesterName, 'Spring 2026');
      assert.equal(history[1].semesterGpa, 3.9);
      assert.equal(history[1].cumulativeGpa, 3.7);
    });
  });
});
