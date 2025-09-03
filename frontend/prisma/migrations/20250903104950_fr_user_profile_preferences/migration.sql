-- CreateTable
CREATE TABLE `profil_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `nomComplet` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `localisation` VARCHAR(191) NULL,
    `languePreferee` VARCHAR(191) NULL,
    `biographie` VARCHAR(191) NULL,
    `dateNaissance` DATETIME(3) NULL,
    `avatarUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `profil_user_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preference_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    `profilPublic` BOOLEAN NOT NULL DEFAULT false,
    `suggestionsIAAutomatiques` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `preference_user_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profil_user` ADD CONSTRAINT `profil_user_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preference_user` ADD CONSTRAINT `preference_user_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
