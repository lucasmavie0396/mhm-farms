-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Animal` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `species` VARCHAR(191) NOT NULL,
    `family` VARCHAR(191) NULL,
    `category` ENUM('MAMIFERO', 'AVE', 'REPTIL', 'DOMESTICO', 'OUTRO') NOT NULL,
    `habitat` VARCHAR(191) NULL,
    `diet` VARCHAR(191) NULL,
    `lifeExpectancy` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `curiosity` VARCHAR(191) NULL,
    `funFact` VARCHAR(191) NULL,
    `behavior` VARCHAR(191) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `mainImage` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Animal_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnimalImage` (
    `id` VARCHAR(191) NOT NULL,
    `animalId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Experience` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDesc` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NOT NULL,
    `type` ENUM('VISITA', 'ALIMENTACAO', 'PASSEIO', 'EDUCACAO', 'FAMILIA', 'EVENTO', 'AVENTURA') NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `minAge` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `availability` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `animalId` VARCHAR(191) NULL,

    UNIQUE INDEX `Experience_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `maxParticipants` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `adults` INTEGER NOT NULL DEFAULT 1,
    `children` INTEGER NOT NULL DEFAULT 0,
    `totalVisitors` INTEGER NOT NULL,
    `visitType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `experienceId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Reservation_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolVisit` (
    `id` VARCHAR(191) NOT NULL,
    `schoolName` VARCHAR(191) NOT NULL,
    `teacherName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `numStudents` INTEGER NOT NULL,
    `numTeachers` INTEGER NOT NULL,
    `schoolLevel` VARCHAR(191) NULL,
    `preferredDate` DATETIME(3) NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'animais',
    `type` VARCHAR(191) NOT NULL DEFAULT 'IMAGE',
    `url` VARCHAR(191) NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `News_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'geral',
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `status` ENUM('NEW', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AnimalImage` ADD CONSTRAINT `AnimalImage_animalId_fkey` FOREIGN KEY (`animalId`) REFERENCES `Animal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Experience` ADD CONSTRAINT `Experience_animalId_fkey` FOREIGN KEY (`animalId`) REFERENCES `Animal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_experienceId_fkey` FOREIGN KEY (`experienceId`) REFERENCES `Experience`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
