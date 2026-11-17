-- ============================================================
--  EduPulse AI – Demo Seed Data
--  Run AFTER schema.sql
--  NOTE: Passwords below are SHA-256 hashes (salt: "edupulse_salt_998877")
--    admin123     → hash of admin123
--    faculty123   → hash of faculty123
--    counselor123 → hash of counselor123
--  The backend's init_db.py generates these automatically.
--  This seed file is for MySQL deployments only.
-- ============================================================

USE edupulse_ai;

-- ── Demo Users ────────────────────────────────────────────────
-- Password hashes (SHA-256 with salt "edupulse_salt_998877"):
--   admin123     = a3c90b86e0e9d5e6315c6d65f8b1e3e9...
--   faculty123   = ...
--   counselor123 = ...
-- For the actual hash, run Python:
--   import hashlib; hashlib.sha256(('admin123'+'edupulse_salt_998877').encode()).hexdigest()

INSERT IGNORE INTO users (username, full_name, email, hashed_password, role) VALUES
  ('admin',     'System Administrator',    'admin@edupulse.ai',          'PLACEHOLDER_HASH_admin123',     'Admin'),
  ('faculty1',  'Dr. Sarah Johnson',       'sarah.johnson@edupulse.ai',  'PLACEHOLDER_HASH_faculty123',   'Faculty'),
  ('faculty2',  'Prof. Arjun Menon',       'arjun.menon@edupulse.ai',    'PLACEHOLDER_HASH_faculty123',   'Faculty'),
  ('counselor', 'Mr. David Kumar',         'david.kumar@edupulse.ai',    'PLACEHOLDER_HASH_counselor123', 'Counselor');

-- ── Demo Students ─────────────────────────────────────────────
INSERT IGNORE INTO students (
  student_id, name, department, semester, age,
  previous_gpa, current_gpa, marks_percentage, failed_subjects,
  assignment_completion_rate, internal_assessment_score, exam_performance_score,
  attendance_percentage, absent_days, late_arrivals,
  lms_logins_per_week, study_hours_per_week, assignment_consistency,
  classroom_participation, online_activity_hours,
  scholarship, financial_difficulty, mentoring_available, parent_support_level,
  distance_from_institute, probability, risk_level
) VALUES
  -- HIGH RISK students
  ('STU001','Aarav Sharma',        'CSE',        4, 21, 5.5, 5.8,  52.0, 3, 45.0, 48.0, 50.0, 62.5, 18, 8, 3,  8, 40.0, 3, 5.0, 0,1,0,2,25.0, 0.82,'High'),
  ('STU002','Sneha Reddy',         'Mechanical', 2, 20, 4.8, 5.1,  48.0, 4, 38.0, 42.0, 45.0, 55.0, 22, 10,2,  6, 35.0, 2, 4.0, 0,1,0,1,30.0, 0.88,'High'),
  ('STU003','Mohammed Al-Rashid',  'Civil',      3, 22, 5.2, 5.5,  51.0, 2, 50.0, 46.0, 48.0, 60.0, 20, 7, 4,  7, 42.0, 3, 6.0, 0,1,0,2,22.0, 0.75,'High'),

  -- MEDIUM RISK students
  ('STU004','Priya Nair',          'ECE',        3, 20, 6.5, 6.4,  63.0, 1, 68.0, 60.0, 62.0, 71.0, 12, 4, 7, 12, 65.0, 5, 7.0, 0,0,1,3,15.0, 0.56,'Medium'),
  ('STU005','Kiran Patel',         'Civil',      6, 23, 6.8, 7.0,  67.0, 1, 72.0, 65.0, 68.0, 79.0,  8, 3, 8, 14, 70.0, 6, 8.0, 0,0,1,3,12.0, 0.47,'Medium'),
  ('STU006','Riya Desai',          'CSE',        5, 21, 6.2, 6.5,  61.0, 1, 65.0, 58.0, 60.0, 73.0, 10, 5, 7, 11, 63.0, 4, 7.5, 0,1,1,3,18.0, 0.52,'Medium'),

  -- LOW RISK students
  ('STU007','Rohan Mehta',         'CSE',        5, 22, 8.5, 8.2,  83.0, 0, 92.0, 85.0, 88.0, 88.0,  5, 1,14, 20, 90.0, 9, 10.0,1,0,1,5, 8.0, 0.18,'Low'),
  ('STU008','Ananya Krishnan',     'ECE',        4, 21, 8.8, 8.5,  86.0, 0, 95.0, 88.0, 90.0, 92.0,  3, 0,15, 22, 92.0,10, 11.0,1,0,1,5, 6.0, 0.12,'Low'),
  ('STU009','Vishal Nambiar',      'Mechanical', 6, 23, 7.8, 8.0,  79.0, 0, 88.0, 80.0, 82.0, 85.0,  7, 2,12, 18, 85.0, 8, 9.0, 1,0,1,5,10.0, 0.21,'Low'),
  ('STU010','Divya Subramaniam',   'Civil',      3, 20, 7.5, 7.8,  76.0, 0, 85.0, 78.0, 80.0, 82.0,  7, 2,11, 17, 82.0, 7, 8.5, 0,0,1,4,14.0, 0.28,'Low');

