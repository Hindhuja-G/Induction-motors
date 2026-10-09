import React from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Wrench,
  Search,
  Activity,
  Flame,
  Zap,
  Gauge,
  RotateCw,
} from 'lucide-react';

export const FaultDetectionView: React.FC = () => {
  const { telemetry, config } = useTelemetry();

  const faults = telemetry?.latestFaults;
  const activeFaults = faults?.activeFaults || [];
  const multiParam = faults?.multiParameterFault;
  const readings = telemetry?.currentReadings;

  const catalogRules = [
    {
      parameter: 'Temperature',
      condition: `T >= ${config?.temp_critical_limit ?? 70}°C`,
      faultTitle: 'Severe Motor Overheating',
      severity: 'CRITICAL',
      rootCause: 'Thermal dissipation breakdown, ventilation blockage, continuous electrical overload.',
      action: 'Automatic relay trip. Allow cooling, inspect stator insulation and cooling airflow.',
      icon: Flame,
    },
    {
      parameter: 'Temperature',
      condition: `T >= ${config?.temp_warning_limit ?? 55}°C`,
      faultTitle: 'Elevated Temperature Advisory',
      severity: 'WARNING',
      rootCause: 'Rising thermal load, slight overcurrent, or partial heat sink blockage.',
      action: 'Verify duty cycle and check cooling airflow.',
      icon: Flame,
    },
    {
      parameter: 'Vibration',
      condition: `V >= ${config?.vibration_critical_limit ?? 4.0} mm/s`,
      faultTitle: 'Excessive Mechanical Vibration',
      severity: 'CRITICAL',
      rootCause: 'Rotor mass eccentricity, loose foundation bolts, bearing race flaking, gear tooth defect.',
      action: 'Emergency trip. Inspect coupling alignment, motor mountings, and bearing play.',
      icon: Activity,
    },
    {
      parameter: 'Current',
      condition: `I >= ${config?.current_critical_limit ?? 1.4} A`,
      faultTitle: 'Dangerous Overcurrent / Stall Condition',
      severity: 'CRITICAL',
      rootCause: 'Rotor lock/stall, excessive mechanical load, shorted winding turns.',
      action: 'Emergency cutoff. Inspect output gearbox for mechanical binding before power-up.',
      icon: Zap,
    },
    {
      parameter: 'Voltage',
      condition: `V < ${config?.voltage_min ?? 10.5} V or V > ${config?.voltage_max ?? 13.5} V`,
      faultTitle: 'Supply Voltage Rail Anomaly',
      severity: 'CRITICAL',
      rootCause: '12V DC power supply sag or unregulated high surge.',
      action: 'Inspect DC adapter regulation and wire gauge.',
      icon: Gauge,
    },
    {
      parameter: 'Speed (RPM)',
      condition: `RPM < ${config?.rpm_min ?? 1200} while energized`,
      faultTitle: 'Abnormal Shaft Speed Droop',
      severity: 'CRITICAL',
      rootCause: 'Mechanical drag on gear train or partial rotor stall.',
      action: 'Check gear mesh and verify IR tachometer alignment.',
      icon: RotateCw,
    },
    {
      parameter: 'Multi-Parameter',
      condition: 'High Temp + High Current + High Vibration + Low RPM',
      faultTitle: 'Combined Mechanical Seizure & Severe Overload',
      severity: 'CRITICAL',
      rootCause: 'Simultaneous electrodynamic and mechanical degradation indicating impending seizure.',
      action: 'Mandatory lockout. Disassemble drive train and inspect rotor bearings.',
      icon: AlertOctagon,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              CONDITION-BASED DIAGNOSTICS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Fault Detection & Diagnostic Engine
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rule-based multi-parameter anomaly cross-referencing and root-cause explanation matrix.
          </p>
        </div>
      </div>

      {/* Multi-Parameter Correlation Hero Card (if active) */}
      {multiParam && (
        <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border-2 border-red-600 rounded-xl p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-300 shrink-0">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] font-bold uppercase rounded">
                  MULTI-PARAMETER CORRELATION
                </span>
                <span className="text-sm font-bold font-sans text-white">
                  {multiParam.title}
                </span>
              </div>
              <p className="text-xs font-mono text-red-200 mt-1">
                Root Cause: {multiParam.rootCause}
              </p>
              <div className="mt-3 p-3 bg-slate-950/70 border border-red-900/60 rounded-lg text-xs font-mono text-slate-200">
                <div className="text-[10px] text-red-400 font-bold uppercase mb-1">
                  MANDATORY CORRECTIVE ACTION
                </div>
                <div>{multiParam.recommendation}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Faults Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              CURRENTLY ACTIVE FAULTS ({activeFaults.length})
            </span>
          </div>
        </div>

        {activeFaults.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 rounded-lg border border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-emerald-300 font-sans">
              Zero Faults Active
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              All electrical, vibrational, thermal, and rotational sensor vectors are within safe operational limits.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeFaults.map((f) => {
              const isCrit = f.severity === 'CRITICAL';
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border font-mono text-xs ${
                    isCrit
                      ? 'bg-red-950/50 border-red-800/80 text-red-200'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isCrit ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="font-bold text-sm text-white">{f.title}</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Parameter: <strong className="text-white">{f.parameter}</strong> (Val:{' '}
                      {f.currentValue}
                      {f.unit})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-[11px]">
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                        DIAGNOSED ROOT CAUSE
                      </div>
                      <div className="text-slate-200">{f.rootCause}</div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                      <div className="text-[10px] text-cyan-400 font-bold uppercase mb-0.5">
                        RECOMMENDED MAINTENANCE ACTION
                      </div>
                      <div className="text-slate-200">{f.recommendation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Fault Detection Rules Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              RULE-BASED FAULT DETECTION LOGIC MATRIX
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Pre-programmed ECE Project Diagnostic Knowledge Base
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {catalogRules.map((rule, idx) => {
            const Icon = rule.icon;
            const isCrit = rule.severity === 'CRITICAL';
            return (
              <div
                key={idx}
                className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs">{rule.faultTitle}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isCrit ? 'text-red-400 bg-red-950/80 border border-red-800/60' : 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-300 font-semibold mb-1">
                    Trigger Condition: {rule.condition}
                  </div>

                  <div className="text-[11px] text-slate-400 mb-2">
                    <strong>Cause:</strong> {rule.rootCause}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{rule.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
