import React, { useState, useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
} from 'chart.js';
import { useTelemetry } from '../../context/TelemetryContext.tsx';
import { HistoryReading } from '../../types.ts';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RealtimeTrendChartProps {
  initialMetric?: 'temperature' | 'vibration' | 'current' | 'voltage' | 'rpm' | 'health';
}

export const RealtimeTrendChart: React.FC<RealtimeTrendChartProps> = ({
  initialMetric = 'temperature',
}) => {
  const { telemetry, config } = useTelemetry();
  const [selectedMetric, setSelectedMetric] = useState(initialMetric);
  const [timeRange, setTimeRange] = useState<'10m' | '30m' | '1h' | '6h' | '24h'>('1h');
  const [historyData, setHistoryData] = useState<HistoryReading[]>([]);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Fetch history when timeRange changes
  useEffect(() => {
    let isSubscribed = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?range=${timeRange}`);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed) {
            setHistoryData(json.readings ? json.readings.reverse() : []);
          }
        }
      } catch (err) {
        // silent
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [timeRange]);

  const points = historyData.length > 0 ? historyData : (telemetry?.recentHistory as any[]) || [];

  const labels = points.map((p) => {
    const d = new Date(p.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const metricConfigs: Record<
    string,
    {
      label: string;
      unit: string;
      color: string;
      bgColor: string;
      data: number[];
      warnThreshold?: number;
      critThreshold?: number;
    }
  > = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#F43F5E',
      bgColor: 'rgba(244, 63, 94, 0.1)',
      data: points.map((p) => p.temperature),
      warnThreshold: config?.temp_warning_limit ?? 55,
      critThreshold: config?.temp_critical_limit ?? 70,
    },
    vibration: {
      label: 'Vibration',
      unit: 'mm/s',
      color: '#A855F7',
      bgColor: 'rgba(168, 85, 247, 0.1)',
      data: points.map((p) => p.vibration),
      warnThreshold: config?.vibration_warning_limit ?? 2.5,
      critThreshold: config?.vibration_critical_limit ?? 4.0,
    },
    current: {
      label: 'Current',
      unit: 'A',
      color: '#EAB308',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      data: points.map((p) => p.current),
      warnThreshold: config?.current_warning_limit ?? 1.1,
      critThreshold: config?.current_critical_limit ?? 1.4,
    },
    voltage: {
      label: 'Voltage',
      unit: 'V',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      data: points.map((p) => p.voltage),
      warnThreshold: 10.5,
      critThreshold: 13.5,
    },
    rpm: {
      label: 'Speed (RPM)',
      unit: 'RPM',
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      data: points.map((p) => p.rpm),
      warnThreshold: config?.rpm_min ?? 1200,
      critThreshold: config?.rpm_max ?? 1650,
    },
    health: {
      label: 'Composite Health Score',
      unit: '%',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      data: points.map((p) => p.health_score ?? p.healthScore ?? 90),
      warnThreshold: 70,
      critThreshold: 40,
    },
  };

  const currentCfg = metricConfigs[selectedMetric];

  // Initialize or update Chart.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const datasets: any[] = [
      {
        label: `${currentCfg.label} (${currentCfg.unit})`,
        data: currentCfg.data,
        borderColor: currentCfg.color,
        backgroundColor: currentCfg.bgColor,
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: currentCfg.data.length > 50 ? 0 : 2,
        pointHoverRadius: 5,
      },
    ];

    if (currentCfg.warnThreshold) {
      datasets.push({
        label: `Warning Threshold (${currentCfg.warnThreshold}${currentCfg.unit})`,
        data: new Array(labels.length).fill(currentCfg.warnThreshold),
        borderColor: '#F59E0B',
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      });
    }

    if (currentCfg.critThreshold) {
      datasets.push({
        label: `Critical Threshold (${currentCfg.critThreshold}${currentCfg.unit})`,
        data: new Array(labels.length).fill(currentCfg.critThreshold),
        borderColor: '#EF4444',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      });
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.labels = labels.length > 0 ? labels : ['0s'];
      chartInstanceRef.current.data.datasets = datasets;
      chartInstanceRef.current.update('none');
    } else {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['0s'],
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 250,
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#94A3B8',
                font: { family: 'JetBrains Mono', size: 11 },
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#CBD5E1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              titleFont: { family: 'JetBrains Mono', size: 12 },
              bodyFont: { family: 'JetBrains Mono', size: 12 },
            },
          },
          scales: {
            x: {
              grid: { color: '#1E293B' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 8 },
            },
            y: {
              grid: { color: '#1E293B' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } },
            },
          },
        },
      });
    }

    return () => {
      // Cleanup on unmount
    };
  }, [points, selectedMetric, currentCfg, labels]);

  // Clean up chart instance when component unmounts
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      {/* Chart Header with Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        {/* Metric Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          {(
            [
              ['temperature', 'Temp'],
              ['vibration', 'Vib'],
              ['current', 'Current'],
              ['voltage', 'Volt'],
              ['rpm', 'RPM'],
              ['health', 'Health'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                selectedMetric === key
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time Span Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
          {(['10m', '30m', '1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded transition-colors uppercase ${
                timeRange === r
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-72 w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-mono text-cyan-400">
            Updating Telemetry Trend...
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div>
          Showing {points.length} telemetry points ({timeRange.toUpperCase()} window)
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full inline-block" />
            Normal Range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded-full inline-block" />
            Warning Limit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-500 rounded-full inline-block" />
            Critical Trip
          </span>
        </div>
      </div>
    </div>
  );
};
