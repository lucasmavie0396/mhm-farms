-- CreateTable
CREATE TABLE `TicketSale` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `items` JSON NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `totalVisitors` INTEGER NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PAID',
    `sellerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TicketSale_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TicketSale` ADD CONSTRAINT `TicketSale_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
