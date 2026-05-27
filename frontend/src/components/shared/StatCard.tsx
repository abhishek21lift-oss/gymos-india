// StatCard.tsx
'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'orange' | 'indigo';
  urgent?: boolean;
}

const COLOR_MAP = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  val: 'text-green-800' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    val: 'text-red-700' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   val: 'text-blue-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', val: 'text-orange-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', val: 'text-indigo-700' },
};

export function StatCard({ label, value, sublabel, icon, color = 'blue', urgent }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`stat-card ${urgent ? 'border-2 border-orange-300 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {icon && <div className={`${c.bg} p-1.5 rounded-lg`}>{icon}</div>}
      </div>
      <p className={`text-2xl font-black ${c.val}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}
