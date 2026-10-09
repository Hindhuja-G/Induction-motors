import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import {
  Play,
  Square,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sliders,
  Power,
  Clock,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const MotorControlView: React.FC = () => {
  const {
    telemetry,
    startMotor,
    stopMotor,
    resetTrip,
    setControlMode,
  } = useTelemetry();

  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const motorStatus = telemetry?.motorStatus ?? 'RUNNING';
  const relayStatus = telemetry?.relayStatus ?? 'ON';
  const controlMode = telemetry?.controlMode ?? 'AUTO';
  const isProtected = telemetry?.protectionActive ?? false;
  const isCritical = telemetry?.latestHealth?.status === 'CRITICAL';
  const tripCount = telemetry?.tripCount ?? 0;
  const runSeconds = telemetry?.totalRunSeconds ?? 1420;

  const hours = Math.floor(runSeconds / 3600);
  const minutes = Math.floor((runSeconds % 3600) / 60);
  const seconds = runSeconds % 60;

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleStart = async () => {
    setLoading(true);
    const res = await startMotor();
    setLoading(false);
    if (!res.success) {
      showFeedback(res.message, true);
    } else {
      showFeedback(res.message, false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    const res = await stopMotor();
    setLoading(false);
    showFeedback(res.message, false);
  };

  const handleResetTrip = async () => {
    setLoading(true);
    const res = await resetTrip();
    setLoading(false);
    if (!res.success) {
      showFeedback(res.message, true);
    } else {
      showFeedback(res.message, false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              ELECTROMECHANICAL ACTUATION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Motor Control & Relay Switchboard
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Two-way digital command interface with safety interlock gating and hardware trip override.
          </p>
        </div>
      </div>

      {/* Safety Interlock Gating Banner */}
      {isProtected || isCritical ? (
        <div className="p-4 rounded-xl bg-red-950/60 border-2 border-red-600 font-mono text-xs text-red-200">
          <div className="flex items-center gap-2 font-bold text-red-300 text-sm mb-1">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            SAFETY RESTART INTERLOCK ENGAGED: START COMMAND BLOCKED
          </div>
          <p className="mt-1">
            The safety engine has detected that monitored sensory parameters exceed certified limits.
            Unsafe startup is prohibited to protect motor windings, gear teeth, and power drivers.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleResetTrip}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
            >
              Reset Safety Interlock (Verify Safe First)
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 font-mono text-xs text-emerald-300 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Safety interlocks armed. Operational limits clear. Motor start sequence authorized.
          </span>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg font-mono text-xs border ${
            feedback.error
              ? 'bg-red-950/70 border-red-800 text-red-200'
              : 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Switchboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Start / Stop Controls */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase font-bold text-slate-300">
                INDUSTRIAL CONTROLLER PUSHBUTTONS
              </span>
              <span className="text-xs font-mono text-slate-500">
                Target: ESP32 GPIO 23 Relay
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              {/* Start Motor Button */}
              <button
                onClick={handleStart}
                disabled={loading || motorStatus === 'RUNNING' || isProtected || isCritical}
                className={`py-8 px-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                  motorStatus === 'RUNNING' || isProtected || isCritical
                    ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/40 active:scale-95'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <div className="text-center font-mono">
                  <div className="text-base font-bold">START MOTOR</div>
                  <div className="text-[11px] opacity-80">Energize Relay Coil</div>
                </div>
              </button>

              {/* Stop Motor Button */}
              <button
                onClick={handleStop}
                disabled={loading || motorStatus === 'STOPPED'}
                className={`py-8 px-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                  motorStatus === 'STOPPED'
                    ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/40 active:scale-95'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Square className="w-8 h-8 fill-current" />
                </div>
                <div className="text-center font-mono">
                  <div className="text-base font-bold">STOP MOTOR</div>
                  <div className="text-[11px] opacity-80">De-energize Relay Coil</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Automated Protection Logic:</span>
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                onClick={() => setControlMode('AUTO')}
                className={`px-3 py-1 rounded transition-colors ${
                  controlMode === 'AUTO'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AUTO PROTECTION
              </button>
              <button
                onClick={() => setControlMode('MANUAL')}
                className={`px-3 py-1 rounded transition-colors ${
                  controlMode === 'MANUAL'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MANUAL CONTROL
              </button>
            </div>
          </div>
        </div>

        {/* Relay Module & Circuit Status */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200 uppercase">
                CIRCUIT & RELAY DIAGNOSTICS
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Coil Contact State:</span>
                <span
                  className={`font-bold text-sm ${
                    relayStatus === 'ON' ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {relayStatus === 'ON' ? 'ENERGIZED (CLOSED)' : 'DE-ENERGIZED (OPEN)'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Total Safety Trips:</span>
                <span className="text-white font-bold tabular-nums text-sm">
                  {tripCount} events
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Cumulative Run Uptime:</span>
                <span className="text-cyan-300 font-bold tabular-nums text-sm">
                  {hours}h {minutes}m {seconds}s
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Relay Module Hardware:</span>
                <span className="text-slate-300">5V Optocoupled / Active LOW</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Note: All relay commands sent via the web dashboard are dispatched through WebSocket and validated by the backend safety engine before execution.
          </div>
        </div>
      </div>
    </div>
  );
};
