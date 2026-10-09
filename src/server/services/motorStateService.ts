import { dbGet, dbRun, dbAll } from '../database/db.ts';
import {
  computeMotorHealth,
  HealthAssessment,
  MotorConfig,
  SensorData,
} from '../healthEngine/healthScore.ts';
import {
  diagnoseMotorFaults,
  FaultAnalysis,
} from '../faultEngine/faultDetector.ts';
import {
  analyzeSensorTrends,
  TrendAnalysisResult,
  TrendDataPoint,
} from '../faultEngine/trendAnalyzer.ts';

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

class MotorStateService {
  private motorStatus: MotorStatus = 'RUNNING';
  private relayStatus: RelayStatus = 'ON';
  private controlMode: ControlMode = 'AUTO';
  private operatingMode: OperatingMode = 'DEMO_MODE'; // Start in Demo mode so UI is instantly live; easy toggle to Live Hardware
  private protectionActive: boolean = false;
  private protectionReason: string | null = null;
  private lastHardwarePing: number | null = null;
  private tripCount: number = 0;
  private totalRunSeconds: number = 1420;

  private currentReadings: SensorData = {
    temperature: 42.5,
    vibration: 1.65,
    current: 0.84,
    voltage: 11.95,
    rpm: 1445,
  };

  private recentHistory: TrendDataPoint[] = [];
  private broadcastCallbacks: ((data: any) => void)[] = [];
  private demoTimer: NodeJS.Timeout | null = null;
  private runtimeTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initHistory();
    this.startDemoLoop();
    this.startRuntimeCounter();
  }

  private async initHistory() {
    try {
      const rows = await dbAll<any>(
        'SELECT timestamp, temperature, vibration, current, voltage, rpm FROM sensor_readings ORDER BY id DESC LIMIT 30'
      );
      if (rows && rows.length > 0) {
        this.recentHistory = rows.reverse().map((r) => ({
          timestamp: r.timestamp,
          temperature: r.temperature,
          vibration: r.vibration,
          current: r.current,
          voltage: r.voltage,
          rpm: r.rpm,
        }));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }

  private startRuntimeCounter() {
    this.runtimeTimer = setInterval(() => {
      if (this.motorStatus === 'RUNNING') {
        this.totalRunSeconds += 1;
      }
    }, 1000);
  }

  public registerBroadcaster(cb: (data: any) => void) {
    this.broadcastCallbacks.push(cb);
  }

  public unregisterBroadcaster(cb: (data: any) => void) {
    this.broadcastCallbacks = this.broadcastCallbacks.filter((c) => c !== cb);
  }

  private broadcast(payload: any) {
    for (const cb of this.broadcastCallbacks) {
      try {
        cb(payload);
      } catch (err) {
        // silent catch
      }
    }
  }

  public async getMotorConfig(): Promise<MotorConfig> {
    const config = await dbGet<MotorConfig>('SELECT * FROM motor_config WHERE id = 1');
    if (!config) {
      return {
        motor_name: 'DC Gear Motor (Induction Simulator)',
        motor_type: '12V DC High-Torque Gear Motor',
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
        control_mode: this.controlMode,
      };
    }
    return config;
  }

  public async processSensorData(data: SensorData, source: 'LIVE_ESP32' | 'DEMO' = 'LIVE_ESP32') {
    if (source === 'LIVE_ESP32') {
      this.lastHardwarePing = Date.now();
      // If hardware is active, automatically recognize hardware
      if (this.operatingMode === 'LIVE_HARDWARE') {
        // keep readings
      }
    }

    this.currentReadings = {
      temperature: Number(data.temperature.toFixed(1)),
      vibration: Number(data.vibration.toFixed(2)),
      current: Number(data.current.toFixed(2)),
      voltage: Number(data.voltage.toFixed(2)),
      rpm: Math.round(data.rpm),
    };

    const config = await this.getMotorConfig();
    const health = computeMotorHealth(this.currentReadings, config);
    const faults = diagnoseMotorFaults(this.currentReadings, config);

    // Append to rolling history
    const nowIso = new Date().toISOString();
    this.recentHistory.push({
      timestamp: nowIso,
      ...this.currentReadings,
    });
    if (this.recentHistory.length > 50) {
      this.recentHistory.shift();
    }

    const trends = analyzeSensorTrends(this.recentHistory);

    // ============================================
    // AUTOMATIC MOTOR PROTECTION & SAFETY LOGIC
    // ============================================
    const previouslyProtected = this.protectionActive;

    if (health.status === 'CRITICAL' || faults.protectionRequired) {
      // CRITICAL CONDITION DETECTED
      this.protectionActive = true;
      this.protectionReason = faults.primaryFault || 'Critical Motor Threshold Exceeded';
      this.relayStatus = 'OFF';
      this.motorStatus = 'PROTECTED';
      this.tripCount += 1;

      // Log alert only if state just transitioned or periodically
      if (!previouslyProtected) {
        await this.logAlert(
          'CRITICAL',
          faults.activeFaults[0]?.parameter || 'SYSTEM',
          faults.activeFaults[0]?.currentValue ? Number(faults.activeFaults[0].currentValue) : null,
          faults.activeFaults[0]?.unit || '',
          `CRITICAL FAULT: ${this.protectionReason}. Motor safety limit breached.`,
          'AUTOMATIC MOTOR PROTECTION ACTIVATED: Relay opened (OFF), motor immediately stopped.'
        );
      }
    } else if (previouslyProtected && health.status === 'NORMAL') {
      // RECOVERY LOGIC: All parameters normalized
      this.protectionActive = false;
      this.protectionReason = null;
      // Note: Motor stays STOPPED until operator starts it safely!
      if (this.motorStatus === 'PROTECTED') {
        this.motorStatus = 'STOPPED';
      }

      await this.logAlert(
        'RECOVERY',
        'SYSTEM',
        health.overallScore,
        '%',
        'Motor operational parameters have returned to safe nominal ranges.',
        'Protection interlock cleared. Motor restart is now safe and available.'
      );
    } else if (health.status === 'WARNING' && trends.primaryWarning && !previouslyProtected) {
      // Early warning trend logged periodically if novel
      if (Math.random() < 0.15) {
        await this.logAlert(
          'WARNING',
          trends.primaryWarning.parameter,
          trends.primaryWarning.percentChange,
          '%',
          `EARLY WARNING: ${trends.primaryWarning.title}. ${trends.primaryWarning.description}`,
          `Recommendation: ${trends.primaryWarning.recommendation}`
        );
      }
    }

    // Persist reading to database
    try {
      await dbRun(
        `INSERT INTO sensor_readings (
          timestamp, temperature, vibration, current, voltage, rpm, health_score, status, fault, motor_status, relay_status, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nowIso,
          this.currentReadings.temperature,
          this.currentReadings.vibration,
          this.currentReadings.current,
          this.currentReadings.voltage,
          this.currentReadings.rpm,
          health.overallScore,
          health.status,
          faults.primaryFault,
          this.motorStatus,
          this.relayStatus,
          source,
        ]
      );
    } catch (err) {
      console.error('Failed to save sensor reading:', err);
    }

    const state = await this.getSystemState();
    this.broadcast({
      type: 'TELEMETRY_UPDATE',
      data: state,
    });

    return {
      healthScore: health.overallScore,
      status: health.status,
      motorStatus: this.motorStatus,
      relayStatus: this.relayStatus,
      fault: faults.primaryFault,
      protectionActive: this.protectionActive,
    };
  }

  public async logAlert(
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'RECOVERY',
    parameter: string,
    value: number | null,
    unit: string,
    message: string,
    action_taken: string
  ) {
    try {
      await dbRun(
        `INSERT INTO alerts (severity, parameter, value, unit, message, action_taken)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [severity, parameter, value, unit, message, action_taken]
      );

      this.broadcast({
        type: 'NEW_ALERT',
        data: {
          timestamp: new Date().toISOString(),
          severity,
          parameter,
          value,
          unit,
          message,
          action_taken,
        },
      });
    } catch (err) {
      console.error('Failed to log alert:', err);
    }
  }

  public async startMotor(): Promise<{ success: boolean; message: string; blocked?: boolean }> {
    const config = await this.getMotorConfig();
    const health = computeMotorHealth(this.currentReadings, config);
    const faults = diagnoseMotorFaults(this.currentReadings, config);

    // SAFETY CHECK: Never allow restart if critical condition is present!
    if (this.protectionActive || health.status === 'CRITICAL' || faults.hasCritical) {
      return {
        success: false,
        blocked: true,
        message: `START BLOCKED: Critical motor fault active (${faults.primaryFault || 'Critical Thresholds Exceeded'}). Clear the thermal/mechanical condition and verify safety before restarting.`,
      };
    }

    this.motorStatus = 'RUNNING';
    this.relayStatus = 'ON';
    this.protectionActive = false;
    this.protectionReason = null;

    if (this.operatingMode === 'DEMO_MODE') {
      this.currentReadings.rpm = 1450;
      this.currentReadings.current = 0.84;
    }

    await this.logAlert(
      'INFO',
      'CONTROL',
      null,
      '',
      'Motor start command executed by operator.',
      'Relay energized (ON). DC motor driving transmission shaft.'
    );

    const state = await this.getSystemState();
    this.broadcast({ type: 'TELEMETRY_UPDATE', data: state });

    return { success: true, message: 'Motor successfully started. Relay energized.' };
  }

  public async stopMotor(): Promise<{ success: boolean; message: string }> {
    this.motorStatus = 'STOPPED';
    this.relayStatus = 'OFF';

    await this.logAlert(
      'INFO',
      'CONTROL',
      null,
      '',
      'Motor manual stop requested by operator.',
      'Relay de-energized (OFF). Motor coasting to halt.'
    );

    const state = await this.getSystemState();
    this.broadcast({ type: 'TELEMETRY_UPDATE', data: state });

    return { success: true, message: 'Motor halted. Relay opened.' };
  }

  public setControlMode(mode: ControlMode) {
    this.controlMode = mode;
    this.broadcast({ type: 'MODE_CHANGE', controlMode: mode });
  }

  public setOperatingMode(mode: OperatingMode) {
    this.operatingMode = mode;
    this.broadcast({ type: 'OPERATING_MODE_CHANGE', operatingMode: mode });
  }

  public async resetProtectionLock(): Promise<{ success: boolean; message: string }> {
    const config = await this.getMotorConfig();
    const health = computeMotorHealth(this.currentReadings, config);

    if (health.status === 'CRITICAL') {
      return {
        success: false,
        message: 'Cannot reset protection: Monitored sensors are still in CRITICAL range. Allow motor to normalize.',
      };
    }

    this.protectionActive = false;
    this.protectionReason = null;
    if (this.motorStatus === 'PROTECTED') {
      this.motorStatus = 'STOPPED';
    }

    await this.logAlert(
      'INFO',
      'SAFETY',
      null,
      '',
      'Protection trip lock manually acknowledged and reset by operator.',
      'Safety interlock cleared. Motor is stopped and ready for safe restart.'
    );

    const state = await this.getSystemState();
    this.broadcast({ type: 'TELEMETRY_UPDATE', data: state });

    return { success: true, message: 'Protection interlock reset. Motor is safe to start.' };
  }

  public async applyDemoScenario(scenario: string) {
    let target = { ...this.currentReadings };

    switch (scenario.toUpperCase()) {
      case 'NORMAL':
        target = { temperature: 42.5, vibration: 1.5, current: 0.82, voltage: 12.0, rpm: 1450 };
        if (this.motorStatus !== 'RUNNING') {
          this.motorStatus = 'RUNNING';
          this.relayStatus = 'ON';
        }
        break;

      case 'WARNING':
        target = { temperature: 56.5, vibration: 2.8, current: 1.05, voltage: 11.8, rpm: 1380 };
        break;

      case 'OVERHEATING':
        target = { temperature: 72.5, vibration: 2.2, current: 1.25, voltage: 11.7, rpm: 1310 };
        break;

      case 'HIGH_VIBRATION':
      case 'VIBRATION':
        target = { temperature: 46.5, vibration: 4.6, current: 0.95, voltage: 11.9, rpm: 1410 };
        break;

      case 'OVERCURRENT':
        target = { temperature: 58.0, vibration: 2.9, current: 1.55, voltage: 11.4, rpm: 1260 };
        break;

      case 'CRITICAL':
        target = { temperature: 74.0, vibration: 4.5, current: 1.52, voltage: 11.3, rpm: 1100 };
        break;

      case 'RECOVERY':
        target = { temperature: 41.0, vibration: 1.4, current: 0.80, voltage: 12.0, rpm: 1460 };
        this.protectionActive = false;
        break;

      default:
        break;
    }

    return await this.processSensorData(target, 'DEMO');
  }

  private startDemoLoop() {
    this.demoTimer = setInterval(async () => {
      // In DEMO mode, produce realistic micro-fluctuations
      if (this.operatingMode === 'DEMO_MODE') {
        const isRunning = this.motorStatus === 'RUNNING';

        let newTemp = this.currentReadings.temperature;
        let newVib = this.currentReadings.vibration;
        let newCurr = this.currentReadings.current;
        let newVolt = this.currentReadings.voltage;
        let newRpm = this.currentReadings.rpm;

        if (isRunning) {
          // Subtle drifting noise around current operating point
          newTemp += (Math.random() - 0.48) * 0.2;
          newVib += (Math.random() - 0.5) * 0.05;
          newCurr += (Math.random() - 0.5) * 0.02;
          newVolt = 12.0 + (Math.random() - 0.5) * 0.15;
          newRpm += Math.round((Math.random() - 0.5) * 12);

          // Bound within sensible limits for demo stability unless under forced critical
          if (!this.protectionActive && newTemp > 65) newTemp = 65;
          if (newVib < 0.8) newVib = 0.8;
          if (newCurr < 0.5) newCurr = 0.5;
        } else {
          // Motor stopped: RPM is 0, current drops to idle ~0.05A, temperature slowly cools down to room temp (~28°C), vibration near 0
          newRpm = 0;
          newCurr = 0.04;
          newVib = 0.15 + Math.random() * 0.05;
          if (newTemp > 30) newTemp -= 0.3;
        }

        await this.processSensorData(
          {
            temperature: Math.max(20, newTemp),
            vibration: Math.max(0.1, newVib),
            current: Math.max(0, newCurr),
            voltage: Math.max(0, newVolt),
            rpm: Math.max(0, newRpm),
          },
          'DEMO'
        );
      }
    }, 2500);
  }

  public async getSystemState(): Promise<SystemTelemetryState> {
    const config = await this.getMotorConfig();
    const health = computeMotorHealth(this.currentReadings, config);
    const faults = diagnoseMotorFaults(this.currentReadings, config);
    const trends = analyzeSensorTrends(this.recentHistory);

    const now = Date.now();
    const lastPing = this.lastHardwarePing;
    const secondsSinceLastPing = lastPing ? Math.round((now - lastPing) / 1000) : 999;
    const isHardwareActive = this.operatingMode === 'LIVE_HARDWARE' ? secondsSinceLastPing < 15 : false;

    return {
      motorStatus: this.motorStatus,
      relayStatus: this.relayStatus,
      controlMode: this.controlMode,
      operatingMode: this.operatingMode,
      protectionActive: this.protectionActive,
      protectionReason: this.protectionReason,
      hardwareConnected: this.operatingMode === 'DEMO_MODE' ? true : isHardwareActive,
      wifiConnected: this.operatingMode === 'DEMO_MODE' ? true : isHardwareActive,
      lastHardwarePing: this.lastHardwarePing,
      secondsSinceLastHardwarePing: secondsSinceLastPing,
      currentReadings: this.currentReadings,
      latestHealth: health,
      latestFaults: faults,
      latestTrends: trends,
      recentHistory: this.recentHistory.slice(-25),
      tripCount: this.tripCount,
      totalRunSeconds: this.totalRunSeconds,
    };
  }
}

export const motorStateService = new MotorStateService();
export default motorStateService;
