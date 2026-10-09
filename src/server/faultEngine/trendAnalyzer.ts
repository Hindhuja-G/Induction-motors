import { SensorData } from '../healthEngine/healthScore.ts';

export interface TrendDataPoint {
  timestamp: string | number;
  temperature: number;
  vibration: number;
  current: number;
  voltage: number;
  rpm: number;
}

export interface EarlyWarning {
  id: string;
  parameter: 'TEMPERATURE' | 'VIBRATION' | 'CURRENT' | 'VOLTAGE' | 'SPEED' | 'COMBINED';
  title: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
  recommendation: string;
  slope: number;
  percentChange: number;
}

export interface TrendAnalysisResult {
  trendDeltas: {
    temperature: number; // e.g. +4.2%
    vibration: number;
    current: number;
    voltage: number;
    rpm: number;
    health: number;
  };
  earlyWarnings: EarlyWarning[];
  primaryWarning: EarlyWarning | null;
  trendStatus: 'STABLE' | 'DEGRADING' | 'CRITICAL_TRAJECTORY';
}

function calculateSlope(values: number[]): { slope: number; percentChange: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, percentChange: 0 };

  const first = values[0];
  const last = values[n - 1];
  const percentChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, percentChange: Number(percentChange.toFixed(1)) };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return {
    slope: Number(slope.toFixed(4)),
    percentChange: Number(percentChange.toFixed(1)),
  };
}

export function analyzeSensorTrends(history: TrendDataPoint[]): TrendAnalysisResult {
  const warnings: EarlyWarning[] = [];

  if (history.length < 3) {
    return {
      trendDeltas: {
        temperature: 0,
        vibration: 0,
        current: 0,
        voltage: 0,
        rpm: 0,
        health: 0,
      },
      earlyWarnings: [],
      primaryWarning: null,
      trendStatus: 'STABLE',
    };
  }

  // Use the last 5 to 10 points for slope detection
  const recent = history.slice(-10);
  const temps = recent.map((p) => p.temperature);
  const vibs = recent.map((p) => p.vibration);
  const currs = recent.map((p) => p.current);
  const volts = recent.map((p) => p.voltage);
  const rpms = recent.map((p) => p.rpm);

  const tempStats = calculateSlope(temps);
  const vibStats = calculateSlope(vibs);
  const currStats = calculateSlope(currs);
  const voltStats = calculateSlope(volts);
  const rpmStats = calculateSlope(rpms);

  // 1. Continuous Temperature Increase Check
  if (tempStats.slope > 0.4 && tempStats.percentChange > 4) {
    const isHighRisk = temps[temps.length - 1] > 50 || tempStats.slope > 0.8;
    warnings.push({
      id: 'WARN_TEMP_SLOPE',
      parameter: 'TEMPERATURE',
      title: 'Increasing Temperature Trend',
      riskLevel: isHighRisk ? 'HIGH' : 'MODERATE',
      description: `Temperature has been continuously increasing at ~${(tempStats.slope * 10).toFixed(1)}°C/min (Delta: +${tempStats.percentChange}%).`,
      recommendation: 'Inspect motor load, verify cooling fan operation, and prepare for load relief.',
      slope: tempStats.slope,
      percentChange: tempStats.percentChange,
    });
  }

  // 2. Escalating Vibration Trend
  if (vibStats.slope > 0.08 && vibStats.percentChange > 8) {
    warnings.push({
      id: 'WARN_VIB_SLOPE',
      parameter: 'VIBRATION',
      title: 'Escalating Mechanical Vibration',
      riskLevel: vibs[vibs.length - 1] > 2.2 ? 'HIGH' : 'MODERATE',
      description: `Vibration amplitude is trending upward (Delta: +${vibStats.percentChange}%). Indicates progressive mechanical wear.`,
      recommendation: 'Inspect foundation mounting bolts, check motor-to-gearbox coupling and bearing lubrication.',
      slope: vibStats.slope,
      percentChange: vibStats.percentChange,
    });
  }

  // 3. Current Draw Creep
  if (currStats.slope > 0.03 && currStats.percentChange > 6) {
    warnings.push({
      id: 'WARN_CURR_SLOPE',
      parameter: 'CURRENT',
      title: 'Current Draw Creep Detected',
      riskLevel: currs[currs.length - 1] > 1.0 ? 'HIGH' : 'MODERATE',
      description: `Motor is steadily drawing higher current (Delta: +${currStats.percentChange}%). Rotor impedance or load friction increasing.`,
      recommendation: 'Verify mechanical output shaft resistance; check for mechanical binding.',
      slope: currStats.slope,
      percentChange: currStats.percentChange,
    });
  }

  // 4. Speed Droop Trend
  if (rpmStats.slope < -12 && rpmStats.percentChange < -4) {
    warnings.push({
      id: 'WARN_RPM_DROP',
      parameter: 'SPEED',
      title: 'Abnormal Shaft Speed Droop',
      riskLevel: rpms[rpms.length - 1] < 1300 ? 'HIGH' : 'MODERATE',
      description: `Rotor RPM is gradually dropping under constant voltage (Delta: ${rpmStats.percentChange}%).`,
      recommendation: 'Check mechanical drag on gears and examine IR sensor pulse alignment.',
      slope: rpmStats.slope,
      percentChange: rpmStats.percentChange,
    });
  }

  // 5. Voltage Instability
  const voltMean = volts.reduce((a, b) => a + b, 0) / volts.length;
  const voltVariance = volts.reduce((sum, v) => sum + Math.pow(v - voltMean, 2), 0) / volts.length;
  const voltStdDev = Math.sqrt(voltVariance);

  if (voltStdDev > 0.5) {
    warnings.push({
      id: 'WARN_VOLT_UNSTABLE',
      parameter: 'VOLTAGE',
      title: 'Power Rail Instability',
      riskLevel: 'MODERATE',
      description: `Supply voltage exhibits erratic fluctuations (StdDev: ±${voltStdDev.toFixed(2)}V).`,
      recommendation: 'Inspect DC adapter filtering, terminal block connections, and ground loops.',
      slope: voltStats.slope,
      percentChange: voltStats.percentChange,
    });
  }

  // 6. Combined Abnormal Trends
  if (tempStats.slope > 0.3 && currStats.slope > 0.02 && rpmStats.slope < -8) {
    warnings.unshift({
      id: 'WARN_COMBINED_OVERLOAD',
      parameter: 'COMBINED',
      title: 'Combined Degraded Trend: Impending Mechanical Stress',
      riskLevel: 'HIGH',
      description: 'Simultaneous temperature rise, current escalation, and rotational deceleration detected.',
      recommendation: 'Proactive intervention recommended before critical trip is provoked.',
      slope: tempStats.slope,
      percentChange: tempStats.percentChange,
    });
  }

  let trendStatus: 'STABLE' | 'DEGRADING' | 'CRITICAL_TRAJECTORY' = 'STABLE';
  if (warnings.some((w) => w.riskLevel === 'HIGH')) {
    trendStatus = 'CRITICAL_TRAJECTORY';
  } else if (warnings.length > 0) {
    trendStatus = 'DEGRADING';
  }

  return {
    trendDeltas: {
      temperature: tempStats.percentChange,
      vibration: vibStats.percentChange,
      current: currStats.percentChange,
      voltage: voltStats.percentChange,
      rpm: rpmStats.percentChange,
      health: Number((-((tempStats.percentChange + vibStats.percentChange) * 0.3)).toFixed(1)),
    },
    earlyWarnings: warnings,
    primaryWarning: warnings[0] || null,
    trendStatus,
  };
}
