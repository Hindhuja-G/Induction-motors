import React from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import { HealthGauge } from '../components/common/HealthGauge.tsx';
import { SensorCard } from '../components/common/SensorCard.tsx';
import { MotorStatusCard } from '../components/common/MotorStatusCard.tsx';
import { CriticalBanner } from '../components/common/CriticalBanner.tsx';
import { EarlyWarningBanner } from '../components/common/EarlyWarningBanner.tsx';
import { DemoControlBar } from '../components/common/DemoControlBar.tsx';
import { RealtimeTrendChart } from '../components/common/RealtimeTrendChart.tsx';
import {
  Thermometer,
  Activity,
  Zap,
  Gauge,
  RotateCw,
  Cpu,
  Layers,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigateToTab: (tab: string) => void }> = ({
  onNavigateToTab,
}) => {
  const { telemetry, config } = useTelemetry();

  const readings = telemetry?.currentReadings || {
    temperature: 42.5,
    vibration: 1.6,
    current: 0.85,
    voltage: 12.0,
    rpm: 1450,
  };

  const health = telemetry?.latestHealth;
  const pScores = health?.parameterScores;
  const trendDeltas = telemetry?.latestTrends?.trendDeltas;
  const history = telemetry?.recentHistory || [];

  const tempHistory = history.map((h) => h.temperature);
  const vibHistory = history.map((h) => h.vibration);
  const currHistory = history.map((h) => h.current);
  const voltHistory = history.map((h) => h.voltage);
  const rpmHistory = history.map((h) => h.rpm);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Project Identification Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              INDUSTRIAL CONDITION MONITORING & PREDICTIVE MAINTENANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            IoT-Based Induction Motor Health Monitoring System
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Continuous sensory telemetry, multi-parameter health indexing, rule-based fault detection & automated relay protection.
          </p>
        </div>

        {/* System Meta Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-slate-400">Motor:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[200px]">
              Prototype DC Gear Motor (Induction Sim)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Controller:</span>
            <span className="text-slate-200 font-semibold">ESP32 240MHz</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Mode:</span>
            <span className="text-emerald-300 font-bold">
              {telemetry?.operatingMode === 'DEMO_MODE' ? 'DEMO SIMULATION' : 'LIVE HARDWARE'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Simulation Bar */}
      <DemoControlBar />

      {/* Critical Condition Banner (Shown only when in Critical status) */}
      <CriticalBanner />

      {/* Early Warning Banner (Shown when monotonic degradation trends detected) */}
      <EarlyWarningBanner />

      {/* Top Core Dashboard Split: Health Gauge + Motor Drive Control + Physical Rig Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Health Gauge (4 cols on desktop) */}
        <div className="lg:col-span-4">
          <HealthGauge health={health} trendDelta={trendDeltas?.health} />
        </div>

        {/* Motor Drive Status & Switchboard (4 cols on desktop) */}
        <div className="lg:col-span-4">
          <MotorStatusCard />
        </div>

        {/* Instrumentation Schematic Cutaway (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider">
                TEST BENCH RIG ARCHITECTURE
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('hardware')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
            >
              Pinouts & Code →
            </button>
          </div>

          <div className="relative h-44 w-full bg-slate-950 overflow-hidden group">
            <img
              src="/src/assets/images/motor_diagnostic_cutaway_1791511148208.jpg"
              alt="Electric Motor and Gearbox Diagnostic Architecture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-300 flex justify-between items-center">
              <span>Instrumentation: 5 Sensors + Relay Interlock</span>
              <span className="text-emerald-400 font-semibold">12V Circuit Safe</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 text-xs font-mono space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Drive Coupling:</span>
              <span className="text-slate-200">DC Gear Reduction 1:12.5</span>
            </div>
            <div className="flex justify-between">
              <span>Sensor Bus:</span>
              <span className="text-slate-200">I2C (LCD) + ADC + Ext Interrupt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sensory Telemetry Cards (5 Primary Parameters) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              REAL-TIME SENSORY TELEMETRY CARDS
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Threshold evaluation active
            </span>
          </div>

          <button
            onClick={() => onNavigateToTab('live')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Open High-Frequency Waveform Stream →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Temperature */}
          <SensorCard
            title="Temperature"
            value={readings.temperature}
            unit="°C"
            status={pScores?.temperature.status ?? 'NORMAL'}
            trendPercent={trendDeltas?.temperature ?? 0}
            icon={Thermometer}
            sparklineData={tempHistory}
            warningLimit={config?.temp_warning_limit ?? 55}
            criticalLimit={config?.temp_critical_limit ?? 70}
            minRange={25}
            maxRange={90}
            subtext="Stator housing surface thermistor"
          />

          {/* 2. Vibration */}
          <SensorCard
            title="Vibration"
            value={readings.vibration}
            unit="mm/s"
            status={pScores?.vibration.status ?? 'NORMAL'}
            trendPercent={trendDeltas?.vibration ?? 0}
            icon={Activity}
            sparklineData={vibHistory}
            warningLimit={config?.vibration_warning_limit ?? 2.5}
            criticalLimit={config?.vibration_critical_limit ?? 4.0}
            minRange={0.5}
            maxRange={6.0}
            subtext="Bearing casing velocity probe"
          />

          {/* 3. Current */}
          <SensorCard
            title="Current"
            value={readings.current}
            unit="A"
            status={pScores?.current.status ?? 'NORMAL'}
            trendPercent={trendDeltas?.current ?? 0}
            icon={Zap}
            sparklineData={currHistory}
            warningLimit={config?.current_warning_limit ?? 1.1}
            criticalLimit={config?.current_critical_limit ?? 1.4}
            minRange={0.1}
            maxRange={2.0}
            subtext="ACS712 Hall-effect sensor"
          />

          {/* 4. Voltage */}
          <SensorCard
            title="Voltage"
            value={readings.voltage}
            unit="V"
            status={pScores?.voltage.status ?? 'NORMAL'}
            trendPercent={trendDeltas?.voltage ?? 0}
            icon={Gauge}
            sparklineData={voltHistory}
            warningLimit={10.5}
            criticalLimit={13.5}
            minRange={8.0}
            maxRange={16.0}
            subtext="Resistive divider power rail"
          />

          {/* 5. Speed / RPM */}
          <SensorCard
            title="Shaft Speed"
            value={readings.rpm}
            unit="RPM"
            status={pScores?.rpm.status ?? 'NORMAL'}
            trendPercent={trendDeltas?.rpm ?? 0}
            icon={RotateCw}
            sparklineData={rpmHistory}
            warningLimit={config?.rpm_min ?? 1200}
            criticalLimit={config?.rpm_max ?? 1650}
            minRange={0}
            maxRange={2000}
            subtext="IR optical slotted disc interrupter"
          />
        </div>
      </div>

      {/* Real-time Trend Graph Component */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              TELEMETRY TRAJECTORY & THRESHOLD ANALYSIS
            </span>
          </div>

          <button
            onClick={() => onNavigateToTab('trends')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium"
          >
            View Historical Table & Export CSV →
          </button>
        </div>

        <RealtimeTrendChart initialMetric="temperature" />
      </div>

      {/* Quick Fault Diagnostics Preview */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              ACTIVE DIAGNOSTIC ENGINE VERDICT
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('faults')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
          >
            Full Diagnostic Matrix →
          </button>
        </div>

        <div className="text-xs font-mono text-slate-300">
          {telemetry?.latestFaults?.activeFaults &&
          telemetry.latestFaults.activeFaults.length > 0 ? (
            <div className="space-y-1.5 mt-2">
              {telemetry.latestFaults.activeFaults.map((f) => (
                <div
                  key={f.id}
                  className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-red-400 font-semibold">{f.title}</span>
                  <span className="text-slate-400 text-[11px]">{f.rootCause}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-emerald-400 flex items-center gap-2 py-1">
              <span>● No active faults detected. Motor parameters comply with all ISO / ECE test limits.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
