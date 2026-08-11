import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const telemetryReadings = mysqlTable("telemetry_readings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sectorId: varchar("sectorId", { length: 64 }).notNull(),
  condition: varchar("condition", { length: 32 }).notNull(),
  confidence: int("confidence").notNull(),
  saturation: int("saturation").notNull(),
  tireStrategy: varchar("tireStrategy", { length: 64 }).notNull(),
  pitWindowLap: int("pitWindowLap").notNull(),
  slope: varchar("slope", { length: 32 }).notNull(),
  temp: varchar("temp", { length: 16 }),
  humidity: varchar("humidity", { length: 16 }),
  windSpeed: varchar("windSpeed", { length: 16 }),
  imageUrl: text("imageUrl"),
  source: varchar("source", { length: 32 }).default("upload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("telemetry_user_created_idx").on(table.userId, table.createdAt),
  index("telemetry_user_sector_created_idx").on(table.userId, table.sectorId, table.createdAt),
]);

export type TelemetryReading = typeof telemetryReadings.$inferSelect;
export type InsertTelemetryReading = typeof telemetryReadings.$inferInsert;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entity: varchar("entity", { length: 64 }).notNull(),
  message: text("message"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("audit_user_created_idx").on(table.userId, table.createdAt)]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

