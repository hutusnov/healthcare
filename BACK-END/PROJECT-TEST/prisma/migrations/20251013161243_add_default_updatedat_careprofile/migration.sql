/*
  Warnings:

  - The primary key for the `doctorprofile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `doctorprofile` table. All the data in the column will be lost.
  - The primary key for the `patientprofile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `patientprofile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `DoctorProfile` DROP FOREIGN KEY `DoctorProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorSlot` DROP FOREIGN KEY `DoctorSlot_doctorId_fkey`;

-- DropForeignKey
ALTER TABLE `PatientProfile` DROP FOREIGN KEY `PatientProfile_userId_fkey`;

-- DropIndex
DROP INDEX `DoctorProfile_userId_key` ON `doctorprofile`;

-- DropIndex
DROP INDEX `PatientProfile_userId_key` ON `patientprofile`;

-- AlterTable
ALTER TABLE `CareProfile` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `DoctorProfile` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`userId`);

-- AlterTable
ALTER TABLE `PatientProfile` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`userId`);

-- AddForeignKey
ALTER TABLE `DoctorSlot` ADD CONSTRAINT `DoctorSlot_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `DoctorProfile`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DoctorProfile`
  ADD CONSTRAINT `DoctorProfile_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PatientProfile`
  ADD CONSTRAINT `PatientProfile_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
