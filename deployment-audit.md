# Deployment Repair Audit

## Deployed Site Observation

- URL: https://turbo-titan.vercel.app/
- Observed on 2026-08-12: The initial page renders a TrackSense Pro sign-in gate with the text “Sign in to open a private telemetry workspace and save your race engineering sessions.” This blocks the requested public dashboard experience.
- The public site shell returned HTTP 200, but its `telemetry.weather` tRPC endpoint returned HTTP 500 with `FUNCTION_INVOCATION_FAILED`. This confirms a deployed serverless-runtime failure in addition to the unwanted sign-in gate. The deployed Vercel build is an older pre-repair version and must be redeployed from the corrected public MongoDB branch with its server-side environment variables.

## MongoDB Validation

- The legacy implementation used `MONGODB_URI` with MongoDB/Mongoose for persisted readings.
- The securely configured `MONGODB_URI` passed the `server/mongodb.connection.test.ts` database ping on 2026-08-12.

## Redeployment Requirement

The corrected branch must be deployed with a server-side `MONGODB_URI` environment variable. It uses a single `api/index.ts` Express function with explicit tRPC path normalization and JSON error handling, while Vercel rewrites API and storage routes to that function before falling back to the Vite static client build.

## Vercel Function-Type Investigation

The owner-provided Vercel log for commit `e993564` shows the static Vite build finishing successfully, followed by non-fatal TypeScript diagnostics in Express request and response types. The identical commit passes a fresh local `pnpm install --frozen-lockfile` and `pnpm check`, so the diagnostics are specific to Vercel's function build environment rather than the repository type graph. Vercel's Node.js runtime guidance notes that function request objects may not include all framework helper properties, reinforcing the need to keep the Vercel function boundary explicit rather than reuse the development-server entrypoint. Source: https://vercel.com/docs/functions/runtimes/node-js

Vercel also documents that TypeScript path mappings are not supported for Node.js function entrypoints. The server runtime imports now use relative paths instead of the `@shared/*` aliases so the serverless bundler can resolve the tRPC, OAuth, and SDK dependencies at function startup.
