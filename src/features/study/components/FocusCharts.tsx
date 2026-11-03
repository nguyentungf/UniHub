import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Clock, PieChart as PieChartIcon } from 'lucide-react';
import type { DailyFocusTrendItem, CourseFocusBreakdown } from '../utils/studyAnalytics';

export interface FocusChartsProps {
  trendData: DailyFocusTrendItem[];
  courseBreakdown: CourseFocusBreakdown[];
}

export const FocusCharts: React.FC<FocusChartsProps> = ({ trendData, courseBreakdown }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Daily Focus Progression (Last 7 Days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <span>Thời gian tập trung mỗi ngày (7 ngày qua)</span>
            </span>
            <span className="text-xs font-normal text-slate-400">Số giờ mỗi ngày</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: unknown) => [`${val} giờ`, 'Thời gian tập trung']}
                  labelFormatter={(label, items) => {
                    const item = items[0]?.payload as DailyFocusTrendItem | undefined;
                    return item ? `${item.formattedDate} (${label})` : label;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#4f46e5" maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Course Focus Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-500" />
              <span>Phân bổ thời gian theo môn học</span>
            </span>
            <span className="text-xs font-normal text-slate-400">Tổng số giờ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseBreakdown.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Chưa có phiên học môn nào được ghi nhận
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseBreakdown} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <YAxis
                    dataKey="code"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: unknown, _, item) => {
                      const payload = item?.payload as CourseFocusBreakdown;
                      return [`${val} giờ (${payload.percentage}%)`, payload.name];
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                    {courseBreakdown.map((entry, idx) => (
                      <Cell key={`course-bar-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

