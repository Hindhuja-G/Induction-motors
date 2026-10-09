import React from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import { HealthGauge } from '../components/common/HealthGauge.tsx';
import {
  HeartPulse,
  Scale,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

export const HealthAnalysisView: React.FC = () => {
  const { telemetry, config } = useTelemetry();

  const health = telemetry?.latestHealth;
  const pScores = health?.parameterScores;
  const score = health?.overallScore ?? 90;

  const weights = [
    {
      name: 'Temperature Weight',
      key: 'temp',
      weight: config?.weight_temp ?? 20,
      subScore: pScores?.temperature.score ?? 95,
      status: pScores?.temperature.status ?? 'NORMAL',
      deviation: pScores?.temperature.deviationPercent ?? 0,
    },
    {
      name: 'Vibration Weight',
      key: 'vibration',
      weight: config?.weight_vibration ?? 25,
      subScore: pScores?.vibration.score ?? 92,
      status: pScores?.vibration.status ?? 'NORMAL',
      deviation: pScores?.vibration.deviationPercent ?? 0,
    },
    {
      name: 'Current Weight',
      key: 'current',
      weight: config?.weight_current ?? 20,
      subScore: pScores?.current.score ?? 94,
      status: pScores?.current.status ?? 'NORMAL',
      deviation: pScores?.current.deviationPercent ?? 0,
    },
    {
      name: 'Voltage Weight',
      key: 'voltage',
      weight: config?.weight_voltage ?? 15,
      subScore: pScores?.voltage.score ?? 98,
      status: pScores?.voltage.status ?? 'NORMAL',
      deviation: pScores?.voltage.deviationPercent ?? 0,
    },
    {
      name: 'Speed (RPM) Weight',
      key: 'rpm',
      weight: config?.weight_rpm ?? 20,
      subScore: pScores?.rpm.score ?? 96,
      status: pScores?.rpm.status ?? 'NORMAL',
      deviation: pScores?.rpm.deviationPercent ?? 0,
    },
  ];

  const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              ALGORITHMIC HEALTH ENGINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Multi-Parameter Health Assessment
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configurable weighted health index combining thermal, electrodynamic, vibrational, and kinematic condition vectors.
          </p>
        </div>
      </div>

      {/* Main Grid: Gauge & Mathematical Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <HealthGauge health={health} trendDelta={telemetry?.latestTrends?.trendDeltas?.health} />
        </div>

        {/* Algorithm Formulation Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase font-bold text-slate-200">
                HEALTH INDEX CALCULATION FORMULA
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-cyan-400 font-bold">
                Health Score = Σ(SubScore_i × Weight_i) / Σ(Weight_i)
              </div>
              <p className="text-[11px] text-slate-400">
                Where each parameter sub-score (0–100) is normalized against its configured nominal,
                warning, and critical tolerances.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300">
                <strong>Safety Gating Interlock:</strong> If ANY single parameter breaches its
                CRITICAL limit, the overall Health Score is automatically capped at ≤ 38%
                regardless of other nominal readings to enforce prompt motor protection.
              </div>
            </div>
          </div>

          {/* Classification Tiers */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              HEALTH CLASSIFICATION TIERS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <div className="text-[10px] text-emerald-400 font-bold">90 – 100%</div>
                <div className="font-bold mt-0.5">EXCELLENT</div>
                <div className="text-[10px] text-slate-400 mt-1">Optimal baseline</div>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300">
                <div className="text-[10px] text-cyan-400 font-bold">70 – 89%</div>
                <div className="font-bold mt-0.5">NORMAL</div>
                <div className="text-[10px] text-slate-400 mt-1">Standard run state</div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
                <div className="text-[10px] text-amber-400 font-bold">40 – 69%</div>
                <div className="font-bold mt-0.5">WARNING</div>
                <div className="text-[10px] text-slate-400 mt-1">Increased stress</div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300">
                <div className="text-[10px] text-red-400 font-bold">0 – 39%</div>
                <div className="font-bold mt-0.5">CRITICAL</div>
                <div className="text-[10px] text-slate-400 mt-1">Protection tripped</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Score Parameter Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              PARAMETER VECTOR SUB-SCORES & SENSITIVITY BREAKDOWN
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Weight: {totalWeight}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">PARAMETER</th>
                <th className="pb-3 font-semibold">CONFIG WEIGHT</th>
                <th className="pb-3 font-semibold">SUB-SCORE</th>
                <th className="pb-3 font-semibold">CONDITION</th>
                <th className="pb-3 font-semibold">DEVIATION</th>
                <th className="pb-3 font-semibold text-right">WEIGHTED CONTRIBUTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {weights.map((w) => {
                const weightedContrib = ((w.subScore * w.weight) / totalWeight).toFixed(1);
                let badge = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                if (w.status === 'CRITICAL') badge = 'text-red-400 bg-red-500/10 border-red-500/30';
                else if (w.status === 'WARNING') badge = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                return (
                  <tr key={w.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-white">{w.name}</td>
                    <td className="py-3 text-slate-300">{w.weight}%</td>
                    <td className="py-3 tabular-nums font-bold text-slate-200">
                      {w.subScore}%
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {w.deviation > 0 ? `+${w.deviation}%` : `${w.deviation}%`}
                    </td>
                    <td className="py-3 text-right font-bold text-cyan-400 tabular-nums">
                      +{weightedContrib} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
