CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` int NOT NULL,
	`contractNumber` varchar(50) NOT NULL,
	`type` enum('fixed','installment') NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`originalValue` decimal(12,2) NOT NULL,
	`interestRate` decimal(5,2) NOT NULL,
	`interestValue` decimal(12,2) NOT NULL,
	`totalValue` decimal(12,2) NOT NULL,
	`minimumPayment` decimal(12,2),
	`startDate` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contracts_contractNumber_unique` UNIQUE(`contractNumber`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`cpfCnpj` varchar(20) NOT NULL,
	`birthDate` varchar(10),
	`address` text NOT NULL,
	`addressNumber` varchar(10) NOT NULL,
	`complement` text,
	`neighborhood` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_cpfCnpj_unique` UNIQUE(`cpfCnpj`)
);
--> statement-breakpoint
CREATE TABLE `installments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`installmentNumber` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`paidValue` decimal(12,2) DEFAULT '0',
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`paidDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhoto` text;