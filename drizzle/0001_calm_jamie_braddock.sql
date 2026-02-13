CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`detailsFr` text NOT NULL,
	`detailsEn` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caseInfo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100),
	`titleFr` text NOT NULL,
	`titleEn` text NOT NULL,
	`descriptionFr` text,
	`descriptionEn` text,
	`amount` bigint,
	`currency` varchar(3) DEFAULT 'EUR',
	`status` enum('active','pending','closed','archived') NOT NULL DEFAULT 'active',
	`clientName` text,
	`opposingParty` text,
	`jurisdiction` text,
	`startDate` timestamp,
	`expectedEndDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseInfo_id` PRIMARY KEY(`id`),
	CONSTRAINT `caseInfo_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameKey` varchar(100) NOT NULL,
	`nameFr` text NOT NULL,
	`nameEn` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(20) NOT NULL,
	`sortOrder` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_nameKey_unique` UNIQUE(`nameKey`)
);
--> statement-breakpoint
CREATE TABLE `documentPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('admin','avocat','expert','observateur') NOT NULL,
	`categoryId` int NOT NULL,
	`canView` boolean NOT NULL DEFAULT false,
	`canUpload` boolean NOT NULL DEFAULT false,
	`canEdit` boolean NOT NULL DEFAULT false,
	`canDelete` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` text NOT NULL,
	`fileSize` bigint NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`s3Key` text NOT NULL,
	`s3Url` text NOT NULL,
	`sha256Hash` varchar(64) NOT NULL,
	`timestampProof` text,
	`description` text,
	`tags` text,
	`version` int NOT NULL DEFAULT 1,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchName` varchar(200) NOT NULL,
	`searchCriteria` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timelineEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('document_upload','document_view','document_edit','document_delete','user_login','user_action','milestone','meeting','deadline','custom') NOT NULL,
	`titleFr` text NOT NULL,
	`titleEn` text NOT NULL,
	`descriptionFr` text,
	`descriptionEn` text,
	`actorId` int,
	`relatedDocumentId` int,
	`metadata` text,
	`eventDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timelineEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','avocat','expert','observateur') NOT NULL DEFAULT 'observateur';--> statement-breakpoint
ALTER TABLE `users` ADD `organization` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;