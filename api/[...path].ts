import "dotenv/config";
import { createApp } from "../server/_core/app";

/** Vercel serverless handler for the TrackSense tRPC and OAuth endpoints. */
export default createApp();
