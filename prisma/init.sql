-- ============================================
-- INSOMNIA TATTOO — Database Setup v2.0
-- Run this in phpMyAdmin on database: insomnia_tattoo
-- ============================================

-- 1. SCHEMA: Create all tables

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('SUPER_ADMIN', 'ARTIST', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
  `name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `google_id` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `email_verified_at` DATETIME(3) NULL,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_google_id_key` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_key` (`token`),
  INDEX `password_reset_tokens_token_idx` (`token`),
  INDEX `password_reset_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_verification_tokens_token_key` (`token`),
  INDEX `email_verification_tokens_token_idx` (`token`),
  INDEX `email_verification_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `email_verification_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` INT NOT NULL,
  `refresh_token` VARCHAR(500) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_refresh_token_key` (`refresh_token`),
  INDEX `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `artists` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `bio_ro` TEXT NULL,
  `bio_en` TEXT NULL,
  `specialty_ro` VARCHAR(200) NULL,
  `specialty_en` VARCHAR(200) NULL,
  `specialties` JSON NULL,
  `profile_image` VARCHAR(500) NULL,
  `instagram_url` VARCHAR(500) NULL,
  `tiktok_url` VARCHAR(500) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `artists_user_id_key` (`user_id`),
  UNIQUE KEY `artists_slug_key` (`slug`),
  CONSTRAINT `artists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `availability` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `artist_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(5) NOT NULL,
  `end_time` VARCHAR(5) NOT NULL,
  `slot_duration_minutes` INT NOT NULL DEFAULT 60,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_artist_date` (`artist_id`, `date`),
  CONSTRAINT `availability_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `availability_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `artist_id` INT NOT NULL,
  `day_of_week` TINYINT NOT NULL,
  `start_time` VARCHAR(5) NOT NULL,
  `end_time` VARCHAR(5) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_artist_day` (`artist_id`, `day_of_week`),
  CONSTRAINT `availability_templates_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `reference_code` VARCHAR(20) NOT NULL,
  `artist_id` INT NOT NULL,
  `client_id` INT NULL,
  `client_name` VARCHAR(200) NOT NULL,
  `client_phone` VARCHAR(50) NOT NULL,
  `client_email` VARCHAR(255) NOT NULL,
  `body_area` VARCHAR(100) NULL,
  `size_category` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `style_preference` VARCHAR(200) NULL,
  `description` TEXT NULL,
  `reference_images` JSON NULL,
  `consultation_date` DATE NOT NULL,
  `consultation_time` VARCHAR(5) NOT NULL,
  `source` VARCHAR(20) NOT NULL DEFAULT 'other',
  `status` VARCHAR(20) NOT NULL DEFAULT 'new',
  `admin_notes` TEXT NULL,
  `gdpr_consent` BOOLEAN NOT NULL DEFAULT FALSE,
  `language` VARCHAR(2) NOT NULL DEFAULT 'ro',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookings_reference_code_key` (`reference_code`),
  INDEX `bookings_status_idx` (`status`),
  INDEX `bookings_consultation_date_idx` (`consultation_date`),
  INDEX `bookings_artist_id_consultation_date_idx` (`artist_id`, `consultation_date`),
  INDEX `bookings_client_id_idx` (`client_id`),
  CONSTRAINT `bookings_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `bookings_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `artist_id` INT NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `thumbnail_path` VARCHAR(500) NULL,
  `title_ro` VARCHAR(200) NULL,
  `title_en` VARCHAR(200) NULL,
  `style` VARCHAR(50) NULL,
  `body_area` VARCHAR(100) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `gallery_artist_id_idx` (`artist_id`),
  INDEX `gallery_is_featured_idx` (`is_featured`),
  INDEX `gallery_style_idx` (`style`),
  CONSTRAINT `gallery_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `client_name` VARCHAR(200) NOT NULL,
  `artist_id` INT NULL,
  `booking_id` INT NULL,
  `rating` TINYINT NOT NULL,
  `review_text_ro` TEXT NULL,
  `review_text_en` TEXT NULL,
  `source` VARCHAR(20) NOT NULL DEFAULT 'website',
  `is_approved` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_booking_review` (`user_id`, `booking_id`),
  CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `booking_id` INT NULL,
  `type` VARCHAR(20) NOT NULL,
  `points` INT NOT NULL,
  `value_ron` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `description` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `loyalty_transactions_user_id_idx` (`user_id`),
  CONSTRAINT `loyalty_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `loyalty_transactions_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prisma migrations tracking table
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mark migration as applied
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `migration_name`, `finished_at`, `applied_steps_count`)
VALUES (UUID(), 'manual-init', '20260411_init', NOW(3), 1);


-- ============================================
-- 2. SEED DATA
-- ============================================

-- Password hash for 'insomnia2024' (bcrypt, 12 rounds)
SET @pw = '$2a$12$Bvf606zk/Q4KcH6Kwk8diO8E2SGYLJ6lXJ8ozcJYoG8vLK7Qr8ECW';

-- Super Admin
INSERT INTO `users` (`email`, `password_hash`, `role`, `name`, `is_active`, `created_at`, `updated_at`)
VALUES ('admin@insomniatattoo.ro', @pw, 'SUPER_ADMIN', 'Admin Insomnia', TRUE, NOW(3), NOW(3));

-- Artist: Madalina
INSERT INTO `users` (`email`, `password_hash`, `role`, `name`, `is_active`, `created_at`, `updated_at`)
VALUES ('madalina@insomniatattoo.ro', @pw, 'ARTIST', 'Madalina', TRUE, NOW(3), NOW(3));

-- Artist: Florentin
INSERT INTO `users` (`email`, `password_hash`, `role`, `name`, `is_active`, `created_at`, `updated_at`)
VALUES ('florentin@insomniatattoo.ro', @pw, 'ARTIST', 'Florentin', TRUE, NOW(3), NOW(3));

