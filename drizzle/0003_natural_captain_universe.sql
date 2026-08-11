CREATE INDEX `audit_user_created_idx` ON `audit_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `telemetry_user_created_idx` ON `telemetry_readings` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `telemetry_user_sector_created_idx` ON `telemetry_readings` (`userId`,`sectorId`,`createdAt`);