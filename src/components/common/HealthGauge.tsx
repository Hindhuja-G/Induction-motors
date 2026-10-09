import React from 'react';
import { HealthAssessment } from '../../types.ts';
import { ArrowUpRight, ArrowDownRight, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface HealthGaugeProps {
  health: HealthAssessment | null | undefined;
  trendDelta?: number;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ health, trendDelta = 0 }) => {
  const score = health?.overallScore ?? 92;
  const status = health?.status ?? 'NORMAL';

  // SVG Gauge calculations
  // Semi-circular or 260-degree arc
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 260 degrees (from 140 deg to 400 deg)
  const arcLength = circumference * (260 / 360);
  const strokeOffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  // Determine color theme
  let statusColor = 'text-emerald-400';
  let strokeColor = '#10B981';
  let glowColor = 'rgba(16, 185, 129, 0.2)';
  let bgStatus = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  let StatusIcon = ShieldCheck;

  if (status === 'CRITICAL' || score < 40) {
    statusColor = 'text-red-400';
    strokeColor = '#EF4444';
    glowColor = 'rgba(239, 68, 68, 0.3)';
    bgStatus = 'bg-red-500/10 text-red-300 border-red-500/30';
    StatusIcon = AlertOctagon;
  } else if (status === 'WARNING' || score < 70) {
    statusColor = 'text-amber-400';
    strokeColor = '#F59E0B';
    glowColor = 'rgba(245, 158, 11, 0.25)';
    bgStatus = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    StatusIcon = AlertTriangle;
  }

  const pScores = health?.parameterScores;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl pointer-events-none -top-10 transition-colors duration-500"
        style={{ background: glowColor }}
      />

      {/* Header title */}
      <div className="w-full flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            COMPOSITE HEALTH SCORE
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono">
          {trendDelta >= 0 ? (
            <span className="text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{trendDelta.toFixed(1)}%
            </span>
          ) : (
            <span className="text-red-400 flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trendDelta.toFixed(1)}%
            </span>
          )}
          <span className="text-slate-400 text-[10px]">trend</span>
        </div>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-52 h-44 flex items-center justify-center my-1 z-10">
        <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 200 200">
          {/* Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#1E293B"
            strokeWidth="14"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transform rotate-140 origin-center"
          />
          {/* Animated Value Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transform rotate-140 origin-center transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner Gauge Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 pointer-events-none">
          <div className="text-4xl font-extrabold tracking-tight font-mono tabular-nums text-white">
            {score}%
          </div>
          <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold mt-0.5">
            MOTOR HEALTH
          </div>
          <div
            className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1 ${bgStatus}`}
          >
            <StatusIcon className="w-3 h-3" />
            {status}
          </div>
        </div>
      </div>

      {/* Parameter Contributions Sub-scores */}
      <div className="w-full mt-2 pt-3 border-t border-slate-800/80 z-10">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>WEIGHTED HEALTH INDEX</span>
          <span>SUB-SCORE</span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {[
            { label: 'Temperature', score: pScores?.temperature.score ?? 95, weight: '20%' },
            { label: 'Vibration', score: pScores?.vibration.score ?? 92, weight: '25%' },
            { label: 'Current', score: pScores?.current.score ?? 94, weight: '20%' },
            { label: 'Voltage', score: pScores?.voltage.score ?? 98, weight: '15%' },
            { label: 'Speed (RPM)', score: pScores?.rpm.score ?? 96, weight: '20%' },
          ].map((param) => {
            const pScore = param.score;
            let barColor = 'bg-emerald-500';
            if (pScore < 40) barColor = 'bg-red-500';
            else if (pScore < 70) barColor = 'bg-amber-500';

            return (
              <div key={param.label} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-300 w-24 truncate">
                  {param.label}
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(5, pScore))}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-slate-300 font-semibold w-8 text-right">
                  {pScore}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
