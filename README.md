# IoT-Based Induction Motor Health Monitoring and Predictive Maintenance System
### Final-Year ECE Capstone Project

A complete, professional, independent Industrial IoT condition monitoring and predictive maintenance web platform. Designed for electric motor health diagnostics and demonstrated using a **12V High-Torque DC Gear Motor prototype** controlled by an **ESP32 microcontroller**.

---

## 1. Project Concept & Pipeline

```text
SENSE → MONITOR → ANALYZE → HEALTH SCORE → TREND ANALYSIS → EARLY WARNING → FAULT DETECTION → ALERT → CONTROL → PROTECTION
```

1. **SENSE**: Continuous physical parameter acquisition via ESP32 (Temperature, Vibration, Current, Voltage, RPM).
2. **MONITOR**: Real-time 2.0 Hz telemetry streaming over Wi-Fi to a custom web dashboard.
3. **ANALYZE**: Multi-parameter weighted health index calculation normalized against motor nameplate ratings.
4. **HEALTH SCORE**: 0–100% composite score categorized into **Excellent** (90–100%), **Normal** (70–89%), **Warning** (40–69%), and **Critical** (0–39%).
5. **TREND ANALYSIS**: Monotonic regression and finite difference slope detection identifying thermal climb, vibration escalation, or speed droop before dangerous thresholds are hit.
6. **EARLY WARNING**: Proactive engineering advisories with risk ratings and maintenance recommendations.
7. **FAULT DETECTION**: Rule-based cross-referencing diagnosing specific failure modes:
   - Over Temperature (Thermal dissipation failure)
   - High Vibration (Rotor unbalance / bearing flaking)
   - Overcurrent / Stall (High mechanical load / rotor bind)
   - Voltage Anomaly (Under-voltage / over-voltage power rail sag)
   - Speed Droop (Gear train friction / optical tachometer misalignment)
   - Multi-Parameter Fault (Combined thermal, vibrational, and electrical stress)
8. **ALERT**: Instant priority logging with timestamps, units, and action taken records.
9. **CONTROL**: Two-way supervisory control allowing operator START/STOP via optocoupled relay.
10. **PROTECTION**: Mandatory automated safety lockout. When any critical parameter is breached, the relay is immediately de-energized, the motor halts, and restart is blocked until the condition is safe.

---

## 2. Project Folder Structure

