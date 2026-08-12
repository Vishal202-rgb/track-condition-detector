# Visual QA Notes

- Desktop command center renders with the persistent sidebar and the mission-control hero no longer overlaps the sidebar after reserving the sidebar inset width.
- The nocturnal motorsport visual system is consistent: near-black surfaces, acid-lime primary telemetry, cyan/orange/red sector signals, condensed tactical headings, and monospace operational labels.
- The first-screen hierarchy is clear: live surface classification, confidence state, recommended compound, and circuit map dominate above supporting telemetry.
- History now presents a real database-backed loading/empty state rather than seeded rows when no saved telemetry exists.
- Next check: verify mobile layout and run final typecheck/build/tests before checkpoint.

## Reliability validation

- The hardened desktop command center rendered without visual regressions after upload, storage, weather-cache, and query-bound improvements.
- Once the live request settled, the telemetry cards displayed Open-Meteo values of 17.4°C, 68%, and 14.4 km/h rather than their initial loading-state values.
- The persistent navigation, circuit topology, analysis panel, strategy call, and telemetry cards remained visible and legible at 1440×960.
