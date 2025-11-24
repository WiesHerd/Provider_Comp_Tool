'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface MonthlyBreakdownChartProps {
  monthlyBreakdown: number[];
  conversionFactor: number;
}

export function MonthlyBreakdownChart({ monthlyBreakdown, conversionFactor }: MonthlyBreakdownChartProps) {
  const isDark = useDarkMode();
  const data = MONTH_NAMES.map((month, index) => ({
    month,
    wRVUs: monthlyBreakdown[index] || 0,
    'Productivity Pay': Math.round((monthlyBreakdown[index] || 0) * conversionFactor * 100) / 100,
  }));

  const hasData = monthlyBreakdown.some(val => val > 0);

  if (!hasData) {
    return null;
  }

  // Dynamic colors based on theme
  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const axisColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500
  const textColor = isDark ? '#f3f4f6' : '#111827'; // gray-100 / gray-900
  const barColor = '#00C805'; // Primary green - works in both themes
  const lineColor = isDark ? '#60a5fa' : '#3b82f6'; // blue-400 / blue-500
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 / white
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const tooltipText = isDark ? '#f3f4f6' : '#111827'; // gray-100 / gray-900

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            opacity={isDark ? 0.5 : 1}
          />
          <XAxis 
            dataKey="month" 
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            label={{ value: 'wRVUs', angle: -90, position: 'insideLeft', fill: textColor }}
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: '$', angle: 90, position: 'insideRight', fill: textColor }}
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: 12 }}
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
                return [value.toLocaleString('en-US', { maximumFractionDigits: 2 }), 'wRVUs'];
              }
              return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
            }}
          />
          <Legend 
            wrapperStyle={{ color: textColor }}
            iconType="rect"
          />
          <Bar yAxisId="left" dataKey="wRVUs" fill={barColor} name="wRVUs" />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="Productivity Pay" 
            stroke={lineColor} 
            strokeWidth={2} 
            name="Productivity Pay ($)" 
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

