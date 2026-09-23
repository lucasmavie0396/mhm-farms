-- AlterTable
ALTER TABLE `ticketsale` ADD COLUMN `reservationId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `TicketSale_reservationId_idx` ON `TicketSale`(`reservationId`);

-- CreateIndex
CREATE INDEX `TicketSale_date_idx` ON `TicketSale`(`date`);

-- AddForeignKey
ALTER TABLE `TicketSale` ADD CONSTRAINT `TicketSale_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
