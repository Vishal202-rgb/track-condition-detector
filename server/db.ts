import { MongoClient, type ObjectId } from "mongodb";
import type { User } from "./_core/user";

const mongoUri = process.env.MONGODB_URI ?? "";
const databaseName = process.env.MONGODB_DB_NAME || "tracksense";

let clientPromise: Promise<MongoClient> | null = null;

export type PublicUserRecord = User;

export type CreateTelemetryReadingInput = {
  sectorId: string;
  condition: string;
  confidence: number;
  saturation: number;
  tireStrategy: string;
  pitWindowLap: number;
  slope: string;
  temp?: string;
  humidity?: string;
  windSpeed?: string;
  imageUrl?: string;
  source: string;
};

export type TelemetryReading = CreateTelemetryReadingInput & {
  id: string;
  createdAt: Date;
};

type MongoTelemetryReading = CreateTelemetryReadingInput & { _id: ObjectId; createdAt: Date };

async function getClient() {
  if (!mongoUri) throw new Error("MongoDB is not configured");
  if (!clientPromise) {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 20_000 });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

async function getDatabase() {
  return (await getClient()).db(databaseName);
}

function toTelemetryReading(document: MongoTelemetryReading): TelemetryReading {
  const { _id, ...reading } = document;
  return { ...reading, id: _id.toHexString() };
}

export async function createTelemetryReading(data: CreateTelemetryReadingInput): Promise<TelemetryReading> {
  const createdAt = new Date();
  const result = await (await getDatabase()).collection<CreateTelemetryReadingInput & { createdAt: Date }>("telemetry_readings").insertOne({ ...data, createdAt });
  return { ...data, createdAt, id: result.insertedId.toHexString() };
}

export async function getTelemetryReadings(sectorId?: string, limit = 100): Promise<TelemetryReading[]> {
  const filter = sectorId ? { sectorId } : {};
  const readings = await (await getDatabase()).collection<MongoTelemetryReading>("telemetry_readings")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return readings.map(toTelemetryReading);
}

export async function getAllTelemetryReadings(limit = 250): Promise<TelemetryReading[]> {
  const readings = await (await getDatabase()).collection<MongoTelemetryReading>("telemetry_readings")
    .find({})
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  return readings.map(toTelemetryReading);
}

export async function createAuditLog(data: { action: string; entity: string; message?: string; metadata?: string }) {
  await (await getDatabase()).collection("audit_logs").insertOne({ ...data, createdAt: new Date() });
}

/** Retained for the optional OAuth infrastructure; public telemetry does not require a session. */
export async function upsertUser(user: Partial<PublicUserRecord> & Pick<PublicUserRecord, "openId">): Promise<void> {
  const now = new Date();
  const values = {
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? "user",
    lastSignedIn: user.lastSignedIn ?? now,
    updatedAt: now,
  };
  await (await getDatabase()).collection("users").updateOne(
    { openId: user.openId },
    { $set: values, $setOnInsert: { openId: user.openId, createdAt: now } },
    { upsert: true },
  );
}

export async function getUserByOpenId(openId: string): Promise<PublicUserRecord | undefined> {
  const user = await (await getDatabase()).collection("users").findOne({ openId });
  if (!user) return undefined;
  return {
    id: Number.parseInt(user._id.toHexString().slice(-8), 16),
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role === "admin" ? "admin" : "user",
    createdAt: user.createdAt ?? new Date(),
    updatedAt: user.updatedAt ?? new Date(),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
}
