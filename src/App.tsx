import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { LiveMonitoringView } from './views/LiveMonitoringView.tsx';
import { HealthAnalysisView } from './views/HealthAnalysisView.tsx';
import { FaultDetectionView } from './views/FaultDetectionView.tsx';
import { TrendsHistoryView } from './views/TrendsHistoryView.tsx';
import { AlertCenterView } from './views/AlertCenterView.tsx';
import { MotorControlView } from './views/MotorControlView.tsx';
import { MotorConfigurationView } from './views/MotorConfigurationView.tsx';
import { SystemDiagnosticsView } from './views/SystemDiagnosticsView.tsx';
import { Esp32HardwareView } from './views/Esp32HardwareView.tsx';
import { Menu } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateToTab={setCurrentTab} />;
      case 'live':
        return <LiveMonitoringView />;
      case 'health':
        return <HealthAnalysisView />;
      case 'faults':
        return <FaultDetectionView />;
      case 'trends':
        return <TrendsHistoryView />;
      case 'alerts':
        return <AlertCenterView />;
      case 'control':
        return <MotorControlView />;
      case 'config':
        return <MotorConfigurationView />;
      case 'diagnostics':
        return <SystemDiagnosticsView />;
      case 'hardware':
        return <Esp32HardwareView />;
      default:
        return <DashboardView onNavigateToTab={setCurrentTab} />;
    }
  };

  return (
    <TelemetryProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Sidebar (Fixed on desktop, drawer on mobile) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Mobile Top Header bar with hamburger button */}
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              MOTOR HEALTH MONITOR
            </span>
            <div className="w-8" /> {/* spacer for alignment */}
          </div>

          {/* Universal Sticky Top Header */}
          <Header
            onOpenAlertsModal={() => setCurrentTab('alerts')}
            onNavigateToTab={setCurrentTab}
          />

          {/* Main Body View */}
          <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            {renderActiveView()}
          </main>

          {/* Industrial Footer */}
          <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              IoT-Based Induction Motor Health Monitoring & Predictive Maintenance System
            </div>
            <div className="text-[11px] text-slate-400">
              ECE Final Year Capstone Project · ESP32 + SQLite + Node.js
            </div>
          </footer>
        </div>
      </div>
    </TelemetryProvider>
  );
}
