'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PercentileChartProps {
  tccPercentile: number;
  wrvuPercentile: number;
  cfPercentile: number;
}

export function PercentileChart({ tccPercentile, wrvuPercentile, cfPercentile }: PercentileChartProps) {
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

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Provider" fill="#00C805" />
          <Bar dataKey="Market" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


