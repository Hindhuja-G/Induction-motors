import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import {
  Bell,
  Cpu,
  Wifi,
  WifiOff,
  Power,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XOctagon,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenAlertsModal?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAlertsModal, onNavigateToTab }) => {
  const {
    telemetry,
    unreadAlertsCount,
    lastUpdatedSecondsAgo,
    stopMotor,
    setOperatingMode,
    acknowledgeAlerts,
    alerts,
  } = useTelemetry();

  const [showAlertDropdown, setShowAlertDropdown] = useState(false);

  const isDemo = telemetry?.operatingMode === 'DEMO_MODE';
  const esp32Connected = telemetry?.hardwareConnected ?? false;
  const wifiConnected = telemetry?.wifiConnected ?? false;
  const isProtected = telemetry?.protectionActive ?? false;

  const handleEmergencyStop = async () => {
    await stopMotor();
  };

  const recentAlerts = alerts.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Project title & breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-sans whitespace-nowrap">
                IoT Motor Health Monitoring
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                DC Gear Motor Prototype (Induction Sim)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>ESP32 Tensilica Dual-Core</span>
              <span>·</span>
              <span>Last updated: {lastUpdatedSecondsAgo}s ago</span>
            </div>
          </div>
        </div>

        {/* Right Action & Status Center */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setOperatingMode('DEMO_MODE')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                isDemo
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Interactive simulation mode for presentation demonstration"
            >
              DEMO MODE
            </button>
            <button
              onClick={() => setOperatingMode('LIVE_HARDWARE')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                !isDemo
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Direct sensor telemetry streamed from physical ESP32"
            >
              LIVE HARDWARE
            </button>
          </div>

          {/* ESP32 Telemetry Status */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 ${
                esp32Connected ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ESP32</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  esp32Connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="text-[11px]">
                {esp32Connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                wifiConnected ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {wifiConnected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span>Wi-Fi</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  wifiConnected ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
            </div>
          </div>

          {/* Emergency Stop Button */}
          <button
            onClick={handleEmergencyStop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all whitespace-nowrap ${
              isProtected
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow-red-500/20 active:scale-95'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMERGENCY STOP</span>
            <span className="sm:hidden">E-STOP</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertDropdown(!showAlertDropdown)}
              className="relative p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Alerts and Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-mono font-bold rounded-full min-w-4 text-center animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showAlertDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      System Notifications
                    </span>
                    {unreadAlertsCount > 0 && (
                      <span className="text-[10px] font-mono text-red-400">
                        {unreadAlertsCount} unread
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => acknowledgeAlerts()}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recentAlerts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No active alerts. System nominal.
                    </div>
                  ) : (
                    recentAlerts.map((a) => (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-lg border text-xs transition-colors ${
                          a.severity === 'CRITICAL'
                            ? 'bg-red-950/40 border-red-900/60 text-red-200'
                            : a.severity === 'WARNING'
                            ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                            : a.severity === 'RECOVERY'
                            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono font-bold text-[10px] uppercase">
                            {a.severity}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] mb-1">{a.message}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Action: {a.action_taken}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowAlertDropdown(false);
                      onNavigateToTab?.('alerts');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    View All in Alert Center →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
