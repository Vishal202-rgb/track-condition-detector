import mongoose from "mongoose";
import Reading from "../models/Reading.js";

const inMemoryStore = [];

export async function saveReading(data) {
  const payload = {
    sectorId: data.sectorId || "sector-1",
    ...data,
  };

  if (mongoose.connection.readyState === 1) {
    return await Reading.create(payload);
  }
  const item = {
    _id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...payload,
    timestamp: new Date(),
  };
  inMemoryStore.push(item);
  return item;
}

export async function getRecentReadings(limit = 10, sectorId = null) {
  const query = sectorId ? { sectorId } : {};

  if (mongoose.connection.readyState === 1) {
    const items = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    return items.reverse();
  }

  let filtered = [...inMemoryStore];
  if (sectorId) {
    filtered = filtered.filter((r) => r.sectorId === sectorId);
  }
  const sorted = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return sorted.slice(0, limit).reverse();
}

export async function getAllReadings(sectorId = null) {
  const query = sectorId ? { sectorId } : {};

  if (mongoose.connection.readyState === 1) {
    return await Reading.find(query).sort({ timestamp: 1 }).lean();
  }

  let filtered = [...inMemoryStore];
  if (sectorId) {
    filtered = filtered.filter((r) => r.sectorId === sectorId);
  }
  return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function clearInMemoryStore() {
  inMemoryStore.length = 0;
}