-- Get user IDs
SET @admin_id = (SELECT id FROM `users` WHERE email = 'admin@insomniatattoo.ro');
SET @madalina_id = (SELECT id FROM `users` WHERE email = 'madalina@insomniatattoo.ro');
SET @florentin_id = (SELECT id FROM `users` WHERE email = 'florentin@insomniatattoo.ro');

-- Artist profile: Madalina
INSERT INTO `artists` (`user_id`, `name`, `slug`, `bio_ro`, `bio_en`, `specialty_ro`, `specialty_en`, `specialties`, `instagram_url`, `profile_image`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES (
  @madalina_id, 'Madalina', 'madalina',
  'Specializata in realism, portrete si lucrari color cu detalii exceptionale. Cu o pasiune pentru arta care transcende pielea, fiecare tatuaj este o poveste unica.',
  'Specialized in realism, portraits and color work with exceptional detail. With a passion for art that transcends skin, each tattoo is a unique story.',
  'Realism & Portrete', 'Realism & Portraits',
  '["realism", "portraits", "color", "black_grey", "nature"]',
  'https://instagram.com/madalina.insomnia',
  '/images/artist-madalina.png',
  1, TRUE, NOW(3), NOW(3)
);

-- Artist profile: Florentin
INSERT INTO `artists` (`user_id`, `name`, `slug`, `bio_ro`, `bio_en`, `specialty_ro`, `specialty_en`, `specialties`, `instagram_url`, `profile_image`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES (
  @florentin_id, 'Florentin', 'florentin',
  'Pasionat de graphic design, line work, geometric si minimalism. Fiecare linie este trasata cu precizie, fiecare design spune o poveste.',
  'Passionate about graphic design, line work, geometric and minimalism. Every line is drawn with precision, every design tells a story.',
  'Graphic & Line Work', 'Graphic & Line Work',
  '["graphic", "linework", "geometric", "minimalist", "blackwork"]',
  'https://instagram.com/florentin.insomnia',
  '/images/artist-florentin.png',
  2, TRUE, NOW(3), NOW(3)
);

-- Get artist IDs
SET @artist_madalina = (SELECT id FROM `artists` WHERE slug = 'madalina');
SET @artist_florentin = (SELECT id FROM `artists` WHERE slug = 'florentin');

-- Availability Templates (Mon-Fri 10-18, Sat 10-16, Sun off)
-- Madalina
INSERT INTO `availability_templates` (`artist_id`, `day_of_week`, `start_time`, `end_time`, `is_active`) VALUES
  (@artist_madalina, 1, '10:00', '18:00', TRUE),
  (@artist_madalina, 2, '10:00', '18:00', TRUE),
  (@artist_madalina, 3, '10:00', '18:00', TRUE),
  (@artist_madalina, 4, '10:00', '18:00', TRUE),
  (@artist_madalina, 5, '10:00', '18:00', TRUE),
  (@artist_madalina, 6, '10:00', '16:00', TRUE),
  (@artist_madalina, 0, '10:00', '18:00', FALSE);

-- Florentin
INSERT INTO `availability_templates` (`artist_id`, `day_of_week`, `start_time`, `end_time`, `is_active`) VALUES
  (@artist_florentin, 1, '10:00', '18:00', TRUE),
  (@artist_florentin, 2, '10:00', '18:00', TRUE),
  (@artist_florentin, 3, '10:00', '18:00', TRUE),
  (@artist_florentin, 4, '10:00', '18:00', TRUE),
  (@artist_florentin, 5, '10:00', '18:00', TRUE),
  (@artist_florentin, 6, '10:00', '16:00', TRUE),
  (@artist_florentin, 0, '10:00', '18:00', FALSE);

-- Sample Reviews (pre-approved)
INSERT INTO `reviews` (`client_name`, `artist_id`, `rating`, `review_text_ro`, `review_text_en`, `source`, `is_approved`, `is_visible`, `created_at`) VALUES
  ('Alexandra M.', @artist_madalina, 5, 'Portretul este incredibil! Madalina a captat fiecare detaliu perfect. Recomand cu toata increderea.', 'The portrait is incredible! Madalina captured every detail perfectly. I recommend with full confidence.', 'google', TRUE, TRUE, NOW(3)),
  ('Andrei P.', @artist_florentin, 5, 'Design geometric superb. Florentin are o viziune artistica unica. Calitate exceptionala.', 'Superb geometric design. Florentin has a unique artistic vision. Exceptional quality.', 'google', TRUE, TRUE, NOW(3)),
  ('Maria C.', @artist_madalina, 5, 'Am facut un tatuaj color si sunt extrem de multumita. Studio curat, atmosfera relaxanta.', 'I got a color tattoo and I am extremely satisfied. Clean studio, relaxing atmosphere.', 'instagram', TRUE, TRUE, NOW(3)),
  ('Radu S.', @artist_florentin, 5, 'Line work impecabil. Exact ce mi-am dorit. Profesionalism de la inceput pana la sfarsit.', 'Impeccable line work. Exactly what I wanted. Professionalism from start to finish.', 'instagram', TRUE, TRUE, NOW(3));

-- Default Settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`)
VALUES ('studio_hours', '{"mon-fri":"10:00 - 18:00","sat":"10:00 - 16:00","sun":"Inchis"}', NOW(3));

-- ============================================
-- DONE! Database ready.
-- Login credentials:
--   Admin: admin@insomniatattoo.ro / insomnia2024
--   Madalina: madalina@insomniatattoo.ro / insomnia2024
--   Florentin: florentin@insomniatattoo.ro / insomnia2024
-- ============================================
