import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Award,
  Layers,
  Download,
  Search,
  ArrowUpDown,
  Filter,
  Trash2,
  Edit2,
} from 'lucide-react';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/common';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import { useExamStore, useCourseStore } from '@/stores';
import { Exam, ExamType, ExamStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  calculateExamOverviewStats,
  filterAndSortExams,
  generateExamsIcs,
  getExamCountdown,
  isExamCompleted,
  ExamSortOption,
} from './utils/examLogic';
import { downloadFile } from '@/features/assignments/utils/assignmentLogic';
import { ExamFormModal } from './components/ExamFormModal';
import { ExamOverviewHeader } from './components/ExamOverviewHeader';
import { ExamCard } from './components/ExamCard';
import { ExamCalendarView } from './components/ExamCalendarView';

export const ExamsPage: React.FC = () => {
  // Store subscriptions
  const exams = useExamStore((state) => state.exams);
  const isLoading = useExamStore((state) => state.isLoading);
  const error = useExamStore((state) => state.error);
  const completedTopics = useExamStore((state) => state.completedTopics);
  const filterCourseId = useExamStore((state) => state.filterCourseId);
  const filterType = useExamStore((state) => state.filterType);
  const filterStatus = useExamStore((state) => state.filterStatus);
  const searchQuery = useExamStore((state) => state.searchQuery);
  const sortBy = useExamStore((state) => state.sortBy);
  const viewMode = useExamStore((state) => state.viewMode);

  // Store actions
  const loadExams = useExamStore((state) => state.loadExams);
  const addExam = useExamStore((state) => state.addExam);
  const updateExam = useExamStore((state) => state.updateExam);
  const deleteExam = useExamStore((state) => state.deleteExam);
  const toggleExamTopic = useExamStore((state) => state.toggleExamTopic);
  const setFilterCourseId = useExamStore((state) => state.setFilterCourseId);
  const setFilterType = useExamStore((state) => state.setFilterType);
  const setFilterStatus = useExamStore((state) => state.setFilterStatus);
  const setSearchQuery = useExamStore((state) => state.setSearchQuery);
  const setSortBy = useExamStore((state) => state.setSortBy);
  const setViewMode = useExamStore((state) => state.setViewMode);
  const clearError = useExamStore((state) => state.clearError);

  // Courses
  const courses = useCourseStore((state) => state.courses);
  const loadCourses = useCourseStore((state) => state.loadCourses);

  // Local dialog states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadExams();
    loadCourses();
  }, [loadExams, loadCourses]);

  // Derived statistics
  const overviewStats = useMemo(() => {
    return calculateExamOverviewStats(exams, completedTopics, courses);
  }, [exams, completedTopics, courses]);

  // Filtered & sorted list
  const filteredExams = useMemo(() => {
    return filterAndSortExams(
      exams,
      {
        courseId: filterCourseId,
        type: filterType,
        status: filterStatus,
        search: searchQuery,
      },
      sortBy,
      courses
    );
  }, [exams, filterCourseId, filterType, filterStatus, searchQuery, sortBy, courses]);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const handleOpenAdd = () => {
    setEditingExam(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteExam(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleExportAllIcs = () => {
    const content = generateExamsIcs(exams, courses);
    downloadFile('unihub-all-exams.ics', content);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Lịch thi & Tiến trình ôn tập"
        subtitle="Đếm ngược ngày thi, số báo danh phòng thi và danh mục ôn tập theo đề cương"
        badge={
          <Badge variant="amber" dot>
            {overviewStats.upcomingCount} kỳ thi sắp diễn ra
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewMode('timeline')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Dòng thời gian
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Danh sách
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Lịch
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportAllIcs}
              title="Tải tệp iCalendar cho Google Calendar"
            >
              Xuất .ICS
            </Button>

            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAdd}
            >
              Lên lịch thi
            </Button>
          </div>
        }
      />

      {/* Error notification */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs font-semibold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <ExamOverviewHeader stats={overviewStats} />

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo kỳ thi, phòng thi hoặc chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Filter Course */}
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả môn học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>

          {/* Filter Exam Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ExamType | 'all')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả loại kỳ thi</option>
            <option value="midterm">Thi giữa kỳ</option>
            <option value="final">Thi cuối kỳ</option>
            <option value="quiz">Kiểm tra ngắn / Quiz</option>
            <option value="practical">Thi thực hành / Lab</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'upcoming' | 'completed')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="completed">Đã thi xong</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ExamSortOption)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="examDate_asc">Ngày thi (Gần nhất trước)</option>
              <option value="examDate_desc">Ngày thi (Xa nhất trước)</option>
              <option value="weight_desc">Trọng số điểm (Cao nhất trước)</option>
              <option value="title_asc">Tên kỳ thi (A - Z)</option>
              <option value="title_desc">Tên kỳ thi (Z - A)</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium self-end lg:self-center">
          Hiển thị {filteredExams.length} / {exams.length} kỳ thi
        </span>
      </div>

      {/* VIEW RENDERING */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Không tìm thấy kỳ thi nào"
          description="Hãy thử điều chỉnh bộ lọc hoặc lên lịch một kỳ thi mới."
          actionLabel="Lên lịch thi"
          onAction={handleOpenAdd}
        />
      ) : viewMode === 'timeline' ? (
        /* 1. TIMELINE CARDS VIEW */
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              course={courseMap.get(exam.courseId)}
              completedTopics={completedTopics}
              onToggleTopic={toggleExamTopic}
              onEdit={handleOpenEdit}
              onDelete={(id, title) => setDeleteTarget({ id, title })}
            />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* 2. TABLE VIEW */
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Môn học</th>
                <th className="p-3.5">Tên & Loại kỳ thi</th>
                <th className="p-3.5">Ngày thi & Thời lượng</th>
                <th className="p-3.5">Phòng thi & SBD</th>
                <th className="p-3.5">Đếm ngược</th>
                <th className="p-3.5">Trọng số</th>
                <th className="p-3.5">Điểm số</th>
                <th className="p-3.5 text-right pr-5">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredExams.map((exam) => {
                const course = courseMap.get(exam.courseId);
                const countdown = getExamCountdown(exam.examDate);
                const isComp = isExamCompleted(exam);

                const getExamTypeVi = (t: string) => {
                  switch (t) {
                    case 'midterm':
                      return 'GIỮA KỲ';
                    case 'final':
                      return 'CUỐI KỲ';
                    case 'quiz':
                      return 'QUIZ';
                    case 'practical':
                      return 'THỰC HÀNH';
                    default:
                      return t.toUpperCase();
                  }
                };

                return (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-mono font-bold">
                      <span
                        className="px-2 py-0.5 rounded text-white text-[11px]"
                        style={{ backgroundColor: course?.color || '#f59e0b' }}
                      >
                        {course?.code || 'GEN'}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white max-w-xs">
                      <div>{exam.title}</div>
                      <Badge variant="outline" size="sm" className="mt-1">
                        {getExamTypeVi(exam.examType)}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateTime(exam.examDate)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {exam.durationMinutes} Phút
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div>{exam.location}</div>
                      {exam.seatNumber && (
                        <span className="font-mono font-bold text-[10px] text-brand-600 dark:text-brand-400">
                          SBD: {exam.seatNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          isComp
                            ? 'slate'
                            : countdown.badgeVariant
                        }
                        size="sm"
                      >
                        {isComp ? 'ĐÃ XONG' : countdown.label}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono font-semibold">
                      {exam.weight !== undefined ? `${exam.weight}%` : '—'}
                    </td>
                    <td className="p-3.5 font-mono">
                      {exam.actualScore !== undefined ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {exam.actualScore}/{exam.maxScore}
                        </span>
                      ) : exam.targetScore !== undefined ? (
                        <span className="text-slate-400 text-[11px]">
                          Mục tiêu: {exam.targetScore}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenEdit(exam)}
                          title="Sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="hover:text-rose-600"
                          onClick={() => setDeleteTarget({ id: exam.id, title: exam.title })}
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        /* 3. CALENDAR VIEW */
        <ExamCalendarView
          exams={filteredExams}
          courses={courses}
          onSelectExam={handleOpenEdit}
        />
      )}

      {/* Add / Edit Exam Modal */}
      <ExamFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={async (item) => {
          if (editingExam) {
            await updateExam(item.id, item);
          } else {
            await addExam(item);
          }
        }}
        initialData={editingExam}
        courses={courses}
      />

      {/* Confirmation Dialog before Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa kỳ thi"
        description={`Bạn có chắc chắn muốn xóa kỳ thi "${deleteTarget?.title}"? Thao tác này sẽ xóa vĩnh viễn danh mục ôn tập và lịch thi khỏi hệ thống.`}
        confirmText="Xóa kỳ thi"
        variant="danger"
      />
    </div>
  );
};
