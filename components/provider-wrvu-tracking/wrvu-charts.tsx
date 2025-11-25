'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatDateString, type DateString } from '@/lib/utils/calendar-helpers';
import { DailyTrackingData } from '@/types/provider-wrvu-tracking';

interface WRVUChartsProps {
  currentDate: Date;
  dailyData: Record<DateString, DailyTrackingData>;
}

export function WRVUCharts({ currentDate, dailyData }: WRVUChartsProps) {
  const isDark = useDarkMode();

  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Prepare daily data for chart
  const dailyChartData = React.useMemo(() => {
    return monthDays.map((day) => {
      const dateStr = formatDateString(day);
      const data = dailyData[dateStr] || { patients: 0, workRVUs: 0 };
      return {
        date: format(day, 'MMM d'),
        dayOfWeek: format(day, 'EEE'),
        patients: data.patients || 0,
        wRVUs: data.workRVUs || 0,
      };
    });
  }, [currentDate, dailyData, monthDays]);

  // Prepare weekly data for chart
  const weeklyChartData = React.useMemo(() => {
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      let weekPatients = 0;
      let weekWRVUs = 0;
      
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      weekDays.forEach((day) => {
        const dateStr = formatDateString(day);
        const data = dailyData[dateStr];
        if (data) {
          weekPatients += data.patients || 0;
          weekWRVUs += data.workRVUs || 0;
        }
      });

      return {
        week: `Week ${format(weekStart, 'M/d')}`,
        patients: weekPatients,
        wRVUs: weekWRVUs,
      };
    });
  }, [currentDate, dailyData, monthStart, monthEnd]);

  const hasData = Object.values(dailyData).some((data) => data.patients > 0 || data.workRVUs > 0);

  if (!hasData) {
    return null;
  }

  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#111827';

  const monthName = format(currentDate, 'MMMM yyyy');

  return (
    <div className="space-y-6">
      {/* Daily Trends Chart */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold text-primary">
              Daily Trends - {monthName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isDark ? 0.5 : 1} />
                <XAxis
                  dataKey="date"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12 }}
                  label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: textColor }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12 }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value, 'Patients'];
                  }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="patients"
                  stroke="#00C805"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Patients"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wRVUs"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="wRVUs"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary Chart */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold text-primary">
              Weekly Summary - {monthName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isDark ? 0.5 : 1} />
                <XAxis
                  dataKey="week"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12 }}
                  label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: textColor }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12 }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value, 'Patients'];
                  }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar yAxisId="left" dataKey="patients" fill="#00C805" name="Patients" />
                <Bar yAxisId="right" dataKey="wRVUs" fill="#3b82f6" name="wRVUs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

