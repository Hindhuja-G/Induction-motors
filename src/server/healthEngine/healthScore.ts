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
  control_mode?: string;
}

export interface SensorData {
  temperature: number; // °C
  vibration: number;   // mm/s
  current: number;     // A
  voltage: number;     // V
  rpm: number;         // RPM
}

export interface ParameterHealth {
  score: number;       // 0 - 100
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

function calculateSubScore(
  val: number,
  nominal: number,
  warn: number,
  crit: number,
  isHigherWorse = true
): ParameterHealth {
  if (isHigherWorse) {
    if (val <= warn) {
      // Normal region: 100 down to 75
      const ratio = Math.max(0, (val - nominal) / (warn - nominal || 1));
      const score = Math.max(75, Math.min(100, Math.round(100 - ratio * 25)));
      return {
        score,
        status: 'NORMAL',
        deviationPercent: Number((((val - nominal) / nominal) * 100).toFixed(1)),
        description: 'Within standard nominal operating range',
      };
    } else if (val < crit) {
      // Warning region: 74 down to 40
      const ratio = (val - warn) / (crit - warn || 1);
      const score = Math.max(40, Math.min(74, Math.round(74 - ratio * 34)));
      return {
        score,
        status: 'WARNING',
        deviationPercent: Number((((val - nominal) / nominal) * 100).toFixed(1)),
        description: 'Exceeded warning limit. Elevated operational stress.',
      };
    } else {
      // Critical region: 39 down to 5
      const excess = Math.min(1, (val - crit) / (crit * 0.3 || 1));
      const score = Math.max(5, Math.min(39, Math.round(39 - excess * 34)));
      return {
        score,
        status: 'CRITICAL',
        deviationPercent: Number((((val - nominal) / nominal) * 100).toFixed(1)),
        description: 'CRITICAL threshold breached. Urgent protection required.',
      };
    }
  } else {
    // Both lower and higher boundaries (e.g. voltage or RPM)
    return {
      score: 100,
      status: 'NORMAL',
      deviationPercent: 0,
      description: 'Nominal',
    };
  }
}

function evaluateRangeScore(
  val: number,
  nominal: number,
  minWarn: number,
  maxWarn: number,
  minCrit: number,
  maxCrit: number
): ParameterHealth {
  const deviation = Number((((val - nominal) / nominal) * 100).toFixed(1));

  if (val >= minWarn && val <= maxWarn) {
    // Optimal band: 85 - 100
    const devRatio = Math.abs(val - nominal) / (maxWarn - nominal || 1);
    const score = Math.max(80, Math.min(100, Math.round(100 - devRatio * 20)));
    return {
      score,
      status: 'NORMAL',
      deviationPercent: deviation,
      description: 'Parameter is steady within nominal band.',
    };
  } else if (val >= minCrit && val <= maxCrit) {
    // Warning region: 40 - 75
    const score = 55;
    return {
      score,
      status: 'WARNING',
      deviationPercent: deviation,
      description: val < minWarn ? 'Operating below recommended threshold.' : 'Operating above recommended threshold.',
    };
  } else {
    // Critical region: < minCrit or > maxCrit
    const score = 25;
    return {
      score,
      status: 'CRITICAL',
      deviationPercent: deviation,
      description: val < minCrit ? 'Severe deficit below critical lower bound!' : 'Severe surge above critical upper bound!',
    };
  }
}

export function computeMotorHealth(data: SensorData, config: MotorConfig): HealthAssessment {
  // 1. Temperature Evaluation (Baseline nominal ~40°C)
  const tempHealth = calculateSubScore(
    data.temperature,
    40.0,
    config.temp_warning_limit,
    config.temp_critical_limit
  );

  // 2. Vibration Evaluation (Baseline nominal ~1.2 mm/s)
  const vibHealth = calculateSubScore(
    data.vibration,
    1.2,
    config.vibration_warning_limit,
    config.vibration_critical_limit
  );

  // 3. Current Evaluation (Nominal rated_current ~0.85A)
  const currHealth = calculateSubScore(
    data.current,
    config.rated_current * 0.9,
    config.current_warning_limit,
    config.current_critical_limit
  );

  // 4. Voltage Evaluation (Nominal rated_voltage ~12V, warning 11.2 - 12.8, crit voltage_min - voltage_max)
  const voltWarnMin = config.rated_voltage - (config.rated_voltage - config.voltage_min) * 0.5;
  const voltWarnMax = config.rated_voltage + (config.voltage_max - config.rated_voltage) * 0.5;
  const voltHealth = evaluateRangeScore(
    data.voltage,
    config.rated_voltage,
    voltWarnMin,
    voltWarnMax,
    config.voltage_min,
    config.voltage_max
  );

  // 5. RPM Evaluation (Nominal rated_speed ~1450 RPM)
  let rpmHealth: ParameterHealth;
  if (data.rpm <= 100 && data.current <= 0.25) {
    // Motor is intentionally in standby / stopped
    rpmHealth = {
      score: 100,
      status: 'NORMAL',
      deviationPercent: 0,
      description: 'Motor at rest in nominal standby.',
    };
  } else {
    const rpmWarnMin = config.rated_speed - (config.rated_speed - config.rpm_min) * 0.5;
    const rpmWarnMax = config.rated_speed + (config.rpm_max - config.rated_speed) * 0.5;
    rpmHealth = evaluateRangeScore(
      data.rpm,
      config.rated_speed,
      rpmWarnMin,
      rpmWarnMax,
      config.rpm_min,
      config.rpm_max
    );
  }

  const parameterScores = {
    temperature: tempHealth,
    vibration: vibHealth,
    current: currHealth,
    voltage: voltHealth,
    rpm: rpmHealth,
  };

  const criticalParameters: string[] = [];
  const warningParameters: string[] = [];

  for (const [key, param] of Object.entries(parameterScores)) {
    if (param.status === 'CRITICAL') {
      criticalParameters.push(key);
    } else if (param.status === 'WARNING') {
      warningParameters.push(key);
    }
  }

  // Calculate weighted sum
  const totalWeight =
    (config.weight_temp || 20) +
    (config.weight_vibration || 25) +
    (config.weight_current || 20) +
    (config.weight_voltage || 15) +
    (config.weight_rpm || 20);

  const weightedSum =
    tempHealth.score * (config.weight_temp || 20) +
    vibHealth.score * (config.weight_vibration || 25) +
    currHealth.score * (config.weight_current || 20) +
    voltHealth.score * (config.weight_voltage || 15) +
    rpmHealth.score * (config.weight_rpm || 20);

  let overallScore = Math.round(weightedSum / (totalWeight || 100));

  // Safety gating: A single critical parameter strictly drops health to CRITICAL
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
  if (criticalParameters.length > 0) {
    status = 'CRITICAL';
    // Cap overall score below 38%
    overallScore = Math.min(overallScore, 36 - (criticalParameters.length - 1) * 6);
    overallScore = Math.max(12, overallScore);
  } else if (warningParameters.length > 0) {
    status = 'WARNING';
    overallScore = Math.min(overallScore, 68);
    overallScore = Math.max(42, overallScore);
  } else {
    status = 'NORMAL';
    overallScore = Math.max(72, Math.min(100, overallScore));
  }

  let rating: 'EXCELLENT' | 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
  if (overallScore >= 90) rating = 'EXCELLENT';
  else if (overallScore >= 70) rating = 'NORMAL';
  else if (overallScore >= 40) rating = 'WARNING';
  else rating = 'CRITICAL';

  let summary = 'Motor parameters operating in nominal range.';
  if (criticalParameters.length > 0) {
    summary = `Critical alarm on: ${criticalParameters.join(', ')}. Emergency protection required.`;
  } else if (warningParameters.length > 0) {
    summary = `Caution: Warning tolerances exceeded on ${warningParameters.join(', ')}.`;
  }

  return {
    overallScore,
    status,
    rating,
    parameterScores,
    criticalParameters,
    warningParameters,
    summary,
  };
}
