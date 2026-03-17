-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `careProfileId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_careProfileId_fkey` FOREIGN KEY (`careProfileId`) REFERENCES `CareProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
