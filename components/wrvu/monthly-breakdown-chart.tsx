'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import { useMobile } from '@/hooks/use-mobile';

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
  const isMobile = useMobile();
  
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

  // Modern, clean styling - Google/Apple inspired
  const xAxisFontSize = isMobile ? 14 : 12;
  const yAxisFontSize = isMobile ? 14 : 12;
  
  // Increased chart height for better proportions
  const chartHeightClass = isMobile ? 'h-80 sm:h-96 min-h-[320px]' : 'h-72 md:h-96';
  
  // Line chart settings - cleaner, no dots
  const lineStrokeWidth = isMobile ? 3 : 2.5;
  
  // Bar chart settings - more spacing
  const barCategoryGap = isMobile ? '30%' : '35%';

  return (
    <div className={`w-full ${chartHeightClass}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={data}
          margin={isMobile ? { top: 20, right: 10, left: 10, bottom: 30 } : { top: 20, right: 40, left: 10, bottom: 30 }}
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
            dataKey="month" 
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: xAxisFontSize }}
            angle={0}
            textAnchor="middle"
            height={50}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            label={{ value: 'wRVUs', angle: -90, position: 'insideLeft', fill: textColor, style: { fontSize: yAxisFontSize } }}
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: yAxisFontSize }}
            width={isMobile ? 50 : 60}
            tickCount={4}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: '$', angle: 90, position: 'insideRight', fill: textColor, style: { fontSize: yAxisFontSize } }}
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: yAxisFontSize }}
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
                return [value.toLocaleString('en-US', { maximumFractionDigits: 2 }), 'wRVUs'];
              }
              return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
            }}
          />
          <Legend 
            wrapperStyle={{ color: textColor }}
            iconType="rect"
          />
          <Bar 
            yAxisId="left" 
            dataKey="wRVUs" 
            fill={barColor} 
            name="wRVUs"
            radius={isMobile ? [6, 6, 0, 0] : [4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="Productivity Pay" 
            stroke={lineColor} 
            strokeWidth={lineStrokeWidth} 
            name="Productivity Pay ($)" 
            dot={false}
            activeDot={{ r: isMobile ? 7 : 6, fill: lineColor, strokeWidth: 2, stroke: isDark ? '#1f2937' : '#ffffff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

