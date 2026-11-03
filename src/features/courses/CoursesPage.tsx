import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Layers,
  Search,
  Sparkles,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader, EmptyState, LoadingState, StatCard } from '@/components/common';
import { Badge, Button, Input, Modal } from '@/components/ui';
import { useCourseStore } from '@/stores/useCourseStore';
import { CourseCard } from './components/CourseCard';
import { CourseFormModal } from './components/CourseFormModal';
import { calculateLessonProgress, calculateAttendanceStats } from './utils/courseProgress';
import { Course } from '@/types';

export const CoursesPage: React.FC = () => {
  const courses = useCourseStore((state) => state.courses);
  const semesters = useCourseStore((state) => state.semesters);
  const selectedSemesterId = useCourseStore((state) => state.selectedSemesterId);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const setSelectedSemesterId = useCourseStore((state) => state.setSelectedSemesterId);
  const addCourse = useCourseStore((state) => state.addCourse);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const clearError = useCourseStore((state) => state.clearError);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'completed' | 'dropped'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Aggregate KPI metrics
  const totalCredits = courses
    .filter((c) => c.status === 'enrolled')
    .reduce((sum, c) => sum + c.credits, 0);

  const avgAttendance = courses.length > 0
    ? Math.round(
        courses.reduce((sum, c) => sum + calculateAttendanceStats(c).attendanceRate, 0) /
          courses.length
      )
    : 100;

  const avgLessonProgress = courses.length > 0
    ? Math.round(
        courses.reduce((sum, c) => sum + calculateLessonProgress(c).percentage, 0) /
          courses.length
      )
    : 0;

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesSemester =
      selectedSemesterId === 'all' || c.semesterId === selectedSemesterId;
    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.instructor && c.instructor.toLowerCase().includes(q));

    return matchesSemester && matchesStatus && matchesSearch;
  });

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (isLoading && courses.length === 0) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục môn học"
        subtitle="Quản lý các môn học đã đăng ký, đề cương, trọng số điểm và tiến độ bài học"
        badge={
          <Badge variant="brand" size="md">
            {courses.length} Môn học
          </Badge>
        }
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Thêm môn học
          </Button>
        }
      />

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-xs font-semibold underline hover:text-rose-900 dark:hover:text-white"
          >
            Bỏ qua
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Môn đang học"
          value={courses.filter((c) => c.status === 'enrolled').length}
          subtitle="Học phần kích hoạt"
          icon={BookOpen}
          iconColor="indigo"
        />
        <StatCard
          title="Tổng tín chỉ"
          value={totalCredits}
          subtitle="Tín chỉ đăng ký"
          icon={GraduationCap}
          iconColor="emerald"
        />
        <StatCard
          title="Tỷ lệ chuyên cần"
          value={`${avgAttendance}%`}
          subtitle={avgAttendance >= 80 ? 'Đạt chuẩn điểm danh' : 'Nguy cơ cấm thi (<80%)'}
          icon={CalendarCheck}
          iconColor={avgAttendance >= 80 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Tiến độ bài học"
          value={`${avgLessonProgress}%`}
          subtitle="Tiến độ đề cương"
          icon={Sparkles}
          iconColor="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Semester selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSemesterId('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none ${
              selectedSemesterId === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Tất cả học kỳ
          </button>
          {semesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => setSelectedSemesterId(sem.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none whitespace-nowrap ${
                selectedSemesterId === sem.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {sem.name} {sem.isCurrent && '●'}
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'enrolled', label: 'Đang học' },
              { id: 'completed', label: 'Hoàn thành' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(id as any)}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  statusFilter === id
                    ? 'bg-white shadow-xs text-slate-900 font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-60">
            <Input
              placeholder="Tìm mã môn hoặc giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Không tìm thấy môn học nào"
          description={
            courses.length === 0
              ? 'Chưa có môn học nào được đăng ký. Thêm môn học đầu tiên để bắt đầu theo dõi thời khóa biểu và điểm danh.'
              : 'Không có môn học nào khớp với bộ lọc hiện tại. Thử bỏ bộ lọc hoặc tìm kiếm bằng từ khóa khác.'
          }
          actionLabel={courses.length === 0 ? 'Thêm môn đầu tiên' : 'Xóa bộ lọc'}
          onAction={() => {
            if (courses.length === 0) {
              setIsAddModalOpen(true);
            } else {
              setSelectedSemesterId('all');
              setStatusFilter('all');
              setSearchQuery('');
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredCourses.map((course) => {
            const sem = semesters.find((s) => s.id === course.semesterId);
            return (
              <CourseCard
                key={course.id}
                course={course}
                semester={sem}
                onEdit={(c) => setCourseToEdit(c)}
                onDelete={(c) => setCourseToDelete(c)}
              />
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <CourseFormModal
        isOpen={isAddModalOpen || !!courseToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setCourseToEdit(null);
        }}
        initialData={courseToEdit}
        semesters={semesters}
        activeSemesterId={selectedSemesterId !== 'all' ? selectedSemesterId : undefined}
        onSubmit={async (courseData) => {
          if (courseToEdit) {
            await updateCourse(courseToEdit.id, courseData);
          } else {
            await addCourse(courseData);
          }
        }}
      />

      {/* Delete Course Confirmation Modal */}
      <Modal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Xác nhận xóa môn học"
        description="Bạn có chắc chắn muốn xóa vĩnh viễn môn học này khỏi hệ thống?"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <span className="font-bold block">Hành động không thể hoàn tác</span>
              Xóa môn học <strong className="font-mono">{courseToDelete?.code}</strong> sẽ đồng thời xóa toàn bộ bài học, lịch sử điểm danh và các tiết học trong thời khóa biểu.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCourseToDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
