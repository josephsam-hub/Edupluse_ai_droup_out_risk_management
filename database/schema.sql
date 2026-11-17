-- ============================================================
--  EduPulse AI – MySQL Database Schema
--  Student Engagement & Dropout Risk Prediction System
-- ============================================================

CREATE DATABASE IF NOT EXISTS edupulse_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edupulse_ai;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)   NOT NULL UNIQUE,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL,
  hashed_password VARCHAR(200)  NOT NULL,
  role            ENUM('Admin','Faculty','Counselor','Student') NOT NULL DEFAULT 'Faculty',
  department      VARCHAR(100)  NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_users_role  (role),
  INDEX idx_users_email (email)
) COMMENT='System users – Admin, Faculty, Counselor, Student accounts';

-- ── students ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  student_id                VARCHAR(20)  PRIMARY KEY,
  name                      VARCHAR(100) NOT NULL,
  department                VARCHAR(50)  NOT NULL,
  semester                  TINYINT      NOT NULL DEFAULT 1,
  age                       TINYINT      NOT NULL DEFAULT 20,

  -- Academic
  previous_gpa              FLOAT        NOT NULL DEFAULT 7.0,
  current_gpa               FLOAT        NOT NULL DEFAULT 7.0,
  marks_percentage          FLOAT        NOT NULL DEFAULT 70.0,
  failed_subjects           TINYINT      NOT NULL DEFAULT 0,
  assignment_completion_rate FLOAT       NOT NULL DEFAULT 80.0,
  internal_assessment_score FLOAT        NOT NULL DEFAULT 75.0,
  exam_performance_score    FLOAT        NOT NULL DEFAULT 75.0,

  -- Attendance
  attendance_percentage     FLOAT        NOT NULL DEFAULT 80.0,
  absent_days               TINYINT      NOT NULL DEFAULT 5,
  late_arrivals             TINYINT      NOT NULL DEFAULT 2,

  -- Engagement
  lms_logins_per_week       TINYINT      NOT NULL DEFAULT 10,
  study_hours_per_week      TINYINT      NOT NULL DEFAULT 15,
  assignment_consistency    FLOAT        NOT NULL DEFAULT 80.0,
  classroom_participation   TINYINT      NOT NULL DEFAULT 6,
  online_activity_hours     FLOAT        NOT NULL DEFAULT 12.0,

  -- Support
  scholarship               TINYINT(1)   NOT NULL DEFAULT 0,
  financial_difficulty      TINYINT(1)   NOT NULL DEFAULT 0,
  mentoring_available       TINYINT(1)   NOT NULL DEFAULT 1,
  parent_support_level      TINYINT      NOT NULL DEFAULT 4,
  distance_from_institute   FLOAT        NOT NULL DEFAULT 10.0,

  -- ML output
  probability               FLOAT        NULL,
  risk_level                ENUM('Low','Medium','High') NULL,
  last_predicted_at         DATETIME     NULL,

  created_at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_students_dept      (department),
  INDEX idx_students_risk      (risk_level),
  INDEX idx_students_semester  (semester)
) COMMENT='Core student academic and engagement data';

-- ── teacher_student_mapping ───────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_student_mapping (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_teacher_student (teacher_id, student_id),
  FOREIGN KEY (teacher_id)  REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES students(student_id) ON DELETE CASCADE
) COMMENT='Maps which teacher is responsible for which student';

-- ── academic_records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_records (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  student_id         VARCHAR(20) NOT NULL,
  semester           TINYINT     NOT NULL,
  attendance         FLOAT       NOT NULL DEFAULT 0,
  internal_marks     FLOAT       NOT NULL DEFAULT 0,
  assignment_completion FLOAT    NOT NULL DEFAULT 0,
  semester_gpa       FLOAT       NOT NULL DEFAULT 0,
  failed_subjects    TINYINT     NOT NULL DEFAULT 0,
  recorded_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_ar_student   (student_id),
  INDEX idx_ar_semester  (semester)
) COMMENT='Semester-wise academic performance history';

-- ── engagement_records ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagement_records (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       VARCHAR(20) NOT NULL,
  lms_logins       INT         NOT NULL DEFAULT 0,
  participation    FLOAT       NOT NULL DEFAULT 0,
  quiz_activity    FLOAT       NOT NULL DEFAULT 0,
  engagement_score FLOAT       NOT NULL DEFAULT 0,
  recorded_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_er_student    (student_id),
  INDEX idx_er_recorded   (recorded_at)
) COMMENT='Weekly LMS and engagement tracking records';

-- ── prediction_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prediction_logs (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  student_id           VARCHAR(20)  NOT NULL,
  probability          FLOAT        NOT NULL,
  risk_level           ENUM('Low','Medium','High') NOT NULL,
  model_used           VARCHAR(80)  NOT NULL,
  confidence           FLOAT        NOT NULL DEFAULT 0,
  risk_factors_json    TEXT         NOT NULL DEFAULT '[]',
  recommendations_json TEXT         NOT NULL DEFAULT '[]',
  timestamp            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_pl_student   (student_id),
  INDEX idx_pl_timestamp (timestamp),
  INDEX idx_pl_risk      (risk_level)
) COMMENT='Full history of every ML prediction run';

-- ── interventions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interventions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(20)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT         NOT NULL,
  assigned_to VARCHAR(100) NOT NULL DEFAULT 'Academic Counselor',
  status      ENUM('Pending','In Progress','Resolved') NOT NULL DEFAULT 'Pending',
  priority    ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_int_student  (student_id),
  INDEX idx_int_status   (status),
  INDEX idx_int_priority (priority)
) COMMENT='Teacher and counselor intervention records per student';

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          NULL,     -- NULL = broadcast to all
  title              VARCHAR(200) NOT NULL,
  message            TEXT         NOT NULL,
  priority           ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  is_read            TINYINT(1)   NOT NULL DEFAULT 0,
  notification_type  VARCHAR(50)  NOT NULL DEFAULT 'info',
  related_student_id VARCHAR(20)  NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)            REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_student_id) REFERENCES students(student_id) ON DELETE SET NULL,
  INDEX idx_notif_user     (user_id),
  INDEX idx_notif_is_read  (is_read),
  INDEX idx_notif_priority (priority)
) COMMENT='In-app notification system for alerts and system messages';

-- ── model_metrics ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_metrics (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  model_name    VARCHAR(100) NOT NULL,
  accuracy      FLOAT        NOT NULL,
  precision_val FLOAT        NOT NULL,
  recall_val    FLOAT        NOT NULL,
  f1_score      FLOAT        NOT NULL,
  roc_auc       FLOAT        NOT NULL,
  model_version VARCHAR(20)  NOT NULL DEFAULT '1.0',
  is_best       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_mm_model_name (model_name),
  INDEX idx_mm_created    (created_at)
) COMMENT='Stores evaluation metrics for each trained model version';