-- ── Teacher–Student Mapping ───────────────────────────────────
-- faculty1 (id=2) → CSE & ECE students
-- faculty2 (id=3) → Mechanical & Civil students
INSERT IGNORE INTO teacher_student_mapping (teacher_id, student_id) VALUES
  (2, 'STU001'), (2, 'STU004'), (2, 'STU006'), (2, 'STU007'), (2, 'STU008'),
  (3, 'STU002'), (3, 'STU003'), (3, 'STU005'), (3, 'STU009'), (3, 'STU010');

-- ── Sample Interventions ──────────────────────────────────────
INSERT IGNORE INTO interventions (student_id, title, description, assigned_to, status, priority) VALUES
  ('STU001','Attendance Counselling Session',
   'Student attendance has dropped to 62.5%. Schedule a one-to-one counselling session to understand barriers and create an attendance improvement plan.',
   'Dr. Sarah Johnson','In Progress','High'),
  ('STU002','Academic Support Plan',
   'Student has 4 failed subjects. Enrol in peer-tutoring programme and assign additional practice materials for core modules.',
   'Academic Support Cell','Pending','High'),
  ('STU003','Financial Aid Review',
   'Student shows signs of financial difficulty. Review eligibility for institutional scholarship and waiver programmes.',
   'Mr. David Kumar','Pending','Medium'),
  ('STU004','Assignment Completion Follow-up',
   'Assignment completion rate is 68%. Remind student of submission deadlines and provide structured submission schedule.',
   'Prof. Arjun Menon','Pending','Medium'),
  ('STU006','LMS Engagement Improvement',
   'Student LMS login frequency is low. Encourage regular use of online resources and schedule weekly check-ins.',
   'Prof. Arjun Menon','Pending','Low');

-- ── Sample Notifications ─────────────────────────────────────
INSERT IGNORE INTO notifications (user_id, title, message, priority, notification_type, related_student_id) VALUES
  (NULL,'⚠ High Risk Alert: Aarav Sharma',
   'Student Aarav Sharma (STU001) has been classified as HIGH RISK with a predicted dropout probability of 82%. Immediate teacher review is recommended.',
   'High','alert','STU001'),
  (NULL,'⚠ High Risk Alert: Sneha Reddy',
   'Student Sneha Reddy (STU002) has been classified as HIGH RISK with a predicted dropout probability of 88%. Counselling session recommended.',
   'High','alert','STU002'),
  (NULL,'📊 ML Model Training Complete',
   'The EduPulse AI prediction model has been successfully trained. Random Forest (Tuned) achieved F1-Score: 91.2% on the test set.',
   'Medium','info',NULL),
  (NULL,'📋 Attendance Warning: Mohammed Al-Rashid',
   'Student Mohammed Al-Rashid (STU003) attendance has fallen below 60%. Please schedule a welfare check.',
   'Medium','warning','STU003'),
  (NULL,'✅ Intervention Resolved',
   'The intervention for Priya Nair (STU004) regarding assignment completion has been marked as resolved by the assigned faculty member.',
   'Low','info','STU004');

-- ── Sample Model Metrics ─────────────────────────────────────
INSERT IGNORE INTO model_metrics (model_name, accuracy, precision_val, recall_val, f1_score, roc_auc, model_version, is_best) VALUES
  ('Logistic Regression',       0.8102, 0.7854, 0.7612, 0.7731, 0.8923, '1.0', 0),
  ('Decision Tree',             0.8341, 0.8012, 0.8156, 0.8083, 0.9012, '1.0', 0),
  ('Random Forest',             0.8892, 0.8723, 0.8841, 0.8782, 0.9412, '1.0', 0),
  ('Gradient Boosting',         0.8754, 0.8612, 0.8723, 0.8667, 0.9298, '1.0', 0),
  ('Random Forest (Tuned)',     0.9023, 0.8891, 0.9012, 0.8951, 0.9521, '1.0', 1);
