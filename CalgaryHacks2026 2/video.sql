-- =========================
-- Database: Video
-- =========================

CREATE DATABASE IF NOT EXISTS video
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE video;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- TABLE: Thread
-- =========================
CREATE TABLE Thread (
  id INT AUTO_INCREMENT NOT NULL,
  prompt VARCHAR(500) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'generating',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_Thread PRIMARY KEY (id),
  CONSTRAINT CK_Thread_Status CHECK (status IN ('generating', 'ready', 'failed', 'archived'))
) ENGINE = InnoDB;

CREATE INDEX IX_Thread_Status ON Thread (status);
CREATE INDEX IX_Thread_CreatedAt ON Thread (createdAt);

-- =========================
-- TABLE: ThreadSource (replaces sourcesJson)
-- =========================
CREATE TABLE ThreadSource (
  threadId INT NOT NULL,
  sourceIndex TINYINT NOT NULL,
  source VARCHAR(500) NOT NULL,
  CONSTRAINT PK_ThreadSource PRIMARY KEY (threadId, sourceIndex),
  CONSTRAINT FK_ThreadSource_Thread FOREIGN KEY (threadId)
    REFERENCES Thread (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT CK_ThreadSource_SourceIndex CHECK (sourceIndex >= 0)
) ENGINE = InnoDB;

CREATE INDEX IX_ThreadSource_ThreadId ON ThreadSource (threadId);

-- =========================
-- TABLE: ThreadSetting (replaces settingsJson)
-- =========================
CREATE TABLE ThreadSetting (
  threadId INT NOT NULL,
  settingKey VARCHAR(50) NOT NULL,
  settingValue VARCHAR(500) NOT NULL,
  CONSTRAINT PK_ThreadSetting PRIMARY KEY (threadId, settingKey),
  CONSTRAINT FK_ThreadSetting_Thread FOREIGN KEY (threadId)
    REFERENCES Thread (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX IX_ThreadSetting_ThreadId ON ThreadSetting (threadId);
CREATE INDEX IX_ThreadSetting_SettingKey ON ThreadSetting (settingKey);

-- =========================
-- TABLE: Video
-- =========================
CREATE TABLE Video (
  id INT AUTO_INCREMENT NOT NULL,
  threadId INT NOT NULL,
  `index` TINYINT NOT NULL,
  scriptText VARCHAR(5000) NOT NULL,

  taskId VARCHAR(100) NULL,
  blobName VARCHAR(512) NULL,
  blobUrl VARCHAR(2048) NULL,

  videoUrl VARCHAR(2048) NULL,
  duration INT NOT NULL, -- seconds
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT PK_Video PRIMARY KEY (id),
  CONSTRAINT FK_Video_Thread FOREIGN KEY (threadId)
    REFERENCES Thread (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT UQ_Video_Thread_Index UNIQUE (threadId, `index`),
  CONSTRAINT UQ_Video_TaskId UNIQUE (taskId),

  CONSTRAINT CK_Video_Index CHECK (`index` BETWEEN 1 AND 5),
  CONSTRAINT CK_Video_Duration CHECK (duration > 0)
) ENGINE = InnoDB;

CREATE INDEX IX_Video_ThreadId ON Video (threadId);
CREATE INDEX IX_Video_CreatedAt ON Video (createdAt);

-- =========================
-- TABLE: Quiz
-- =========================
CREATE TABLE Quiz (
  id INT AUTO_INCREMENT NOT NULL,
  videoId INT NOT NULL,
  questionText VARCHAR(500) NOT NULL,
  correctIndex TINYINT NOT NULL,
  explanation VARCHAR(1000) NULL,
  CONSTRAINT PK_Quiz PRIMARY KEY (id),
  CONSTRAINT FK_Quiz_Video FOREIGN KEY (videoId)
    REFERENCES Video (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT UQ_Quiz_Video UNIQUE (videoId),
  CONSTRAINT CK_Quiz_CorrectIndex CHECK (correctIndex >= 0)
) ENGINE = InnoDB;

CREATE INDEX IX_Quiz_VideoId ON Quiz (videoId);

-- =========================
-- TABLE: QuizOption
-- =========================
CREATE TABLE QuizOption (
  quizId INT NOT NULL,
  optionIndex TINYINT NOT NULL,
  optionText VARCHAR(255) NOT NULL,
  CONSTRAINT PK_QuizOption PRIMARY KEY (quizId, optionIndex),
  CONSTRAINT FK_QuizOption_Quiz FOREIGN KEY (quizId)
    REFERENCES Quiz (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT CK_QuizOption_OptionIndex CHECK (optionIndex >= 0)
) ENGINE = InnoDB;

CREATE INDEX IX_QuizOption_QuizId ON QuizOption (quizId);

-- =========================
-- TABLE: Progress
-- =========================
CREATE TABLE Progress (
  progressId INT AUTO_INCREMENT NOT NULL,
  videoId INT NOT NULL,
  answeredCorrectly TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  lastAttemptAt DATETIME NULL,
  completedAt DATETIME NULL,
  CONSTRAINT PK_Progress PRIMARY KEY (progressId),
  CONSTRAINT UQ_Progress_Video UNIQUE (videoId),
  CONSTRAINT FK_Progress_Video FOREIGN KEY (videoId)
    REFERENCES Video (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT CK_Progress_Attempts CHECK (attempts >= 0)
) ENGINE = InnoDB;

-- =========================
-- DUMMY DATA
-- =========================

INSERT INTO Thread (id, prompt, status, createdAt)
VALUES
(1, 'Explain Azure Blob Storage basics', 'ready', '2026-02-14 15:30:00'),
(2, 'Linear Algebra: Eigenvalues simplified', 'ready', '2026-02-14 15:32:00'),
(3, 'Introduction to SQL Constraints', 'ready', '2026-02-14 15:35:00');

INSERT INTO ThreadSource (threadId, sourceIndex, source)
VALUES
(1, 0, 'https://learn.microsoft.com/azure/storage/blobs/'),
(2, 0, 'Linear Algebra Textbook Chapter 5'),
(3, 0, 'MySQL Official Documentation');

INSERT INTO ThreadSetting (threadId, settingKey, settingValue)
VALUES
(1, 'difficulty', 'beginner'),
(2, 'difficulty', 'intermediate'),
(3, 'difficulty', 'beginner');

-- NOTE:
-- blobUrl is the stable non-SAS URL you store long-term.
-- videoUrl can be a playable SAS URL (or NULL if not generated yet).
INSERT INTO Video (
  id, threadId, `index`, scriptText,
  taskId, blobName, blobUrl,
  videoUrl, duration, createdAt
)
VALUES
(1, 1, 1,
 'Azure Blob Storage is a scalable object storage solution designed for unstructured data such as images and videos.',
 'task_az_001',
 'video-task_az_001.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_az_001.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_az_001.mp4?sv=...SAS...',
 60,
 '2026-02-14 15:31:00'),

(2, 2, 1,
 'An eigenvalue represents the factor by which a matrix scales a vector during transformation.',
 'task_la_002',
 'video-task_la_002.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_la_002.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_la_002.mp4?sv=...SAS...',
 60,
 '2026-02-14 15:33:00'),

(3, 3, 1,
 'SQL constraints are rules applied to table columns to enforce data integrity.',
 'task_sql_003',
 'video-task_sql_003.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_sql_003.mp4',
 'https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/video-task_sql_003.mp4?sv=...SAS...',
 60,
 '2026-02-14 15:36:00');

INSERT INTO Quiz (id, videoId, questionText, correctIndex, explanation)
VALUES
(1, 1,
 'What type of data is Azure Blob Storage primarily designed for?',
 1,
 'Azure Blob Storage is designed for unstructured object data such as images and files.'),
(2, 2,
 'What does an eigenvalue represent?',
 2,
 'An eigenvalue represents how much a matrix scales a vector.'),
(3, 3,
 'What is the purpose of SQL constraints?',
 2,
 'Constraints enforce rules like NOT NULL, UNIQUE, and FOREIGN KEY to maintain data integrity.');

INSERT INTO QuizOption (quizId, optionIndex, optionText)
VALUES
(1, 0, 'Structured relational data'),
(1, 1, 'Unstructured object data'),
(1, 2, 'Temporary cache data'),
(1, 3, 'System logs only'),

(2, 0, 'Matrix size'),
(2, 1, 'Vector rotation only'),
(2, 2, 'Scaling factor of a vector'),
(2, 3, 'Number of rows in a matrix'),

(3, 0, 'Speed up queries only'),
(3, 1, 'Decorate tables visually'),
(3, 2, 'Enforce data integrity rules'),
(3, 3, 'Store JSON data');

INSERT INTO Progress (videoId, answeredCorrectly, attempts, lastAttemptAt, completedAt)
VALUES
(1, 1, 1, '2026-02-14 15:40:00', '2026-02-14 15:40:00'),
(2, 0, 2, '2026-02-14 15:45:00', NULL),
(3, 1, 3, '2026-02-14 15:50:00', '2026-02-14 15:50:00');

SET FOREIGN_KEY_CHECKS = 1;
