// components/VitalMonitor.tsx

interface VitalProps {
  label: string;
  value: string | number;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
}

export function VitalItem({ label, value, unit, status = 'normal' }: VitalProps) {
  const statusColors = {
    normal: 'text-[#D4AF37]',
    warning: 'text-orange-500',
    critical: 'text-[#8B0000]'
  };

  return (
    <div className={`flex flex-col items-center px-8 border-r border-white/5 last:border-none group`}>
      <span className="text-[7px] text-white/20 uppercase tracking-[0.4em] mb-2 group-hover:text-white/40 transition-colors">
        {label}
      </span>
      <div className={`flex items-baseline gap-1 ${statusColors[status]} ${status === 'critical' ? 'vital-pulse' : ''}`}>
        <span className="text-2xl font-bold tabular-nums medical-glow tracking-tighter">
          {value}
        </span>
        <span className="text-[9px] opacity-30 font-light lowercase tracking-normal italic">
          {unit}
        </span>
      </div>
    </div>
  );
}