import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/common';
import { DashboardPage } from '@/features/dashboard';
import { CoursesPage, CourseDetailPage } from '@/features/courses';
import { TimetablePage } from '@/features/timetable';
import { AssignmentsPage } from '@/features/assignments';
import { ExamsPage } from '@/features/exams';
import { GpaPage } from '@/features/gpa';
import { StudyPage } from '@/features/study';
import { NotesPage } from '@/features/notes';
import { SettingsPage } from '@/features/settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:courseId', element: <CourseDetailPage /> },
      { path: 'timetable', element: <TimetablePage /> },
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'exams', element: <ExamsPage /> },
      { path: 'gpa', element: <GpaPage /> },
      { path: 'study', element: <StudyPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
