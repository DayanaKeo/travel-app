/*
  Warnings:

  - Added the required column `updatedAt` to the `Etape` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `etape` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `ordre` INTEGER NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `etape_voyageId_date_idx` ON `etape`(`voyageId`, `date`);

-- CreateIndex
CREATE INDEX `etape_date_idx` ON `etape`(`date`);

-- CreateIndex
CREATE FULLTEXT INDEX `etape_titre_texte_idx` ON `etape`(`titre`, `texte`);
