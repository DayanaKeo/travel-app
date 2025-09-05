/*
  Warnings:

  - You are about to drop the column `token` on the `verificationtoken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `VerificationToken_identifier_token_key` ON `verificationtoken`;

-- DropIndex
DROP INDEX `VerificationToken_token_key` ON `verificationtoken`;

-- AlterTable
ALTER TABLE `verificationtoken` DROP COLUMN `token`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `tokenHash` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `VerificationToken_expires_idx` ON `VerificationToken`(`expires`);

-- CreateIndex
CREATE UNIQUE INDEX `VerificationToken_identifier_key` ON `VerificationToken`(`identifier`);
