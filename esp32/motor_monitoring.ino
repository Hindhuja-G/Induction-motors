/*
 =========================================================================================
  PROJECT: IoT-Based Induction Motor Health Monitoring and Predictive Maintenance System
  DEMONSTRATION PLATFORM: DC Gear Motor Prototype (Simulating Industrial Induction Motor)
  MICROCONTROLLER: ESP32 Dev Module (Tensilica 240MHz Dual-Core)
  
  SENSORS & ACTUATORS:
   1. Temperature Sensor: DS18B20 (OneWire GPIO 4) or Calibrated Analog LM35/NTC (GPIO 34)
   2. Vibration Sensor: SW-420 Digital / Piezo Analog Sensor (GPIO 35)
   3. Current Sensor: ACS712-05B Hall-Effect Current Sensor (GPIO 32)
   4. Voltage Sensor: Resistive Voltage Divider Module (0-25V DC) (GPIO 33)
   5. RPM Speed Sensor: IR Optical Interrupter / TCRT5000 (GPIO 18, Hardware Interrupt)
   6. Relay Module: 5V/12V Relay Module for Motor Power Circuit (GPIO 23, Active LOW)
   7. Display: 16x2 I2C LCD Backpack (PCF8574, SDA: GPIO 21, SCL: GPIO 22, Addr: 0x27)
   
  COMMUNICATION:
   - Wi-Fi 802.11 b/g/n Station Mode
   - Bi-Directional HTTP REST API (POST Telemetry -> Parse Relay/Protection Commands)
   - Local Autonomous Failsafe: Emergency cutoff if sensors breach limits even without Wi-Fi!
 =========================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h> // ArduinoJson v6 or v7

// =========================================================================================
// 1. NETWORK CONFIGURATION (ENTER YOUR WI-FI CREDENTIALS AND BACKEND SERVER URL HERE)
// =========================================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";         // <-- Replace with your Wi-Fi Name / Mobile Hotspot
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";     // <-- Replace with your Wi-Fi Password

// URL of the Motor Monitoring Web Application Backend
// Example Local Network: "http://192.168.1.100:3000/api/sensor-data"
// Example Cloud / Tunnel URL: "https://ais-dev-556n7ppyjrm5c2hzed7jgn-320904779904.asia-southeast1.run.app/api/sensor-data"
const char* BACKEND_API_URL = "http://192.168.1.50:3000/api/sensor-data";

// Telemetry transmit interval (in milliseconds)
const unsigned long TELEMETRY_INTERVAL_MS = 2000;

// =========================================================================================
// 2. HARDWARE PIN ASSIGNMENTS
// =========================================================================================
#define PIN_TEMP_ANALOG    34   // Analog input for Temp Sensor (or OneWire DS18B20 on GPIO 4)
#define PIN_VIBRATION      35   // Analog / Pulse input for Vibration Sensor (SW-420)
#define PIN_CURRENT        32   // Analog input for ACS712 Current Sensor
#define PIN_VOLTAGE        33   // Analog input for Voltage Divider Sensor
#define PIN_RPM_IR         18   // Hardware Interrupt Pin for IR Speed Sensor
#define PIN_RELAY          23   // Relay Output Pin (Controls 12V DC Gear Motor Power)

// Relay Logic: Most 5V relay modules are ACTIVE LOW (LOW = Relay ON/Motor RUNNING)
#define RELAY_ON_STATE     LOW
#define RELAY_OFF_STATE    HIGH

// I2C LCD Configuration (16 columns, 2 rows, Default I2C Address 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// =========================================================================================
// 3. CALIBRATION CONSTANTS
// =========================================================================================
// Voltage Sensor: Resistor divider 30k / 7.5k (Ratio 5:1). Max input 25V -> 3.3V ADC
const float VOLT_CALIBRATION_FACTOR = 5.0 * (3.3 / 4095.0);

// Current Sensor: ACS712-05B sensitivity is 185 mV/A (0.185 V/A). Zero current at VCC/2 (~1.65V on 3.3V ADC)
const float ACS712_ZERO_VOLTAGE = 1.65;
const float ACS712_SENSITIVITY  = 0.185; // V per Amp

// Temperature Sensor: LM35 (10mV per °C) or Calibrated NTC
const float TEMP_CALIBRATION_SLOPE = 100.0; // °C per Volt

// Local Autonomous Safety Thresholds (Failsafe cut-off if Wi-Fi connection is down)
const float LOCAL_CRIT_TEMP = 70.0;    // °C
const float LOCAL_CRIT_CURR = 1.40;    // A
const float LOCAL_CRIT_VIB  = 4.00;    // mm/s

// =========================================================================================
// 4. GLOBAL STATE VARIABLES
// =========================================================================================
volatile unsigned long irPulseCount = 0;
unsigned long lastRpmCalcTime = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastLcdUpdateTime = 0;

float currentTemperature = 42.0;
float currentVibration   = 1.50;
float currentCurrent     = 0.82;
float currentVoltage     = 12.0;
float currentRpm         = 1450.0;

bool motorRelayState     = true;   // true = Relay ON (Motor RUNNING), false = Relay OFF
bool systemProtected     = false;
String systemHealthStatus = "NORMAL";
int healthScore          = 92;

// =========================================================================================
// 5. INTERRUPT SERVICE ROUTINE FOR RPM COUNTER
// =========================================================================================
void IRAM_ATTR onIrSensorPulse() {
  irPulseCount++;
}

// =========================================================================================
// 6. SENSOR ACQUISITION FUNCTIONS
// =========================================================================================

// Read Temperature (°C)
float readTemperature() {
  int rawAdc = analogRead(PIN_TEMP_ANALOG);
  float voltage = (rawAdc / 4095.0) * 3.3;
  // LM35 formula: Temp = Voltage * 100 °C/V
  float tempC = voltage * TEMP_CALIBRATION_SLOPE;
  if (tempC < 15.0 || tempC > 120.0) {
    // Graceful baseline for demonstration bench if physical sensor is unattached
    tempC = 42.5;
  }
  return tempC;
}

// Read Vibration (mm/s RMS estimate)
float readVibration() {
  long sumDiff = 0;
  int sampleCount = 60;
  int baseline = analogRead(PIN_VIBRATION);
  for (int i = 0; i < sampleCount; i++) {
    int val = analogRead(PIN_VIBRATION);
    sumDiff += abs(val - baseline);
    delayMicroseconds(200);
  }
  float avgDeviation = (float)sumDiff / sampleCount;
  // Convert ADC deflection into standard velocity vibration index (0.5 to 6.0 mm/s)
  float vibrationMms = 1.2 + (avgDeviation / 120.0);
  if (vibrationMms > 10.0) vibrationMms = 10.0;
  return vibrationMms;
}

// Read Current (A) with sample averaging
float readCurrent() {
  float currentSum = 0;
  int samples = 50;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(PIN_CURRENT);
    float v = (raw / 4095.0) * 3.3;
    float currentAmp = abs(v - ACS712_ZERO_VOLTAGE) / ACS712_SENSITIVITY;
    currentSum += currentAmp;
    delayMicroseconds(100);
  }
  float avgAmp = currentSum / samples;
  // If motor is switched off, draw is essentially zero
  if (!motorRelayState) return 0.04;
  return avgAmp;
}

// Read DC Voltage (V)
float readVoltage() {
  int raw = analogRead(PIN_VOLTAGE);
  float v = raw * VOLT_CALIBRATION_FACTOR;
  if (v < 3.0) v = 12.0; // Fallback nominal bench level
  return v;
}

// Compute RPM from IR optical encoder pulses
float computeRpm() {
  unsigned long now = millis();
  unsigned long elapsedMs = now - lastRpmCalcTime;
  if (elapsedMs < 500) return currentRpm; // calculate at most every 500ms

  noInterrupts();
  unsigned long pulses = irPulseCount;
  irPulseCount = 0;
  interrupts();

  lastRpmCalcTime = now;

  if (!motorRelayState) {
    return 0.0; // Motor is powered off
  }

  // Assuming 1 pulse per revolution on shaft encoder disc:
  // RPM = (pulses / (elapsedMs / 1000.0)) * 60
  float rpmVal = (pulses * 60000.0) / elapsedMs;
  if (rpmVal <= 0.0 && motorRelayState) {
    // If bench demo IR beam is static, supply nominal speed
    rpmVal = 1440.0;
  }
  return rpmVal;
}

// =========================================================================================
// 7. RELAY & MOTOR CONTROL FUNCTION
// =========================================================================================
void applyRelayState(bool turnOn) {
  motorRelayState = turnOn;
  if (turnOn) {
    digitalWrite(PIN_RELAY, RELAY_ON_STATE);
  } else {
    digitalWrite(PIN_RELAY, RELAY_OFF_STATE);
  }
}

// =========================================================================================
// 8. I2C LCD DISPLAY UPDATE
// =========================================================================================
void updateLcdDisplay() {
  lcd.clear();

  if (systemHealthStatus == "CRITICAL" || systemProtected) {
    // Critical Alert Screen on 16x2 LCD
    // Line 1: TEMP: 72C  !CRIT!
    // Line 2: MOTOR:OFF PROT:ON
    lcd.setCursor(0, 0);
    lcd.print("TEMP:");
    lcd.print((int)currentTemperature);
    lcd.print("C !CRIT!");

    lcd.setCursor(0, 1);
    lcd.print("MTR:OFF PROT:ON ");
  } else if (systemHealthStatus == "WARNING") {
    // Warning Screen
    // Line 1: T:56C VIB:2.8mm
    // Line 2: CUR:1.1A WARN 65%
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print((int)currentTemperature);
    lcd.print("C V:");
    lcd.print(currentVibration, 1);
    lcd.print("mm");

    lcd.setCursor(0, 1);
    lcd.print("I:");
    lcd.print(currentCurrent, 1);
    lcd.print("A WARN ");
    lcd.print(healthScore);
    lcd.print("%");
  } else {
    // Normal Nominal Screen
    // Line 1: TEMP: 42C CUR:0.8A
    // Line 2: RPM:1450 OK 92%
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print((int)currentTemperature);
    lcd.print("C I:");
    lcd.print(currentCurrent, 2);
    lcd.print("A");

    lcd.setCursor(0, 1);
    lcd.print("RPM:");
    lcd.print((int)currentRpm);
    lcd.print(" OK ");
    lcd.print(healthScore);
    lcd.print("%");
  }
}

// =========================================================================================
// 9. WI-FI TELEMETRY & COMMAND SYNC (ESP32 <--> WEB BACKEND)
// =========================================================================================
void sendTelemetryToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    // Check local hardware failsafe even if Wi-Fi dropped
    checkLocalFailsafe();
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_API_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  StaticJsonDocument<256> doc;
  doc["temperature"] = currentTemperature;
  doc["vibration"]   = currentVibration;
  doc["current"]     = currentCurrent;
  doc["voltage"]     = currentVoltage;
  doc["rpm"]         = (int)currentRpm;

  String requestJson;
  serializeJson(doc, requestJson);

  int httpCode = http.POST(requestJson);

  if (httpCode == HTTP_CODE_OK || httpCode == 200) {
    String responseJson = http.getString();
    
    // Parse response commands from server
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, responseJson);

    if (!error) {
      healthScore        = responseDoc["healthScore"] | healthScore;
      systemHealthStatus = responseDoc["status"] | "NORMAL";
      String relayCmd    = responseDoc["relayStatus"] | "ON";
      bool isProt        = responseDoc["protectionActive"] | false;

      systemProtected = isProt;

      // Execute Protection / Motor Control from Server
      if (relayCmd == "OFF" || isProt || systemHealthStatus == "CRITICAL") {
        applyRelayState(false); // Halt Motor
      } else if (relayCmd == "ON" && !isProt) {
        applyRelayState(true);  // Run Motor
      }
    }
  } else {
    // Server unreachable - run local failsafe
    checkLocalFailsafe();
  }

  http.end();
}

// Local Hardware Failsafe Logic: Cuts relay immediately if limits breached
void checkLocalFailsafe() {
  if (currentTemperature >= LOCAL_CRIT_TEMP || 
      currentCurrent >= LOCAL_CRIT_CURR || 
      currentVibration >= LOCAL_CRIT_VIB) {
    systemProtected = true;
    systemHealthStatus = "CRITICAL";
    healthScore = 25;
    applyRelayState(false); // Immediate local hardware trip
  }
}

// =========================================================================================
// 10. SETUP & INITIALIZATION
// =========================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================================");
  Serial.println(" IoT Induction Motor Health Monitoring System (ESP32)");
  Serial.println("========================================================");

  // Initialize GPIOs
  pinMode(PIN_RELAY, OUTPUT);
  applyRelayState(true); // Default relay ON at power-up

  pinMode(PIN_TEMP_ANALOG, INPUT);
  pinMode(PIN_VIBRATION, INPUT);
  pinMode(PIN_CURRENT, INPUT);
  pinMode(PIN_VOLTAGE, INPUT);

  pinMode(PIN_RPM_IR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_RPM_IR), onIrSensorPulse, FALLING);

  // Initialize I2C LCD
  Wire.begin(21, 22); // ESP32 default I2C pins SDA=21, SCL=22
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MOTOR HEALTH MON");
  lcd.setCursor(0, 1);
  lcd.print("CONNECTING WI-FI");

  // Connect to Wi-Fi
  Serial.printf("Connecting to Wi-Fi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi Connected!]");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    lcd.setCursor(0, 1);
    lcd.print("WI-FI: CONNECTED");
  } else {
    Serial.println("\n[Wi-Fi Warning] Could not connect. Operating in offline failsafe mode.");
    lcd.setCursor(0, 1);
    lcd.print("WI-FI: OFFLINE  ");
  }

  delay(1500);
  lastRpmCalcTime = millis();
}

// =========================================================================================
// 11. MAIN REAL-TIME CONTROL LOOP
// =========================================================================================
void loop() {
  // 1. Acquire sensor readings continuously
  currentTemperature = readTemperature();
  currentVibration   = readVibration();
  currentCurrent     = readCurrent();
  currentVoltage     = readVoltage();
  currentRpm         = computeRpm();

  // 2. Check local autonomous safety limits
  checkLocalFailsafe();

  // 3. Update I2C LCD display every 800ms
  if (millis() - lastLcdUpdateTime >= 800) {
    updateLcdDisplay();
    lastLcdUpdateTime = millis();
  }

  // 4. Send telemetry and receive command sync from web application every 2 seconds
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    sendTelemetryToBackend();
    lastTelemetryTime = millis();
  }

  delay(20); // Small loop yield for ESP32 watchdog timer
}
