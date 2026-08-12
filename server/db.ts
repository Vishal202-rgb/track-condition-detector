import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, telemetryReadings, InsertTelemetryReading, auditLogs } from "../drizzle/schema";
import { ENV } from './_core/env';
import { desc, asc, and } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createTelemetryReading(data: InsertTelemetryReading) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(telemetryReadings).values(data);
  return result;
}

export async function getTelemetryReadings(userId: number, sectorId?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  if (sectorId) {
    return await db.select().from(telemetryReadings)
      .where(and(eq(telemetryReadings.userId, userId), eq(telemetryReadings.sectorId, sectorId)))
      .orderBy(desc(telemetryReadings.createdAt))
      .limit(limit);
  }
  return await db.select().from(telemetryReadings)
    .where(eq(telemetryReadings.userId, userId))
    .orderBy(desc(telemetryReadings.createdAt))
    .limit(limit);
}

export async function getAllTelemetryReadings(userId: number, limit: number = 250) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(telemetryReadings)
    .where(eq(telemetryReadings.userId, userId))
    .orderBy(asc(telemetryReadings.createdAt))
    .limit(limit);
}

export async function createAuditLog(data: { userId: number; action: string; entity: string; message?: string; metadata?: string }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot write audit log: database not available");
    return;
  }
  await db.insert(auditLogs).values(data);
}
