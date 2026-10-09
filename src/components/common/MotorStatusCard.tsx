import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import {
  Play,
  Square,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Power,
  SlidersHorizontal,
} from 'lucide-react';

export const MotorStatusCard: React.FC = () => {
  const {
    telemetry,
    startMotor,
    stopMotor,
    resetTrip,
    setControlMode,
  } = useTelemetry();

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const motorStatus = telemetry?.motorStatus ?? 'RUNNING';
  const relayStatus = telemetry?.relayStatus ?? 'ON';
  const controlMode = telemetry?.controlMode ?? 'AUTO';
  const healthStatus = telemetry?.latestHealth?.status ?? 'NORMAL';
  const isProtected = telemetry?.protectionActive ?? false;
  const protectionReason = telemetry?.protectionReason;

  const showTemporaryFeedback = (text: string, error = false) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleStart = async () => {
    setLoading(true);
    const res = await startMotor();
    setLoading(false);
    if (!res.success) {
      showTemporaryFeedback(res.message, true);
    } else {
      showTemporaryFeedback(res.message, false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    const res = await stopMotor();
    setLoading(false);
    showTemporaryFeedback(res.message, false);
  };

  const handleReset = async () => {
    setLoading(true);
    const res = await resetTrip();
    setLoading(false);
    if (!res.success) {
      showTemporaryFeedback(res.message, true);
    } else {
      showTemporaryFeedback(res.message, false);
    }
  };

  // State presentation
  let statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let statusIcon = ShieldCheck;
  let statusTitle = 'RUNNING';

  if (isProtected || motorStatus === 'PROTECTED') {
    statusBadge = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
    statusIcon = ShieldAlert;
    statusTitle = 'PROTECTED';
  } else if (motorStatus === 'STOPPED') {
    statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
    statusIcon = Power;
    statusTitle = 'STOPPED';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              MOTOR DRIVE & RELAY STATUS
            </span>
          </div>

          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${statusBadge}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                motorStatus === 'RUNNING'
                  ? 'bg-emerald-400 animate-ping'
                  : isProtected
                  ? 'bg-red-500'
                  : 'bg-slate-500'
              }`}
            />
            {statusTitle}
          </span>
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs font-mono my-2">
          <div>
            <div className="text-[10px] text-slate-400">RELAY MODULE</div>
            <div className="font-bold flex items-center gap-1 mt-0.5">
              <Zap
                className={`w-3.5 h-3.5 ${
                  relayStatus === 'ON' ? 'text-amber-400' : 'text-slate-600'
                }`}
              />
              <span className={relayStatus === 'ON' ? 'text-amber-300' : 'text-slate-500'}>
                {relayStatus}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">CONTROL MODE</div>
            <div className="font-bold text-slate-200 mt-0.5 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{controlMode}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">HEALTH STATUS</div>
            <div
              className={`font-bold mt-0.5 ${
                healthStatus === 'CRITICAL'
                  ? 'text-red-400'
                  : healthStatus === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {healthStatus}
            </div>
          </div>
        </div>

        {/* Protection Alert Note if tripped */}
        {isProtected && (
          <div className="my-2 p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-xs">
            <div className="font-mono font-bold text-red-300 text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              SAFETY TRIP ACTIVATED
            </div>
            <p className="text-[11px] text-red-200 mt-1">
              Reason: {protectionReason || 'Critical Parameter Limits Exceeded'}
            </p>
          </div>
        )}

        {/* Temporary Feedback Notification */}
        {feedbackMsg && (
          <div
            className={`my-2 p-2.5 rounded-lg text-xs font-mono border ${
              feedbackMsg.error
                ? 'bg-red-950/50 border-red-900/70 text-red-300'
                : 'bg-emerald-950/50 border-emerald-900/70 text-emerald-300'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}
      </div>

      {/* Control Buttons Panel */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={loading || motorStatus === 'RUNNING' || isProtected}
            className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${
              motorStatus === 'RUNNING' || isProtected
                ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-500/20 active:scale-98'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            START MOTOR
          </button>

          <button
            onClick={handleStop}
            disabled={loading || motorStatus === 'STOPPED'}
            className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${
              motorStatus === 'STOPPED'
                ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-rose-700 hover:bg-rose-600 text-white shadow-sm hover:shadow-rose-500/20 active:scale-98'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            STOP MOTOR
          </button>
        </div>

        {/* Protection Reset or Mode Toggles */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {isProtected ? (
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-1.5 px-3 rounded-lg font-mono text-xs font-semibold bg-amber-600/20 border border-amber-600/40 text-amber-300 hover:bg-amber-600/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET SAFETY INTERLOCK
            </button>
          ) : (
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>Automatic protection: Active</span>
              <button
                onClick={() => setControlMode(controlMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Switch to {controlMode === 'AUTO' ? 'MANUAL' : 'AUTO'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
