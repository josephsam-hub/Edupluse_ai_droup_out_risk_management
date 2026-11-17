# EduPulse AI — System Architecture

## Overview

EduPulse AI is a three-tier web application that uses Machine Learning to predict student dropout risk. The system comprises a React frontend, FastAPI backend, and a Machine Learning pipeline trained on real academic data.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                            │
│  React + Vite + Tailwind CSS + Recharts                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Landing  │ │  Auth    │ │Dashboard │ │Prediction│              │
│  │  Page    │ │  Pages   │ │  Pages   │ │  Pages   │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ Axios (REST API + JWT)
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Auth API │ │Student   │ │Prediction│ │Analytics │              │
│  │ JWT/RBAC │ │  CRUD    │ │  Engine  │ │  Engine  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │Teacher   │ │Interven  │ │Notifica  │ │Reports   │              │
│  │Dashboard │ │  tions   │ │  tions   │ │& Export  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│  ┌──────────────────────────────────────┐                          │
│  │    SHAP Explainability Module        │                          │
│  └──────────────────────────────────────┘                          │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ SQLAlchemy ORM
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE (SQLite / MySQL)                       │
│  users, students, predictions, interventions, notifications,       │
│  model_metrics, teacher_student_mapping, engagement_records, etc.  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ML PIPELINE (Scikit-learn)                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Dataset   │  │Preprocessing │  │  Training &  │               │
│  │  Loading   │──│  & Feature   │──│  Evaluation  │               │
│  │  (CSV)     │  │  Engineering │  │  (4+ models) │               │
│  └────────────┘  └──────────────┘  └──────┬───────┘               │
│                                           │                        │
│                                    ┌──────▼───────┐               │
│                                    │  Model Save  │               │
│                                    │  (Joblib)    │               │
│                                    └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## ML Pipeline Flow

1. **Data Loading** — CSV dataset loaded (synthetic or UCI-based)
2. **Feature Engineering** — Derived features (GPA buckets, engagement composites)
3. **Preprocessing** — Scaling numerical + encoding categorical features
4. **Stratified Split** — 80/20 train-test with class balance maintained
5. **Model Training** — Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost
6. **Hyperparameter Tuning** — GridSearchCV on Random Forest
7. **Model Selection** — Best model chosen by F1-Score
8. **Model Serialization** — Pipeline saved as `.pkl` via Joblib
9. **Prediction** — New student data passed through same pipeline
10. **Explainability** — SHAP values computed for per-student explanations

## API Architecture

All API routes are protected by JWT authentication. Endpoints are organized by domain:

| Prefix | Module | Description |
|--------|--------|-------------|
| `/api/auth` | auth.py | Login, register, token refresh |
| `/api/students` | students.py | CRUD operations on student records |
| `/api/predict` | predict.py | Single student dropout prediction |
| `/api/batch-predict` | batch.py | CSV upload batch prediction |
| `/api/dashboard` | dashboard.py | Admin overview statistics |
| `/api/teacher` | teacher.py | Faculty-specific views |
| `/api/interventions` | interventions.py | Intervention management |
| `/api/notifications` | notifications.py | Alert system |
| `/api/analytics` | analytics.py | Engagement & attendance trends |
| `/api/ml` | explainability.py | SHAP & feature importance |
| `/api/model-performance` | model_info.py | Training metrics |
| `/api/report` | report.py | Student reports & exports |

## Role-Based Access

| Feature | Admin | Faculty | Counselor |
|---------|-------|---------|-----------|
| Dashboard | ✅ | ✅ (Teacher) | ✅ |
| Student Management | ✅ Full | ✅ View | ✅ View |
| Predict Risk | ✅ | ✅ | ❌ |
| Batch Predict | ✅ | ❌ | ❌ |
| Interventions | ✅ | ❌ | ✅ |
| Model Training | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Engagement | ✅ | ✅ | ✅ |
