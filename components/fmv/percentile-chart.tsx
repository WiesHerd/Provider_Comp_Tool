'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';

interface PercentileChartProps {
  tccPercentile: number;
  wrvuPercentile: number;
  cfPercentile: number;
}

export function PercentileChart({ tccPercentile, wrvuPercentile, cfPercentile }: PercentileChartProps) {
  const isDark = useDarkMode();
  const data = [
    {
      name: 'TCC',
      Provider: tccPercentile,
      Market: 50, // 50th percentile as reference
    },
    {
      name: 'wRVUs',
      Provider: wrvuPercentile,
      Market: 50,
    },
    {
      name: 'CF',
      Provider: cfPercentile,
      Market: 50,
    },
  ];

  // Dynamic colors based on theme
  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const axisColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500
  const textColor = isDark ? '#f3f4f6' : '#111827'; // gray-100 / gray-900
  const providerColor = '#00C805'; // Primary green - works in both themes
  const marketColor = isDark ? '#64748b' : '#94a3b8'; // slate-500 / slate-400
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 / white
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const tooltipText = isDark ? '#f3f4f6' : '#111827'; // gray-100 / gray-900

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            opacity={isDark ? 0.5 : 1}
          />
          <XAxis 
            dataKey="name" 
            stroke={axisColor}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]} 
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
          />
          <Legend 
            wrapperStyle={{ color: textColor }}
            iconType="rect"
          />
          <Bar dataKey="Provider" fill={providerColor} />
          <Bar dataKey="Market" fill={marketColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}



