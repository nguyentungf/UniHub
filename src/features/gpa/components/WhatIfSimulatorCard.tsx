import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Course, GradingScale } from '@/types';
import { Sliders, RotateCcw, TrendingUp, Sparkles, BookOpen } from 'lucide-react';

interface WhatIfSimulatorCardProps {
  courses: Course[];
  scale: GradingScale;
  simulatedGrades: Record<string, number>;
  onGradeChange: (courseId: string, gradePoint: number) => void;
  onReset: () => void;
  projectedSemesterGpa: number;
  projectedCumulativeGpa: number;
  currentSemesterGpa: number;
  currentCumulativeGpa: number;
}

export const WhatIfSimulatorCard: React.FC<WhatIfSimulatorCardProps> = ({
  courses,
  scale,
  simulatedGrades,
  onGradeChange,
  onReset,
  projectedSemesterGpa,
  projectedCumulativeGpa,
  currentSemesterGpa,
  currentCumulativeGpa,
}) => {
  // Only courses in current/enrolled state or missing actual grades
  const enrolledCourses = courses.filter((c) => c.status === 'enrolled');
  const targetCourses = enrolledCourses.length > 0 ? enrolledCourses : courses.slice(0, 4);

  const semDelta = projectedSemesterGpa - currentSemesterGpa;
  const cumDelta = projectedCumulativeGpa - currentCumulativeGpa;

  return (
    <Card className="border border-brand-100 bg-white dark:border-brand-950 dark:bg-slate-900 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>&quot;What-If&quot; Grade Scenario Simulator</span>
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate expected grades for enrolled courses to evaluate real-time GPA trajectory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Dynamic Projected Metric Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 dark:bg-brand-950/20 dark:border-brand-900/40">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Projected Term GPA
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-brand-700 dark:text-brand-300">
                {projectedSemesterGpa.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">/ {scale.maxGpa.toFixed(1)}</span>
            </div>
            {semDelta !== 0 && (
              <span
                className={`text-[10px] font-bold font-mono ${
                  semDelta > 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {semDelta > 0 ? `+${semDelta.toFixed(2)}` : semDelta.toFixed(2)} vs curr
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Projected Cumulative
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {projectedCumulativeGpa.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">/ {scale.maxGpa.toFixed(1)}</span>
            </div>
            {cumDelta !== 0 && (
              <span
                className={`text-[10px] font-bold font-mono ${
                  cumDelta > 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {cumDelta > 0 ? `+${cumDelta.toFixed(2)}` : cumDelta.toFixed(2)} overall
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Simulated Courses
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {targetCourses.length}
            </span>
            <span className="text-[10px] text-slate-500">
              {targetCourses.reduce((sum, c) => sum + c.credits, 0)} Total Credits
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Trajectory Status
            </span>
            <Badge
              variant={projectedCumulativeGpa >= 3.7 ? 'emerald' : 'brand'}
              size="sm"
              className="mt-1"
            >
              {projectedCumulativeGpa >= 3.7 ? 'Dean’s Honor List' : 'On Track'}
            </Badge>
          </div>
        </div>

        {/* Course Grade Selectors */}
        <div className="space-y-2.5">
          {targetCourses.map((course) => {
            const currentSimVal =
              simulatedGrades[course.id] !== undefined
                ? simulatedGrades[course.id]
                : course.actualGrade !== undefined
                ? course.actualGrade
                : scale.tiers[0]?.gradePoint || 4.0;

            const qp = currentSimVal * course.credits;

            return (
              <div
                key={course.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded text-white shadow-2xs"
                    style={{ backgroundColor: course.color }}
                  >
                    {course.code}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {course.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {course.credits} Credits · Target: {course.targetGrade || 'A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={currentSimVal}
                    onChange={(e) =>
                      onGradeChange(course.id, parseFloat(e.target.value))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-brand-400 shadow-2xs cursor-pointer"
                  >
                    {scale.tiers.map((tier) => (
                      <option key={tier.letter} value={tier.gradePoint}>
                        {tier.letter} ({tier.gradePoint.toFixed(2)} pts)
                      </option>
                    ))}
                  </select>

                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 w-16 text-right">
                    {qp.toFixed(1)} QP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

