export interface MotorConfig {
  id?: number;
  motor_name: string;
  motor_type: string;
  power_rating: string;
  rated_voltage: number;
  rated_current: number;
  rated_speed: number;
  temp_warning_limit: number;
  temp_critical_limit: number;
  vibration_warning_limit: number;
  vibration_critical_limit: number;
  current_warning_limit: number;
  current_critical_limit: number;
  voltage_min: number;
  voltage_max: number;
  rpm_min: number;
  rpm_max: number;
  weight_temp: number;
  weight_vibration: number;
  weight_current: number;
  weight_voltage: number;
  weight_rpm: number;
  control_mode?: 'AUTO' | 'MANUAL';
  updated_at?: string;
}

export interface SensorData {
  temperature: number;
  vibration: number;
  current: number;
  voltage: number;
  rpm: number;
}

export interface ParameterHealth {
  score: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  deviationPercent: number;
  description: string;
}

export interface HealthAssessment {
  overallScore: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  rating: 'EXCELLENT' | 'NORMAL' | 'WARNING' | 'CRITICAL';
  parameterScores: {
    temperature: ParameterHealth;
    vibration: ParameterHealth;
    current: ParameterHealth;
    voltage: ParameterHealth;
    rpm: ParameterHealth;
  };
  criticalParameters: string[];
  warningParameters: string[];
  summary: string;
}

export interface DetectedFault {
  id: string;
  parameter: 'TEMPERATURE' | 'VIBRATION' | 'CURRENT' | 'VOLTAGE' | 'SPEED' | 'MULTI_PARAMETER';
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  currentValue: number | string;
  thresholdValue: number | string;
  unit: string;
  rootCause: string;
  recommendation: string;
}

export interface FaultAnalysis {
  activeFaults: DetectedFault[];
  primaryFault: string | null;
  multiParameterFault: DetectedFault | null;
  hasCritical: boolean;
  hasWarning: boolean;
  protectionRequired: boolean;
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
    temperature: number;
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

export interface TrendDataPoint {
  timestamp: string;
  temperature: number;
  vibration: number;
  current: number;
  voltage: number;
  rpm: number;
}

export type MotorStatus = 'RUNNING' | 'STOPPED' | 'PROTECTED';
export type RelayStatus = 'ON' | 'OFF';
export type ControlMode = 'AUTO' | 'MANUAL';
export type OperatingMode = 'LIVE_HARDWARE' | 'DEMO_MODE';

export interface SystemTelemetryState {
  motorStatus: MotorStatus;
  relayStatus: RelayStatus;
  controlMode: ControlMode;
  operatingMode: OperatingMode;
  protectionActive: boolean;
  protectionReason: string | null;
  hardwareConnected: boolean;
  wifiConnected: boolean;
  lastHardwarePing: number | null;
  secondsSinceLastHardwarePing: number;
  currentReadings: SensorData;
  latestHealth: HealthAssessment;
  latestFaults: FaultAnalysis;
  latestTrends: TrendAnalysisResult;
  recentHistory: TrendDataPoint[];
  tripCount: number;
  totalRunSeconds: number;
}

export interface AlertItem {
  id: number;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'RECOVERY';
  parameter: string;
  value: number | null;
  unit: string;
  message: string;
  action_taken: string;
  acknowledged: number;
}

export interface HistoryReading {
  id: number;
  timestamp: string;
  temperature: number;
  vibration: number;
  current: number;
  voltage: number;
  rpm: number;
  health_score: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  fault: string | null;
  motor_status: MotorStatus;
  relay_status: RelayStatus;
  source: string;
}
