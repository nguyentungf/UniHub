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
} from 'lucide-react';
import { SEED_DATA } from '@/constants/seedData';
import { cn } from '@/lib/utils';
import { dataAccessLayer } from '@/lib/storage/dal';

export interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('unihub_user_settings_v1');
      return stored ? JSON.parse(stored).theme : 'system';
    } catch {
      return 'system';
    }
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      const existing = localStorage.getItem('unihub_user_settings_v1');
      const parsed = existing ? JSON.parse(existing) : { ...SEED_DATA.data.settings };
      parsed.theme = theme;
      localStorage.setItem('unihub_user_settings_v1', JSON.stringify(parsed));
    } catch (e) {}
  }, [theme]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Academic Overview' },
    '/courses': { title: 'Course Catalog', subtitle: 'Curriculum & Weights' },
    '/timetable': { title: 'Weekly Timetable', subtitle: 'Class Schedules & Rooms' },
    '/assignments': { title: 'Assignments', subtitle: 'Tasks & Submission Deadlines' },
    '/exams': { title: 'Exam Hub', subtitle: 'Countdown & Checklists' },
    '/gpa': { title: 'GPA Simulator', subtitle: 'Grade Simulator & Targets' },
    '/study': { title: 'Study Tracker', subtitle: 'Pomodoro & Focus History' },
    '/notes': { title: 'Knowledge Vault', subtitle: 'Markdown Notes & Tags' },
    '/settings': { title: 'Settings', subtitle: 'Semester & Preferences' },
  };

  const currentRoute = routeTitles[location.pathname] || {
    title: 'UniHub',
    subtitle: 'University Operating System',
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const notifications = [
    {
      id: '1',
      title: 'Assignment Due Soon',
      desc: 'CS201 - Red-Black Tree Implementation due in 2 days',
      time: 'Due Nov 3, 23:59',
      type: 'warning',
      icon: AlertTriangle,
    },
    {
      id: '2',
      title: 'Upcoming Exam',
      desc: 'CS201 Midterm Examination in Turing Hall 302',
      time: 'In 14 days',
      type: 'info',
      icon: Calendar,
    },
    {
      id: '3',
      title: 'Study Goal Reached',
      desc: 'You completed 4 Pomodoro focus sessions today!',
      time: '2 hours ago',
      type: 'success',
      icon: CheckCircle2,
    },
  ];

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
              Search courses, tasks, exams...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions (Theme, Notifications, Profile) */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Current theme: ${theme}. Click to switch.`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          aria-label="Toggle visual theme"
        >
          {theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
          {theme === 'dark' && <Moon className="h-4 w-4 text-brand-400" />}
          {theme === 'system' && <Laptop className="h-4 w-4 text-slate-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-navy-900" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Notifications & Reminders
                </span>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  3 active
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
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
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <NavLink
                  to="/assignments"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View all upcoming deadlines →
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
            aria-label="Open user profile menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-semibold text-xs shadow-xs">
              AC
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                Alex Chen
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                GPA 3.82 · Fall &apos;26
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl animate-slide-up dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Alex Chen
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Metropolis Univ. of Technology
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    Target GPA: 3.85
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
                  <span>Preferences & Settings</span>
                </NavLink>
                <NavLink
                  to="/gpa"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span>GPA Simulator</span>
                </NavLink>
              </div>

              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 p-1">
                <button
                  onClick={async () => {
                    if (confirm('Reset all UniHub data back to default demo state?')) {
                      await dataAccessLayer.resetAll();
                      await dataAccessLayer.initializeSeedDataIfNeeded();
                      window.location.reload();
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
