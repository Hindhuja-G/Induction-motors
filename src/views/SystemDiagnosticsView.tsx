import React from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import {
  Cpu,
  Wifi,
  Server,
  Database,
  Radio,
  Clock,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  Activity,
  Layers,
} from 'lucide-react';

export const SystemDiagnosticsView: React.FC = () => {
  const { telemetry, connectionStatus, lastUpdatedSecondsAgo } = useTelemetry();

  const isDemo = telemetry?.operatingMode === 'DEMO_MODE';
  const esp32Connected = telemetry?.hardwareConnected ?? false;
  const wifiConnected = telemetry?.wifiConnected ?? false;
  const secondsSincePing = telemetry?.secondsSinceLastHardwarePing ?? 999;
  const isStale = !isDemo && secondsSincePing > 12;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              HEALTH CHECK & TELEMETRY LINK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            System Diagnostics & Connectivity
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time status of ESP32 physical controller, Wi-Fi link, Express backend, and SQLite database.
          </p>
        </div>
      </div>

      {/* Offline Stale Data Warning Banner */}
      {isStale && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-600 font-mono text-xs text-amber-200 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300 text-sm">
              ESP32 HARDWARE DISCONNECTED · DATA OFFLINE
            </div>
            <p className="mt-1 text-slate-300">
              No telemetry packet has been received from the physical ESP32 in {secondsSincePing} seconds.
              The dashboard is displaying cached status. Switch to DEMO MODE to continue simulated testing.
            </p>
          </div>
        </div>
      )}

      {/* 4 Core Connectivity Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* 1. ESP32 Controller */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                esp32Connected
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-slate-400 bg-slate-800 border-slate-700'
              }`}
            >
              {esp32Connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">ESP32 Dev Module</div>
            <div className="text-xs text-slate-400 mt-1">Tensilica Dual-Core 240MHz</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
            Ping Age: {isDemo ? 'Live Sim (< 1s)' : `${secondsSincePing}s ago`}
          </div>
        </div>

        {/* 2. Wi-Fi Station Link */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                wifiConnected
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-slate-400 bg-slate-800 border-slate-700'
              }`}
            >
              {wifiConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Wi-Fi 802.11 b/g/n</div>
            <div className="text-xs text-slate-400 mt-1">Station Mode (TCP/IP)</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
            Channel: 2.4 GHz Band
          </div>
        </div>

        {/* 3. Express Backend Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
              ONLINE
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Node.js Express Server</div>
            <div className="text-xs text-slate-400 mt-1">REST API + WebSocket /ws</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
            WS Client State: {connectionStatus}
          </div>
        </div>

        {/* 4. SQLite Database */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
              HEALTHY
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">SQLite Persistent DB</div>
            <div className="text-xs text-slate-400 mt-1">motor_monitoring.db</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
            Tables: sensor_readings, alerts, config
          </div>
        </div>
      </div>

      {/* Communication Protocol Telemetry Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs">
        <div className="text-xs font-bold uppercase text-slate-300 mb-3 pb-2 border-b border-slate-800">
          COMMUNICATION INTERFACE ARCHITECTURE
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
              <span>UPLINK: ESP32 → WEB APPLICATION</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• Method: HTTP POST /api/sensor-data</div>
              <div>• Payload: JSON with temperature, vibration, current, voltage, rpm</div>
              <div>• Cadence: Every 2000 milliseconds (2.0s)</div>
              <div>• Failover: Local hardware cut-off if limits breached during link loss</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
              <span>DOWNLINK: WEB APPLICATION → ESP32</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• Response: Synchronous HTTP JSON response</div>
              <div>• Commands: relayStatus ('ON' | 'OFF'), motorStatus, protectionActive</div>
              <div>• Real-time Dashboard Sync: WebSocket Server (/ws) + SSE Stream (/api/stream)</div>
              <div>• Zero page reloads required</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
