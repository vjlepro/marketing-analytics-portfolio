import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  subvalue?: string;
  delta?: number;         // percent change
  deltaLabel?: string;
  icon?: ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  testId?: string;
}

const COLOR_MAP = {
  blue:   { accent: 'hsl(199 89% 48%)',  bg: 'hsl(199 89% 48% / 0.08)', border: 'hsl(199 89% 48% / 0.2)' },
  purple: { accent: 'hsl(262 80% 65%)',  bg: 'hsl(262 80% 65% / 0.08)', border: 'hsl(262 80% 65% / 0.2)' },
  green:  { accent: 'hsl(158 64% 52%)',  bg: 'hsl(158 64% 52% / 0.08)', border: 'hsl(158 64% 52% / 0.2)' },
  orange: { accent: 'hsl(35 91% 55%)',   bg: 'hsl(35 91% 55% / 0.08)',  border: 'hsl(35 91% 55% / 0.2)'  },
  red:    { accent: 'hsl(0 72% 51%)',    bg: 'hsl(0 72% 51% / 0.08)',   border: 'hsl(0 72% 51% / 0.2)'   },
};

export default function KpiCard({ label, value, subvalue, delta, deltaLabel, icon, color = 'blue', testId }: KpiCardProps) {
  const c = COLOR_MAP[color];
  const positive = delta !== undefined && delta > 0;
  const negative = delta !== undefined && delta < 0;

  return (
    <div
      data-testid={testId || `kpi-${label.toLowerCase().replace(/\s+/g,'-')}`}
      className="rounded-lg p-4 relative overflow-hidden"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg" style={{ background: c.accent }} />

      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && (
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${c.accent}20` }}>
            <span style={{ color: c.accent }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="metric-value text-xl font-bold text-foreground" style={{ color: c.accent }}>
        {value}
      </div>

      {subvalue && (
        <div className="text-[11px] text-muted-foreground mt-0.5">{subvalue}</div>
      )}

      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-muted-foreground'}`}>
          {positive ? <TrendingUp size={11} /> : negative ? <TrendingDown size={11} /> : <Minus size={11} />}
          <span>{positive ? '+' : ''}{delta.toFixed(1)}%</span>
          {deltaLabel && <span className="text-muted-foreground font-normal">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
