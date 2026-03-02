# AI-Driven Crop Lifecycle & Post-Harvest Intelligence

Reduce spoilage losses and soil degradation by predicting crop cycles, storage timing, and supply chain optimization.

## 1. Project Identity
- Project Name: KisanVision 360
- Category: AgriTech Decision Intelligence Platform
- Scope: Disease Detection + Lifecycle Monitoring + Post-Harvest Intelligence

## 2. Executive Summary
KisanVision 360 is an end-to-end farmer support system that combines AI disease detection, real-time field and storage telemetry, lifecycle risk intelligence, and market-linked sell timing guidance. The platform is designed to work in practical conditions with online APIs when available and local fallback behavior for stable demos and low-connectivity environments.

## 3. Problem Statement
Farmers and agri-operators face three linked operational challenges:
- Delayed disease detection causes avoidable yield loss and higher treatment cost.
- Limited visibility into field and storage conditions increases spoilage risk.
- Uncertain market timing reduces profit and can force panic selling.

## 4. Solution Overview
KisanVision 360 addresses these challenges through four functional modules:
- Disease Intelligence: YOLO-based crop disease detection with image annotations.
- Lifecycle Intelligence: sensor-based risk, crop stage, and prioritized actions.
- Post-Harvest Intelligence: storage suitability + sell-now vs hold recommendation.
- Farmer & Device Setup: onboarding and node linkage for real deployment flow.

## 5. Current Feature Set
### 5.1 Disease Detection
- Upload image or capture via camera.
- Supports crop-based model selection:
  - Rice: `best.pt`
  - Tomato: `best(3).pt`
- Returns class name, confidence score, and bounding boxes.
- Generates disease-only guidance (without unrelated storage advice).

### 5.2 Lifecycle Monitoring
- Reads field and storage sensor snapshots.
- Computes environmental risk score and risk level.
- Derives crop stage and stage actions.
- Shows highlighted priority recommendations for immediate farmer action.
- Supports multilingual output (`en`, `hi`, `te`).

### 5.3 Post-Harvest Decision
- Commodity-wise price trend and current market snapshot.
- Storage spoilage risk and cold-storage suitability scoring.
- Highlighted final action: sell now or hold for defined days.
- Profit impact estimate for chosen quantity.

### 5.4 Operational Reliability
- Health endpoint and presentation-status endpoint.
- Demo fallback market data when live API key is unavailable.
- Demo scripts for pre-judge checks and fallback data injection.

## 6. System Architecture
### Frontend
- Multi-page web UI (`/`, `/disease`, `/dashboard`, `/market`, `/farmer`)
- HTML + CSS + JavaScript
- Global navbar language switcher for consistent localization

### Backend
- FastAPI service with modular routes
- YOLO model inference for disease pipeline
- Decision engine for lifecycle and advisory generation
- Market service for trend and sell timing prediction

### Data Layer
- SQLite for local persistence and traceability
- Core records: field telemetry, storage telemetry, disease results, recommendations

### Edge Layer
- ESP32 field node for temperature, humidity, soil moisture, rain
- ESP32 storage node for storage temperature, humidity, days in storage

## 7. Technology Stack
- Backend: Python 3.10, FastAPI, Uvicorn
- ML/CV: Ultralytics YOLO, PIL
- Optional ML: joblib model for spoilage predictor
- Database: SQLite
- Frontend: HTML, CSS, JavaScript
- Optional advisory enhancement: Groq API
- Hardware: ESP32 + DHT + analog soil/rain sensors

## 8. Key Workflows
### 8.1 Disease Workflow
1. User selects crop + uploads/captures leaf image.
2. Backend runs selected YOLO model.
3. UI shows annotated image and predicted classes.
4. System returns disease-focused “what to do” guidance.

### 8.2 Lifecycle Workflow
1. Field/storage telemetry is ingested.
2. Decision engine computes risk, stage, and action.
3. UI prioritizes 2 highlighted lines: what to do + immediate action.

### 8.3 Post-Harvest Workflow
1. Market prices are fetched (live or fallback).
2. Spoilage + trend logic computes sell/hold recommendation.
3. UI highlights final action and storage-device status.

## 9. Core API Endpoints
- `GET /health`
- `GET /presentation-status`
- `POST /predict`
- `POST /predict-disease`
- `POST /submit-field-data`
- `POST /submit-storage-data`
- `GET /dashboard-data`
- `GET /market-prices`
- `GET /home-data`
- `POST /register-farmer`
- `POST /register-device`
- `GET /farmers`
- `POST /verify-setup-pin`
- `POST /delete-setup`

## 10. Rainfall Volume Metric
Rain exposure is aggregated from field telemetry and converted to field-level water volume.

Formula:

Rainwater Volume (m³) = (Cumulative Rain (mm) / 1000) × Field Area (m²)

This helps convert sensor data into practical harvest context.

## 11. Setup and Run
1. Install dependencies in backend environment.
2. Configure `.env` from `.env.example`.
3. Start backend:
   - `./scripts/start_backend.ps1`
4. Open app at `http://127.0.0.1:5000`.
5. Connect ESP32 nodes or run demo injector script.

## 12. Validation Strategy
- Endpoint health check (`/health`).
- Presentation readiness check (`/presentation-status`).
- Disease inference sanity test with sample image.
- Telemetry-driven lifecycle and market response verification.

## 13. Current Limitations
- Live market quality depends on external API authorization and availability.
- MVP security hardening (auth/multi-tenant roles) is limited.
- Sensor quality affects recommendation quality.

## 14. Future Improvements
- MQTT ingestion for scalable telemetry.
- Role-based access and secure device provisioning.
- Time-series analytics and anomaly alerts.
- Voice and vernacular advisory delivery.
- Mobile-first offline sync workflow.

## 15. Repository Structure
- `backend/` API, decision engine, market logic, data layer
- `frontend/` web pages and static assets
- `esp32/` node firmware
- `scripts/` startup and demo automation
- `docs/` documentation and presentation assets
