import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import { AlertOctagon, ShieldAlert, RotateCcw } from 'lucide-react';

export const CriticalBanner: React.FC = () => {
  const { telemetry, resetTrip } = useTelemetry();

  const isCritical =
    telemetry?.latestHealth?.status === 'CRITICAL' ||
    telemetry?.protectionActive === true;

  if (!isCritical) return null;

  const readings = telemetry?.currentReadings;
  const faults = telemetry?.latestFaults;
  const primaryFault = faults?.primaryFault || 'Critical Motor Threshold Exceeded';
  const healthScore = telemetry?.latestHealth?.overallScore ?? 28;

  return (
    <div className="bg-red-950/70 border-2 border-red-600/80 rounded-xl p-4 sm:p-5 shadow-2xl shadow-red-950/50 mb-6 animate-pulse">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Headline */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-300 shrink-0">
            <AlertOctagon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold font-sans tracking-tight text-red-100">
                CRITICAL MOTOR CONDITION DETECTED
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                SAFETY TRIP ACTIVE
              </span>
            </div>
            <p className="text-xs text-red-200 mt-1 max-w-2xl font-mono">
              Diagnostic Fault: <strong className="text-white">{primaryFault}</strong>. Automatic
              protection has de-energized relay to protect motor winding and gearbox.
            </p>
          </div>
        </div>

        {/* Right Action / Reset */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
          <button
            onClick={() => resetTrip()}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            CLEAR & RESET INTERLOCK
          </button>
        </div>
      </div>

      {/* Parameter Telemetry Breakdown in Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4 pt-3 border-t border-red-900/60 font-mono text-xs">
        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">HEALTH SCORE</div>
          <div className="text-lg font-bold text-red-100 tabular-nums">{healthScore}%</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">TEMPERATURE</div>
          <div className="text-lg font-bold text-white tabular-nums">{readings?.temperature}°C</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">CURRENT</div>
          <div className="text-lg font-bold text-white tabular-nums">{readings?.current} A</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">VIBRATION</div>
          <div className="text-lg font-bold text-white tabular-nums">{readings?.vibration} mm/s</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">SPEED (RPM)</div>
          <div className="text-lg font-bold text-white tabular-nums">{readings?.rpm}</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">RELAY STATE</div>
          <div className="text-lg font-bold text-red-300 uppercase">OFF (OPEN)</div>
        </div>

        <div className="bg-red-900/40 p-2 rounded border border-red-800/60">
          <div className="text-[10px] text-red-300">MOTOR STATE</div>
          <div className="text-lg font-bold text-red-300 uppercase">STOPPED</div>
        </div>
      </div>
    </div>
  );
};
