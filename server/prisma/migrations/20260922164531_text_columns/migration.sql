-- AlterTable
ALTER TABLE `animal` MODIFY `description` TEXT NOT NULL,
    MODIFY `curiosity` TEXT NULL,
    MODIFY `funFact` TEXT NULL,
    MODIFY `behavior` TEXT NULL;

-- AlterTable
ALTER TABLE `animalimage` MODIFY `url` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `contactmessage` MODIFY `subject` TEXT NOT NULL,
    MODIFY `message` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `event` MODIFY `description` TEXT NOT NULL,
    MODIFY `image` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `experience` MODIFY `shortDesc` TEXT NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `image` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `faq` MODIFY `question` TEXT NOT NULL,
    MODIFY `answer` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `feedback` MODIFY `comment` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `galleryitem` MODIFY `url` TEXT NOT NULL,
    MODIFY `videoUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `news` MODIFY `content` LONGTEXT NOT NULL,
    MODIFY `image` TEXT NULL;

-- AlterTable
ALTER TABLE `reservation` MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `schoolvisit` MODIFY `message` TEXT NULL;

-- AlterTable
ALTER TABLE `setting` MODIFY `value` LONGTEXT NOT NULL;
