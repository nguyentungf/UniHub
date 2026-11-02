import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Search,
  ArrowUpDown,
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
import { useAssignmentStore, useCourseStore } from '@/stores';
import { Assignment, PriorityLevel, AssignmentStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  calculateAssignmentProgress,
  filterAndSortAssignments,
  generateAssignmentsIcs,
  downloadFile,
  getAssignmentDeadlineInfo,
  isAssignmentCompleted,
  AssignmentSortOption,
} from './utils/assignmentLogic';
import { AssignmentFormModal } from './components/AssignmentFormModal';
import { AssignmentProgressHeader } from './components/AssignmentProgressHeader';
import { AssignmentCard } from './components/AssignmentCard';
import { AssignmentCalendarView } from './components/AssignmentCalendarView';

export const AssignmentsPage: React.FC = () => {
  // Store subscriptions with granular selectors
  const assignments = useAssignmentStore((state) => state.assignments);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const error = useAssignmentStore((state) => state.error);
  const filterCourseId = useAssignmentStore((state) => state.filterCourseId);
  const filterPriority = useAssignmentStore((state) => state.filterPriority);
  const filterStatus = useAssignmentStore((state) => state.filterStatus);
  const searchQuery = useAssignmentStore((state) => state.searchQuery);
  const sortBy = useAssignmentStore((state) => state.sortBy);
  const viewMode = useAssignmentStore((state) => state.viewMode);

  // Store actions
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);
  const addAssignment = useAssignmentStore((state) => state.addAssignment);
  const updateAssignment = useAssignmentStore((state) => state.updateAssignment);
  const deleteAssignment = useAssignmentStore((state) => state.deleteAssignment);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const setFilterCourseId = useAssignmentStore((state) => state.setFilterCourseId);
  const setFilterPriority = useAssignmentStore((state) => state.setFilterPriority);
  const setFilterStatus = useAssignmentStore((state) => state.setFilterStatus);
  const setSearchQuery = useAssignmentStore((state) => state.setSearchQuery);
  const setSortBy = useAssignmentStore((state) => state.setSortBy);
  const setViewMode = useAssignmentStore((state) => state.setViewMode);
  const clearError = useAssignmentStore((state) => state.clearError);

  // Courses
  const courses = useCourseStore((state) => state.courses);
  const loadCourses = useCourseStore((state) => state.loadCourses);

  // Local dialog states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Confirmation dialog for delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadAssignments();
    loadCourses();
  }, [loadAssignments, loadCourses]);

  // Derived progress statistics
  const progressStats = useMemo(() => {
    return calculateAssignmentProgress(assignments);
  }, [assignments]);

  // Filtered and sorted assignments
  const filteredAssignments = useMemo(() => {
    return filterAndSortAssignments(
      assignments,
      {
        courseId: filterCourseId,
        priority: filterPriority,
        status: filterStatus,
        search: searchQuery,
      },
      sortBy,
      courses
    );
  }, [assignments, filterCourseId, filterPriority, filterStatus, searchQuery, sortBy, courses]);

  // Kanban Column definitions
  const columns: {
    status: AssignmentStatus;
    label: string;
    description: string;
    color: string;
  }[] = [
    {
      status: 'todo',
      label: 'Not Started',
      description: 'Backlog & queued homework',
      color: 'border-slate-300 dark:border-slate-700',
    },
    {
      status: 'in_progress',
      label: 'In Progress',
      description: 'Actively being researched or coded',
      color: 'border-brand-500',
    },
    {
      status: 'completed',
      label: 'Completed',
      description: 'Finished, submitted, or graded',
      color: 'border-emerald-500',
    },
  ];

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAssignment(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleExportAllIcs = () => {
    const content = generateAssignmentsIcs(assignments, courses);
    downloadFile('unihub-all-assignments.ics', content);
  };

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Assignments & Deadlines"
        subtitle="Manage upcoming coursework, milestones, and grading weights with smart calendar sync"
        badge={
          <Badge variant="brand">
            {progressStats.total - progressStats.completed} Pending Tasks
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewMode('kanban')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Calendar
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportAllIcs}
              title="Download iCalendar file for Google Calendar"
            >
              Export
            </Button>

            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAdd}
            >
              Add Assignment
            </Button>
          </div>
        }
      />

      {/* Error alert if any */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress & Health Overview Bar */}
      <AssignmentProgressHeader stats={progressStats} />

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or course..."
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
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>

          {/* Filter Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as PriorityLevel | 'all')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | 'all')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="todo">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AssignmentSortOption)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="dueDate_asc">Due Date (Earliest First)</option>
              <option value="dueDate_desc">Due Date (Latest First)</option>
              <option value="priority_desc">Priority (Urgent First)</option>
              <option value="priority_asc">Priority (Low First)</option>
              <option value="title_asc">Title (A to Z)</option>
              <option value="title_desc">Title (Z to A)</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium self-end lg:self-center">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </span>
      </div>

      {/* VIEW RENDERING */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No assignments found"
          description="Try adjusting your filters or search keywords, or create a new assignment."
          actionLabel="Add Assignment"
          onAction={handleOpenAdd}
        />
      ) : viewMode === 'kanban' ? (
        /* 1. KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {columns.map((col) => {
            const columnItems = filteredAssignments.filter((a) => {
              if (col.status === 'completed') {
                return isAssignmentCompleted(a.status);
              }
              if (col.status === 'in_progress') {
                return a.status === 'in_progress';
              }
              return a.status === 'todo';
            });

            return (
              <div
                key={col.status}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-100/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {columnItems.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{col.description}</p>
                  </div>
                </div>

                {/* Column Items */}
                <div className="mt-3 space-y-3 flex-1">
                  {columnItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No tasks in this lane
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <AssignmentCard
                        key={item.id}
                        assignment={item}
                        course={courseMap.get(item.courseId)}
                        onEdit={handleOpenEdit}
                        onDelete={(id, title) => setDeleteTarget({ id, title })}
                        onStatusChange={updateAssignmentStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* 2. TABLE VIEW */
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Course</th>
                <th className="p-3.5">Assignment Title</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Weight</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredAssignments.map((a) => {
                const course = courseMap.get(a.courseId);
                const deadline = getAssignmentDeadlineInfo(a.dueDate, a.status);
                const completed = isAssignmentCompleted(a.status);

                return (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-mono font-bold">
                      <span
                        className="px-2 py-0.5 rounded text-white text-[11px]"
                        style={{ backgroundColor: course?.color || '#4f46e5' }}
                      >
                        {course?.code || 'GEN'}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white max-w-xs">
                      <div className={completed ? 'line-through text-slate-400' : ''}>
                        {a.title}
                      </div>
                      {a.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {a.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        {deadline.isOverdue && (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        )}
                        <span
                          className={
                            deadline.isOverdue
                              ? 'text-rose-600 font-bold dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }
                        >
                          {formatDateTime(a.dueDate)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {deadline.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          a.priority === 'urgent'
                            ? 'rose'
                            : a.priority === 'high'
                            ? 'amber'
                            : a.priority === 'medium'
                            ? 'sky'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {a.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono font-semibold">
                      {a.weight !== undefined ? `${a.weight}%` : '—'}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          completed
                            ? 'emerald'
                            : a.status === 'in_progress'
                            ? 'brand'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {completed
                          ? 'COMPLETED'
                          : a.status === 'in_progress'
                          ? 'IN PROGRESS'
                          : 'NOT STARTED'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            const next = a.status === 'todo' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'todo';
                            updateAssignmentStatus(a.id, next);
                          }}
                        >
                          {a.status === 'todo' ? 'Start' : a.status === 'in_progress' ? 'Done' : 'Reopen'}
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenEdit(a)}
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="hover:text-rose-600"
                          onClick={() => setDeleteTarget({ id: a.id, title: a.title })}
                          title="Delete"
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
        <AssignmentCalendarView
          assignments={filteredAssignments}
          courses={courses}
          onSelectAssignment={handleOpenEdit}
        />
      )}

      {/* Add / Edit Modal */}
      <AssignmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={async (item) => {
          if (editingAssignment) {
            await updateAssignment(item.id, item);
          } else {
            await addAssignment(item);
          }
        }}
        initialData={editingAssignment}
        courses={courses}
      />

      {/* Confirmation Dialog before Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Assignment"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will remove associated grading records.`}
        confirmText="Delete Assignment"
        variant="danger"
      />
    </div>
  );
};
