-- CreateTable
CREATE TABLE `CareProfile` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `relation` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `DoctorSlot_doctorId_start_end_idx` ON `DoctorSlot`(`doctorId`, `start`, `end`);

-- CreateIndex
CREATE INDEX `DoctorSlot_doctorId_start_isBooked_idx` ON `DoctorSlot`(`doctorId`, `start`, `isBooked`);

-- AddForeignKey
ALTER TABLE `CareProfile` ADD CONSTRAINT `CareProfile_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
