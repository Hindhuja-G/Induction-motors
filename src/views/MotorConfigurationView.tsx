import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import { MotorConfig } from '../types.ts';
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export const MotorConfigurationView: React.FC = () => {
  const { config, saveConfig } = useTelemetry();

  const [form, setForm] = useState<MotorConfig>({
    motor_name: 'DC Gear Motor (Induction Sim Prototype)',
    motor_type: '12V High-Torque Gear Motor',
    power_rating: '12W',
    rated_voltage: 12.0,
    rated_current: 0.85,
    rated_speed: 1450,
    temp_warning_limit: 55.0,
    temp_critical_limit: 70.0,
    vibration_warning_limit: 2.5,
    vibration_critical_limit: 4.0,
    current_warning_limit: 1.10,
    current_critical_limit: 1.40,
    voltage_min: 10.5,
    voltage_max: 13.5,
    rpm_min: 1200,
    rpm_max: 1650,
    weight_temp: 20,
    weight_vibration: 25,
    weight_current: 20,
    weight_voltage: 15,
    weight_rpm: 20,
  });

  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const handleChange = (field: keyof MotorConfig, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const totalWeight =
    Number(form.weight_temp || 0) +
    Number(form.weight_vibration || 0) +
    Number(form.weight_current || 0) +
    Number(form.weight_voltage || 0) +
    Number(form.weight_rpm || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      setStatusMsg({
        text: `Configuration Warning: Total parameter weights sum to ${totalWeight}%. Recommended sum is 100%.`,
        error: true,
      });
    }

    setSaving(true);
    const res = await saveConfig(form);
    setSaving(false);

    if (res.success) {
      setStatusMsg({ text: 'Motor configuration & thresholds successfully saved to SQLite database!', error: false });
    } else {
      setStatusMsg({ text: res.message || 'Failed to save configuration', error: true });
    }

    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleResetDefaults = () => {
    setForm({
      motor_name: 'DC Gear Motor (Induction Sim Prototype)',
      motor_type: '12V High-Torque Gear Motor',
      power_rating: '12W',
      rated_voltage: 12.0,
      rated_current: 0.85,
      rated_speed: 1450,
      temp_warning_limit: 55.0,
      temp_critical_limit: 70.0,
      vibration_warning_limit: 2.5,
      vibration_critical_limit: 4.0,
      current_warning_limit: 1.10,
      current_critical_limit: 1.40,
      voltage_min: 10.5,
      voltage_max: 13.5,
      rpm_min: 1200,
      rpm_max: 1650,
      weight_temp: 20,
      weight_vibration: 25,
      weight_current: 20,
      weight_voltage: 15,
      weight_rpm: 20,
    });
    setStatusMsg({ text: 'Form populated with factory benchmark defaults. Click Save to apply.', error: false });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              MACHINE RATINGS & TRIP TOLERANCES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Motor Profile & Threshold Configuration
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure motor nameplate specifications, warning triggers, and critical relay trip limits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Load Benchmark Defaults
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl font-mono text-xs border flex items-center gap-2 ${
            statusMsg.error
              ? 'bg-red-950/60 border-red-800 text-red-200'
              : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
          }`}
        >
          {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Motor Identity & Nameplate Ratings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-300 mb-4 pb-2 border-b border-slate-800">
            01. MOTOR NAMEPLATE & IDENTITY
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Motor Equipment Name</label>
              <input
                type="text"
                value={form.motor_name}
                onChange={(e) => handleChange('motor_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Motor Type / Subsystem</label>
              <input
                type="text"
                value={form.motor_type}
                onChange={(e) => handleChange('motor_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Power Rating Label</label>
              <input
                type="text"
                value={form.power_rating}
                onChange={(e) => handleChange('power_rating', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Rated Nominal Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                value={form.rated_voltage}
                onChange={(e) => handleChange('rated_voltage', parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Rated Full-Load Current (A)</label>
              <input
                type="number"
                step="0.05"
                value={form.rated_current}
                onChange={(e) => handleChange('rated_current', parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Rated Synchronous/Shaft Speed (RPM)</label>
              <input
                type="number"
                step="10"
                value={form.rated_speed}
                onChange={(e) => handleChange('rated_speed', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 tabular-nums"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Sensor Warning & Critical Trip Limits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-300 mb-4 pb-2 border-b border-slate-800">
            02. SENSOR OPERATIONAL THRESHOLDS & RELAY TRIP LIMITS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-mono text-xs">
            {/* Temperature */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-rose-400 block">Temperature Thresholds (°C)</span>
              <div>
                <label className="text-slate-400 block mb-1">Warning Threshold (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.temp_warning_limit}
                  onChange={(e) => handleChange('temp_warning_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Critical Trip Limit (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.temp_critical_limit}
                  onChange={(e) => handleChange('temp_critical_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-red-900/60 text-red-200 tabular-nums font-bold"
                />
              </div>
            </div>

            {/* Vibration */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-purple-400 block">Vibration Thresholds (mm/s)</span>
              <div>
                <label className="text-slate-400 block mb-1">Warning Threshold (mm/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.vibration_warning_limit}
                  onChange={(e) => handleChange('vibration_warning_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Critical Trip Limit (mm/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.vibration_critical_limit}
                  onChange={(e) => handleChange('vibration_critical_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-red-900/60 text-red-200 tabular-nums font-bold"
                />
              </div>
            </div>

            {/* Current */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-amber-400 block">Current Draw Thresholds (A)</span>
              <div>
                <label className="text-slate-400 block mb-1">Warning Threshold (A)</label>
                <input
                  type="number"
                  step="0.05"
                  value={form.current_warning_limit}
                  onChange={(e) => handleChange('current_warning_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Critical Trip Limit (A)</label>
                <input
                  type="number"
                  step="0.05"
                  value={form.current_critical_limit}
                  onChange={(e) => handleChange('current_critical_limit', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-red-900/60 text-red-200 tabular-nums font-bold"
                />
              </div>
            </div>

            {/* Voltage */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-blue-400 block">Supply Voltage Envelope (V)</span>
              <div>
                <label className="text-slate-400 block mb-1">Minimum Voltage Bound (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.voltage_min}
                  onChange={(e) => handleChange('voltage_min', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Maximum Voltage Bound (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.voltage_max}
                  onChange={(e) => handleChange('voltage_max', parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
            </div>

            {/* Speed RPM */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-cyan-400 block">Speed Bounds (RPM)</span>
              <div>
                <label className="text-slate-400 block mb-1">Minimum Operating RPM</label>
                <input
                  type="number"
                  step="10"
                  value={form.rpm_min}
                  onChange={(e) => handleChange('rpm_min', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Maximum Safe Over-Speed (RPM)</label>
                <input
                  type="number"
                  step="10"
                  value={form.rpm_max}
                  onChange={(e) => handleChange('rpm_max', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-white tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Health Score Weight Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              03. COMPOSITE HEALTH SCORE SENSITIVITY WEIGHTS
            </span>
            <span className={`text-xs font-mono font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Sum: {totalWeight}% (Target: 100%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Temperature Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weight_temp}
                onChange={(e) => handleChange('weight_temp', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Vibration Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weight_vibration}
                onChange={(e) => handleChange('weight_vibration', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Current Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weight_current}
                onChange={(e) => handleChange('weight_current', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Voltage Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weight_voltage}
                onChange={(e) => handleChange('weight_voltage', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Speed (RPM) Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weight_rpm}
                onChange={(e) => handleChange('weight_rpm', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING CONFIGURATION...' : 'SAVE CONFIGURATION TO DATABASE'}
          </button>
        </div>
      </form>
    </div>
  );
};
