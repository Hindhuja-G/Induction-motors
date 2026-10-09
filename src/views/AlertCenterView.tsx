import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import {
  BellRing,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  RotateCcw,
  Trash2,
  Check,
} from 'lucide-react';

export const AlertCenterView: React.FC = () => {
  const { alerts, acknowledgeAlerts, clearAlerts } = useTelemetry();
  const [filter, setFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              AUDIT TRAIL & LOGS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Alert & Alarm Center
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Chronological log of critical threshold trips, early warning advisories, and system recovery actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => acknowledgeAlerts()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Acknowledge All
          </button>

          <button
            onClick={() => clearAlerts()}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 hover:bg-red-900/40 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono w-fit">
        {(['ALL', 'CRITICAL', 'WARNING', 'RECOVERY', 'INFO'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === f
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts Timeline List */}
      <div className="space-y-3 font-mono text-xs">
        {filteredAlerts.length === 0 ? (
          <div className="p-10 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            No alerts logged matching filter '{filter}'.
          </div>
        ) : (
          filteredAlerts.map((a) => {
            let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
            let cardBg = 'bg-slate-900 border-slate-800';
            let Icon = Info;

            if (a.severity === 'CRITICAL') {
              badgeBg = 'bg-red-600 text-white border-red-500';
              cardBg = 'bg-red-950/30 border-red-900/60';
              Icon = AlertOctagon;
            } else if (a.severity === 'WARNING') {
              badgeBg = 'bg-amber-600 text-white border-amber-500';
              cardBg = 'bg-amber-950/25 border-amber-900/50';
              Icon = AlertTriangle;
            } else if (a.severity === 'RECOVERY') {
              badgeBg = 'bg-emerald-600 text-white border-emerald-500';
              cardBg = 'bg-emerald-950/25 border-emerald-900/50';
              Icon = RotateCcw;
            }

            return (
              <div
                key={a.id}
                className={`p-4 rounded-xl border transition-all ${cardBg} ${
                  !a.acknowledged ? 'ring-1 ring-cyan-500/30' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeBg}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Parameter: <strong className="text-white">{a.parameter}</strong>
                    </span>
                    {a.value !== null && a.value !== undefined && (
                      <span className="text-slate-300 text-[11px]">
                        Value: {a.value}
                        {a.unit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{new Date(a.timestamp).toLocaleString()}</span>
                    {!a.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlerts(a.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-100 text-xs font-sans font-medium">{a.message}</p>
                  <p className="text-[11px] text-cyan-300 bg-slate-950/50 p-2 rounded border border-slate-800/60">
                    <strong className="text-slate-400 uppercase text-[10px]">Action Taken:</strong>{' '}
                    {a.action_taken}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
