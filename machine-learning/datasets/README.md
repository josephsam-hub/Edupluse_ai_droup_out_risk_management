# EduPulse AI — Dataset Documentation

## 📁 Dataset Files

| File | Rows | Purpose |
|------|------|---------|
| `student_dropout_dataset.csv` | 1,500 | **Main training dataset** — used to train all ML models |
| `student_engagement_dataset.csv` | 1,500 | **Engagement analysis** — LMS, attendance & participation data |
| `demo_test_dataset.csv` | 50 | **Quick testing** — small subset for demo predictions |

---

## 📊 Main Dataset: `student_dropout_dataset.csv`

### Overview
- **Total Records:** 1,500 students
- **Total Features:** 25 input features + 1 target variable
- **Target Variable:** `dropout_risk` (0 = Continuing, 1 = Dropout)
- **Class Distribution:** ~64% Continuing (0), ~36% Dropout (1)
- **Departments:** 6 (Computer Science, Electronics & Comm, Mechanical Eng, Civil Eng, Business Admin, Data Science)

### Column Descriptions

#### Identification (not used for training)
| Column | Type | Description |
|--------|------|-------------|
| `student_id` | String | Unique student identifier (STU0001–STU1500) |
| `name` | String | Student name (synthetic) |

#### Demographic Features
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `department` | Categorical | 6 values | Academic department |
| `semester` | Integer | 1–8 | Current semester |
| `age` | Integer | 18–24 | Student age |

#### Academic Performance Features
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `previous_gpa` | Float | 3.0–10.0 | GPA in previous semester |
| `current_gpa` | Float | 2.5–10.0 | GPA in current semester |
| `marks_percentage` | Float | 30–100 | Overall marks percentage |
| `failed_subjects` | Integer | 0–4 | Number of failed subjects |
| `internal_assessment_score` | Float | 20–100 | Internal exam marks |
| `exam_performance_score` | Float | 20–100 | Final exam performance |

#### Attendance Features
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `attendance_percentage` | Float | 35–100 | Class attendance % |
| `absent_days` | Integer | 0–35 | Total days absent |
| `late_arrivals` | Integer | 0–14 | Number of late arrivals |

#### Engagement & Learning Features
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `assignment_completion_rate` | Float | 20–100 | % of assignments submitted |
| `assignment_consistency` | Float | 15–100 | Regularity of submissions |
| `lms_logins_per_week` | Integer | 1–30 | LMS platform logins per week |
| `study_hours_per_week` | Integer | 2–40 | Self-reported study hours |
| `classroom_participation` | Integer | 1–10 | Active participation score |
| `online_activity_hours` | Float | 0.5–45 | Hours on online learning |

#### Support & Socioeconomic Features
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `scholarship` | Binary | 0 or 1 | Receiving scholarship (1=Yes) |
| `financial_difficulty` | Binary | 0 or 1 | Facing financial issues (1=Yes) |
| `mentoring_available` | Binary | 0 or 1 | Has access to mentor (1=Yes) |
| `parent_support_level` | Integer | 1–5 | Family support (1=Low, 5=High) |
| `distance_from_institute` | Float | 1–60 km | Distance to campus |

#### Target Variable
| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `dropout_risk` | Binary | 0 or 1 | **0** = Continuing student, **1** = At risk of dropout |

---

## 🔬 How the Target Variable Was Generated

The `dropout_risk` label is NOT random. It is computed from a **risk score formula** that models real educational research:

```
risk_score = 
    (75 - attendance%) × 0.08          ← Low attendance increases risk
  + (6.0 - current_gpa) × 0.65        ← Low GPA strongly increases risk
  + (previous_gpa - current_gpa) × 0.4 ← Declining grades increase risk
  + failed_subjects × 0.75             ← More failures = higher risk
  + (65 - assignment_completion) × 0.04 ← Low submissions increase risk
  + (5 - lms_logins) × 0.12           ← Low engagement increases risk
  + financial_difficulty × 0.5         ← Financial stress increases risk
  - scholarship × 0.4                 ← Scholarship reduces risk
  - mentoring × 0.3                   ← Mentoring reduces risk
  + (distance / 30) × 0.3             ← Far distance increases risk
  - (parent_support - 3) × 0.2        ← Family support reduces risk
  + noise                             ← Realistic random variation
```

Then: `dropout_risk = 1 if sigmoid(risk_score) > 0.52 else 0`

This ensures the ML model learns **meaningful, realistic patterns** — not random noise.

---

## 📈 Engagement Dataset: `student_engagement_dataset.csv`

Same 1,500 students but focused on engagement metrics only. Includes a computed **engagement_score** and **engagement_level** (High/Medium/Low).

### Additional Columns
| Column | Type | Description |
|--------|------|-------------|
| `engagement_score` | Float | Weighted composite: `(LMS×2 + Study×1.5 + Participation×3 + Online×0.5) / 4` |
| `engagement_level` | Categorical | High (score > 18), Medium (10–18), Low (< 10) |

---

## ⚠️ Important Notes for Viva

1. **This is a synthetic dataset** — generated using realistic statistical distributions, NOT real student data. Always be honest about this in your report.

2. **Why synthetic?** Real student data is protected by privacy laws (FERPA, GDPR). For a semester project, synthetic data that follows real educational patterns is the standard approach.

3. **The patterns are realistic** — the risk formula is based on educational research showing that attendance, GPA decline, failed subjects, and financial difficulty are the strongest dropout predictors.

4. **You can also reference the UCI dataset** — "Predict Students' Dropout and Academic Success" (https://archive.ics.uci.edu/dataset/697/) as a real-world comparable dataset in your report.

5. **The ML model trains on this data and produces real predictions** — the model genuinely learns patterns from the features, it does NOT use hardcoded rules.
