import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.resolve(dataDir, 'motor_monitoring_store.json');

interface DatabaseStore {
  motor_config: any[];
  sensor_readings: any[];
  alerts: any[];
  seq: {
    sensor_readings: number;
    alerts: number;
  };
}

let store: DatabaseStore = {
  motor_config: [],
  sensor_readings: [],
  alerts: [],
  seq: {
    sensor_readings: 1,
    alerts: 1,
  },
};

function loadStore() {
  if (fs.existsSync(dbFilePath)) {
    try {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      store = JSON.parse(content);
    } catch (e) {
      console.error('Error reading db file, reinitializing', e);
    }
  }
}

function saveStore() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db file', e);
  }
}

export async function dbRun(
  sql: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> {
  loadStore();
  const trimmed = sql.trim();

  // 1. INSERT INTO sensor_readings
  if (trimmed.startsWith('INSERT INTO sensor_readings')) {
    const id = store.seq.sensor_readings++;
    const [
      timestamp,
      temperature,
      vibration,
      current,
      voltage,
      rpm,
      health_score,
      status,
      fault,
      motor_status,
      relay_status,
      source,
    ] = params;

    store.sensor_readings.push({
      id,
      timestamp: timestamp || new Date().toISOString(),
      temperature,
      vibration,
      current,
      voltage,
      rpm,
      health_score,
      status,
      fault: fault || null,
      motor_status,
      relay_status,
      source: source || 'LIVE_ESP32',
    });

    // Cap history size to 3000 rows
    if (store.sensor_readings.length > 3000) {
      store.sensor_readings.shift();
    }

    saveStore();
    return { lastID: id, changes: 1 };
  }

  // 2. INSERT INTO alerts
  if (trimmed.startsWith('INSERT INTO alerts')) {
    const id = store.seq.alerts++;
    const [severity, parameter, value, unit, message, action_taken] = params;
    store.alerts.push({
      id,
      timestamp: new Date().toISOString(),
      severity,
      parameter,
      value,
      unit,
      message,
      action_taken,
      acknowledged: 0,
    });
    saveStore();
    return { lastID: id, changes: 1 };
  }

  // 3. INSERT INTO motor_config
  if (trimmed.startsWith('INSERT INTO motor_config')) {
    const [
      id,
      motor_name,
      motor_type,
      power_rating,
      rated_voltage,
      rated_current,
      rated_speed,
      temp_warning_limit,
      temp_critical_limit,
      vibration_warning_limit,
      vibration_critical_limit,
      current_warning_limit,
      current_critical_limit,
      voltage_min,
      voltage_max,
      rpm_min,
      rpm_max,
      weight_temp,
      weight_vibration,
      weight_current,
      weight_voltage,
      weight_rpm,
      control_mode,
    ] = params;

    store.motor_config = [
      {
        id: id || 1,
        motor_name,
        motor_type,
        power_rating,
        rated_voltage,
        rated_current,
        rated_speed,
        temp_warning_limit,
        temp_critical_limit,
        vibration_warning_limit,
        vibration_critical_limit,
        current_warning_limit,
        current_critical_limit,
        voltage_min,
        voltage_max,
        rpm_min,
        rpm_max,
        weight_temp,
        weight_vibration,
        weight_current,
        weight_voltage,
        weight_rpm,
        control_mode: control_mode || 'AUTO',
        updated_at: new Date().toISOString(),
      },
    ];
    saveStore();
    return { lastID: 1, changes: 1 };
  }

  // 4. UPDATE motor_config
  if (trimmed.startsWith('UPDATE motor_config SET control_mode =')) {
    const [mode] = params;
    if (store.motor_config.length > 0) {
      store.motor_config[0].control_mode = mode;
      saveStore();
    }
    return { lastID: 1, changes: 1 };
  }

  if (trimmed.startsWith('UPDATE motor_config SET')) {
    const [
      motor_name,
      motor_type,
      power_rating,
      rated_voltage,
      rated_current,
      rated_speed,
      temp_warning_limit,
      temp_critical_limit,
      vibration_warning_limit,
      vibration_critical_limit,
      current_warning_limit,
      current_critical_limit,
      voltage_min,
      voltage_max,
      rpm_min,
      rpm_max,
      weight_temp,
      weight_vibration,
      weight_current,
      weight_voltage,
      weight_rpm,
    ] = params;

    store.motor_config[0] = {
      ...store.motor_config[0],
      motor_name,
      motor_type,
      power_rating,
      rated_voltage,
      rated_current,
      rated_speed,
      temp_warning_limit,
      temp_critical_limit,
      vibration_warning_limit,
      vibration_critical_limit,
      current_warning_limit,
      current_critical_limit,
      voltage_min,
      voltage_max,
      rpm_min,
      rpm_max,
      weight_temp,
      weight_vibration,
      weight_current,
      weight_voltage,
      weight_rpm,
      updated_at: new Date().toISOString(),
    };
    saveStore();
    return { lastID: 1, changes: 1 };
  }

  // 5. UPDATE alerts
  if (trimmed.startsWith('UPDATE alerts SET acknowledged = 1 WHERE id = ?')) {
    const [id] = params;
    const alert = store.alerts.find((a) => a.id === id);
    if (alert) alert.acknowledged = 1;
    saveStore();
    return { lastID: id, changes: 1 };
  }

  if (trimmed.startsWith('UPDATE alerts SET acknowledged = 1')) {
    for (const a of store.alerts) {
      a.acknowledged = 1;
    }
    saveStore();
    return { lastID: 0, changes: store.alerts.length };
  }

  // 6. DELETE FROM alerts
  if (trimmed.startsWith('DELETE FROM alerts')) {
    const count = store.alerts.length;
    store.alerts = [];
    saveStore();
    return { lastID: 0, changes: count };
  }

  return { lastID: 0, changes: 0 };
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  loadStore();
  const trimmed = sql.trim();

  if (trimmed.includes('FROM motor_config WHERE id = 1')) {
    return (store.motor_config[0] as T) || undefined;
  }

  if (trimmed.includes('COUNT(*) as count FROM sensor_readings')) {
    return ({ count: store.sensor_readings.length } as any) as T;
  }

  return undefined;
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  loadStore();
  const trimmed = sql.trim();

  if (trimmed.includes('FROM motor_config')) {
    return (store.motor_config as unknown) as T[];
  }

  if (trimmed.includes('FROM alerts')) {
    let result = [...store.alerts];
    if (params.length > 0) {
      const severity = params[0];
      if (severity && typeof severity === 'string' && severity !== 'ALL') {
        result = result.filter((a) => a.severity === severity);
      }
    }
    return (result.reverse().slice(0, 100) as unknown) as T[];
  }

  if (trimmed.includes('FROM sensor_readings')) {
    let result = [...store.sensor_readings];
    if (trimmed.includes('status = ?')) {
      const status = params[0];
      result = result.filter((r) => r.status === status);
    }
    return (result.reverse().slice(0, 500) as unknown) as T[];
  }

  return [];
}

export async function initDatabase(): Promise<void> {
  loadStore();

  // Seed default motor configuration if none exists
  if (store.motor_config.length === 0) {
    await dbRun(
      `INSERT INTO motor_config (
        id, motor_name, motor_type, power_rating, rated_voltage, rated_current, rated_speed,
        temp_warning_limit, temp_critical_limit, vibration_warning_limit, vibration_critical_limit,
        current_warning_limit, current_critical_limit, voltage_min, voltage_max, rpm_min, rpm_max,
        weight_temp, weight_vibration, weight_current, weight_voltage, weight_rpm, control_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'DC Gear Motor Unit #1 (Induction Simulation Prototype)',
        '12V High-Torque Gear Motor / 3-Phase Induction Model',
        '12 W (Demonstration Bench Unit)',
        12.0,
        0.85,
        1450.0,
        55.0,
        70.0,
        2.5,
        4.0,
        1.1,
        1.4,
        10.5,
        13.5,
        1200.0,
        1650.0,
        20.0,
        25.0,
        20.0,
        15.0,
        20.0,
        'AUTO',
      ]
    );
  }

  // Seed initial baseline readings if empty
  if (store.sensor_readings.length === 0) {
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const pastTime = new Date(now - i * 60 * 1000).toISOString();
      const baseTemp = 42.0 + Math.sin(i * 0.3) * 2.2 + (Math.random() - 0.5) * 0.8;
      const baseVib = 1.6 + Math.cos(i * 0.4) * 0.3 + (Math.random() - 0.5) * 0.1;
      const baseCurr = 0.82 + Math.sin(i * 0.2) * 0.04 + (Math.random() - 0.5) * 0.02;
      const baseVolt = 12.0 + (Math.random() - 0.5) * 0.15;
      const baseRpm = 1445 + Math.round((Math.random() - 0.5) * 20);
      const health = 92 - Math.round(Math.abs(Math.sin(i * 0.3)) * 4);

      await dbRun(
        `INSERT INTO sensor_readings (
          timestamp, temperature, vibration, current, voltage, rpm, health_score, status, fault, motor_status, relay_status, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NORMAL', NULL, 'RUNNING', 'ON', 'DEMO_SEED')`,
        [
          pastTime,
          parseFloat(baseTemp.toFixed(1)),
          parseFloat(baseVib.toFixed(2)),
          parseFloat(baseCurr.toFixed(2)),
          parseFloat(baseVolt.toFixed(2)),
          baseRpm,
          health,
          'NORMAL',
          null,
          'RUNNING',
          'ON',
          'DEMO_SEED',
        ]
      );
    }

    await dbRun(
      `INSERT INTO alerts (severity, parameter, value, unit, message, action_taken) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'INFO',
        'SYSTEM',
        1,
        '',
        'System monitoring initialized successfully. Baseline parameters normal.',
        'Continuous telemetry active.',
      ]
    );
  }
}

export default { dbRun, dbGet, dbAll, initDatabase };
