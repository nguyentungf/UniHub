import React, { useState, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  Settings,
  RotateCcw,
  Sparkles,
  Database,
  Check,
  GraduationCap,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn, getInitials, formatDeadlineRelative, formatDate } from '@/lib/utils';
import { dataAccessLayer } from '@/lib/storage/dal';
import { useSettingsStore, useCourseStore, useAssignmentStore, useExamStore } from '@/stores';

export interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const location = useLocation();
  const settings = useSettingsStore((state) => state.settings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const databaseMode = useSettingsStore((state) => state.databaseMode);
  const switchDatabaseMode = useSettingsStore((state) => state.switchDatabaseMode);
  const semesters = useCourseStore((state) => state.semesters);
  const setCurrentSemester = useCourseStore((state) => state.setCurrentSemester);
  const courses = useCourseStore((state) => state.courses);
  const assignments = useAssignmentStore((state) => state.assignments);
  const exams = useExamStore((state) => state.exams);

  const currentSemester = semesters.find((s) => s.isCurrent) || semesters[0];

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDbSwitchOpen, setIsDbSwitchOpen] = useState(false);
  const [isSemesterSwitchOpen, setIsSemesterSwitchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dbSwitchRef = useRef<HTMLDivElement>(null);
  const semesterSwitchRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (dbSwitchRef.current && !dbSwitchRef.current.contains(e.target as Node)) {
        setIsDbSwitchOpen(false);
      }
      if (semesterSwitchRef.current && !semesterSwitchRef.current.contains(e.target as Node)) {
        setIsSemesterSwitchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'Tổng quan', subtitle: 'Báo cáo học tập' },
    '/courses': { title: 'Danh mục môn học', subtitle: 'Chương trình & Trọng số' },
    '/timetable': { title: 'Thời khóa biểu tuần', subtitle: 'Lịch học & Phòng học' },
    '/assignments': { title: 'Bài tập & Hạn nộp', subtitle: 'Nhiệm vụ & Deadline' },
    '/exams': { title: 'Lịch thi & Ôn tập', subtitle: 'Đếm ngược & Danh sách ôn tập' },
    '/gpa': { title: 'Tính điểm & GPA', subtitle: 'Dự phóng điểm số & Mục tiêu' },
    '/study': { title: 'Đồng hồ Pomodoro', subtitle: 'Lịch sử học tập tập trung' },
    '/notes': { title: 'Sổ tay ghi chép', subtitle: 'Kiến thức & Thẻ phân loại' },
    '/settings': { title: 'Cài đặt hệ thống', subtitle: 'Học kỳ & Tùy chọn' },
  };

  const currentRoute = routeTitles[location.pathname] || {
    title: 'UniHub',
    subtitle: 'Hệ điều hành học tập sinh viên',
  };

  const toggleTheme = () => {
    if (settings.theme === 'light') setTheme('dark');
    else if (settings.theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const initials = getInitials(settings.studentName);
  const displayName = settings.studentName?.trim() || 'Sinh viên';
  const displayUniversity = settings.universityName?.trim() || 'Chưa đặt trường đại học';
  const displaySubtitle = settings.major?.trim()
    ? `${settings.major} · ${currentSemester?.name || ''}`
    : currentSemester
    ? currentSemester.name
    : 'Sinh viên UniHub';

  // Dynamic notifications from active assignments and exams
  const activeAssignments = assignments.filter((a) => a.status !== 'completed');
  const notifications: Array<{
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'warning' | 'info' | 'success';
    icon: typeof AlertTriangle;
  }> = [];

  for (const a of activeAssignments.slice(0, 3)) {
    const course = courses.find((c) => c.id === a.courseId);
    notifications.push({
      id: `a-${a.id}`,
      title: 'Bài tập cần nộp',
      desc: `${course ? course.code + ' - ' : ''}${a.title}`,
      time: formatDeadlineRelative(a.dueDate).label,
      type: a.priority === 'urgent' ? 'warning' : 'info',
      icon: AlertTriangle,
    });
  }

  for (const ex of exams.slice(0, 2)) {
    const course = courses.find((c) => c.id === ex.courseId);
    notifications.push({
      id: `ex-${ex.id}`,
      title: 'Lịch thi sắp tới',
      desc: `${course ? course.code + ' - ' : ''}${ex.title} (${ex.location || 'Chưa có phòng'})`,
      time: formatDate(ex.examDate),
      type: 'info',
      icon: Calendar,
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-navy-900/80">
      {/* Left: Mobile hamburger + Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span>UniHub</span>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentRoute.title}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">{currentRoute.subtitle}</span>
        </div>
      </div>

      {/* Center: Global Search Trigger */}
      <div className="flex flex-1 items-center justify-center px-4 max-w-md">
        <button
          onClick={onOpenSearch}
          className="group flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-400 shadow-xs transition-all hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-500 transition-colors" />
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              Tìm kiếm môn học, bài tập, lịch thi...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions (Semester, DB Mode, Theme, Notifications, Profile) */}
      <div className="flex items-center gap-2">
        {/* Semester Quick Switcher */}
        <div className="relative" ref={semesterSwitchRef}>
          <button
            onClick={() => setIsSemesterSwitchOpen(!isSemesterSwitchOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
            title="Chuyển đổi học kỳ hiện tại"
            aria-label="Chuyển đổi học kỳ hiện tại"
          >
            <GraduationCap className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span className="hidden md:inline max-w-[130px] truncate">
              {currentSemester?.name || 'Học kỳ'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isSemesterSwitchOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-brand-500" />
                    <span>Học kỳ Hiện tại</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Chuyển đổi học kỳ làm việc tích cực
                  </p>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setIsSemesterSwitchOpen(false)}
                  className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Quản lý →
                </NavLink>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {semesters.map((s) => {
                  const isCur = s.isCurrent;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={async () => {
                        if (!isCur) {
                          await setCurrentSemester(s.id);
                        }
                        setIsSemesterSwitchOpen(false);
                      }}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between",
                        isCur
                          ? "bg-brand-50/80 border-brand-300 text-brand-900 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-200 font-semibold"
                          : "border-transparent hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {isCur && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-semibold">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.startDate} → {s.endDate}
                          {s.targetGpa ? ` · Mục tiêu GPA: ${s.targetGpa.toFixed(2)}` : ''}
                        </p>
                      </div>
                      {isCur && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <NavLink
                  to="/settings"
                  onClick={() => setIsSemesterSwitchOpen(false)}
                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-brand-500" />
                  <span>Tạo hoặc Quản lý học kỳ</span>
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* Database Mode Switcher */}
        <div className="relative" ref={dbSwitchRef}>
          <button
            onClick={() => setIsDbSwitchOpen(!isDbSwitchOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              databaseMode === 'real'
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
            )}
            title="Chuyển đổi môi trường cơ sở dữ liệu (Thực tế vs Mẫu)"
            aria-label="Chuyển đổi môi trường cơ sở dữ liệu"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                databaseMode === 'real' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span className="hidden sm:inline">
              {databaseMode === 'real' ? 'Dữ liệu thực tế' : 'Dữ liệu mẫu'}
            </span>
            <span className="sm:hidden">
              {databaseMode === 'real' ? 'Thực tế' : 'Demo'}
            </span>
          </button>

          {isDbSwitchOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-brand-500" />
                  <span>Môi trường Cơ sở Dữ liệu</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  UniHub lưu trữ độc lập giữa dữ liệu thực và dữ liệu mẫu.
                </p>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    if (databaseMode !== 'real') {
                      await switchDatabaseMode('real');
                    }
                    setIsDbSwitchOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between",
                    databaseMode === 'real'
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200"
                      : "border-transparent hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Cơ sở Dữ liệu Thực tế</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Trường trắng dành cho sinh viên học tập. Cập nhật thời gian thực.
                    </p>
                  </div>
                  {databaseMode === 'real' && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (databaseMode !== 'demo') {
                      await switchDatabaseMode('demo');
                    }
                    setIsDbSwitchOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between",
                    databaseMode === 'demo'
                      ? "bg-amber-50/80 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200"
                      : "border-transparent hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Cơ sở Dữ liệu Mẫu (Demo)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Dữ liệu mẫu hoàn chỉnh để Tester & Dev kiểm thử mọi tính năng.
                    </p>
                  </div>
                  {databaseMode === 'demo' && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Giao diện: ${settings.theme === 'light' ? 'Sáng' : settings.theme === 'dark' ? 'Tối' : 'Hệ thống'}. Nhấn để chuyển.`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          aria-label="Chuyển đổi giao diện sáng tối"
        >
          {settings.theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
          {settings.theme === 'dark' && <Moon className="h-4 w-4 text-brand-400" />}
          {settings.theme === 'system' && <Laptop className="h-4 w-4 text-slate-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            aria-label="Xem thông báo"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-navy-900" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Thông báo & Nhắc nhở
                </span>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  {notifications.length} thông báo
                </span>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Không có thông báo mới. Bạn đã hoàn thành tất cả nhiệm vụ!
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 rounded-xl p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                            n.type === 'warning' && 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
                            n.type === 'info' && 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
                            n.type === 'success' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.desc}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
                            {n.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <NavLink
                  to="/assignments"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Xem tất cả bài tập sắp tới →
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Mở menu người dùng"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-semibold text-xs shadow-xs">
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {displaySubtitle}
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {displayUniversity}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    Mục tiêu GPA: {currentSemester?.targetGpa ? currentSemester.targetGpa.toFixed(2) : 'Chưa đặt'}
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                <NavLink
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Tùy chọn & Cài đặt</span>
                </NavLink>
                <NavLink
                  to="/gpa"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span>Dự phóng GPA</span>
                </NavLink>
              </div>

              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 p-1">
                <button
                  onClick={async () => {
                    const confirmMsg =
                      databaseMode === 'real'
                        ? 'Xóa toàn bộ dữ liệu thực tế và quay về trường trắng ban đầu?'
                        : 'Đặt lại toàn bộ dữ liệu mẫu về trạng thái ban đầu?';
                    if (confirm(confirmMsg)) {
                      await dataAccessLayer.resetAll();
                      window.location.reload();
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>
                    {databaseMode === 'real' ? 'Xóa sạch dữ liệu thực tế' : 'Đặt lại dữ liệu mẫu'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
