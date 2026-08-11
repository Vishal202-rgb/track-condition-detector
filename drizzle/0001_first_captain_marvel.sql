CREATE TABLE `telemetry_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sectorId` varchar(64) NOT NULL,
	`condition` varchar(32) NOT NULL,
	`confidence` int NOT NULL,
	`saturation` int NOT NULL,
	`tireStrategy` varchar(64) NOT NULL,
	`pitWindowLap` int NOT NULL,
	`slope` varchar(32) NOT NULL,
	`temp` varchar(16),
	`humidity` varchar(16),
	`windSpeed` varchar(16),
	`imageUrl` text,
	`source` varchar(32) NOT NULL DEFAULT 'upload',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_readings_id` PRIMARY KEY(`id`)
);
