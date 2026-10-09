import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertItem,
  MotorConfig,
  OperatingMode,
  ControlMode,
  SystemTelemetryState,
} from '../types.ts';

interface TelemetryContextType {
  telemetry: SystemTelemetryState | null;
  config: MotorConfig | null;
  alerts: AlertItem[];
  unreadAlertsCount: number;
  connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  lastUpdatedSecondsAgo: number;
  startMotor: () => Promise<{ success: boolean; message: string; blocked?: boolean }>;
  stopMotor: () => Promise<{ success: boolean; message: string }>;
  resetTrip: () => Promise<{ success: boolean; message: string }>;
  setControlMode: (mode: ControlMode) => Promise<void>;
  setOperatingMode: (mode: OperatingMode) => Promise<void>;
  applyScenario: (scenario: string) => Promise<void>;
  updateSensors: (sensors: {
    temperature: number;
    vibration: number;
    current: number;
    voltage: number;
    rpm: number;
  }) => Promise<void>;
  saveConfig: (newConfig: MotorConfig) => Promise<{ success: boolean; message?: string }>;
  acknowledgeAlerts: (id?: number) => Promise<void>;
  clearAlerts: () => Promise<void>;
  refreshTelemetry: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetryState | null>(null);
  const [config, setConfig] = useState<MotorConfig | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [lastUpdatedSecondsAgo, setLastUpdatedSecondsAgo] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track last updated timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuration');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const refreshTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const state: SystemTelemetryState = await res.json();
        setTelemetry(state);
        setLastUpdated(Date.now());
        setConnectionStatus('CONNECTED');
      }
    } catch (e) {
      setConnectionStatus('DISCONNECTED');
    }
  }, []);

  // Real-time synchronization using WebSocket with SSE fallback
  useEffect(() => {
    fetchConfig();
    fetchAlerts();
    refreshTelemetry();

    let isSubscribed = true;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnectionStatus('CONNECTED');
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'INIT_STATE' || msg.type === 'TELEMETRY_UPDATE') {
              setTelemetry(msg.data);
              setLastUpdated(Date.now());
              setConnectionStatus('CONNECTED');
            } else if (msg.type === 'NEW_ALERT') {
              fetchAlerts();
            } else if (msg.type === 'MODE_CHANGE') {
              if (telemetry) {
                setTelemetry({ ...telemetry, controlMode: msg.controlMode });
              }
            } else if (msg.type === 'OPERATING_MODE_CHANGE') {
              if (telemetry) {
                setTelemetry({ ...telemetry, operatingMode: msg.operatingMode });
              }
            }
          } catch (err) {
            console.error('WS parse error:', err);
          }
        };

        ws.onerror = () => {
          // If WS fails, establish SSE fallback
          startSseFallback();
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnectionStatus('DISCONNECTED');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
      } catch (e) {
        startSseFallback();
      }
    };

    const startSseFallback = () => {
      if (sseRef.current) return;
      try {
        const sse = new EventSource('/api/stream');
        sseRef.current = sse;
        sse.onopen = () => {
          if (!isSubscribed) return;
          setConnectionStatus('CONNECTED');
        };
        sse.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'INIT_STATE' || msg.type === 'TELEMETRY_UPDATE') {
              setTelemetry(msg.data);
              setLastUpdated(Date.now());
            } else if (msg.type === 'NEW_ALERT') {
              fetchAlerts();
            }
          } catch (err) {
            // ignore
          }
        };
        sse.onerror = () => {
          sse.close();
          sseRef.current = null;
        };
      } catch (err) {
        // ignore
      }
    };

    connectWebSocket();

    // Fallback polling every 5 seconds to ensure absolute reliability
    const pollInterval = setInterval(() => {
      refreshTelemetry();
      fetchAlerts();
    }, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      if (sseRef.current) sseRef.current.close();
    };
  }, [fetchConfig, fetchAlerts, refreshTelemetry]);

  // Actions
  const startMotor = async () => {
    try {
      const res = await fetch('/api/motor/start', { method: 'POST' });
      const data = await res.json();
      await refreshTelemetry();
      await fetchAlerts();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to start motor' };
    }
  };

  const stopMotor = async () => {
    try {
      const res = await fetch('/api/motor/stop', { method: 'POST' });
      const data = await res.json();
      await refreshTelemetry();
      await fetchAlerts();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to stop motor' };
    }
  };

  const resetTrip = async () => {
    try {
      const res = await fetch('/api/motor/reset-trip', { method: 'POST' });
      const data = await res.json();
      await refreshTelemetry();
      await fetchAlerts();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reset trip' };
    }
  };

  const setControlMode = async (mode: ControlMode) => {
    try {
      await fetch('/api/motor/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      await refreshTelemetry();
    } catch (e) {
      // ignore
    }
  };

  const setOperatingMode = async (mode: OperatingMode) => {
    try {
      await fetch('/api/demo/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      await refreshTelemetry();
    } catch (e) {
      // ignore
    }
  };

  const applyScenario = async (scenario: string) => {
    try {
      await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      await refreshTelemetry();
      await fetchAlerts();
    } catch (e) {
      // ignore
    }
  };

  const updateSensors = async (sensors: {
    temperature: number;
    vibration: number;
    current: number;
    voltage: number;
    rpm: number;
  }) => {
    try {
      await fetch('/api/demo/set-sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensors),
      });
      await refreshTelemetry();
      await fetchAlerts();
    } catch (e) {
      // ignore
    }
  };

  const saveConfig = async (newConfig: MotorConfig) => {
    try {
      const res = await fetch('/api/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        await refreshTelemetry();
        await fetchAlerts();
        return { success: true };
      }
      return { success: false, message: data.error || 'Failed to save configuration' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const acknowledgeAlerts = async (id?: number) => {
    try {
      await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchAlerts();
    } catch (e) {
      // ignore
    }
  };

  const clearAlerts = async () => {
    try {
      await fetch('/api/alerts/clear', { method: 'POST' });
      await fetchAlerts();
    } catch (e) {
      // ignore
    }
  };

  const unreadAlertsCount = alerts.filter((a) => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING')).length;

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        config,
        alerts,
        unreadAlertsCount,
        connectionStatus,
        lastUpdatedSecondsAgo,
        startMotor,
        stopMotor,
        resetTrip,
        setControlMode,
        setOperatingMode,
        applyScenario,
        updateSensors,
        saveConfig,
        acknowledgeAlerts,
        clearAlerts,
        refreshTelemetry,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
