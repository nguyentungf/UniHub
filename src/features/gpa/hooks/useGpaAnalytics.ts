import { useMemo, useEffect } from 'react';
import {
  useCourseStore,
  useGpaStore,
  useStudyStore,
  useAssignmentStore,
  useExamStore,
} from '@/stores';
import {
  normalizeCourseToGradeRecord,
  calculateSemesterGpa,
  calculateCumulativeGpa,
  getGpaProgressionHistory,
  simulateProjectedGpa,
} from '../utils/gpaLogic';
import {
  calculateCreditAnalytics,
  calculateCourseCompletionStats,
  calculateStudyTimeAnalytics,
  calculateAssignmentAnalytics,
  calculateAcademicPeriodSummaries,
} from '../utils/analyticsLogic';
import { DEFAULT_GRADING_SCALES } from '../utils/gradingScales';
import { GradeRecord } from '@/types';

export function useGpaAnalytics() {
  // Store state
  const courses = useCourseStore((s) => s.courses);
  const semesters = useCourseStore((s) => s.semesters);
  const loadCourses = useCourseStore((s) => s.loadCourses);
  const addCourse = useCourseStore((s) => s.addCourse);
  const updateCourse = useCourseStore((s) => s.updateCourse);
  const deleteCourse = useCourseStore((s) => s.deleteCourse);

  const activeScaleId = useGpaStore((s) => s.activeScaleId);
  const scales = useGpaStore((s) => s.scales);
  const simulatedGrades = useGpaStore((s) => s.simulatedGrades);
  const selectedSemesterId = useGpaStore((s) => s.selectedSemesterId);
  const loadScales = useGpaStore((s) => s.loadScales);

  const studySessions = useStudyStore((s) => s.sessions);
  const loadSessions = useStudyStore((s) => s.loadSessions);

  const assignments = useAssignmentStore((s) => s.assignments);
  const loadAssignments = useAssignmentStore((s) => s.loadAssignments);

  const exams = useExamStore((s) => s.exams);
  const loadExams = useExamStore((s) => s.loadExams);

  useEffect(() => {
    loadCourses();
    loadScales();
    loadSessions();
    loadAssignments();
    loadExams();
  }, [loadCourses, loadScales, loadSessions, loadAssignments, loadExams]);

  // Active grading scale
  const activeScale = useMemo(() => {
    return scales.find((s) => s.id === activeScaleId) || DEFAULT_GRADING_SCALES[0];
  }, [scales, activeScaleId]);

  // Semester map for quick name lookup
  const semesterMap = useMemo(() => {
    const map = new Map<string, string>();
    semesters.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [semesters]);

  // Normalize courses to GradeRecord
  const allGradeRecords = useMemo<GradeRecord[]>(() => {
    return courses.map((c) =>
      normalizeCourseToGradeRecord(c, semesterMap.get(c.semesterId))
    );
  }, [courses, semesterMap]);

  // Current semester object
  const currentSemester = useMemo(() => {
    return semesters.find((s) => s.isCurrent) || semesters[semesters.length - 1];
  }, [semesters]);

  // Filtered records by semester tab
  const filteredRecords = useMemo(() => {
    if (selectedSemesterId === 'all') return allGradeRecords;
    return allGradeRecords.filter((r) => r.semesterId === selectedSemesterId);
  }, [allGradeRecords, selectedSemesterId]);

  // Active Semester GPA summary
  const activeSemesterSummary = useMemo(() => {
    const semId = selectedSemesterId === 'all' ? currentSemester?.id : selectedSemesterId;
    const semName = semesterMap.get(semId || '') || 'Current Term';
    const recs = allGradeRecords.filter((r) => r.semesterId === semId);
    return calculateSemesterGpa(recs, activeScale, semId, semName);
  }, [allGradeRecords, selectedSemesterId, currentSemester, semesterMap, activeScale]);

  // Cumulative GPA Summary across all semesters
  const cumulativeSummary = useMemo(() => {
    return calculateCumulativeGpa(allGradeRecords, semesters, activeScale);
  }, [allGradeRecords, semesters, activeScale]);

  // GPA History Curve points
  const gpaProgressionHistory = useMemo(() => {
    return getGpaProgressionHistory(semesters, allGradeRecords, activeScale);
  }, [semesters, allGradeRecords, activeScale]);

  // What-If Simulation Result
  const simulationResult = useMemo(() => {
    return simulateProjectedGpa(allGradeRecords, semesters, simulatedGrades, activeScale);
  }, [allGradeRecords, semesters, simulatedGrades, activeScale]);

  // Credit Analytics
  const creditAnalytics = useMemo(() => {
    return calculateCreditAnalytics(courses, 120);
  }, [courses]);

  // Course Completion Stats & Grade Distribution
  const courseCompletionStats = useMemo(() => {
    return calculateCourseCompletionStats(courses);
  }, [courses]);

  // Study Time Analytics
  const studyAnalytics = useMemo(() => {
    return calculateStudyTimeAnalytics(studySessions, courses);
  }, [studySessions, courses]);

  // Assignment Performance Analytics
  const assignmentAnalytics = useMemo(() => {
    return calculateAssignmentAnalytics(assignments);
  }, [assignments]);

  // Weekly & Monthly Academic Summaries
  const academicSummaries = useMemo(() => {
    return calculateAcademicPeriodSummaries(studySessions, assignments, exams, courses);
  }, [studySessions, assignments, exams, courses]);

  return {
    courses,
    semesters,
    currentSemester,
    activeScale,
    allGradeRecords,
    filteredRecords,
    activeSemesterSummary,
    cumulativeSummary,
    gpaProgressionHistory,
    simulationResult,
    creditAnalytics,
    courseCompletionStats,
    studyAnalytics,
    assignmentAnalytics,
    academicSummaries,
    addCourse,
    updateCourse,
    deleteCourse,
  };
}

