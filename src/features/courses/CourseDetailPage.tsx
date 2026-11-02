import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  User,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useCourseStore } from '@/stores/useCourseStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { calculateLessonProgress, calculateAttendanceStats } from './utils/courseProgress';
import { LessonTracker } from './components/LessonTracker';
import { AttendanceTracker } from './components/AttendanceTracker';
import { CourseFormModal } from './components/CourseFormModal';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tabs, Modal } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/common';
import { Course } from '@/types';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const courses = useCourseStore((state) => state.courses);
  const semesters = useCourseStore((state) => state.semesters);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const addLesson = useCourseStore((state) => state.addLesson);
  const toggleLessonCompleted = useCourseStore((state) => state.toggleLessonCompleted);
  const deleteLesson = useCourseStore((state) => state.deleteLesson);
  const logAttendance = useCourseStore((state) => state.logAttendance);
  const deleteAttendanceRecord = useCourseStore((state) => state.deleteAttendanceRecord);

  const timetableSlots = useTimetableStore((state) => state.slots);

  const [activeTab, setActiveTab] = useState<'lessons' | 'attendance' | 'grading' | 'schedule'>('lessons');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const semester = semesters.find((s) => s.id === course?.semesterId);
  const courseSlots = timetableSlots.filter((slot) => slot.courseId === courseId);

  if (!course) {
    return (
      <div className="space-y-6">
        <NavLink
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </NavLink>
        <EmptyState
          icon={Layers}
          title="Course Not Found"
          description="The requested course could not be located in your academic records."
          actionLabel="Return to Catalog"
          onAction={() => navigate('/courses')}
        />
      </div>
    );
  }

  const lessonProgress = calculateLessonProgress(course);
  const attendance = calculateAttendanceStats(course);

  const handleDeleteConfirm = async () => {
    try {
      await deleteCourse(course.id);
      navigate('/courses');
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const tabs = [
    {
      id: 'lessons',
      label: 'Lessons & Progress',
      count: lessonProgress.completed,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: 'attendance',
      label: 'Attendance Tracking',
      count: attendance.totalSessions,
      icon: <CalendarCheck className="h-4 w-4" />,
    },
    {
      id: 'grading',
      label: 'Syllabus & Grading',
      count: course.gradingComponents?.length || 0,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: 'schedule',
      label: 'Class Schedule',
      count: courseSlots.length,
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  const daysMap: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Course Catalog</span>
        </NavLink>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Course
          </Button>
          <Button
            size="xs"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Course Cockpit Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg transition-all"
        style={{
          background: `linear-gradient(135deg, ${course.color} 0%, #1e1b4b 120%)`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black px-3 py-1 rounded-lg bg-black/30 backdrop-blur-md uppercase tracking-wider">
                {course.code}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                {course.credits} Academic Credits
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md">
                {semester?.name || 'Fall 2026'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-100 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {course.status.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{course.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs opacity-90 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0" />
                <span>Instructor: {course.instructor || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Location: {course.location || 'Online'}</span>
              </div>
              {course.syllabusUrl && (
                <a
                  href={course.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline underline-offset-4 hover:opacity-100 font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Syllabus Document
                </a>
              )}
            </div>
          </div>

          {/* Target Grade Badge */}
          {course.targetGrade && (
            <div className="text-left md:text-right shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl min-w-[110px]">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                Target Grade
              </span>
              <span className="text-3xl font-black">{course.targetGrade}</span>
              <span className="text-[10px] block opacity-75 mt-0.5">Scale 4.0</span>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lesson Progress KPI */}
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-brand-500" /> Lesson Completion
              </span>
              <span className="font-mono text-slate-900 dark:text-white font-bold">
                {lessonProgress.percentage}%
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {lessonProgress.completed} / {lessonProgress.total}
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${lessonProgress.percentage}%`,
                  backgroundColor: course.color,
                }}
              />
            </div>
          </div>
        </Card>

        {/* Attendance Rate KPI */}
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-emerald-500" /> Attendance Rate
              </span>
              <Badge
                variant={attendance.isAtRisk ? 'rose' : attendance.attendanceRate >= 90 ? 'emerald' : 'amber'}
                size="sm"
              >
                {attendance.statusLabel}
              </Badge>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {attendance.attendanceRate}%
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {attendance.present} Present · {attendance.late} Late · {attendance.absent} Absent
          </p>
        </Card>

        {/* Weekly Sessions KPI */}
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-500" /> Weekly Class Slots
              </span>
              <NavLink to="/timetable" className="text-[11px] text-brand-600 hover:underline">
                View Timetable →
              </NavLink>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {courseSlots.length} Sessions / week
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {courseSlots.map((s) => `${daysMap[s.dayOfWeek]} ${s.startTime}`).join(', ') || 'No slots scheduled'}
          </p>
        </Card>
      </div>

      {/* Tabs navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="pill"
      />

      {/* Tab Panels */}
      {activeTab === 'lessons' && (
        <LessonTracker
          course={course}
          onToggleLesson={(lessonId) => toggleLessonCompleted(course.id, lessonId)}
          onAddLesson={(title, desc) => addLesson(course.id, title, desc)}
          onDeleteLesson={(lessonId) => deleteLesson(course.id, lessonId)}
          onUpdateCourse={(updates) => updateCourse(course.id, updates)}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceTracker
          course={course}
          onLogAttendance={(record) => logAttendance(course.id, record)}
          onDeleteAttendanceRecord={(recordId) => deleteAttendanceRecord(course.id, recordId)}
        />
      )}

      {activeTab === 'grading' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <span>Syllabus Assessment Weights Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                {course.gradingComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {comp.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Weight: {comp.weight}% of final grade
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {comp.earnedScore !== undefined && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Score: {comp.earnedScore} / 100
                        </span>
                      )}
                      <Badge variant="brand" size="sm">
                        {comp.weight}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {course.notes && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold block mb-1 text-slate-900 dark:text-white">
                    Instructor Notes & Office Hours:
                  </span>
                  {course.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Timetable Sessions for {course.code}
            </h4>
            <NavLink to="/timetable">
              <Button size="xs" variant="outline" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                Open Full Timetable
              </Button>
            </NavLink>
          </div>

          {courseSlots.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">
                No class slots currently scheduled for this course on the weekly calendar.
              </p>
              <NavLink to="/timetable">
                <Button size="xs">Schedule in Timetable</Button>
              </NavLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courseSlots.map((slot) => (
                <Card
                  key={slot.id}
                  className="p-4 border-l-4"
                  style={{ borderLeftColor: course.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {daysMap[slot.dayOfWeek]}
                    </span>
                    <Badge variant="outline" size="sm">
                      {slot.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {slot.room ? `${slot.room} · ` : ''}
                      {slot.location}
                    </span>
                  </div>
                  {slot.instructor && (
                    <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{slot.instructor}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Course Modal */}
      <CourseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={course}
        semesters={semesters}
        onSubmit={async (updated) => {
          await updateCourse(course.id, updated);
        }}
      />

      {/* Delete Course Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Course Deletion"
        description="Are you sure you want to delete this course from your academic records?"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <span className="font-bold block">Permanent Academic Data Removal</span>
              Deleting <strong className="font-mono">{course.code}</strong> will also remove all its associated timetable sessions, lesson progress history, and attendance records from offline storage.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Keep Course
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
