import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import {
  Sliders,
  Play,
  RotateCcw,
  Flame,
  Activity,
  Zap,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DemoControlBar: React.FC = () => {
  const { telemetry, applyScenario, updateSensors } = useTelemetry();
  const [expanded, setExpanded] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('NORMAL');

  const isDemo = telemetry?.operatingMode === 'DEMO_MODE';
  if (!isDemo) return null;

  const readings = telemetry?.currentReadings || {
    temperature: 42.5,
    vibration: 1.6,
    current: 0.85,
    voltage: 12.0,
    rpm: 1450,
  };

  const handleScenarioClick = async (scenario: string) => {
    setActiveScenario(scenario);
    await applyScenario(scenario);
  };

  const handleSliderChange = async (key: string, value: number) => {
    const updated = { ...readings, [key]: value };
    await updateSensors(updated);
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 sm:p-4 mb-6 shadow-xl shadow-cyan-950/20 backdrop-blur-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                DEMO MODE · SIMULATED SENSOR DATA
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                (Project Presentation & Defence Controls)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Test fault injection, real-time health score degradation, and automatic relay protection.
            </p>
          </div>
        </div>

        {/* Toggle Slider Controls */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-end md:self-auto"
        >
          <span>{expanded ? 'Hide Manual Sliders' : 'Fine-Tune Sliders'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-800">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
          SCENARIOS:
        </span>

        <button
          onClick={() => handleScenarioClick('NORMAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'NORMAL'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          NORMAL
        </button>

        <button
          onClick={() => handleScenarioClick('WARNING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'WARNING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3 h-3 text-amber-400" />
          WARNING
        </button>

        <button
          onClick={() => handleScenarioClick('OVERHEATING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'OVERHEATING'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-400" />
          OVERHEATING (72°C)
        </button>

        <button
          onClick={() => handleScenarioClick('HIGH_VIBRATION')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'HIGH_VIBRATION'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3 h-3 text-purple-400" />
          HIGH VIBRATION (4.6 mm/s)
        </button>

        <button
          onClick={() => handleScenarioClick('OVERCURRENT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'OVERCURRENT'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3 h-3 text-orange-400" />
          OVERCURRENT (1.55A)
        </button>

        <button
          onClick={() => handleScenarioClick('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeScenario === 'CRITICAL'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse'
              : 'bg-red-950/60 text-red-300 border border-red-800/80 hover:bg-red-900/50'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-300" />
          CRITICAL MULTI-FAULT
        </button>

        <button
          onClick={() => handleScenarioClick('RECOVERY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeScenario === 'RECOVERY'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3 h-3 text-teal-400" />
          RECOVERY
        </button>
      </div>

      {/* Manual Interactive Sliders Drawer */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-800">
          {/* Temperature Slider */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Temperature</span>
              <span className="text-white font-bold">{readings.temperature}°C</span>
            </div>
            <input
              type="range"
              min="25"
              max="95"
              step="0.5"
              value={readings.temperature}
              onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>25°C</span>
              <span className="text-amber-500">55°C (Warn)</span>
              <span className="text-red-500">70°C (Crit)</span>
            </div>
          </div>

          {/* Vibration Slider */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Vibration</span>
              <span className="text-white font-bold">{readings.vibration} mm/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={readings.vibration}
              onChange={(e) => handleSliderChange('vibration', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.5</span>
              <span className="text-amber-500">2.5 (Warn)</span>
              <span className="text-red-500">4.0 (Crit)</span>
            </div>
          </div>

          {/* Current Slider */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Current</span>
              <span className="text-white font-bold">{readings.current} A</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={readings.current}
              onChange={(e) => handleSliderChange('current', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.1A</span>
              <span className="text-amber-500">1.1A (Warn)</span>
              <span className="text-red-500">1.4A (Crit)</span>
            </div>
          </div>

          {/* Voltage Slider */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Voltage</span>
              <span className="text-white font-bold">{readings.voltage} V</span>
            </div>
            <input
              type="range"
              min="8.0"
              max="16.0"
              step="0.1"
              value={readings.voltage}
              onChange={(e) => handleSliderChange('voltage', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span className="text-red-500">10.5V</span>
              <span className="text-emerald-500">12.0V</span>
              <span className="text-red-500">13.5V</span>
            </div>
          </div>

          {/* Speed / RPM Slider */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Speed</span>
              <span className="text-white font-bold">{readings.rpm} RPM</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={readings.rpm}
              onChange={(e) => handleSliderChange('rpm', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span className="text-red-500">1200</span>
              <span className="text-emerald-500">1450</span>
              <span className="text-red-500">1650</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
