# TrackSense AI — Live Track Surface Telemetry & Pit Strategy Engine

A high-performance racetrack surface telemetry platform that classifies surface moisture conditions (**Dry / Damp / Wet / Drying**), calculates moisture evolution slope over time, auto-fetches weather data, isolates track sectors, flags low-confidence AI predictions, and recommends optimal pit tire strategy windows.

---

## 🚀 Key Features

- **🏎️ Multi-Sector Telemetry Tracking**: Tag and filter telemetry data per sector (*Sector 1: Turn 1-4*, *Sector 2: Chicane*, *Sector 3: Straight*, *Pit Lane*).
- **🤖 Dual-Engine Classification**: AI Vision classification powered by Anthropic's Claude API with automated MD5 buffer caching, plus a local fallback heuristic classifier.
- **⚡ Race Weather Auto-Fetch**: Integrates with Open-Meteo free API to automatically retrieve track ambient temperature, humidity, and wind speed if left blank.
- **📊 Real-Time Strategy Telemetry**: Linear regression slope math (`computeSlope`) tracking moisture trends with automated pit stop tire advice (*Slicks*, *Intermediates*, *Full Wets*).
- **⚠️ Confidence Flagging**: Auto-flags predictions with **< 75% AI confidence** for manual track-side inspection.
- **🗺️ SVG Circuit Map & Environmental Gauge**: Interactive circuit map sector selector and surface moisture saturation meter (`0%` to `100%`).
- **💾 CSV Export & Engineering Debrief**: 1-click CSV telemetry log downloader and printable engineering debrief report.
- **🧪 Complete Automated Test Suite**: Built-in Unit Test and E2E Integration Test runner (`npm test`).

---

## 🛠️ Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose) with transparent in-memory fallback, Sharp, Multer, Axios, Open-Meteo API, Anthropic SDK.
- **Frontend**: React, Vite, Recharts, Lucide React, Google Fonts (*Outfit*, *Inter*, *JetBrains Mono*).

---

## ⚙️ Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🔬 Testing & Data Seeding

### Run Automated Unit & E2E Integration Tests
```bash
cd backend
npm test
```
Executes 11 automated tests covering linear regression math, tire rules, Open-Meteo weather fetch, and API endpoints.

### Seed Sample Telemetry Data
```bash
curl -X POST http://localhost:5000/api/seed
```
Seeds 10 historical telemetry readings across all 4 track sectors.

---

## 📡 API Endpoints

- `POST /api/analyze` — Upload track image (`image`), optional `weather` string, and `sectorId`. Auto-fetches weather if omitted.
- `GET /api/trend?sector=sector-1` — Retrieves sector-specific telemetry readings, slope, trend direction, and tire strategy.
- `POST /api/seed` — Seeds batch historical telemetry readings.
- `GET /api/health` — Health check endpoint.

---

## 📁 Repository Structure

```
track-condition-detector/
├── backend/
│   ├── models/Reading.js         - Mongoose schema with sectorId
│   ├── routes/analyze.js         - POST /api/analyze endpoint
│   ├── routes/trend.js           - GET /api/trend endpoint
│   ├── routes/seed.js            - POST /api/seed batch endpoint
│   ├── utils/classify.js         - AI Vision classifier with MD5 cache
│   ├── utils/heuristic.js        - Local fallback classifier
│   ├── utils/store.js            - MongoDB & in-memory store adapter
│   ├── utils/trend.js            - Least-squares slope math & tire engine
│   ├── utils/weather.js          - Open-Meteo weather auto-fetch
│   ├── tests/trend.test.js       - Unit tests for slope math
│   ├── tests/integration.test.js - E2E API integration test suite
│   └── scripts/generate_test_images.js - Sample JPEG test generator
│
├── frontend/
│   ├── src/components/UploadPanel.jsx       - Drag & drop image uploader
│   ├── src/components/ConditionBadge.jsx    - High-contrast badge & warning flag
│   ├── src/components/TrendChart.jsx       - Telemetry AreaChart & strategy advice
│   ├── src/components/SectorSelector.jsx   - Track sector selector
│   ├── src/components/CircuitMap.jsx       - SVG Circuit Map & sector heatmap
│   ├── src/components/EnvironmentalGauge.jsx - Saturation meter & weather stats
│   ├── src/components/LiveSimulationBar.jsx - Instant preset & 4-lap simulator
│   ├── src/components/SectorMatrix.jsx     - Multi-sector comparison table
│   ├── src/components/ExportToolbar.jsx    - CSV export & print debrief
│   ├── src/components/ErrorBoundary.jsx    - React error boundary
│   └── src/App.jsx                         - Main telemetry dashboard
│
└── test_images/                           - Sample JPEG test images
```
