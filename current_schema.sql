-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: video
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'e8a458dc-0a54-11f1-99f3-85c341fd3203:1-36';

--
-- Table structure for table `Progress`
--

DROP TABLE IF EXISTS `Progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Progress` (
  `progressId` int NOT NULL AUTO_INCREMENT,
  `videoId` int NOT NULL,
  `answeredCorrectly` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int NOT NULL DEFAULT '0',
  `lastAttemptAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`progressId`),
  UNIQUE KEY `UQ_Progress_Video` (`videoId`),
  CONSTRAINT `FK_Progress_Video` FOREIGN KEY (`videoId`) REFERENCES `Video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CK_Progress_Attempts` CHECK ((`attempts` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Quiz`
--

DROP TABLE IF EXISTS `Quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Quiz` (
  `id` int NOT NULL AUTO_INCREMENT,
  `videoId` int NOT NULL,
  `questionText` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correctIndex` tinyint NOT NULL,
  `explanation` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_Quiz_Video` (`videoId`),
  KEY `IX_Quiz_VideoId` (`videoId`),
  CONSTRAINT `FK_Quiz_Video` FOREIGN KEY (`videoId`) REFERENCES `Video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CK_Quiz_CorrectIndex` CHECK ((`correctIndex` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `QuizOption`
--

DROP TABLE IF EXISTS `QuizOption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QuizOption` (
  `quizId` int NOT NULL,
  `optionIndex` tinyint NOT NULL,
  `optionText` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`quizId`,`optionIndex`),
  KEY `IX_QuizOption_QuizId` (`quizId`),
  CONSTRAINT `FK_QuizOption_Quiz` FOREIGN KEY (`quizId`) REFERENCES `Quiz` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CK_QuizOption_OptionIndex` CHECK ((`optionIndex` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Thread`
--

DROP TABLE IF EXISTS `Thread`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Thread` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prompt` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'generating',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IX_Thread_Status` (`status`),
  KEY `IX_Thread_CreatedAt` (`createdAt`),
  CONSTRAINT `CK_Thread_Status` CHECK ((`status` in (_utf8mb4'generating',_utf8mb4'ready',_utf8mb4'failed',_utf8mb4'archived')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ThreadSetting`
--

DROP TABLE IF EXISTS `ThreadSetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ThreadSetting` (
  `threadId` int NOT NULL,
  `settingKey` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settingValue` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`threadId`,`settingKey`),
  KEY `IX_ThreadSetting_ThreadId` (`threadId`),
  KEY `IX_ThreadSetting_SettingKey` (`settingKey`),
  CONSTRAINT `FK_ThreadSetting_Thread` FOREIGN KEY (`threadId`) REFERENCES `Thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ThreadSource`
--

DROP TABLE IF EXISTS `ThreadSource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ThreadSource` (
  `threadId` int NOT NULL,
  `sourceIndex` tinyint NOT NULL,
  `source` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`threadId`,`sourceIndex`),
  KEY `IX_ThreadSource_ThreadId` (`threadId`),
  CONSTRAINT `FK_ThreadSource_Thread` FOREIGN KEY (`threadId`) REFERENCES `Thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CK_ThreadSource_SourceIndex` CHECK ((`sourceIndex` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Video`
--

DROP TABLE IF EXISTS `Video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Video` (
  `id` int NOT NULL AUTO_INCREMENT,
  `threadId` int NOT NULL,
  `index` tinyint NOT NULL,
  `scriptText` varchar(5000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blobName` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blobUrl` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `videoUrl` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_Video_Thread_Index` (`threadId`,`index`),
  UNIQUE KEY `UQ_Video_TaskId` (`taskId`),
  KEY `IX_Video_ThreadId` (`threadId`),
  KEY `IX_Video_CreatedAt` (`createdAt`),
  CONSTRAINT `FK_Video_Thread` FOREIGN KEY (`threadId`) REFERENCES `Thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CK_Video_Duration` CHECK ((`duration` > 0)),
  CONSTRAINT `CK_Video_Index` CHECK ((`index` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15 13:04:13
