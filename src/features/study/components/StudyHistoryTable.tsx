import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Star,
  Trash2,
  Search,
  BookOpen,
  Plus,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import type { StudySession, Course } from '@/types';
import { formatDateTime, formatDurationMinutes } from '@/lib/utils';

export interface StudyHistoryTableProps {
  sessions: StudySession[];
  courses: Course[];
  onDeleteSession: (id: string) => Promise<void>;
  onOpenLogModal: () => void;
}

export const StudyHistoryTable: React.FC<StudyHistoryTableProps> = ({
  sessions,
  courses,
  onDeleteSession,
  onOpenLogModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const courseMap = new Map<string, Course>();
  for (const c of courses) {
    courseMap.set(c.id, c);
  }

  const filteredSessions = sessions.filter((s) => {
    // Course filter
    if (selectedCourseFilter !== 'all') {
      if (selectedCourseFilter === 'general' && s.courseId) return false;
      if (selectedCourseFilter !== 'general' && s.courseId !== selectedCourseFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const course = s.courseId ? courseMap.get(s.courseId) : null;
      const courseMatch = course && (course.code.toLowerCase().includes(q) || course.name.toLowerCase().includes(q));
      const notesMatch = s.notes && s.notes.toLowerCase().includes(q);
      const typeMatch = s.sessionType.toLowerCase().includes(q);
      if (!courseMatch && !notesMatch && !typeMatch) return false;
    }

    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    } catch {
      // Handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-500" />
          <span>Study Session History ({filteredSessions.length})</span>
        </CardTitle>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs cursor-pointer focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Courses</option>
            <option value="general">General / Unassigned</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>

          {/* Quick Search */}
          <div className="w-48">
            <Input
              placeholder="Search notes / type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="py-1 text-xs"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={onOpenLogModal}
          >
            Log Offline Session
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No study sessions found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Start a Pomodoro interval above or log an offline study block
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Focus Depth</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredSessions.map((sess) => {
                  const course = sess.courseId ? courseMap.get(sess.courseId) : null;
                  return (
                    <tr
                      key={sess.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3">
                        {course ? (
                          <span
                            className="font-mono font-bold px-2 py-0.5 rounded text-white text-[11px]"
                            style={{ backgroundColor: course.color }}
                          >
                            {course.code}
                          </span>
                        ) : (
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-[11px]">
                            General
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(sess.startTime)}
                      </td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {formatDurationMinutes(sess.durationMinutes)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            sess.sessionType === 'pomodoro'
                              ? 'brand'
                              : sess.sessionType === 'stopwatch'
                              ? 'sky'
                              : 'outline'
                          }
                          size="sm"
                        >
                          {sess.sessionType.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: sess.focusRating || 3 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {sess.notes || '—'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSessionToDelete(sess)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete session record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={sessionToDelete !== null}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Study Record"
        description="Are you sure you want to delete this study session? This action will adjust your study analytics and cannot be undone."
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />
    </Card>
  );
};