```text
├── esp32/
│   └── motor_monitoring.ino          # Complete ESP32 Arduino C++ firmware sketch
├── src/
│   ├── assets/
│   │   └── images/                   # Industrial motor cutaway & hardware bench rig photos
│   ├── components/
│   │   ├── common/
│   │   │   ├── CriticalBanner.tsx    # Emergency shutdown alert panel
│   │   │   ├── DemoControlBar.tsx    # Live simulation presets and manual parameter sliders
│   │   │   ├── EarlyWarningBanner.tsx# Trend advisory banner
│   │   │   ├── HealthGauge.tsx       # Animated circular gauge with sub-score breakdown
│   │   │   ├── MotorStatusCard.tsx   # Drive state, relay state, and trip lockout controls
│   │   │   ├── RealtimeTrendChart.tsx# Chart.js graphs with warning/critical threshold lines
│   │   │   └── SensorCard.tsx        # High-density cards with live sparklines and tolerance bars
│   │   └── layout/
│   │       ├── Header.tsx            # Top status bar, hardware link, notifications, E-STOP
│   │       └── Sidebar.tsx           # Desktop fixed & mobile drawer navigation menu
│   ├── context/
│   │   └── TelemetryContext.tsx      # WebSocket / SSE real-time state synchronization
│   ├── server/
│   │   ├── database/
│   │   │   └── db.ts                 # Persistent database engine (readings, alerts, config)
│   │   ├── faultEngine/
│   │   │   ├── faultDetector.ts      # Multi-parameter rule-based diagnostic engine
│   │   │   └── trendAnalyzer.ts      # Rate-of-change slope and monotonicity analyzer
│   │   ├── healthEngine/
│   │   │   └── healthScore.ts        # Weighted composite health scoring algorithm
│   │   ├── routes/
│   │   │   └── api.ts                # REST API endpoints (sensors, control, config, CSV)
│   │   └── services/
│   │       └── motorStateService.ts  # State machine, safety interlock, and broadcast manager
│   ├── views/
│   │   ├── AlertCenterView.tsx       # Searchable, filterable audit log of system alarms
│   │   ├── DashboardView.tsx         # Primary executive operations overview
│   │   ├── Esp32HardwareView.tsx     # Wiring guide, 16x2 LCD simulator & Arduino code
│   │   ├── FaultDetectionView.tsx    # Diagnostic matrix and root-cause explanations
│   │   ├── HealthAnalysisView.tsx    # Mathematical formulation & sensitivity weights
│   │   ├── LiveMonitoringView.tsx    # High-frequency waveforms and raw packet inspector
│   │   ├── MotorConfigurationView.tsx# Motor ratings & trip thresholds editor
│   │   ├── MotorControlView.tsx      # Industrial pushbutton switchboard & trip counter
│   │   ├── SystemDiagnosticsView.tsx # Communication latency & connection status
│   │   └── TrendsHistoryView.tsx     # Historical data table with CSV export
│   ├── App.tsx                       # Main application shell
│   ├── index.css                     # Tailwind CSS v4 directives
│   ├── main.tsx                      # React root entry point
│   └── types.ts                      # Shared TypeScript data contracts
├── data/
│   └── motor_monitoring_store.json   # Persistent SQLite-style JSON database file
├── server.ts                         # Full-stack Node.js Express server + WebSocket server
├── package.json                      # Scripts & dependencies
└── vite.config.ts                    # Vite client bundler configuration
```

---

## 3. How to Run the Web Application

### Prerequisites
- Node.js (v18 or higher)
- npm

### Development & Live Testing
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the full-stack server (runs both Express REST API, WebSocket server, and Vite):
   ```bash
   npm run dev
   ```
3. Open your browser at:
   ```text
   http://localhost:3000
   ```

### Production Build
```bash
npm run build
npm run start
```

---

## 4. Hardware Wiring & Pinout Table

| Module / Sensor | Sensor Pin | ESP32 GPIO | Description / Connection |
| :--- | :--- | :--- | :--- |
| **Relay Module (5V/12V)** | `IN` | **GPIO 23** | Active-LOW optocoupled relay controlling 12V motor power rail |
| **IR Speed Sensor (TCRT5000)** | `DO` | **GPIO 18** | Hardware interrupt (FALLING) counting pulses for RPM |
| **Current Sensor (ACS712-05B)** | `OUT` | **GPIO 32 (ADC1)** | Analog input reading motor load current (185 mV/A) |
| **Voltage Divider Module** | `S (Signal)` | **GPIO 33 (ADC1)** | Analog input reading 12V supply rail voltage (5:1 ratio) |
| **Temperature Sensor (LM35/NTC)** | `OUT` | **GPIO 34 (ADC1)** | Analog temperature probe mounted on motor stator casing |
| **Vibration Sensor (SW-420)** | `A0 / D0` | **GPIO 35 (ADC1)** | Vibration velocity deflection probe on bearing housing |
| **16×2 I2C LCD Display** | `SDA` | **GPIO 21 (SDA)** | I2C Data line for local hardware display screen |
| **16×2 I2C LCD Display** | `SCL` | **GPIO 22 (SCL)** | I2C Clock line (Address `0x27` or `0x3F`) |
| **Power Supply** | `VCC / GND` | **VIN (5V) / GND** | 12V 1A DC adapter powers motor via relay; 5V step-down to ESP32 |

---

## 5. ESP32 Wi-Fi & Backend Configuration

Open `esp32/motor_monitoring.ino` in the Arduino IDE.

