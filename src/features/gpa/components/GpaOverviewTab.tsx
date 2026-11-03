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
  Target,
} from 'lucide-react';
import { StatCard, ConfirmDialog, EmptyState } from '@/components/common';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Modal,
  Input,
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
  onUpdateTargetGpa?: (semesterId: string, targetGpa: number) => Promise<void>;
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
  onUpdateTargetGpa,
}) => {
  const [deleteCandidate, setDeleteCandidate] = useState<GradeRecord | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(true);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false);
  const [targetGpaInput, setTargetGpaInput] = useState<string>('');
  const [targetModalError, setTargetModalError] = useState<string | null>(null);

  const activeSemesterObj = semesters.find(
    (s) => s.id === (selectedSemesterId === 'all' ? activeSemesterSummary.semesterId : selectedSemesterId)
  );

  const handleOpenTargetModal = () => {
    setTargetGpaInput(
      activeSemesterObj?.targetGpa ? String(activeSemesterObj.targetGpa) : '3.8'
    );
    setTargetModalError(null);
    setIsTargetModalOpen(true);
  };

  const handleSaveTargetGpa = async () => {
    const parsed = parseFloat(targetGpaInput);
    if (isNaN(parsed) || parsed < 0 || parsed > activeScale.maxGpa) {
      setTargetModalError(`Mục tiêu GPA phải từ 0.0 đến ${activeScale.maxGpa.toFixed(1)}`);
      return;
    }
    const targetSemId = activeSemesterObj?.id || activeSemesterSummary.semesterId;
    if (onUpdateTargetGpa && targetSemId) {
      await onUpdateTargetGpa(targetSemId, parsed);
    }
    setIsTargetModalOpen(false);
  };

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
          title="GPA Tích lũy"
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
          title="GPA Học kỳ"
          value={activeSemesterSummary.gpa.toFixed(2)}
          subtitle={`Học kỳ: ${activeSemesterSummary.semesterName}`}
          icon={Sparkles}
          iconColor="indigo"
          progress={{
            current: activeSemesterSummary.gpa,
            total: activeSemesterSummary.targetGpa || activeScale.maxGpa,
            unit: 'GPA',
          }}
          trend={{
            value: activeSemesterSummary.targetGpa
              ? `Mục tiêu: ${activeSemesterSummary.targetGpa.toFixed(2)} (${activeSemesterSummary.gpa >= activeSemesterSummary.targetGpa ? 'Đạt' : 'Chưa đạt'})`
              : `${activeSemesterSummary.gradedCoursesCount} môn có điểm · ${activeSemesterSummary.ungradedCoursesCount} đang học`,
            positive: activeSemesterSummary.targetGpa
              ? activeSemesterSummary.gpa >= activeSemesterSummary.targetGpa
              : activeSemesterSummary.gpa >= activeScale.maxGpa * 0.8,
          }}
        />

        {/* 3. Earned Credits towards degree */}
        <StatCard
          title="Tín chỉ tích lũy"
          value={String(cumulativeSummary.totalCreditsEarned)}
          subtitle={`trên ${cumulativeSummary.totalCreditsAttempted} tín chỉ đăng ký`}
          icon={BookOpen}
          iconColor="sky"
          progress={{
            current: cumulativeSummary.totalCreditsEarned,
            total: 120, // Degree requirement
            unit: 'Tín chỉ',
          }}
          trend={{
            value: `${cumulativeSummary.totalCreditsInProgress} tín chỉ đang học`,
            positive: true,
          }}
        />

        {/* 4. Weighted Percentage Score */}
        <StatCard
          title="Điểm trung bình hệ 100"
          value={
            cumulativeSummary.overallWeightedPercentage !== null
              ? `${cumulativeSummary.overallWeightedPercentage.toFixed(1)}%`
              : 'N/A'
          }
          subtitle="Điểm trung bình theo tín chỉ (0 - 100%)"
          icon={Percent}
          iconColor="amber"
          trend={{
            value: 'Khác với điểm hệ số GPA chất lượng',
            positive: true,
          }}
        />
      </div>

      {/* Action Header & Scale Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Thang điểm áp dụng:</span>
          <button
            onClick={onOpenScaleModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300 transition-colors"
          >
            <span>{activeScale.name} (Tối đa {activeScale.maxGpa.toFixed(1)})</span>
            <Sliders className="h-3 w-3" />
          </button>

          {activeSemesterObj && (
            <button
              onClick={handleOpenTargetModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 transition-colors"
              title="Thiết lập mục tiêu GPA cho học kỳ này"
            >
              <Target className="h-3.5 w-3.5" />
              <span>
                Mục tiêu kỳ này: {activeSemesterObj.targetGpa ? activeSemesterObj.targetGpa.toFixed(2) : 'Chưa đặt'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<HelpCircle className="h-3.5 w-3.5" />}
            onClick={onOpenExplainerModal}
          >
            Cách tính điểm GPA
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={onOpenAddModal}
          >
            Thêm điểm môn học
          </Button>
        </div>
      </div>

      {/* Course Grades Section with Semester Filter Tabs */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-600" />
              <span>Bảng điểm các môn học</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Điểm số, điểm chữ và số tín chỉ được tính toán chính xác
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
              Tất cả học kỳ ({allGradeRecords.length})
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
              title="Chưa có điểm môn học nào"
              description="Không có bản ghi điểm nào cho bộ lọc học kỳ đã chọn."
              actionLabel="Thêm điểm môn học"
              onAction={onOpenAddModal}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-semibold">Môn học</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Học kỳ</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Tín chỉ</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Điểm %</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Điểm chữ</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Điểm hệ số</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Điểm chất lượng (QP)</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Thao tác</th>
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
                          {record.semesterName || 'Học kỳ khác'}
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
                              Điểm {record.gradePoint?.toFixed(1)}
                            </Badge>
                          ) : (
                            <Badge variant="amber" size="sm" dot>
                              Chưa có điểm
                            </Badge>
                          )}
                        </td>

                        {/* Grade Point */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {isGraded ? (
                            record.gradePoint!.toFixed(2)
                          ) : (
                            <span className="text-amber-500 font-normal">Đang chờ</span>
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
                              ? 'Hoàn thành'
                              : record.status === 'enrolled'
                              ? 'Đang học'
                              : 'Đã hủy'}
                          </Badge>
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditModal(record)}
                              title="Sửa bản ghi điểm"
                              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(record)}
                              title="Xóa bản ghi điểm"
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
        title="Xóa bản ghi điểm"
        description={`Bạn có chắc chắn muốn xóa bản ghi điểm cho môn ${deleteCandidate?.courseCode} - ${deleteCandidate?.courseName}? Hành động này sẽ điều chỉnh lại GPA học kỳ và tích lũy.`}
        confirmText="Xóa bản ghi"
        variant="danger"
      />

      {/* Target GPA Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title={`Thiết lập mục tiêu GPA - ${activeSemesterObj?.name || 'Học kỳ'}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mục tiêu GPA được lưu trữ riêng biệt cho từng học kỳ để bạn chủ động theo dõi và đối sánh kỳ vọng.
          </p>

          <Input
            label={`Mục tiêu GPA (Thang tối đa ${activeScale.maxGpa.toFixed(1)})`}
            type="number"
            step="0.01"
            min="0"
            max={activeScale.maxGpa}
            value={targetGpaInput}
            onChange={(e) => setTargetGpaInput(e.target.value)}
            error={targetModalError || undefined}
            placeholder="Ví dụ: 3.80"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsTargetModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTargetGpa}>
              Lưu mục tiêu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
