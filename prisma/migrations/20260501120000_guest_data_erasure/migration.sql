-- CreateTable
CREATE TABLE `guest_data_erasure_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email_norm` VARCHAR(255) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `guest_data_erasure_tokens_token_hash_key`(`token_hash`),
    INDEX `guest_data_erasure_tokens_email_norm_idx`(`email_norm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
