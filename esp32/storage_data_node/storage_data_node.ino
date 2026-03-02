#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// -------- PIN DEFINITIONS --------
#define DHT_PIN 4
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// -------- WIFI + BACKEND --------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Replace with your laptop IP (backend running on port 5000)
const char* SERVER_URL = "http://10.212.231.1:5000/submit-storage-data";
const char* DEVICE_ID = "storage_01";

// Update this value daily according to actual storage timeline
int daysInStorage = 2;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 30000; // send every 30 sec

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

void postStorageData(float temperature, float humidity, int storageDays) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"humidity\":" + String(humidity, 2) + ",";
  payload += "\"days_in_storage\":" + String(storageDays);
  payload += "}";

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);
  String response = http.getString();

  Serial.println("---- STORAGE DATA SENT ----");
  Serial.println(payload);
  Serial.print("HTTP code: ");
  Serial.println(httpCode);
  Serial.print("Response : ");
  Serial.println(response);
  Serial.println("---------------------------");

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();
  connectWiFi();

  Serial.println("ESP32 Storage Node Online ❄️📦");
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ DHT sensor failed!");
  } else {
    Serial.print("📦 Storage Temp: ");
    Serial.print(temperature);
    Serial.print(" °C | 💧 Storage Humidity: ");
    Serial.print(humidity);
    Serial.print(" % | Days in storage: ");
    Serial.println(daysInStorage);
  }

  unsigned long now = millis();
  if (!isnan(humidity) && !isnan(temperature) && (now - lastSend >= SEND_INTERVAL_MS)) {
    lastSend = now;
    postStorageData(temperature, humidity, daysInStorage);
  }

  delay(2000);
}
