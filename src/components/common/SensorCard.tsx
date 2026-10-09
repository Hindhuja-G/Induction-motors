import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  trendPercent: number;
  icon: LucideIcon;
  sparklineData?: number[];
  warningLimit?: number;
  criticalLimit?: number;
  minRange?: number;
  maxRange?: number;
  subtext?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  status,
  trendPercent,
  icon: Icon,
  sparklineData = [],
  warningLimit,
  criticalLimit,
  minRange = 0,
  maxRange = 100,
  subtext,
}) => {
  // Color configuration
  let statusBadge = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let cardBorder = 'border-slate-800';
  let iconBg = 'bg-slate-800 text-slate-300';
  let sparkColor = '#10B981';

  if (status === 'CRITICAL') {
    statusBadge = 'text-red-400 bg-red-500/10 border-red-500/30';
    cardBorder = 'border-red-900/60 shadow-lg shadow-red-950/20';
    iconBg = 'bg-red-500/20 text-red-400';
    sparkColor = '#EF4444';
  } else if (status === 'WARNING') {
    statusBadge = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    cardBorder = 'border-amber-900/60 shadow-lg shadow-amber-950/20';
    iconBg = 'bg-amber-500/20 text-amber-400';
    sparkColor = '#F59E0B';
  }

  // Generate SVG Sparkline points
  const points = sparklineData.length > 2 ? sparklineData : [0, 1, 0, 2, 1, 3, 2];
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points) || 1;
  const range = maxVal - minVal || 1;
  const width = 110;
  const height = 30;

  const polylinePoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Compute position on gauge bar
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const pct = Math.min(100, Math.max(0, ((numVal - minRange) / (maxRange - minRange || 1)) * 100));

  return (
    <div
      className={`bg-slate-900 rounded-xl p-4 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${cardBorder}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${statusBadge}`}
        >
          {status}
        </span>
      </div>

      {/* Main Metric & Sparkline Row */}
      <div className="flex items-end justify-between my-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight">
              {value}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">
              {unit}
            </span>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-1 mt-1 text-[11px] font-mono">
            {trendPercent > 0 ? (
              <span className="text-red-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                +{trendPercent.toFixed(1)}%
              </span>
            ) : trendPercent < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowDownRight className="w-3 h-3" />
                {trendPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-slate-400 flex items-center">
                <Minus className="w-3 h-3" />
                0.0%
              </span>
            )}
            <span className="text-slate-400 text-[10px]">vs baseline</span>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="w-28 h-8">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
            <polyline
              fill="none"
              stroke={sparkColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          </svg>
        </div>
      </div>

      {/* Threshold Tolerances Progress Bar */}
      <div className="mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>Tolerance Limits</span>
          <span>
            {warningLimit ? `Warn: ${warningLimit}${unit}` : ''}
            {criticalLimit ? ` · Crit: ${criticalLimit}${unit}` : ''}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'CRITICAL'
                ? 'bg-red-500'
                : status === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {subtext && (
        <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
