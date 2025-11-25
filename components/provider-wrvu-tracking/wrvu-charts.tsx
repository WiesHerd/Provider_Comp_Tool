'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  // Modern, clean styling - Google/Apple inspired
  const xAxisFontSize = isMobile ? 14 : 12;
  const yAxisFontSize = isMobile ? 14 : 12;

  // Increased chart height for better proportions
  const chartHeightClass = isMobile ? 'h-80 sm:h-96 min-h-[320px]' : 'h-72 md:h-96';

  // Line chart settings - cleaner, no dots
  const lineStrokeWidth = isMobile ? 3 : 2.5;

  // Bar chart settings - more spacing
  const barCategoryGap = isMobile ? '30%' : '35%';

  // Smart X-axis interval calculation for daily chart
  const calculateXAxisInterval = () => {
    const dayCount = dailyChartData.length;
    if (dayCount <= 7) return 0; // Show all labels for short months
    if (dayCount <= 14) return 1; // Show every other day
    if (dayCount <= 21) return 2; // Show every 3rd day
    return 3; // Show every 4th day for full months
  };

  const xAxisInterval = calculateXAxisInterval();

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
        <CardContent className="pt-6">
          <div className={`w-full ${chartHeightClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={dailyChartData} 
                margin={isMobile ? { top: 20, right: 10, left: 10, bottom: 30 } : { top: 20, right: 40, left: 10, bottom: 30 }}
              >
                <CartesianGrid 
                  strokeDasharray="0" 
                  stroke={gridColor} 
                  opacity={0.12}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey={isMobile ? 'dayNumber' : 'date'}
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: xAxisFontSize }}
                  angle={0}
                  textAnchor="middle"
                  height={50}
                  interval={isMobile ? 'preserveStartEnd' : xAxisInterval}
                  tickCount={isMobile ? 7 : undefined}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={4}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                    padding: isMobile ? '12px' : '10px',
                    fontSize: isMobile ? '14px' : '12px',
                    boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                  position={isMobile ? { y: -10 } : undefined}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value.toLocaleString(), 'Patients'];
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="patients"
                  stroke="#00C805"
                  strokeWidth={lineStrokeWidth}
                  dot={false}
                  activeDot={{ r: isMobile ? 7 : 6, fill: '#00C805', strokeWidth: 2, stroke: isDark ? '#1f2937' : '#ffffff' }}
                  name="Patients"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wRVUs"
                  stroke="#3b82f6"
                  strokeWidth={lineStrokeWidth}
                  dot={false}
                  activeDot={{ r: isMobile ? 7 : 6, fill: '#3b82f6', strokeWidth: 2, stroke: isDark ? '#1f2937' : '#ffffff' }}
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
        <CardContent className="pt-6">
          <div className={`w-full ${chartHeightClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyChartData}
                margin={isMobile ? { top: 20, right: 10, left: 10, bottom: 20 } : { top: 20, right: 40, left: 10, bottom: 20 }}
                barCategoryGap={barCategoryGap}
              >
                <CartesianGrid 
                  strokeDasharray="0" 
                  stroke={gridColor} 
                  opacity={0.12}
                  horizontal={true}
                  vertical={false}
                />
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
                  tickCount={4}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: yAxisFontSize }}
                  label={{ value: 'wRVUs', angle: 90, position: 'insideRight', fill: textColor, style: { fontSize: yAxisFontSize } }}
                  width={isMobile ? 50 : 60}
                  tickCount={4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                    padding: isMobile ? '12px' : '10px',
                    fontSize: isMobile ? '14px' : '12px',
                    boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                  position={isMobile ? { y: -10 } : undefined}
                  formatter={(value: number, name: string) => {
                    if (name === 'wRVUs') {
                      return [value.toFixed(2), 'wRVUs'];
                    }
                    return [value.toLocaleString(), 'Patients'];
                  }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="patients" 
                  fill="#00C805" 
                  name="Patients"
                  radius={isMobile ? [6, 6, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="wRVUs" 
                  fill="#3b82f6" 
                  name="wRVUs"
                  radius={isMobile ? [6, 6, 0, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

