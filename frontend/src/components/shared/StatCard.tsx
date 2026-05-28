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
  green:  { bg: 'bg-green-50/80',  ring: 'ring-green-500/20',  val: 'text-green-700' },
  red:    { bg: 'bg-red-50/80',    ring: 'ring-red-500/20',    val: 'text-red-700' },
  blue:   { bg: 'bg-blue-50/80',   ring: 'ring-blue-500/20',   val: 'text-blue-700' },
  orange: { bg: 'bg-orange-50/80', ring: 'ring-orange-500/20', val: 'text-orange-700' },
  indigo: { bg: 'bg-indigo-50/80', ring: 'ring-indigo-500/20', val: 'text-indigo-700' },
};

export function StatCard({ label, value, sublabel, icon, color = 'blue', urgent }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`stat-card ${urgent ? 'ring-2 ring-orange-400/40 animate-pulse-glow' : 'ring-1 ring-black/5'}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">{label}</p>
        {icon && (
          <div className={`${c.bg} p-2 rounded-xl ring-1 ring-black/5 backdrop-blur-sm`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-black tracking-tight ${c.val}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}
