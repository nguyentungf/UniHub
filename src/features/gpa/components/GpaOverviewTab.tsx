import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Percent,
  Plus,
  HelpCircle,
  Sliders,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { StatCard, ConfirmDialog, EmptyState } from '@/components/common';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
import { GradeRecord, Semester, Course, GradingScale } from '@/types';
import { WhatIfSimulatorCard } from './WhatIfSimulatorCard';

interface GpaOverviewTabProps {
  courses: Course[];
  semesters: Semester[];
  activeScale: GradingScale;
  filteredRecords: GradeRecord[];
  allGradeRecords: GradeRecord[];
  selectedSemesterId: string | 'all';
  onSelectSemester: (id: string | 'all') => void;
  activeSemesterSummary: any;
  cumulativeSummary: any;
  simulationResult: any;
  simulatedGrades: Record<string, number>;
  onSimulatedGradeChange: (courseId: string, val: number) => void;
  onResetSimulation: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (record: GradeRecord) => void;
  onOpenExplainerModal: () => void;
  onOpenScaleModal: () => void;
  onDeleteRecord: (record: GradeRecord) => Promise<void>;
}

export const GpaOverviewTab: React.FC<GpaOverviewTabProps> = ({
  courses,
  semesters,
  activeScale,
  filteredRecords,
  allGradeRecords,
  selectedSemesterId,
  onSelectSemester,
  activeSemesterSummary,
  cumulativeSummary,
  simulationResult,
  simulatedGrades,
  onSimulatedGradeChange,
  onResetSimulation,
  onOpenAddModal,
  onOpenEditModal,
  onOpenExplainerModal,
  onOpenScaleModal,
  onDeleteRecord,
}) => {
  const [deleteCandidate, setDeleteCandidate] = useState<GradeRecord | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(true);

  const confirmDelete = async () => {
    if (deleteCandidate) {
      await onDeleteRecord(deleteCandidate);
      setDeleteCandidate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Hero Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cumulative GPA */}
        <StatCard
          title="Cumulative GPA"
          value={cumulativeSummary.cumulativeGpa.toFixed(2)}
          subtitle={cumulativeSummary.academicStanding.title}
          icon={Award}
          iconColor="emerald"
          trend={{
            value: `${cumulativeSummary.academicStanding.honors} · / ${activeScale.maxGpa.toFixed(2)}`,
            positive: cumulativeSummary.cumulativeGpa >= activeScale.maxGpa * 0.85,
          }}
        />

        {/* 2. Active Term GPA */}
        <StatCard
          title="Active Semester GPA"
          value={activeSemesterSummary.gpa.toFixed(2)}
          subtitle={`${activeSemesterSummary.semesterName} Term`}
          icon={Sparkles}
          iconColor="indigo"
          progress={{
            current: activeSemesterSummary.gpa,
            total: activeScale.maxGpa,
            unit: 'GPA',
          }}
          trend={{
            value: `${activeSemesterSummary.gradedCoursesCount} Graded · ${activeSemesterSummary.ungradedCoursesCount} In Progress`,
            positive: activeSemesterSummary.gpa >= activeScale.maxGpa * 0.8,
          }}
        />

        {/* 3. Earned Credits towards degree */}
        <StatCard
          title="Earned Credits"
          value={String(cumulativeSummary.totalCreditsEarned)}
          subtitle={`of ${cumulativeSummary.totalCreditsAttempted} Attempted Units`}
          icon={BookOpen}
          iconColor="sky"
          progress={{
            current: cumulativeSummary.totalCreditsEarned,
            total: 120, // Degree requirement
            unit: 'Units',
          }}
          trend={{
            value: `${cumulativeSummary.totalCreditsInProgress} Units currently in-progress`,
            positive: true,
          }}
        />

        {/* 4. Weighted Percentage Score */}
        <StatCard
          title="Weighted Avg Score (%)"
          value={
            cumulativeSummary.overallWeightedPercentage !== null
              ? `${cumulativeSummary.overallWeightedPercentage.toFixed(1)}%`
              : 'N/A'
          }
          subtitle="Credit-Weighted Mean (0 - 100%)"
          icon={Percent}
          iconColor="amber"
          trend={{
            value: 'Distinct from GPA quality points',
            positive: true,
          }}
        />
      </div>

      {/* Action Header & Scale Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Grading System:</span>
          <button
            onClick={onOpenScaleModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300 transition-colors"
          >
            <span>{activeScale.name} (Max {activeScale.maxGpa.toFixed(1)})</span>
            <Sliders className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<HelpCircle className="h-3.5 w-3.5" />}
            onClick={onOpenExplainerModal}
          >
            How GPA is Calculated
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={onOpenAddModal}
          >
            Add Course Grade
          </Button>
        </div>
      </div>

      {/* Course Grades Section with Semester Filter Tabs */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-600" />
              <span>Academic Course Grade Records</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified course quality points, letter marks, and credit evaluations
            </p>
          </div>

          {/* Semester Filter Tabs */}
          <div className="flex flex-wrap items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
            <button
              onClick={() => onSelectSemester('all')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedSemesterId === 'all'
                  ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All Semesters ({allGradeRecords.length})
            </button>
            {semesters.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSemester(s.id)}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  selectedSemesterId === s.id
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Course Grades Found"
              description="No grade records recorded for the selected semester filter."
              actionLabel="Add Course Grade"
              onAction={onOpenAddModal}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-semibold">Course</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Semester</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Credits</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Percentage</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Letter</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Grade Point</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Quality Points (QP)</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredRecords.map((record) => {
                    const isGraded =
                      record.gradePoint !== undefined && !isNaN(record.gradePoint);
                    const qp = isGraded ? record.gradePoint! * record.credits : 0;

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Course code & name */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded text-white shadow-2xs"
                              style={{ backgroundColor: record.color || '#3B82F6' }}
                            >
                              {record.courseCode}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {record.courseName}
                            </span>
                          </div>
                        </td>

                        {/* Semester */}
                        <td className="py-2.5 px-3 text-slate-500">
                          {record.semesterName || 'Unknown Term'}
                        </td>

                        {/* Credits */}
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">
                          {record.credits.toFixed(1)}
                        </td>

                        {/* Percentage */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {record.percentageScore !== undefined ? (
                            <span className="text-slate-800 dark:text-slate-200">
                              {record.percentageScore.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Letter */}
                        <td className="py-2.5 px-3 text-center">
                          {record.letterGrade ? (
                            <Badge variant="brand" size="sm">
                              {record.letterGrade}
                            </Badge>
                          ) : isGraded ? (
                            <Badge variant="outline" size="sm">
                              Grade {record.gradePoint?.toFixed(1)}
                            </Badge>
                          ) : (
                            <Badge variant="amber" size="sm" dot>
                              Ungraded
                            </Badge>
                          )}
                        </td>

                        {/* Grade Point */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {isGraded ? (
                            record.gradePoint!.toFixed(2)
                          ) : (
                            <span className="text-amber-500 font-normal">Pending</span>
                          )}
                        </td>

                        {/* Quality Points */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                          {isGraded ? (
                            `${qp.toFixed(2)} QP`
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              record.status === 'completed'
                                ? 'emerald'
                                : record.status === 'enrolled'
                                ? 'sky'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {record.status === 'completed'
                              ? 'Completed'
                              : record.status === 'enrolled'
                              ? 'In Progress'
                              : 'Dropped'}
                          </Badge>
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditModal(record)}
                              title="Edit Grade Record"
                              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(record)}
                              title="Delete Grade Record"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive What-If Simulator Card */}
      <WhatIfSimulatorCard
        courses={courses}
        scale={activeScale}
        simulatedGrades={simulatedGrades}
        onGradeChange={onSimulatedGradeChange}
        onReset={onResetSimulation}
        projectedSemesterGpa={simulationResult.projectedSemesterGpa}
        projectedCumulativeGpa={simulationResult.projectedCumulativeGpa}
        currentSemesterGpa={activeSemesterSummary.gpa}
        currentCumulativeGpa={cumulativeSummary.cumulativeGpa}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
        title="Remove Grade Record"
        description={`Are you sure you want to delete the grade record for ${deleteCandidate?.courseCode} - ${deleteCandidate?.courseName}? This will adjust your semester and cumulative GPA calculation.`}
        confirmText="Remove Record"
        variant="danger"
      />
    </div>
  );
};
