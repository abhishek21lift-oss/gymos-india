'use client';

import useSWR from 'swr';
import { dashboardApi } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export function RevenueChart({ days = 14 }: { days?: number }) {
  const { data, isLoading } = useSWR(
    ['revenue-chart', days],
    () => dashboardApi.getRevenueChart(days).then(r => r.data),
  );

  if (isLoading) {
    return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const chartData = (data || []).map((d: any) => ({
    date: format(new Date(d.date), 'dd MMM'),
    revenue: Number(d.revenue || 0),
    transactions: Number(d.transactions || 0),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
          <p className="font-bold text-gray-900 mb-1">{label}</p>
          <p className="text-green-600 font-semibold">₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
          <p className="text-gray-400">{payload[1]?.value} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#E53E3E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="revenue" stroke="#E53E3E" strokeWidth={2}
          fill="url(#revenueGrad)" dot={{ fill: '#E53E3E', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
