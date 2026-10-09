import { MotorConfig, SensorData } from '../healthEngine/healthScore.ts';

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

export function diagnoseMotorFaults(data: SensorData, config: MotorConfig): FaultAnalysis {
  const faults: DetectedFault[] = [];

  // 1. Temperature Analysis
  if (data.temperature >= config.temp_critical_limit) {
    faults.push({
      id: 'FAULT_TEMP_CRIT',
      parameter: 'TEMPERATURE',
      severity: 'CRITICAL',
      title: 'Severe Motor Overheating',
      currentValue: data.temperature,
      thresholdValue: config.temp_critical_limit,
      unit: '°C',
      rootCause: 'Thermal dissipation failure, excessive ambient heat, or severe continuous electrical overload.',
      recommendation: 'Halt motor immediately. Inspect stator cooling airflow, bearing friction, and winding insulation.',
    });
  } else if (data.temperature >= config.temp_warning_limit) {
    faults.push({
      id: 'FAULT_TEMP_WARN',
      parameter: 'TEMPERATURE',
      severity: 'WARNING',
      title: 'Elevated Operating Temperature',
      currentValue: data.temperature,
      thresholdValue: config.temp_warning_limit,
      unit: '°C',
      rootCause: 'Rising thermal load, slight overcurrent, or partial ventilation blockage.',
      recommendation: 'Monitor thermal trajectory. Verify heat sink dissipation and duty cycle.',
    });
  }

  // 2. Vibration Analysis
  if (data.vibration >= config.vibration_critical_limit) {
    faults.push({
      id: 'FAULT_VIB_CRIT',
      parameter: 'VIBRATION',
      severity: 'CRITICAL',
      title: 'Excessive Mechanical Vibration',
      currentValue: data.vibration,
      thresholdValue: config.vibration_critical_limit,
      unit: 'mm/s',
      rootCause: 'Severe rotor unbalance, shaft misalignment, broken gear tooth, or damaged bearing race.',
      recommendation: 'Immediate shutdown required to prevent catastrophic mechanical failure. Inspect shaft coupling & bearings.',
    });
  } else if (data.vibration >= config.vibration_warning_limit) {
    faults.push({
      id: 'FAULT_VIB_WARN',
      parameter: 'VIBRATION',
      severity: 'WARNING',
      title: 'Moderate Mechanical Vibration',
      currentValue: data.vibration,
      thresholdValue: config.vibration_warning_limit,
      unit: 'mm/s',
      rootCause: 'Slight mechanical resonance, minor coupling eccentricity, or loose mounting bolts.',
      recommendation: 'Inspect mounting fasteners, verify shaft alignment, and check bearing lubrication.',
    });
  }

  // 3. Current Analysis
  if (data.current >= config.current_critical_limit) {
    faults.push({
      id: 'FAULT_CURR_CRIT',
      parameter: 'CURRENT',
      severity: 'CRITICAL',
      title: 'Dangerous Overcurrent / Impending Stall',
      currentValue: data.current,
      thresholdValue: config.current_critical_limit,
      unit: 'A',
      rootCause: 'Rotor lock/stall condition, excessive mechanical torque demand, or winding short-circuit.',
      recommendation: 'Emergency relay de-energize. Check output gearbox for mechanical jam before restoring power.',
    });
  } else if (data.current >= config.current_warning_limit) {
    faults.push({
      id: 'FAULT_CURR_WARN',
      parameter: 'CURRENT',
      severity: 'WARNING',
      title: 'Current Draw Exceeding Rated Capacity',
      currentValue: data.current,
      thresholdValue: config.current_warning_limit,
      unit: 'A',
      rootCause: 'High mechanical load resistance or elevated supply voltage ripple.',
      recommendation: 'Verify mechanical load profile and check driver circuit temperature.',
    });
  }

  // 4. Voltage Analysis
  if (data.voltage < config.voltage_min) {
    faults.push({
      id: 'FAULT_VOLT_UNDER',
      parameter: 'VOLTAGE',
      severity: 'CRITICAL',
      title: 'Supply Under-Voltage Detected',
      currentValue: data.voltage,
      thresholdValue: config.voltage_min,
      unit: 'V',
      rootCause: 'Power supply sag, high lead resistance, or exhausted adapter/battery.',
      recommendation: 'Inspect 12V adapter rating and wiring gauge. Low voltage can cause stator overheating.',
    });
  } else if (data.voltage > config.voltage_max) {
    faults.push({
      id: 'FAULT_VOLT_OVER',
      parameter: 'VOLTAGE',
      severity: 'CRITICAL',
      title: 'Supply Over-Voltage Detected',
      currentValue: data.voltage,
      thresholdValue: config.voltage_max,
      unit: 'V',
      rootCause: 'Unregulated supply spike, regenerative back-EMF surge, or power converter malfunction.',
      recommendation: 'Check DC power supply regulation immediately to protect motor driver.',
    });
  }

  // 5. Speed (RPM) Analysis
  if (data.rpm < config.rpm_min && data.current > 0.3) {
    faults.push({
      id: 'FAULT_RPM_LOW',
      parameter: 'SPEED',
      severity: 'CRITICAL',
      title: 'Abnormal Shaft Speed Droop (Under-Speed)',
      currentValue: data.rpm,
      thresholdValue: config.rpm_min,
      unit: 'RPM',
      rootCause: 'Heavy mechanical drag, gearbox gear binding, or partial rotor stall.',
      recommendation: 'Check mechanical transmission train and verify IR optical tachometer alignment.',
    });
  } else if (data.rpm > config.rpm_max) {
    faults.push({
      id: 'FAULT_RPM_HIGH',
      parameter: 'SPEED',
      severity: 'WARNING',
      title: 'Unloaded Over-Speed Detected',
      currentValue: data.rpm,
      thresholdValue: config.rpm_max,
      unit: 'RPM',
      rootCause: 'Sudden decoupling of load or input voltage surge.',
      recommendation: 'Inspect mechanical coupling and speed governor settings.',
    });
  }

  // 6. Multi-Parameter Cross-Referencing
  let multiParamFault: DetectedFault | null = null;
  const isHighTemp = data.temperature >= config.temp_warning_limit;
  const isHighCurr = data.current >= config.current_warning_limit;
  const isHighVib = data.vibration >= config.vibration_warning_limit;
  const isLowRpm = data.rpm < config.rpm_min;

  if (isHighTemp && isHighCurr && isHighVib && isLowRpm) {
    multiParamFault = {
      id: 'FAULT_MULTI_SEIZURE',
      parameter: 'MULTI_PARAMETER',
      severity: 'CRITICAL',
      title: 'Combined Mechanical Seizure & Severe Overload',
      currentValue: `T:${data.temperature}°C, I:${data.current}A, V:${data.vibration}mm/s, RPM:${data.rpm}`,
      thresholdValue: 'Multiple Warning/Critical Limits',
      unit: '',
      rootCause: 'Combined thermal escalation, high current surge, elevated vibration, and speed drop indicate impending rotor lock / bearing destruction.',
      recommendation: 'Mandatory automatic trip activated. Disassemble drive train and inspect rotor bearings before restart.',
    };
  } else if (isHighTemp && isHighCurr) {
    multiParamFault = {
      id: 'FAULT_MULTI_OVERLOAD',
      parameter: 'MULTI_PARAMETER',
      severity: data.temperature >= config.temp_critical_limit || data.current >= config.current_critical_limit ? 'CRITICAL' : 'WARNING',
      title: 'Thermal & Electrical Overload Correlation',
      currentValue: `T:${data.temperature}°C, I:${data.current}A`,
      thresholdValue: 'Rated Limits',
      unit: '',
      rootCause: 'High current draw is directly driving winding thermal escalation.',
      recommendation: 'Reduce shaft load resistance or increase duty resting intervals.',
    };
  } else if (isHighVib && isHighTemp) {
    multiParamFault = {
      id: 'FAULT_MULTI_BEARING',
      parameter: 'MULTI_PARAMETER',
      severity: data.vibration >= config.vibration_critical_limit ? 'CRITICAL' : 'WARNING',
      title: 'Friction-Induced Bearing Distress',
      currentValue: `V:${data.vibration}mm/s, T:${data.temperature}°C`,
      thresholdValue: 'Vibration & Temp Warning Limits',
      unit: '',
      rootCause: 'Bearing race friction causing simultaneous mechanical vibration harmonic and localized heating.',
      recommendation: 'Inspect bearing lubrication, axial play, and shaft alignment.',
    };
  }

  if (multiParamFault) {
    faults.unshift(multiParamFault);
  }

  const hasCritical = faults.some((f) => f.severity === 'CRITICAL');
  const hasWarning = faults.some((f) => f.severity === 'WARNING');

  let primaryFault: string | null = null;
  if (multiParamFault && multiParamFault.severity === 'CRITICAL') {
    primaryFault = multiParamFault.title;
  } else if (faults.length > 0) {
    primaryFault = faults[0].title;
  }

  return {
    activeFaults: faults,
    primaryFault,
    multiParameterFault: multiParamFault,
    hasCritical,
    hasWarning,
    protectionRequired: hasCritical,
  };
}
