# Deployment Repair Audit

## Deployed Site Observation

- URL: https://turbo-titan.vercel.app/
- Observed on 2026-08-12: The initial page renders a TrackSense Pro sign-in gate with the text “Sign in to open a private telemetry workspace and save your race engineering sessions.” This blocks the requested public dashboard experience.
- The public site shell returned HTTP 200, but its `telemetry.weather` tRPC endpoint returned HTTP 500 with `FUNCTION_INVOCATION_FAILED`. This confirms a deployed serverless-runtime failure in addition to the unwanted sign-in gate. The deployed Vercel build is an older pre-repair version and must be redeployed from the corrected public MongoDB branch with its server-side environment variables.

## MongoDB Validation

- The legacy implementation used `MONGODB_URI` with MongoDB/Mongoose for persisted readings.
- The securely configured `MONGODB_URI` passed the `server/mongodb.connection.test.ts` database ping on 2026-08-12.

## Redeployment Requirement

The corrected branch must be deployed with a server-side `MONGODB_URI` environment variable. It now includes an `api/[...path].ts` Vercel serverless entrypoint that exposes the shared Express/tRPC application and a `vercel.json` configuration that separates API requests from the Vite static client build.
