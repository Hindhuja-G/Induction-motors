import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import { AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';

export const EarlyWarningBanner: React.FC = () => {
  const { telemetry } = useTelemetry();

  const primaryWarning = telemetry?.latestTrends?.primaryWarning;
  const isCritical = telemetry?.latestHealth?.status === 'CRITICAL';

  // Do not show early warning banner if critical banner is already active
  if (!primaryWarning || isCritical) return null;

  const isHighRisk = primaryWarning.riskLevel === 'HIGH';

  return (
    <div
      className={`rounded-xl p-4 mb-6 border transition-all ${
        isHighRisk
          ? 'bg-amber-950/60 border-amber-600/70 text-amber-100'
          : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-amber-400 tracking-wider">
                EARLY WARNING ADVISORY
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold uppercase ${
                  isHighRisk ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-900/60 text-amber-300'
                }`}
              >
                Risk: {primaryWarning.riskLevel}
              </span>
            </div>

            <div className="text-sm font-semibold font-sans mt-0.5 text-white">
              {primaryWarning.title}
            </div>

            <p className="text-xs text-amber-200/90 mt-1 font-mono">
              {primaryWarning.description}
            </p>
          </div>
        </div>

        {/* Engineering recommendation pill */}
        <div className="w-full sm:w-auto p-2.5 bg-slate-950/60 border border-amber-900/40 rounded-lg text-xs font-mono shrink-0 max-w-sm">
          <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mb-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
            ENGINEERING RECOMMENDATION
          </div>
          <div className="text-[11px] text-slate-300">
            {primaryWarning.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
