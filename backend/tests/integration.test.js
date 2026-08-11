import { test, describe } from "node:test";
import assert from "node:assert";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5000";
const testImagesDir = path.resolve("../test_images");

describe("End-to-End API & Telemetry Pipeline Integration Tests", () => {
  test("GET /api/health returns ok status", async () => {
    const { data, status } = await axios.get(`${BASE_URL}/api/health`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, "ok");
  });

  test("POST /api/seed creates batch historical telemetry data", async () => {
    const { data, status } = await axios.post(`${BASE_URL}/api/seed`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.count, 10);
    assert.ok(Array.isArray(data.data));
  });

  test("POST /api/analyze uploads image frame and auto-fetches weather", async () => {
    const filePath = path.join(testImagesDir, "test_wet_track.jpg");
    assert.ok(fs.existsSync(filePath), "test_wet_track.jpg must exist");

    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));
    form.append("sectorId", "sector-2");

    const { data, status } = await axios.post(`${BASE_URL}/api/analyze`, form, {
      headers: form.getHeaders(),
    });

    assert.strictEqual(status, 200);
    assert.ok(data.label, "Response must include label");
    assert.strictEqual(data.sectorId, "sector-2");
    assert.ok(data.weather.includes("Auto-Fetch") || data.weather.length > 0, "Weather auto-fetch must populate weather string");
    assert.ok(typeof data.wetnessIndex === "number");
  });

  test("GET /api/trend filters readings by sectorId", async () => {
    const { data, status } = await axios.get(`${BASE_URL}/api/trend`, {
      params: { sector: "sector-2" },
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(data.sectorId, "sector-2");
    assert.ok(Array.isArray(data.readings));
    assert.ok(data.readings.length > 0);
    assert.ok(typeof data.slope === "number");
    assert.ok(data.suggestion.length > 0);
  });
});
