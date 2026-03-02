#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// -------- PIN DEFINITIONS --------
#define SOIL_PIN 34     // Analog
#define RAIN_PIN 35     // Analog
#define DHT_PIN  4      // Digital

// -------- DHT SETUP --------
#define DHTTYPE DHT11   // change to DHT22 if needed
DHT dht(DHT_PIN, DHTTYPE);

// -------- WIFI + BACKEND --------
const char* WIFI_SSID = "Deshik";
const char* WIFI_PASS = "129129129";

// Replace with your laptop IP (backend running on port 5000)
const char* SERVER_URL = "http://10.212.231.1:5000/submit-field-data";
const char* DEVICE_ID = "field_01";

// Optional: set this daily from your field timeline
int daysSincePlanting = 25;

// -------- SENSOR CALIBRATION --------
// Adjust these values based on your sensor
const int SOIL_DRY_RAW = 3200;
const int SOIL_WET_RAW = 1300;
const int RAIN_WET_THRESHOLD = 2200;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 30000; // send every 30 sec

float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void postFieldData(float temperature, float humidity, float soilPct, int rainDetected, int rainRaw, float rainMmEstimate) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"humidity\":" + String(humidity, 2) + ",";
  payload += "\"soil_moisture\":" + String(soilPct, 1) + ",";
  payload += "\"rain_detected\":" + String(rainDetected) + ",";
  payload += "\"rain_raw\":" + String(rainRaw) + ",";
  payload += "\"rain_mm_estimate\":" + String(rainMmEstimate, 3) + ",";
  payload += "\"days_since_planting\":" + String(daysSincePlanting);
  payload += "}";

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);
  String response = http.getString();

  Serial.println("---- FIELD DATA SENT ----");
  Serial.println(payload);
  Serial.print("HTTP code: ");
  Serial.println(httpCode);
  Serial.print("Response : ");
  Serial.println(response);
  Serial.println("-------------------------");

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12); // ESP32 ADC 0..4095
  dht.begin();
  connectWiFi();

  Serial.println("ESP32 Field Node Online 🌱🌧️🌡️");
}

void loop() {
  // ---- Read analog sensors ----
  int soilRaw = analogRead(SOIL_PIN);   // 0–4095
  int rainRaw = analogRead(RAIN_PIN);   // 0–4095

  // Convert soil raw to percentage
  float soilPct = mapFloat((float)soilRaw, (float)SOIL_DRY_RAW, (float)SOIL_WET_RAW, 0.0, 100.0);
  soilPct = constrain(soilPct, 0.0, 100.0);

  // Rain detection (1 = raining/wet plate, 0 = dry)
  int rainDetected = (rainRaw < RAIN_WET_THRESHOLD) ? 1 : 0;
  float rainMmEstimate = 0.0;
  if (rainDetected == 1) {
    rainMmEstimate = mapFloat((float)rainRaw, (float)RAIN_WET_THRESHOLD, 0.0, 0.1, 2.0);
    rainMmEstimate = constrain(rainMmEstimate, 0.1, 2.0);
  }

  // ---- Read DHT sensor ----
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius

  // ---- Print local serial logs ----
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ DHT sensor failed!");
  } else {
    Serial.print("🌡️ Temp: ");
    Serial.print(temperature);
    Serial.print(" °C | 💧 Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  Serial.print("🌱 Soil Raw: ");
  Serial.print(soilRaw);
  Serial.print(" | Soil %: ");
  Serial.print(soilPct, 1);
  Serial.print(" | 🌧️ Rain Raw: ");
  Serial.print(rainRaw);
  Serial.print(" | Rain: ");
  Serial.print(rainDetected ? "YES" : "NO");
  Serial.print(" | Est. Rain mm: ");
  Serial.println(rainMmEstimate, 3);

  // ---- Send data every 30 seconds ----
  unsigned long now = millis();
  if (!isnan(humidity) && !isnan(temperature) && (now - lastSend >= SEND_INTERVAL_MS)) {
    lastSend = now;
    postFieldData(temperature, humidity, soilPct, rainDetected, rainRaw, rainMmEstimate);
  }

  delay(2000); // sensor read interval
}
