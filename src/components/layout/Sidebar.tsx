import React from 'react';
import {
  LayoutDashboard,
  Activity,
  HeartPulse,
  AlertOctagon,
  LineChart,
  BellRing,
  Sliders,
  Settings,
  Cpu,
  Layers,
  FileCode,
  X,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext.tsx';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { telemetry, unreadAlertsCount } = useTelemetry();

  const esp32Connected = telemetry?.hardwareConnected ?? false;
  const wifiConnected = telemetry?.wifiConnected ?? false;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Activity },
    { id: 'health', label: 'Health Analysis', icon: HeartPulse },
    { id: 'faults', label: 'Fault Detection', icon: AlertOctagon },
    { id: 'trends', label: 'Trends & History', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: BellRing, badge: unreadAlertsCount },
    { id: 'control', label: 'Motor Control', icon: Sliders },
    { id: 'config', label: 'Motor Configuration', icon: Settings },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Layers },
    { id: 'hardware', label: 'Hardware & Firmware', icon: FileCode },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              ⚙
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white font-sans">
                MOTOR HEALTH
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                ECE FINAL YEAR PROJ
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-600 text-white rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Hardware Status Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-2.5">
          <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            CONTROLLER TELEMETRY
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              ESP32
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  esp32Connected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-600'
                }`}
              />
              <span className={esp32Connected ? 'text-emerald-400' : 'text-slate-500'}>
                {esp32Connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              Wi-Fi Link
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  wifiConnected ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
              <span className={wifiConnected ? 'text-emerald-400' : 'text-slate-500'}>
                {wifiConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Core Mode</span>
            <span className="text-slate-300">
              {telemetry?.operatingMode === 'DEMO_MODE' ? 'Demo Sim' : 'Live ESP32'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
