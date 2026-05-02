CREATE TABLE `security_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(100) NOT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'warning',
  `source` VARCHAR(120) NULL,
  `ip_hash` VARCHAR(64) NULL,
  `user_id` INTEGER NULL,
  `user_agent` VARCHAR(500) NULL,
  `path` VARCHAR(500) NULL,
  `method` VARCHAR(10) NULL,
  `details` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `security_events_event_type_created_at_idx` (`event_type`, `created_at`),
  INDEX `security_events_severity_created_at_idx` (`severity`, `created_at`),
  INDEX `security_events_ip_hash_created_at_idx` (`ip_hash`, `created_at`),
  INDEX `security_events_user_id_idx` (`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rate_limit_buckets` (
  `key` VARCHAR(191) NOT NULL,
  `count` INTEGER NOT NULL DEFAULT 0,
  `reset_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `rate_limit_buckets_reset_at_idx` (`reset_at`),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `security_events`
  ADD CONSTRAINT `security_events_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
