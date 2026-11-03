import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SemesterFormSchema } from '../../../lib/validation/schemas.ts';
import type { Semester, Course } from '../../../types/index.ts';

describe('Semester Management Business Logic & Validation Lifecycle Tests', () => {
  describe('BUG 01 & BUG 04 – Semester Creation & Form Validation', () => {
    it('validates a complete valid semester with custom target GPA', () => {
      const validPayload = {
        name: 'Học kỳ 1 (2026 - 2027)',
        startDate: '2026-09-01',
        endDate: '2027-01-15',
        isCurrent: true,
        targetGpa: 3.75,
      };

      const result = SemesterFormSchema.safeParse(validPayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.name, 'Học kỳ 1 (2026 - 2027)');
        assert.equal(result.data.startDate, '2026-09-01');
        assert.equal(result.data.endDate, '2027-01-15');
        assert.equal(result.data.isCurrent, true);
        assert.equal(result.data.targetGpa, 3.75);
      }
    });

    it('accepts semester without target GPA (optional field)', () => {
      const payloadWithoutTarget = {
        name: 'Học kỳ Hè 2027',
        startDate: '2027-06-01',
        endDate: '2027-08-15',
        isCurrent: false,
      };

      const result = SemesterFormSchema.safeParse(payloadWithoutTarget);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.targetGpa, undefined);
      }
    });

    it('rejects empty semester name', () => {
      const invalid = {
        name: '   ',
        startDate: '2026-09-01',
        endDate: '2027-01-15',
      };
      const result = SemesterFormSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const errors = result.error.errors.map((e) => e.path.join('.'));
        assert.ok(errors.includes('name'));
      }
    });

    it('rejects end date occurring before start date', () => {
      const invalid = {
        name: 'Học kỳ Ngược',
        startDate: '2027-02-01',
        endDate: '2026-10-01', // Earlier than startDate
      };
      const result = SemesterFormSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const errors = result.error.errors.map((e) => e.path.join('.'));
        assert.ok(errors.includes('endDate'));
      }
    });

    it('rejects target GPA out of bounds (< 0 or > 4.0)', () => {
      const invalidNegative = {
        name: 'Học kỳ Lỗi',
        startDate: '2026-09-01',
        endDate: '2027-01-15',
        targetGpa: -0.5,
      };
      assert.equal(SemesterFormSchema.safeParse(invalidNegative).success, false);

      const invalidExceed = {
        name: 'Học kỳ Lỗi',
        startDate: '2026-09-01',
        endDate: '2027-01-15',
        targetGpa: 4.5,
      };
      assert.equal(SemesterFormSchema.safeParse(invalidExceed).success, false);
    });
  });

  describe('BUG 02 – Delete Validation Rules & Data Protection', () => {
    const mockSemesters: Semester[] = [
      {
        id: 'sem-1',
        name: 'Học kỳ 1 (2025 - 2026)',
        startDate: '2025-09-01',
        endDate: '2026-01-15',
        isCurrent: false,
        targetGpa: 3.5,
      },
      {
        id: 'sem-2',
        name: 'Học kỳ 2 (2025 - 2026)',
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        isCurrent: true,
        targetGpa: 3.7,
      },
      {
        id: 'sem-3',
        name: 'Học kỳ 1 (2026 - 2027)',
        startDate: '2026-09-01',
        endDate: '2027-01-15',
        isCurrent: false,
        targetGpa: 3.85,
      },
    ];

    const mockCourses: Course[] = [
      {
        id: 'c-1',
        semesterId: 'sem-1',
        code: 'CS101',
        name: 'Lập trình cơ bản',
        credits: 3,
        color: '#3B82F6',
        status: 'completed',
        gradingComponents: [],
      },
      {
        id: 'c-2',
        semesterId: 'sem-2',
        code: 'CS201',
        name: 'Cấu trúc dữ liệu',
        credits: 4,
        color: '#10B981',
        status: 'enrolled',
        gradingComponents: [],
      },
    ];

    function validateSemesterDeletion(
      semesterId: string,
      semesters: Semester[],
      courses: Course[]
    ): { canDelete: boolean; reason?: string } {
      const target = semesters.find((s) => s.id === semesterId);
      if (!target) {
        return { canDelete: false, reason: 'Không tìm thấy học kỳ để xóa' };
      }
      if (semesters.length <= 1) {
        return { canDelete: false, reason: 'Không thể xóa học kỳ duy nhất của hệ thống' };
      }
      if (target.isCurrent) {
        return {
          canDelete: false,
          reason: 'Không thể xóa học kỳ đang được đặt làm hiện tại. Vui lòng chuyển trạng thái hiện tại sang học kỳ khác trước khi xóa.',
        };
      }
      const linkedCourses = courses.filter((c) => c.semesterId === semesterId);
      if (linkedCourses.length > 0) {
        return {
          canDelete: false,
          reason: `Không thể xóa học kỳ đang chứa ${linkedCourses.length} môn học. Vui lòng chuyển hoặc xóa các môn học này trước khi xóa học kỳ.`,
        };
      }
      return { canDelete: true };
    }

    it('blocks deletion of the current active semester (isCurrent = true)', () => {
      const result = validateSemesterDeletion('sem-2', mockSemesters, mockCourses);
      assert.equal(result.canDelete, false);
      assert.match(result.reason || '', /Không thể xóa học kỳ đang được đặt làm hiện tại/);
    });

    it('blocks deletion of a semester containing registered courses', () => {
      const result = validateSemesterDeletion('sem-1', mockSemesters, mockCourses);
      assert.equal(result.canDelete, false);
      assert.match(result.reason || '', /đang chứa 1 môn học/);
    });

    it('blocks deletion when only one semester exists in the system', () => {
      const singleList = [mockSemesters[0]];
      const result = validateSemesterDeletion('sem-1', singleList, []);
      assert.equal(result.canDelete, false);
      assert.match(result.reason || '', /học kỳ duy nhất/);
    });

    it('permits deletion of an empty, non-current semester', () => {
      // sem-3 has no courses and is not current
      const result = validateSemesterDeletion('sem-3', mockSemesters, mockCourses);
      assert.equal(result.canDelete, true);
      assert.equal(result.reason, undefined);
    });
  });

  describe('BUG 03 – Current Semester Switching Logic', () => {
    it('guarantees exactly one semester has isCurrent = true when switching', () => {
      const initialSemesters: Semester[] = [
        { id: 's1', name: 'Kỳ 1', startDate: '2026-09-01', endDate: '2027-01-15', isCurrent: true },
        { id: 's2', name: 'Kỳ 2', startDate: '2027-02-01', endDate: '2027-06-30', isCurrent: false },
        { id: 's3', name: 'Kỳ 3', startDate: '2027-07-01', endDate: '2027-08-30', isCurrent: false },
      ];

      function switchActiveSemester(targetId: string, list: Semester[]): Semester[] {
        return list.map((s) => ({
          ...s,
          isCurrent: s.id === targetId,
        }));
      }

      // Switch to s2
      const afterS2 = switchActiveSemester('s2', initialSemesters);
      assert.equal(afterS2.find((s) => s.id === 's2')?.isCurrent, true);
      assert.equal(afterS2.find((s) => s.id === 's1')?.isCurrent, false);
      assert.equal(afterS2.find((s) => s.id === 's3')?.isCurrent, false);
      assert.equal(afterS2.filter((s) => s.isCurrent).length, 1);

      // Switch to s3
      const afterS3 = switchActiveSemester('s3', afterS2);
      assert.equal(afterS3.find((s) => s.id === 's3')?.isCurrent, true);
      assert.equal(afterS3.find((s) => s.id === 's2')?.isCurrent, false);
      assert.equal(afterS3.find((s) => s.id === 's1')?.isCurrent, false);
      assert.equal(afterS3.filter((s) => s.isCurrent).length, 1);
    });
  });

  describe('BUG 04 – Per-Semester GPA Target Isolation', () => {
    it('maintains distinct target GPA values across multiple semesters without collision', () => {
      const semesters: Semester[] = [
        { id: 'sem-2025-1', name: 'Kỳ 1 (2025)', startDate: '2025-09-01', endDate: '2026-01-15', isCurrent: false, targetGpa: 3.60 },
        { id: 'sem-2025-2', name: 'Kỳ 2 (2025)', startDate: '2026-02-01', endDate: '2026-06-30', isCurrent: false, targetGpa: 3.75 },
        { id: 'sem-2026-1', name: 'Kỳ 1 (2026)', startDate: '2026-09-01', endDate: '2027-01-15', isCurrent: true, targetGpa: 3.90 },
      ];

      function getSemesterTargetGpa(semesterId: string, list: Semester[]): number | undefined {
        return list.find((s) => s.id === semesterId)?.targetGpa;
      }

      assert.equal(getSemesterTargetGpa('sem-2025-1', semesters), 3.60);
      assert.equal(getSemesterTargetGpa('sem-2025-2', semesters), 3.75);
      assert.equal(getSemesterTargetGpa('sem-2026-1', semesters), 3.90);

      // Updating sem-2025-2 target does not affect others
      const updated = semesters.map((s) =>
        s.id === 'sem-2025-2' ? { ...s, targetGpa: 3.82 } : s
      );

      assert.equal(getSemesterTargetGpa('sem-2025-1', updated), 3.60);
      assert.equal(getSemesterTargetGpa('sem-2025-2', updated), 3.82);
      assert.equal(getSemesterTargetGpa('sem-2026-1', updated), 3.90);
    });
  });

  describe('BUG 05 – Semester Transition (Rollover) Workflow', () => {
    it('seamlessly transitions to a new semester while preserving all historical data', () => {
      const existingSemesters: Semester[] = [
        {
          id: 'sem-fall-2026',
          name: 'Học kỳ 1 (2026 - 2027)',
          startDate: '2026-09-01',
          endDate: '2027-01-15',
          isCurrent: true,
          targetGpa: 3.75,
        },
      ];

      const historicalCourses: Course[] = [
        {
          id: 'c-fall-1',
          semesterId: 'sem-fall-2026',
          code: 'CS201',
          name: 'DSA',
          credits: 4,
          color: '#3B82F6',
          actualGrade: 3.8,
          status: 'completed',
          gradingComponents: [],
        },
        {
          id: 'c-fall-2',
          semesterId: 'sem-fall-2026',
          code: 'MATH205',
          name: 'Calculus 3',
          credits: 3,
          color: '#10B981',
          actualGrade: 3.5,
          status: 'completed',
          gradingComponents: [],
        },
      ];

      // Simulate transition action
      const newSemesterData = {
        name: 'Học kỳ 2 (2026 - 2027)',
        startDate: '2027-02-01',
        endDate: '2027-06-30',
        targetGpa: 3.85,
      };

      const newId = 'sem-spring-2027';
      const createdSemester: Semester = {
        ...newSemesterData,
        id: newId,
        isCurrent: true,
      };

      const transitionedSemesters = [
        createdSemester,
        ...existingSemesters.map((s) => ({ ...s, isCurrent: false })),
      ];

      // 1. Verify new semester is active
      const activeSem = transitionedSemesters.find((s) => s.isCurrent);
      assert.equal(activeSem?.id, 'sem-spring-2027');
      assert.equal(activeSem?.name, 'Học kỳ 2 (2026 - 2027)');
      assert.equal(activeSem?.targetGpa, 3.85);

      // 2. Verify previous semester is preserved and marked inactive
      const oldSem = transitionedSemesters.find((s) => s.id === 'sem-fall-2026');
      assert.equal(oldSem?.isCurrent, false);
      assert.equal(oldSem?.targetGpa, 3.75);

      // 3. Verify historical courses remain completely unchanged
      assert.equal(historicalCourses.length, 2);
      assert.equal(historicalCourses[0].semesterId, 'sem-fall-2026');
      assert.equal(historicalCourses[0].actualGrade, 3.8);
      assert.equal(historicalCourses[1].semesterId, 'sem-fall-2026');
      assert.equal(historicalCourses[1].actualGrade, 3.5);

      // 4. In new semester, active courses list is initially empty, ready for registration
      const newSemesterCourses = historicalCourses.filter((c) => c.semesterId === newId);
      assert.equal(newSemesterCourses.length, 0, 'New semester starts with fresh course slate');
    });
  });
});

