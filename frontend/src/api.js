import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function analyzeImage(file, weather = "", sectorId = "sector-1") {
  const formData = new FormData();
  formData.append("image", file);
  if (weather) formData.append("weather", weather);
  if (sectorId) formData.append("sectorId", sectorId);

  const { data } = await api.post("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function analyzeVideo(file, weather = "", sectorId = "sector-1") {
  const formData = new FormData();
  formData.append("video", file);
  if (weather) formData.append("weather", weather);
  if (sectorId) formData.append("sectorId", sectorId);

  const { data } = await api.post("/analyze-video", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getTrend(sectorId = null) {
  const params = sectorId ? { sector: sectorId } : {};
  const { data } = await api.get("/trend", { params });
  return data;
}

export async function getHistory(sectorId = null) {
  const params = sectorId ? { sector: sectorId } : {};
  const { data } = await api.get("/trend/history", { params });
  return data;
}

export async function seedDemoData() {
  const { data } = await api.post("/seed");
  return data;
}

export async function clearHistory() {
  const { data } = await api.delete("/trend/history");
  return data;
}

export default api;