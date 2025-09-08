/*
  Warnings:

  - Added the required column `updatedAt` to the `Etape` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Etape` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `ordre` INTEGER NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `Etape_voyageId_date_idx` ON `Etape`(`voyageId`, `date`);

-- CreateIndex
CREATE INDEX `Etape_date_idx` ON `Etape`(`date`);

-- CreateIndex
CREATE FULLTEXT INDEX `Etape_titre_texte_idx` ON `Etape`(`titre`, `texte`);
