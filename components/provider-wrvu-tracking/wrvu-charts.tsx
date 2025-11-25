'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import { useMobile } from '@/hooks/use-mobile';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatDateString, type DateString } from '@/lib/utils/calendar-helpers';
import { DailyTrackingData } from '@/types/provider-wrvu-tracking';

interface WRVUChartsProps {
  currentDate: Date;
  dailyData: Record<DateString, DailyTrackingData>;
}

export function WRVUCharts({ currentDate, dailyData }: WRVUChartsProps) {
  const isDark = useDarkMode();
  const isMobile = useMobile();

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
        dayOfWeekShort: format(day, 'EEEEEE'), // Single letter: M, T, W, T, F, S, S
        dayNumber: format(day, 'd'), // Day number only
        patients: data.patients || 0,
        wRVUs: data.workRVUs || 0,
      };
    });
  }, [currentDate, dailyData, monthDays]);

  // Prepare weekly data for chart
  const weeklyChartData = React.useMemo(() => {
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    return weeks.map((weekStart, index) => {
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
        weekShort: `W${index + 1}`, // Simplified: W1, W2, etc.
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

  // Mobile-optimized font sizes
  const xAxisFontSize = isMobile ? 14 : 12;
  const yAxisFontSize = isMobile ? 14 : 12;
  const legendFontSize = isMobile ? 14 : 12;

  // Mobile-optimized chart dimensions
  const chartHeightClass = isMobile ? 'h-80 sm:h-96 min-h-[320px]' : 'h-64 md:h-80';

  // Mobile-optimized line chart settings
  const lineStrokeWidth = isMobile ? 3 : 2;
  const dotRadius = isMobile ? 5 : 3;

  // Mobile-optimized bar chart settings
  const barCategoryGap = isMobile ? '20%' : '10%';

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
          <div className={`w-full ${chartHeightClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isDark ? 0.5 : 1} />
                <XAxis
                  dataKey={isMobile ? 'dayNumber' : 'date'}
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: xAxisFontSize }}
                  angle={isMobile ? 0 : -45}
                  textAnchor={isMobile ? 'middle' : 'end'}
                  height={isMobile ? 40 : 60}
                  interval={isMobile ? 'preserveStartEnd' : 0}
                  tickCount={isMobile ? 7 : undefined}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={isMobile ? 5 : undefined}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={isMobile ? 5 : undefined}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                    padding: isMobile ? '12px' : '8px',
                    fontSize: isMobile ? '14px' : '12px',
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                  position={isMobile ? { y: -10 } : undefined}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value, 'Patients'];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: textColor, fontSize: legendFontSize }}
                  verticalAlign={isMobile ? 'top' : 'bottom'}
                  layout={isMobile ? 'vertical' : 'horizontal'}
                  iconSize={isMobile ? 16 : 14}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="patients"
                  stroke="#00C805"
                  strokeWidth={lineStrokeWidth}
                  dot={{ r: dotRadius, fill: '#00C805' }}
                  activeDot={{ r: isMobile ? 7 : 5 }}
                  name="Patients"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wRVUs"
                  stroke="#3b82f6"
                  strokeWidth={lineStrokeWidth}
                  dot={{ r: dotRadius, fill: '#3b82f6' }}
                  activeDot={{ r: isMobile ? 7 : 5 }}
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
          <div className={`w-full ${chartHeightClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyChartData}
                margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 5, right: 30, left: 0, bottom: 5 }}
                barCategoryGap={barCategoryGap}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isDark ? 0.5 : 1} />
                <XAxis
                  dataKey={isMobile ? 'weekShort' : 'week'}
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: xAxisFontSize }}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={isMobile ? 5 : undefined}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={isMobile ? 5 : undefined}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                    padding: isMobile ? '12px' : '8px',
                    fontSize: isMobile ? '14px' : '12px',
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                  position={isMobile ? { y: -10 } : undefined}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value, 'Patients'];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: textColor, fontSize: legendFontSize }}
                  verticalAlign={isMobile ? 'top' : 'bottom'}
                  layout={isMobile ? 'vertical' : 'horizontal'}
                  iconSize={isMobile ? 16 : 14}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="patients" 
                  fill="#00C805" 
                  name="Patients"
                  radius={isMobile ? [4, 4, 0, 0] : [2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="wRVUs" 
                  fill="#3b82f6" 
                  name="wRVUs"
                  radius={isMobile ? [4, 4, 0, 0] : [2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

