import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BarChart2,
  Calculator,
  Sliders,
  HelpCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, Badge } from '@/components/ui';
import { useGpaAnalytics } from './hooks/useGpaAnalytics';
import { useGpaStore } from '@/stores';
import {
  GpaOverviewTab,
  AcademicAnalyticsTab,
  CalculationExplainerModal,
  GradeRecordModal,
  GradingScaleModal,
} from './components';
import { GradeRecord, Course } from '@/types';

export const GpaPage: React.FC = () => {
  const {
    courses,
    semesters,
    activeScale,
    filteredRecords,
    allGradeRecords,
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
  } = useGpaAnalytics();

  // Zustand Store actions
  const activeTab = useGpaStore((s) => s.activeTab);
  const setActiveTab = useGpaStore((s) => s.setActiveTab);
  const selectedSemesterId = useGpaStore((s) => s.selectedSemesterId);
  const setSelectedSemesterId = useGpaStore((s) => s.setSelectedSemesterId);
  const scales = useGpaStore((s) => s.scales);
  const activeScaleId = useGpaStore((s) => s.activeScaleId);
  const setActiveScaleId = useGpaStore((s) => s.setActiveScaleId);
  const saveScale = useGpaStore((s) => s.saveScale);
  const resetScalesToDefault = useGpaStore((s) => s.resetScalesToDefault);
  const simulatedGrades = useGpaStore((s) => s.simulatedGrades);
  const setSimulatedGrade = useGpaStore((s) => s.setSimulatedGrade);
  const resetSimulatedGrades = useGpaStore((s) => s.resetSimulatedGrades);

  // Modal control states
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState<boolean>(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<GradeRecord | null>(null);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (record: GradeRecord) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  // Persists a new or updated grade record to the repository via DAL
  const handleSaveGradeRecord = async (payload: {
    courseId?: string;
    courseCode: string;
    courseName: string;
    semesterId: string;
    credits: number;
    gradePoint?: number;
    letterGrade?: string;
    percentageScore?: number;
    status: 'enrolled' | 'completed' | 'dropped';
    notes?: string;
  }) => {
    if (editingRecord) {
      // Update existing course
      await updateCourse(editingRecord.courseId, {
        code: payload.courseCode,
        name: payload.courseName,
        semesterId: payload.semesterId,
        credits: payload.credits,
        actualGrade: payload.gradePoint,
        letterGrade: payload.letterGrade,
        percentageScore: payload.percentageScore,
        status: payload.status,
        notes: payload.notes,
      });
    } else if (payload.courseId) {
      // Assign grade to an existing enrolled course
      await updateCourse(payload.courseId, {
        actualGrade: payload.gradePoint,
        letterGrade: payload.letterGrade,
        percentageScore: payload.percentageScore,
        status: payload.status,
        notes: payload.notes,
      });
    } else {
      // Create new graded course record
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        code: payload.courseCode,
        name: payload.courseName,
        semesterId: payload.semesterId,
        credits: payload.credits,
        color: '#3B82F6',
        actualGrade: payload.gradePoint,
        letterGrade: payload.letterGrade,
        percentageScore: payload.percentageScore,
        status: payload.status,
        notes: payload.notes,
        gradingComponents: [],
      };
      await addCourse(newCourse);
    }
  };

  // Handles deleting or ungrading a course record
  const handleDeleteGradeRecord = async (record: GradeRecord) => {
    // If it's a standalone created record, delete the course; otherwise clear its grade
    const targetCourse = courses.find((c) => c.id === record.courseId);
    if (targetCourse && targetCourse.gradingComponents.length > 0) {
      // Keep course but reset grade
      await updateCourse(record.courseId, {
        actualGrade: undefined,
        letterGrade: undefined,
        percentageScore: undefined,
        status: 'enrolled',
      });
    } else {
      await deleteCourse(record.courseId);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPA Calculator & Analytics"
        subtitle="Credit-weighted GPA projections, academic honors standing, and multi-term performance intelligence"
        badge={
          <Badge variant="brand" dot>
            {cumulativeSummary.academicStanding.title} · {activeScale.name}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-white shadow-xs text-slate-900 font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Calculator className="h-3.5 w-3.5 text-brand-600" />
                <span>GPA Calculator</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white shadow-xs text-slate-900 font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>Analytics & Trends</span>
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sliders className="h-3.5 w-3.5" />}
              onClick={() => setIsScaleModalOpen(true)}
            >
              Scales
            </Button>

            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleOpenAddModal}
            >
              Add Grade
            </Button>
          </div>
        }
      />

      {/* Main Tab Content */}
      {activeTab === 'calculator' ? (
        <GpaOverviewTab
          courses={courses}
          semesters={semesters}
          activeScale={activeScale}
          filteredRecords={filteredRecords}
          allGradeRecords={allGradeRecords}
          selectedSemesterId={selectedSemesterId}
          onSelectSemester={setSelectedSemesterId}
          activeSemesterSummary={activeSemesterSummary}
          cumulativeSummary={cumulativeSummary}
          simulationResult={simulationResult}
          simulatedGrades={simulatedGrades}
          onSimulatedGradeChange={setSimulatedGrade}
          onResetSimulation={resetSimulatedGrades}
          onOpenAddModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
          onOpenExplainerModal={() => setIsExplainerOpen(true)}
          onOpenScaleModal={() => setIsScaleModalOpen(true)}
          onDeleteRecord={handleDeleteGradeRecord}
        />
      ) : (
        <AcademicAnalyticsTab
          creditAnalytics={creditAnalytics}
          courseCompletionStats={courseCompletionStats}
          studyAnalytics={studyAnalytics}
          assignmentAnalytics={assignmentAnalytics}
          academicSummaries={academicSummaries}
          gpaHistory={gpaProgressionHistory}
          scale={activeScale}
        />
      )}

      {/* Modals */}
      <CalculationExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        scale={activeScale}
      />

      <GradeRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        record={editingRecord}
        courses={courses}
        semesters={semesters}
        scale={activeScale}
        onSave={handleSaveGradeRecord}
      />

      <GradingScaleModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        activeScaleId={activeScaleId}
        scales={scales}
        onSelectScale={setActiveScaleId}
        onSaveScale={saveScale}
        onResetScales={resetScalesToDefault}
      />
    </div>
  );
};
