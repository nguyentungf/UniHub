import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  User,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Course, Semester } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button } from '@/components/ui';
import { calculateLessonProgress, calculateAttendanceStats } from '../utils/courseProgress';

interface CourseCardProps {
  course: Course;
  semester?: Semester;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  semester,
  onEdit,
  onDelete,
}) => {
  const lessonProgress = calculateLessonProgress(course);
  const attendance = calculateAttendanceStats(course);

  return (
    <Card
      hoverEffect
      className="flex flex-col justify-between overflow-hidden relative border-t-4 transition-all duration-200"
      style={{ borderTopColor: course.color }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg text-white shadow-xs"
                style={{ backgroundColor: course.color }}
              >
                {course.code}
              </span>
              <Badge variant="outline" size="sm">
                {course.credits} Credits
              </Badge>
              {semester && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {semester.name}
                </span>
              )}
            </div>
            <CardTitle className="text-base mt-2 line-clamp-1">{course.name}</CardTitle>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {course.targetGrade && (
              <div className="text-right mr-2">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">
                  Target
                </span>
                <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                  {course.targetGrade}
                </span>
              </div>
            )}
            <button
              onClick={() => onEdit(course)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Edit course"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(course)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
              title="Delete course"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instructor & Location */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{course.instructor || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{course.location || 'Online'}</span>
          </div>
        </div>

        {/* Course Progress Section */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-brand-500" /> Lesson Progress
            </span>
            <span className="font-mono text-slate-900 dark:text-white">
              {lessonProgress.completed} / {lessonProgress.total} ({lessonProgress.percentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${lessonProgress.percentage}%`,
                backgroundColor: course.color,
              }}
            />
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Attendance Rate:
          </span>
          {attendance.isAtRisk ? (
            <Badge variant="rose" size="sm" dot>
              {attendance.attendanceRate}% · At Risk (&lt;80%)
            </Badge>
          ) : (
            <Badge variant={attendance.attendanceRate >= 90 ? 'emerald' : 'brand'} size="sm">
              {attendance.attendanceRate}% Attendance
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          {course.status.toUpperCase()}
        </span>

        <NavLink to={`/courses/${course.id}`}>
          <Button
            size="xs"
            variant="ghost"
            rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
          >
            Course Cockpit
          </Button>
        </NavLink>
      </CardFooter>
    </Card>
  );
};
