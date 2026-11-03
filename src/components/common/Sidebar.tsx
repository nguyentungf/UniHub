import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  Sparkles,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEED_DATA } from '@/constants/seedData';
import { useCourseStore, useAssignmentStore, useExamStore } from '@/stores';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const courses = useCourseStore((state) => state.courses);
  const semesters = useCourseStore((state) => state.semesters);
  const assignments = useAssignmentStore((state) => state.assignments);
  const exams = useExamStore((state) => state.exams);

  const currentSemester = semesters.find((s) => s.isCurrent) || semesters[0] || SEED_DATA.data.semesters[0];
  const pendingAssignmentsCount = assignments.filter((a) => a.status === 'todo' || a.status === 'in_progress').length;
  const upcomingExamsCount = exams.filter((e) => !e.status || e.status === 'upcoming').length;

  const navItems = [
    { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Môn học', path: '/courses', icon: BookOpen, badge: courses.length > 0 ? String(courses.length) : undefined },
    { name: 'Thời khóa biểu', path: '/timetable', icon: Calendar },
    { name: 'Bài tập', path: '/assignments', icon: CheckSquare, badge: pendingAssignmentsCount > 0 ? String(pendingAssignmentsCount) : undefined },
    { name: 'Lịch thi', path: '/exams', icon: GraduationCap, badge: upcomingExamsCount > 0 ? String(upcomingExamsCount) : undefined },
    { name: 'Tính điểm & GPA', path: '/gpa', icon: Sparkles },
    { name: 'Đồng hồ Pomodoro', path: '/study', icon: Clock },
    { name: 'Ghi chú', path: '/notes', icon: FileText },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 dark:border-slate-800/80 dark:bg-navy-900/95 lg:static',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300',
            isCollapsed ? 'justify-between px-2' : 'justify-between px-4'
          )}
        >
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className={cn(
              'flex shrink-0 items-center select-none transition-all duration-300',
              isCollapsed ? 'gap-0' : 'gap-3 overflow-hidden'
            )}
            title={isCollapsed ? 'UniHub Dashboard' : undefined}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white shadow-md shadow-brand-500/25 transition-all duration-300',
                isCollapsed ? 'h-8 w-8' : 'h-10 w-10'
              )}
            >
              <GraduationCap
                className={cn(
                  'transition-all duration-300',
                  isCollapsed ? 'h-4 w-4' : 'h-5 w-5'
                )}
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Uni<span className="text-brand-600 dark:text-brand-400">Hub</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {currentSemester.name}
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all duration-200',
              isCollapsed ? 'h-6 w-6' : 'h-7 w-7'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 select-none',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300',
                        !isCollapsed && 'mr-3'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 truncate tracking-tight">{item.name}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                          isActive
                            ? 'bg-brand-200/80 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Quick Focus Widget / Card (if expanded) */}
        {!isCollapsed && (
          <div className="mx-3 mb-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-brand-50/30 p-3.5 dark:border-brand-900/50 dark:from-brand-950/40 dark:via-slate-900/80 dark:to-brand-950/20">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
                <Flame className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Tập trung học
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Pomodoro 25 phút
                </p>
              </div>
            </div>
            <NavLink
              to="/study"
              onClick={onCloseMobile}
              className="mt-2.5 block text-center rounded-xl bg-brand-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 active:scale-98 transition-all"
            >
              Bắt đầu phiên
            </NavLink>
          </div>
        )}

        {/* Footer / Offline status indicator */}
        <div className="border-t border-slate-200/60 p-3 dark:border-slate-800/60">
          <div
            className={cn(
              'flex items-center rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
            title="UniHub chạy 100% trên trình duyệt và hoạt động ngoại tuyến hoàn chỉnh qua IndexedDB."
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {!isCollapsed && <span className="font-medium">Chế độ ngoại tuyến</span>}
            </div>
            {!isCollapsed && <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />}
          </div>
        </div>
      </aside>
    </>
  );
};
