# Presentation Guide

## 1) Recommended Project Name
KrishiGuard AI

## 2) One-Line Pitch
KrishiGuard AI helps farmers detect crop disease early, monitor risk in field and storage, and decide when to sell for better profit.

## 3) Rubric-Aligned Presentation Order

Use this exact order in your deck because judges are scoring category by category:

1. Business understanding and problem clarity (15)
2. Architecture & technical design (15)
3. Domain relevance (10)
4. Scalability (10)
5. Security / compliance awareness (10)
6. Innovation (20)
7. Implementation feasibility (10)
8. Presentation & documentation (10)

## 4) Slide Deck Structure (Rubric Order)

### Slide 1: Title
- Project name
- Team name
- Tagline

### Slide 2: Business Understanding and Problem Clarity (15)
- Late disease response causes yield loss
- Poor storage monitoring causes spoilage
- Uncertain market timing reduces farmer margin
- Farmer pain-point journey: field -> storage -> market

### Slide 3: Architecture and Technical Design (15)
- Show data flow: ESP32 + camera/upload -> FastAPI -> SQLite + AI engine -> dashboards
- Explain each module: disease model, decision engine, market service, health checks
- Mention demo reliability endpoints: /health and /presentation-status

### Slide 4: Domain Relevance (10)
- Why this matters for rice and cold-storage workflows in your region
- Support for commodity-specific sell timing and storage suitability
- Local-language advisory output for farmer usability
- Show UI commodity categories: Cereals, Vegetables (Cold Storage - South India), Fruits (Cold Storage)
- Mention current supported commodities: Rice, Wheat, Maize, Onion, Potato, Tomato, Cabbage, Carrot, Beetroot, Green Chilli, Banana

### Slide 5: Scalability (10)
- Current MVP: edge-local deployment
- Next scale path: MQTT ingestion, cloud DB, district aggregation
- API-first architecture supports more devices and crops

### Slide 6: Security / Compliance Awareness (10)
- No hardcoded secrets in docs; env-based configuration
- Device/API separation and constrained local deployment for MVP
- Planned controls: authentication, audit logs, secure device onboarding

### Slide 7: Innovation (20)
- Unified platform from field to post-harvest
- Image AI + IoT telemetry + decision engine
- Sell-now vs hold decision with spoilage-aware tradeoff
- Offline fallback mode with transparent live/demo market source

### Slide 8: Implementation Feasibility (10)
- FastAPI, Python 3.10, SQLite
- Ultralytics YOLO model for disease detection
- JavaScript frontend dashboard
- ESP32 + DHT11 + soil/rain sensor integration
- Optional Groq advisory enhancement

### Slide 9: Presentation and Documentation (10)
- Show documentation set in docs/
- Show run scripts and demo checklist
- Show fallback plan for stable live demo

### Slide 10: Live Demo Snapshot and Closing
- Disease prediction with bounding boxes
- Lifecycle dashboard with live connection indicators
- Sell timing prediction and profit estimate

## 5) Marks-to-Slide Mapping (Quick View)

- Business understanding and problem clarity (15): Slide 2
- Architecture & technical design (15): Slide 3
- Domain relevance (10): Slide 4
- Scalability (10): Slide 5
- Security / compliance awareness (10): Slide 6
- Innovation (20): Slide 7
- Implementation feasibility (10): Slide 8
- Presentation & documentation (10): Slide 9

## 6) Live Demo Script (4 to 5 Minutes)
1. Open Disease page and run prediction from sample image.
2. Show bounding boxes and confidence values.
3. Move to Lifecycle page and show field/storage cards and green status indicators.
4. Change language and show localized recommendation.
5. Move to Market page, explain trend, decision, and profit difference.
6. Run scripts/demo_check.ps1 to prove system health and readiness.

## 7) Presenter Notes
- Keep explanation in farmer-impact language, not only technical terms.
- Mention transparency: market source is shown as live or demo.
- If sensors are unavailable, run scripts/send_demo_data.ps1 and continue demo.
- If market API is unauthorized, explicitly mention fallback resilience.

## 8) Likely Judge Questions and Answers
Q: Is this usable without internet?
A: Yes. Core risk logic, dashboard, and local advisories run without internet.

Q: Why is this better than only disease detection apps?
A: It supports the full decision chain: disease, lifecycle risk, storage risk, and market timing.

Q: How do you prevent demo failure?
A: We use readiness scripts, connection badges, and fallback data seeding.

Q: Can it scale?
A: Yes. MQTT + cloud storage and model services can be added on top of current API design.

## 9) Final Pre-Presentation Checklist
- Start backend using scripts/start_backend.ps1
- Verify with scripts/demo_check.ps1
- Keep one disease sample image ready
- Keep at least one ESP32 node connected or seed demo data
- Open three tabs in advance: /, /dashboard, /market
