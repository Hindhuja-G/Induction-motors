import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import { RealtimeTrendChart } from '../components/common/RealtimeTrendChart.tsx';
import { DemoControlBar } from '../components/common/DemoControlBar.tsx';
import {
  Activity,
  Radio,
  Thermometer,
  Zap,
  Gauge,
  RotateCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export const LiveMonitoringView: React.FC = () => {
  const { telemetry, config, lastUpdatedSecondsAgo } = useTelemetry();

  const readings = telemetry?.currentReadings || {
    temperature: 42.5,
    vibration: 1.6,
    current: 0.85,
    voltage: 12.0,
    rpm: 1450,
  };

  const health = telemetry?.latestHealth;

  const parameters = [
    {
      name: 'Temperature',
      key: 'temperature',
      value: readings.temperature,
      unit: '°C',
      nominal: 42.0,
      warning: config?.temp_warning_limit ?? 55.0,
      critical: config?.temp_critical_limit ?? 70.0,
      status: health?.parameterScores.temperature.status ?? 'NORMAL',
      icon: Thermometer,
      description: 'Thermal rise indicates copper loss (I²R) or ventilation obstruction.',
    },
    {
      name: 'Vibration',
      key: 'vibration',
      value: readings.vibration,
      unit: 'mm/s',
      nominal: 1.5,
      warning: config?.vibration_warning_limit ?? 2.5,
      critical: config?.vibration_critical_limit ?? 4.0,
      status: health?.parameterScores.vibration.status ?? 'NORMAL',
      icon: Activity,
      description: 'High velocity RMS signals mechanical unbalance or bearing spalling.',
    },
    {
      name: 'Current',
      key: 'current',
      value: readings.current,
      unit: 'A',
      nominal: config?.rated_current ?? 0.85,
      warning: config?.current_warning_limit ?? 1.10,
      critical: config?.current_critical_limit ?? 1.40,
      status: health?.parameterScores.current.status ?? 'NORMAL',
      icon: Zap,
      description: 'Stator current draw directly correlates with shaft mechanical torque.',
    },
    {
      name: 'Voltage',
      key: 'voltage',
      value: readings.voltage,
      unit: 'V',
      nominal: config?.rated_voltage ?? 12.0,
      warning: 10.5,
      critical: 13.5,
      status: health?.parameterScores.voltage.status ?? 'NORMAL',
      icon: Gauge,
      description: 'Under-voltage provokes elevated slip and winding heating.',
    },
    {
      name: 'Shaft Speed',
      key: 'rpm',
      value: readings.rpm,
      unit: 'RPM',
      nominal: config?.rated_speed ?? 1450,
      warning: config?.rpm_min ?? 1200,
      critical: 1000,
      status: health?.parameterScores.rpm.status ?? 'NORMAL',
      icon: RotateCw,
      description: 'Speed droop reflects rotor mechanical drag and load slippage.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              HIGH-FREQUENCY STREAM
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Live Condition Monitoring
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time telemetry stream synchronized with physical ESP32 controller and database buffer.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Stream Rate:</span>
            <span className="text-emerald-300 font-bold">2.0 Hz (500ms sample window)</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Last Telemetry:</span>
            <span className="text-white font-bold">{lastUpdatedSecondsAgo}s ago</span>
          </div>
        </div>
      </div>

      <DemoControlBar />

      {/* High-Density Parameter Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parameters.map((p) => {
          const Icon = p.icon;
          let badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          let borderClass = 'border-slate-800';
          let StatusIcon = ShieldCheck;

          if (p.status === 'CRITICAL') {
            badgeClass = 'text-red-400 bg-red-500/10 border-red-500/30';
            borderClass = 'border-red-900/60 shadow-lg shadow-red-950/20';
            StatusIcon = AlertOctagon;
          } else if (p.status === 'WARNING') {
            badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            borderClass = 'border-amber-900/60 shadow-lg shadow-amber-950/20';
            StatusIcon = AlertTriangle;
          }

          return (
            <div
              key={p.name}
              className={`bg-slate-900 p-4 rounded-xl border flex flex-col justify-between ${borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold uppercase text-white">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.unit} measurement
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${badgeClass}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {p.status}
                  </span>
                </div>

                <div className="my-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                      {p.value}
                    </span>
                    <span className="text-sm font-mono text-slate-400 ml-1.5 font-medium">
                      {p.unit}
                    </span>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <div>Nominal: {p.nominal}{p.unit}</div>
                  </div>
                </div>

                {/* Tolerance Bands Spectrum */}
                <div className="space-y-1 my-2 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Range Bands</span>
                    <span>
                      Warn: {p.warning}{p.unit} · Crit: {p.critical}{p.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                    <div className="w-3/5 bg-emerald-500/60 h-full" title="Normal Region" />
                    <div className="w-1/5 bg-amber-500/70 h-full" title="Warning Region" />
                    <div className="w-1/5 bg-red-500/80 h-full" title="Critical Region" />
                  </div>
                </div>
              </div>

              <p className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                {p.description}
              </p>
            </div>
          );
        })}

        {/* Live Packet Frame Inspector Card */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-300">
                LATEST INCOMING TELEMETRY FRAME
              </span>
              <span className="text-[10px] text-emerald-400">VALID CRC32</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-cyan-300 space-y-1">
              <div>{`{`}</div>
              <div className="pl-3 text-slate-400">
                "temp": <span className="text-rose-400">{readings.temperature}</span>,
              </div>
              <div className="pl-3 text-slate-400">
                "vib": <span className="text-purple-400">{readings.vibration}</span>,
              </div>
              <div className="pl-3 text-slate-400">
                "curr": <span className="text-amber-400">{readings.current}</span>,
              </div>
              <div className="pl-3 text-slate-400">
                "volt": <span className="text-blue-400">{readings.voltage}</span>,
              </div>
              <div className="pl-3 text-slate-400">
                "rpm": <span className="text-cyan-400">{readings.rpm}</span>
              </div>
              <div>{`}`}</div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
            <span>Transport: HTTP POST / WebSocket</span>
            <span>Encoding: JSON (256 bytes)</span>
          </div>
        </div>
      </div>

      {/* Dual Waveform Analysis */}
      <div>
        <div className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-3">
          DYNAMIC WAVEFORM TRACE OSCILLOSCOPE
        </div>
        <RealtimeTrendChart initialMetric="vibration" />
      </div>
    </div>
  );
};
