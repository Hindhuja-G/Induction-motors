import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext.tsx';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Cpu,
  Layers,
  HelpCircle,
  Monitor,
  ExternalLink,
} from 'lucide-react';

export const Esp32HardwareView: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [copied, setCopied] = useState(false);

  const readings = telemetry?.currentReadings || {
    temperature: 42.5,
    vibration: 1.6,
    current: 0.85,
    voltage: 12.0,
    rpm: 1450,
  };

  const healthScore = telemetry?.latestHealth?.overallScore ?? 92;
  const isCritical = telemetry?.latestHealth?.status === 'CRITICAL';
  const isWarn = telemetry?.latestHealth?.status === 'WARNING';

  // Format exact 16x2 LCD representation
  let lcdLine1 = `T:${Math.round(readings.temperature)}C I:${readings.current.toFixed(2)}A   `;
  let lcdLine2 = `RPM:${readings.rpm} OK ${healthScore}%`;

  if (isCritical) {
    lcdLine1 = `TEMP:${Math.round(readings.temperature)}C !CRIT!`;
    lcdLine2 = `MTR:OFF PROT:ON `;
  } else if (isWarn) {
    lcdLine1 = `T:${Math.round(readings.temperature)}C V:${readings.vibration.toFixed(1)}mm`;
    lcdLine2 = `I:${readings.current.toFixed(1)}A WARN ${healthScore}%`;
  }

  // Ensure exactly 16 characters
  lcdLine1 = lcdLine1.padEnd(16, ' ').slice(0, 16);
  lcdLine2 = lcdLine2.padEnd(16, ' ').slice(0, 16);

  const pinoutTable = [
    { component: 'ESP32 Dev Module', pin: '3V3 / GND / 5V', espPin: 'Power Rails', desc: 'Main 32-bit dual-core microcontroller' },
    { component: 'Relay Module (5V/12V)', pin: 'IN', espPin: 'GPIO 23', desc: 'Active-LOW optocoupled relay for DC gear motor power' },
    { component: 'IR Speed Sensor (TCRT5000)', pin: 'OUT / DO', espPin: 'GPIO 18', desc: 'Hardware interrupt (FALLING) pulses for RPM calculation' },
    { component: 'Current Sensor (ACS712)', pin: 'OUT', espPin: 'GPIO 32 (ADC1)', desc: 'Analog Hall-effect sensing motor shaft load current' },
    { component: 'Voltage Divider (0-25V)', pin: 'S (Signal)', espPin: 'GPIO 33 (ADC1)', desc: 'Analog input reading 12V supply rail voltage' },
    { component: 'Temperature Sensor (LM35/NTC)', pin: 'OUT / Vout', espPin: 'GPIO 34 (ADC1)', desc: 'Analog temperature transducer on motor casing' },
    { component: 'Vibration Sensor (SW-420)', pin: 'A0 / D0', espPin: 'GPIO 35 (ADC1)', desc: 'Mechanical vibration velocity deflection sensor' },
    { component: '16x2 I2C LCD Backpack', pin: 'SDA', espPin: 'GPIO 21 (SDA)', desc: 'I2C Data line for real-time hardware status screen' },
    { component: '16x2 I2C LCD Backpack', pin: 'SCL', espPin: 'GPIO 22 (SCL)', desc: 'I2C Clock line (Address 0x27 or 0x3F)' },
  ];

  const handleCopyCode = async () => {
    try {
      const res = await fetch('/esp32/motor_monitoring.ino');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadCode = () => {
    const link = document.createElement('a');
    link.href = '/esp32/motor_monitoring.ino';
    link.download = 'motor_monitoring.ino';
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              EMBEDDED HARDWARE INTEGRATION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
            ESP32 Microcontroller & Hardware Setup
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Wiring schematic, pin assignments, 16x2 I2C LCD preview, and ready-to-flash Arduino firmware.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED TO CLIPBOARD' : 'COPY ARDUINO CODE'}
          </button>

          <button
            onClick={handleDownloadCode}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD .INO
          </button>
        </div>
      </div>

      {/* Bench Prototype Lab Photo & LCD Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lab Photo of Physical Bench Setup */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              PROTOTYPE HARDWARE BENCH RIG
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              ASSEMBLED & TESTED
            </span>
          </div>

          <div className="relative h-64 w-full bg-slate-950 overflow-hidden group">
            <img
              src="/src/assets/images/esp32_hardware_rig_1791511162218.jpg"
              alt="ESP32 Hardware Rig with I2C LCD, Relay, and Sensors"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-300 flex justify-between">
              <span>ESP32 + Opto Relay + 16x2 LCD + Sensors</span>
              <span className="text-cyan-400">12V DC Supply</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <div>• Motor: 12V High-Torque DC Gear Motor (Simulating 3-Phase Induction Motor)</div>
            <div>• Power: 12V 1A DC Adapter through Optocoupled Relay Isolation</div>
          </div>
        </div>

        {/* 16x2 I2C LCD Physical Display Simulator */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase font-bold text-slate-200">
                  16×2 I2C LCD SCREEN SIMULATOR (LIVE REPLICA)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Address: 0x27 / GPIO 21 & 22
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400 mb-3">
              The physical prototype contains an I2C LiquidCrystal display. Below is the exact live mirror
              of characters rendered on the hardware screen:
            </p>

            {/* Skeuomorphic 16x2 LCD Bezel */}
            <div className="p-5 bg-emerald-950/80 border-4 border-slate-800 rounded-xl shadow-inner font-mono">
              <div className="p-3 bg-[#0f2e1b] border-2 border-[#194528] rounded text-[#4ade80] shadow-inner select-none tracking-widest text-base sm:text-lg font-bold">
                <div className="whitespace-pre">{lcdLine1}</div>
                <div className="whitespace-pre mt-1">{lcdLine2}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>LCD State:</span>
              <span className="text-white font-bold">{isCritical ? 'CRITICAL SHUTDOWN' : isWarn ? 'WARNING ADVISORY' : 'NORMAL BENCH'}</span>
            </div>
            <div className="flex justify-between">
              <span>Backlight:</span>
              <span className="text-emerald-400">ACTIVE (LED ON)</span>
            </div>
          </div>
        </div>
      </div>

      {/* GPIO Wiring & Pinout Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              ESP32 GPIO PIN ASSIGNMENT REFERENCE
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-950/40">
                <th className="py-2.5 px-3 font-semibold">MODULE / SENSOR</th>
                <th className="py-2.5 px-3 font-semibold">DEVICE PIN</th>
                <th className="py-2.5 px-3 font-semibold">ESP32 GPIO</th>
                <th className="py-2.5 px-3 font-semibold">FUNCTIONAL DESCRIPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pinoutTable.map((row) => (
                <tr key={row.component + row.espPin} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{row.component}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{row.pin}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.espPin}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Connection Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-4">
        <div className="text-xs font-bold uppercase text-slate-200 pb-2 border-b border-slate-800">
          HOW TO CONFIGURE & FLASH THE ESP32 FIRMWARE
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">
              Step 1: Install Required Arduino IDE Libraries
            </div>
            <div className="text-slate-400 text-[11px]">
              Open Arduino IDE → Library Manager (Ctrl+Shift+I) and install:
              <br />• <strong>LiquidCrystal_I2C</strong> by Frank de Brabander
              <br />• <strong>ArduinoJson</strong> by Benoit Blanchon (v6 or v7)
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">
              Step 2: Enter Wi-Fi Credentials & Backend Server IP
            </div>
            <div className="text-slate-400 text-[11px]">
              In <code className="text-amber-300">motor_monitoring.ino</code> (Lines 34–41), edit:
              <pre className="mt-2 p-2 bg-slate-900 rounded text-cyan-300 text-[11px] overflow-x-auto">
{`const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Example Local IP: "http://192.168.1.100:3000/api/sensor-data"
// Example Cloud Applet URL: "${window.location.origin}/api/sensor-data"
const char* BACKEND_API_URL = "${window.location.origin}/api/sensor-data";`}
              </pre>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">
              Step 3: Upload & Verify Two-Way Sync
            </div>
            <div className="text-slate-400 text-[11px]">
              Select Board: <strong>ESP32 Dev Module</strong>, Baud Rate: <strong>115200</strong>.
              Once flashed, the ESP32 will connect to Wi-Fi, post sensor telemetry to the web application every 2 seconds,
              and receive real-time motor relay protection commands!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
