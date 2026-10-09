import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/db.ts';
import motorStateService, { ControlMode, OperatingMode } from '../services/motorStateService.ts';

const router = Router();

// 1. ESP32 Sensor Ingestion Endpoint
router.post('/sensor-data', async (req: Request, res: Response) => {
  try {
    const { temperature, vibration, current, voltage, rpm } = req.body;

    if (
      temperature === undefined ||
      vibration === undefined ||
      current === undefined ||
      voltage === undefined ||
      rpm === undefined
    ) {
      return res.status(400).json({ error: 'Missing required sensor telemetry fields' });
    }

    const response = await motorStateService.processSensorData(
      {
        temperature: Number(temperature),
        vibration: Number(vibration),
        current: Number(current),
        voltage: Number(voltage),
        rpm: Number(rpm),
      },
      'LIVE_ESP32'
    );

    return res.json(response);
  } catch (err: any) {
    console.error('Sensor data ingestion error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Telemetry and System Status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const state = await motorStateService.getSystemState();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Health Assessment Detail
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const state = await motorStateService.getSystemState();
    const config = await motorStateService.getMotorConfig();
    res.json({
      health: state.latestHealth,
      weights: {
        temperature: config.weight_temp,
        vibration: config.weight_vibration,
        current: config.weight_current,
        voltage: config.weight_voltage,
        rpm: config.weight_rpm,
      },
      config,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Alerts API
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const severity = req.query.severity as string;
    const search = req.query.search as string;

    let query = 'SELECT * FROM alerts';
    const params: any[] = [];
    const conditions: string[] = [];

    if (severity && severity !== 'ALL') {
      conditions.push('severity = ?');
      params.push(severity.toUpperCase());
    }

    if (search) {
      conditions.push('(message LIKE ? OR action_taken LIKE ? OR parameter LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT 100';

    const alerts = await dbAll(query, params);
    res.json({ alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (id) {
      await dbRun('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [id]);
    } else {
      await dbRun('UPDATE alerts SET acknowledged = 1');
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/clear', async (_req: Request, res: Response) => {
  try {
    await dbRun('DELETE FROM alerts');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Historical Sensor Readings
router.get('/history', async (req: Request, res: Response) => {
  try {
    const timeRange = (req.query.range as string) || '1h'; // 10m, 30m, 1h, 6h, 24h
    const search = req.query.search as string;
    const status = req.query.status as string;

    let timeFilterMinutes = 60;
    if (timeRange === '10m') timeFilterMinutes = 10;
    else if (timeRange === '30m') timeFilterMinutes = 30;
    else if (timeRange === '1h') timeFilterMinutes = 60;
    else if (timeRange === '6h') timeFilterMinutes = 360;
    else if (timeRange === '24h') timeFilterMinutes = 1440;

    let query = `
      SELECT * FROM sensor_readings
      WHERE timestamp >= datetime('now', '-${timeFilterMinutes} minutes')
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (status LIKE ? OR fault LIKE ? OR motor_status LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC LIMIT 500';

    const readings = await dbAll(query, params);
    res.json({ readings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export
router.get('/history/export', async (_req: Request, res: Response) => {
  try {
    const readings = await dbAll('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 2000');
    let csv = 'ID,Timestamp,Temperature(C),Vibration(mm/s),Current(A),Voltage(V),Speed(RPM),HealthScore(%),Status,Fault,MotorStatus,RelayStatus,Source\n';

    for (const r of readings) {
      const faultText = (r.fault || 'None').replace(/,/g, ';');
      csv += `${r.id},${r.timestamp},${r.temperature},${r.vibration},${r.current},${r.voltage},${r.rpm},${r.health_score},${r.status},"${faultText}",${r.motor_status},${r.relay_status},${r.source}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="motor_telemetry_history.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).send('Export error: ' + err.message);
  }
});

// 6. Motor Control Actions
router.post('/motor/start', async (_req: Request, res: Response) => {
  try {
    const result = await motorStateService.startMotor();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/motor/stop', async (_req: Request, res: Response) => {
  try {
    const result = await motorStateService.stopMotor();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/motor/reset-trip', async (_req: Request, res: Response) => {
  try {
    const result = await motorStateService.resetProtectionLock();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/motor/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    if (mode === 'AUTO' || mode === 'MANUAL') {
      motorStateService.setControlMode(mode as ControlMode);
      await dbRun('UPDATE motor_config SET control_mode = ? WHERE id = 1', [mode]);
      return res.json({ success: true, controlMode: mode });
    }
    return res.status(400).json({ error: 'Invalid mode. Must be AUTO or MANUAL' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. Motor Configuration Limits
router.get('/configuration', async (_req: Request, res: Response) => {
  try {
    const config = await motorStateService.getMotorConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/configuration', async (req: Request, res: Response) => {
  try {
    const c = req.body;
    // Input validation
    if (
      !c.motor_name ||
      c.rated_voltage === undefined ||
      c.temp_warning_limit === undefined ||
      c.temp_critical_limit === undefined ||
      c.vibration_warning_limit === undefined ||
      c.vibration_critical_limit === undefined ||
      c.current_warning_limit === undefined ||
      c.current_critical_limit === undefined
    ) {
      return res.status(400).json({ error: 'Missing required configuration fields' });
    }

    await dbRun(
      `UPDATE motor_config SET
        motor_name = ?, motor_type = ?, power_rating = ?,
        rated_voltage = ?, rated_current = ?, rated_speed = ?,
        temp_warning_limit = ?, temp_critical_limit = ?,
        vibration_warning_limit = ?, vibration_critical_limit = ?,
        current_warning_limit = ?, current_critical_limit = ?,
        voltage_min = ?, voltage_max = ?,
        rpm_min = ?, rpm_max = ?,
        weight_temp = ?, weight_vibration = ?, weight_current = ?, weight_voltage = ?, weight_rpm = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
      [
        c.motor_name,
        c.motor_type || 'DC Gear Motor Prototype',
        c.power_rating || '12W',
        Number(c.rated_voltage),
        Number(c.rated_current),
        Number(c.rated_speed),
        Number(c.temp_warning_limit),
        Number(c.temp_critical_limit),
        Number(c.vibration_warning_limit),
        Number(c.vibration_critical_limit),
        Number(c.current_warning_limit),
        Number(c.current_critical_limit),
        Number(c.voltage_min),
        Number(c.voltage_max),
        Number(c.rpm_min),
        Number(c.rpm_max),
        Number(c.weight_temp || 20),
        Number(c.weight_vibration || 25),
        Number(c.weight_current || 20),
        Number(c.weight_voltage || 15),
        Number(c.weight_rpm || 20),
      ]
    );

    await motorStateService.logAlert(
      'INFO',
      'CONFIG',
      null,
      '',
      'Motor operational thresholds and weight profile updated.',
      'New threshold matrix active in real-time engine.'
    );

    const updated = await motorStateService.getMotorConfig();
    return res.json({ success: true, config: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Demo Simulator Endpoints
router.post('/demo/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    if (mode === 'LIVE_HARDWARE' || mode === 'DEMO_MODE') {
      motorStateService.setOperatingMode(mode as OperatingMode);
      return res.json({ success: true, operatingMode: mode });
    }
    return res.status(400).json({ error: 'Invalid mode. Must be LIVE_HARDWARE or DEMO_MODE' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/demo/scenario', async (req: Request, res: Response) => {
  try {
    const { scenario } = req.body;
    if (!scenario) {
      return res.status(400).json({ error: 'Scenario name is required' });
    }
    const result = await motorStateService.applyDemoScenario(scenario);
    return res.json({ success: true, scenario, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/demo/set-sensors', async (req: Request, res: Response) => {
  try {
    const { temperature, vibration, current, voltage, rpm } = req.body;
    const result = await motorStateService.processSensorData(
      {
        temperature: Number(temperature),
        vibration: Number(vibration),
        current: Number(current),
        voltage: Number(voltage),
        rpm: Number(rpm),
      },
      'DEMO'
    );
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Real-Time Server-Sent Events (SSE) Stream
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial state immediately
  motorStateService.getSystemState().then((state) => {
    sendEvent({ type: 'INIT_STATE', data: state });
  });

  const broadcaster = (payload: any) => {
    sendEvent(payload);
  };

  motorStateService.registerBroadcaster(broadcaster);

  req.on('close', () => {
    motorStateService.unregisterBroadcaster(broadcaster);
    res.end();
  });
});

export default router;