Locate **Lines 34 to 41**:
```cpp
// =========================================================================================
// 1. NETWORK CONFIGURATION (ENTER YOUR WI-FI CREDENTIALS AND BACKEND SERVER URL HERE)
// =========================================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";     // <-- Enter your Wi-Fi name / Mobile Hotspot
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- Enter your Wi-Fi password

// URL of the Motor Monitoring Web Application Backend
// Example Local Network: "http://192.168.1.100:3000/api/sensor-data"
// Example Cloud Web App URL: "https://your-app-domain.com/api/sensor-data"
const char* BACKEND_API_URL = "http://192.168.1.50:3000/api/sensor-data";
```

### Required Arduino IDE Libraries:
1. `LiquidCrystal_I2C` by Frank de Brabander
2. `ArduinoJson` by Benoit Blanchon (version 6 or 7)

---

## 6. Two-Way Communication Protocol

### Uplink: ESP32 → Web Application
Every 2 seconds, the ESP32 performs:
```http
POST /api/sensor-data HTTP/1.1
Content-Type: application/json

{
  "temperature": 42.5,
  "vibration": 1.65,
  "current": 0.84,
  "voltage": 11.95,
  "rpm": 1445
}
```

### Downlink: Web Application → ESP32
The backend evaluates the reading against the motor thresholds, runs the health engine, and returns:
```json
{
  "healthScore": 92,
  "status": "NORMAL",
  "motorStatus": "RUNNING",
  "relayStatus": "ON",
  "fault": null,
  "protectionActive": false
}
```
If a critical threshold is breached, the backend returns:
```json
{
  "healthScore": 24,
  "status": "CRITICAL",
  "motorStatus": "PROTECTED",
  "relayStatus": "OFF",
  "fault": "Possible Overheating / Rotor Overload",
  "protectionActive": true
}
```
The ESP32 immediately turns the relay `OFF` (`digitalWrite(PIN_RELAY, HIGH)`).

### Local Autonomous Failsafe:
If the Wi-Fi connection is lost or the server is temporarily unreachable, the ESP32 runs an autonomous local check: if Temperature ≥ 70°C or Current ≥ 1.4A or Vibration ≥ 4.0 mm/s, the ESP32 trips the relay **locally**, safeguarding the motor independently.

---

## 7. Final Demonstration Scenarios

Use the **DEMO MODE** controls on the web dashboard to demonstrate the full system to examiners without needing physical hardware connected:

1. **NORMAL**:
   - `Temp = 42.5°C, Vib = 1.5 mm/s, Curr = 0.82 A, Volt = 12.0 V, RPM = 1450`
   - Health = 92–96% (NORMAL), Relay = ON, Motor = RUNNING.
2. **WARNING**:
   - `Temp = 56.5°C, Vib = 2.8 mm/s, Curr = 1.05 A, RPM = 1380`
   - Health = 65% (WARNING). Early warning advisory triggered: Increasing thermal and vibration trend. Motor remains ON.
3. **OVERHEATING**:
   - `Temp = 72.5°C`. Severe motor overheating detected.
   - Health drops to 28% (CRITICAL). Automated protection activated: Relay OFF, Motor STOPPED.
4. **HIGH VIBRATION**:
   - `Vib = 4.6 mm/s`. Mechanical imbalance / bearing flaw diagnosed. Immediate safety trip.
5. **OVERCURRENT**:
   - `Current = 1.55 A`. Impending stall / overload fault diagnosed. Immediate relay cutoff.
6. **CRITICAL MULTI-FAULT**:
   - `Temp = 74°C, Vib = 4.5 mm/s, Curr = 1.52A, RPM = 1100`.
   - Diagnosed: Combined Mechanical Seizure & Severe Overload. Automatic trip engaged.
7. **RECOVERY**:
   - Select `RECOVERY` (`Temp = 41°C, Vib = 1.4 mm/s, Curr = 0.80A, RPM = 1460`).
   - Condition recovered banner appears. Health restored to 95%. Protection interlock cleared. Motor restart becomes available.
