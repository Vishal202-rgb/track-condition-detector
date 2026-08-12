import { afterAll, describe, expect, it } from "vitest";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
let client: MongoClient | null = null;

describe("MongoDB connection configuration", () => {
  it("connects to the configured MongoDB deployment", async () => {
    expect(uri).toMatch(/^mongodb(\+srv)?:\/\//);

    client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
    await client.db().command({ ping: 1 });
  }, 25_000);
});

afterAll(async () => {
  await client?.close();
});
