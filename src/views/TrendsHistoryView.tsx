import React, { useState, useEffect } from 'react';
import { RealtimeTrendChart } from '../components/common/RealtimeTrendChart.tsx';
import { HistoryReading } from '../types.ts';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  Table,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export const TrendsHistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<string>('1h');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('range', timeRange);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.readings || []);
      }
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [timeRange, statusFilter]);

  const handleExportCsv = () => {
    window.open('/api/history/export', '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              TIME-SERIES ARCHIVE & ANALYSIS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            Trends & Historical Telemetry
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sensor telemetry logging with ISO threshold overlays and exportable SQLite audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Primary Trend Graphs Section */}
      <div>
        <RealtimeTrendChart initialMetric="temperature" />
      </div>

      {/* Historical Data Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              AUDIT DATA GRID ({history.length} RECORDS)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fault, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-44 sm:w-56"
              />
            </div>

            {/* Status Segmented Filter */}
            <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
              {(['ALL', 'NORMAL', 'WARNING', 'CRITICAL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === s
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-950/40">
                <th className="py-2.5 px-3 font-semibold">TIMESTAMP</th>
                <th className="py-2.5 px-3 font-semibold">TEMP (°C)</th>
                <th className="py-2.5 px-3 font-semibold">VIB (mm/s)</th>
                <th className="py-2.5 px-3 font-semibold">CURRENT (A)</th>
                <th className="py-2.5 px-3 font-semibold">VOLTAGE (V)</th>
                <th className="py-2.5 px-3 font-semibold">SPEED (RPM)</th>
                <th className="py-2.5 px-3 font-semibold">HEALTH</th>
                <th className="py-2.5 px-3 font-semibold">STATUS</th>
                <th className="py-2.5 px-3 font-semibold">RELAY</th>
                <th className="py-2.5 px-3 font-semibold">DIAGNOSTIC FAULT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No historical logs found for current criteria.
                  </td>
                </tr>
              ) : (
                history.slice(0, 50).map((row) => {
                  const isCrit = row.status === 'CRITICAL';
                  const isWarn = row.status === 'WARNING';
                  let statusBadge = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                  if (isCrit) {
                    statusBadge = 'text-red-400 bg-red-500/10 border-red-500/30';
                  } else if (isWarn) {
                    statusBadge = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(row.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-semibold text-white">
                        {row.temperature}°C
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-200">
                        {row.vibration}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-200">
                        {row.current}A
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-200">
                        {row.voltage}V
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-200 font-semibold">
                        {row.rpm}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-bold text-white">
                        {row.health_score}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold ${
                            row.relay_status === 'ON' ? 'text-amber-400' : 'text-slate-500'
                          }`}
                        >
                          {row.relay_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate">
                        {row.fault || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
