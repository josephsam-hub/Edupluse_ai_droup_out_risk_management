# EduPulse AI 🎓

> **AI-powered student performance prediction and dropout-risk management platform for educational institutions.**

EduPulse AI combines machine learning with an intuitive dashboard to help educators identify at-risk students early, track engagement trends, and coordinate targeted interventions — before it's too late.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Database Setup](#database-setup)
7. [Training the ML Model](#training-the-ml-model)
8. [Running the Backend](#running-the-backend)
9. [Running the Frontend](#running-the-frontend)
10. [Demo Credentials](#demo-credentials)
11. [API Documentation](#api-documentation)
12. [ML Model Information](#ml-model-information)
13. [Troubleshooting](#troubleshooting)
14. [Screenshots](#screenshots)
15. [License & Credits](#license--credits)

---

## Project Overview

EduPulse AI is a full-stack web application that enables academic institutions to:

- **Predict** student dropout risk using a trained ML model (Random Forest / Gradient Boosting)
- **Monitor** academic performance, attendance, and engagement in real time
- **Coordinate** faculty and counselor interventions for at-risk students
- **Visualise** trends through interactive dashboards and charts
- **Alert** staff with automated notifications when risk levels change

The system supports four user roles — **Admin**, **Faculty**, **Counselor**, and **Student** — each with a tailored dashboard and permissions model.

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Web framework | **FastAPI** (Python 3.11+) |
| ORM | **SQLAlchemy** 2.x |
| Authentication | **JWT** (python-jose) + bcrypt |
| Validation | **Pydantic** v2 |
| Database | **PostgreSQL 13+** (default) / SQLite |
| ML runtime | **scikit-learn**, joblib |
| Server | **Uvicorn** (ASGI) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | **React 18** + **TypeScript** |
| Build tool | **Vite** |
| UI library | **shadcn/ui** + **Tailwind CSS** |
| Charts | **Recharts** |
| State / data | **TanStack Query** |
| Routing | **React Router v6** |
| HTTP client | **Axios** |

### ML Pipeline
| Component | Technology |
|-----------|-----------|
| Algorithm | Random Forest / Gradient Boosting |
| Preprocessing | scikit-learn Pipelines |
| Serialisation | joblib |
| Metrics | accuracy, F1, ROC-AUC, confusion matrix |

---

## Features

### 🔐 Authentication & Authorisation
- JWT-based login with role-based access control (RBAC)
- Password hashing with bcrypt (cost factor 12)
- Token refresh and secure logout
- Per-role route guards on both frontend and backend

### 📊 Dashboard
- Summary cards: total students, high/medium/low risk counts
- Trend charts: risk distribution over time, attendance heatmaps
- Recent alerts and notifications panel
- Quick-action buttons for interventions

### 🤖 ML Risk Prediction
- Automated risk scoring (Low / Medium / High) per student
- Feature importance visualisation
- Prediction confidence display
- Manual re-prediction trigger for individual students
- Full prediction audit log

### 👨‍🎓 Student Management
- Full CRUD for student profiles
- Academic record upload and display
- Engagement signal tracking (attendance, assignments, LMS hours)
- Per-student risk history timeline

### 🚨 Interventions
- Create, assign, and track interventions
- Status workflow: Planned → In Progress → Completed / Cancelled
- Priority levels (Low / Medium / High)
- Outcome logging and follow-up reminders

### 🔔 Notifications
- In-app alerts when risk level changes
- Unread badge count
- Mark-as-read and bulk-clear
- Notification history

### 📈 Analytics
- Department-wise risk breakdown
- Year-of-study cohort analysis
- Intervention effectiveness reports
- Model performance metrics dashboard

### ⚙️ Admin Panel
- User management (create / deactivate staff accounts)
- Model training trigger
- Seed data import
- System health monitoring

---

## Project Structure

```
edupulse-ai/
├── backend/                    # FastAPI application
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── config.py               # Settings (loaded from .env)
│   ├── database.py             # SQLAlchemy engine & session factory
│   ├── dependencies.py         # Shared FastAPI dependencies (get_db, get_current_user)
│   ├── init_db.py              # DB initialisation + seed script
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── academic_record.py
│   │   ├── engagement_record.py
│   │   ├── prediction.py
│   │   ├── intervention.py
│   │   ├── notification.py
│   │   └── model_metric.py
│   ├── schemas/                # Pydantic request / response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── prediction.py
│   │   ├── intervention.py
│   │   └── notification.py
│   ├── routers/                # API route handlers
│   │   ├── auth.py             # POST /auth/login, /auth/refresh
│   │   ├── users.py            # CRUD /users
│   │   ├── students.py         # CRUD /students
│   │   ├── academic.py         # /academic-records
│   │   ├── predictions.py      # /predictions, /predict/{id}
│   │   ├── interventions.py    # CRUD /interventions
│   │   ├── notifications.py    # /notifications
│   │   └── analytics.py        # /analytics/*
│   ├── services/
│   │   ├── auth_service.py     # JWT creation / validation
│   │   ├── prediction_service.py # Model loading, feature engineering, scoring
│   │   └── notification_service.py
│   └── ml/
│       ├── train.py            # Model training script
│       ├── predict.py          # Inference helpers
│       ├── feature_engineering.py
│       └── models/             # Serialised model artefacts (git-ignored)
│           ├── risk_model.joblib
│           └── scaler.joblib
│
├── frontend/                   # React + Vite SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                # Axios API client modules
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── StudentDetail.tsx
│   │   │   ├── Interventions.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # State management
│   │   └── types/              # TypeScript interfaces
│   └── public/
│
├── database/
│   ├── schema.sql              # MySQL schema (all tables)
│   └── seed.sql                # Demo data
│
├── .env.example                # Environment variable template
├── .gitignore
├── requirements.txt            # Python dependencies
├── package.json                # (root-level, if using monorepo)
└── README.md
```

---

## Installation

### Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18 LTS+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |
| Git | any | [git-scm.com](https://git-scm.com) |
| PostgreSQL | 13+ | [postgresql.org](https://www.postgresql.org/download/) |

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/edupulse-ai.git
cd edupulse-ai
```

---

### Step 2 — Backend setup

#### Windows (PowerShell)
```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt
```

#### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Step 3 — Configure environment variables

```bash
# Copy the template
cp .env.example .env

# Open .env and update at minimum:
#   SECRET_KEY  — generate with: python -c "import secrets; print(secrets.token_hex(32))"
#   DB_TYPE     — "postgresql" (default) or "sqlite"
```

> **Windows users:** Use `copy .env.example .env` or duplicate via File Explorer.

---

### Step 4 — Frontend setup

```bash
cd frontend
npm install
```

---

## Database Setup

### PostgreSQL (default)

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE edupulse_ai;"
```

Set `DB_TYPE=postgresql` and your `PG_HOST`, `PG_PORT`, `PG_USER`,
`PG_PASSWORD`, and `PG_DATABASE` values in `.env` (copied from `.env.example`).
The API creates its tables and demo data when it starts.

To transfer existing records from `backend/edupulse.db`, run this before
starting the API:

```bash
cd backend
python -m database.migrate_sqlite_to_postgres
```

The migration requires empty PostgreSQL tables and stops rather than
overwriting existing data. To use SQLite instead, set `DB_TYPE=sqlite`.

---

## Training the ML Model

The ML model must be trained before predictions can be made. Training uses the data already in your database.

```bash
# From the project root (venv activated)
cd backend
python ml/train.py
```

**Training options:**

```bash
# Use a specific algorithm
python ml/train.py --algorithm gradient_boosting

# Tune hyperparameters (slower, recommended for production)
python ml/train.py --tune --cv 5

# Save model to a custom path
python ml/train.py --output ./ml/models/risk_model_v2.joblib
```

**Expected output:**
```
📊 Training data: 800 samples | Test data: 200 samples
🌲 Algorithm: RandomForest
⏳ Training model...
✅ Training complete!

Metrics:
  Accuracy  : 87.42%
  Precision : 88.01%
  Recall    : 87.42%
  F1-Score  : 86.12%
  ROC-AUC   : 92.03%

Feature Importance:
  attendance_pct       0.312
  avg_marks            0.287
  assignments_ratio    0.198
  online_hours         0.089
  ...

💾 Model saved to: ml/models/risk_model.joblib
📝 Metrics logged to database (model_version=1.0)
```

---

## Running the Backend

```bash
# From the project root (venv activated)
cd backend

# Development (auto-reload on file changes)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **REST API:** `http://localhost:8000`
- **Interactive docs (Swagger UI):** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health check:** `http://localhost:8000/health`

---

## Running the Frontend

```bash
cd frontend

# Development server (hot-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will be available at: **`http://localhost:5173`**

> **Tip:** Make sure the backend is running before opening the frontend, or you'll see API connection errors.

---

## Demo Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | `admin` | `admin123` | Full access — user management, model training, all data |
| **Faculty** | `faculty1` | `faculty123` | View & manage own students, create interventions |
| **Faculty** | `faculty2` | `faculty123` | View & manage own students, create interventions |
| **Counselor** | `counselor1` | `counselor123` | View all at-risk students, manage counseling interventions |

> ⚠️ **Change all passwords before deploying to any shared or production environment.**

---

## API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

**Login:**
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": { "id": 1, "username": "admin", "role": "Admin" }
}
```

---

### Key Endpoints

#### Users
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/users/me` | Current user profile | All |
| `GET` | `/users` | List all users | Admin |
| `POST` | `/users` | Create user | Admin |
| `PUT` | `/users/{id}` | Update user | Admin |
| `DELETE` | `/users/{id}` | Deactivate user | Admin |

#### Students
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/students` | List students (filtered by role) | All |
| `GET` | `/students/{id}` | Student details | All |
| `POST` | `/students` | Create student | Admin, Faculty |
| `PUT` | `/students/{id}` | Update student | Admin, Faculty |
| `DELETE` | `/students/{id}` | Delete student | Admin |

#### Predictions
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/predictions` | All latest predictions | Admin, Faculty, Counselor |
| `GET` | `/predictions/{student_id}` | Prediction for a student | All |
| `POST` | `/predictions/run/{student_id}` | Re-run prediction | Admin, Faculty |
| `POST` | `/predictions/run-all` | Re-run for all students | Admin |
| `GET` | `/predictions/logs/{student_id}` | Prediction history | Admin, Faculty |

#### Interventions
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/interventions` | List interventions | All |
| `POST` | `/interventions` | Create intervention | Faculty, Counselor |
| `PUT` | `/interventions/{id}` | Update status/outcome | Faculty, Counselor |
| `DELETE` | `/interventions/{id}` | Delete | Admin |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/overview` | Summary counts and risk distribution |
| `GET` | `/analytics/department` | Per-department breakdown |
| `GET` | `/analytics/trends` | Risk trend over time |
| `GET` | `/analytics/model-metrics` | ML model performance history |

---

### Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with id 999 does not exist.",
    "details": null
  }
}
```

---

## ML Model Information

### Algorithm
The default model is a **Random Forest Classifier** with the following feature set:

| Feature | Description | Type |
|---------|-------------|------|
| `attendance_pct` | Overall attendance percentage | Float |
| `avg_internal_marks` | Average internal assessment marks | Float |
| `avg_external_marks` | Average end-semester marks | Float |
| `assignments_ratio` | Submitted / total assignments | Float |
| `failed_subjects_count` | Number of failed subjects | Int |
| `online_hours` | LMS platform usage hours / month | Float |
| `participation_score` | Class participation score (0-10) | Float |
| `library_visits` | Library visits / month | Int |
| `counseling_sessions` | Counseling sessions attended | Int |
| `extracurricular_score` | Extra-curricular activity score | Int |
| `mental_health_score` | Self-reported well-being (1-5) | Int |
| `year_of_study` | Current year (1-4) | Int |

### Risk Classes
| Class | Probability Range | Action |
|-------|------------------|--------|
| **Low** | 0.00 – 0.40 | Routine monitoring |
| **Medium** | 0.40 – 0.70 | Proactive support |
| **High** | 0.70 – 1.00 | Immediate intervention |

### Baseline Performance (v1.0, synthetic data)

| Metric | Score |
|--------|-------|
| Accuracy | 87.42% |
| Precision (weighted) | 88.01% |
| Recall (weighted) | 87.42% |
| F1-Score (weighted) | 86.12% |
| ROC-AUC | 92.03% |

> **Note:** Performance on real institutional data will vary. It is strongly recommended to retrain the model with your own historical data using `python ml/train.py`.

### Model Versioning
Every training run is recorded in the `model_metrics` table with its hyperparameters, metrics, and feature importances. The active model version is set via `MODEL_VERSION` in `.env`.

---

## Troubleshooting

### Backend won't start

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`

**Fix:** Ensure the virtual environment is activated:
```bash
# Windows
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

**Problem:** `[Errno 10048] Only one usage of each socket address` (Windows)

**Fix:** Port 8000 is already in use. Either kill the existing process or use a different port:
```powershell
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use a different port
uvicorn main:app --reload --port 8001
```

---

**Problem:** `sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such table`

**Fix:** The database hasn't been initialised. Run:
```bash
cd backend && python init_db.py
```

---

### MySQL connection errors

**Problem:** `pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")`

**Checklist:**
1. Ensure MySQL service is running: `net start MySQL80` (Windows) / `sudo systemctl start mysql` (Linux)
2. Verify credentials in `.env`
3. Check `MYSQL_HOST` — use `127.0.0.1` instead of `localhost` on Windows if needed
4. Ensure `pymysql` is installed: `pip install pymysql`

---

### Frontend issues

**Problem:** `Error: Failed to fetch` / CORS errors in browser console

**Fix:** Ensure the backend is running and `VITE_API_URL` in `.env` matches the backend URL (including port). Also verify `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:5173`.

---

**Problem:** `npm install` fails on Windows with EACCES

**Fix:** Run PowerShell as Administrator, or use:
```powershell
npm install --legacy-peer-deps
```

---

### ML model errors

**Problem:** `FileNotFoundError: ml/models/risk_model.joblib not found`

**Fix:** Train the model first:
```bash
cd backend && python ml/train.py
```

---

**Problem:** Predictions all return the same risk level

**Fix:** Check that the database has sufficient and varied engagement/academic data. Run `python ml/train.py --verbose` to inspect the class distribution during training.

---

## Screenshots

> 📸 Screenshots will be added after the UI is finalised. Below are placeholder descriptions.

| Screen | Description |
|--------|-------------|
| **Login** | Clean login form with EduPulse branding |
| **Admin Dashboard** | Summary cards, risk donut chart, notifications panel |
| **Faculty Dashboard** | My students table with risk badges, quick-action buttons |
| **Student Detail** | Academic timeline, engagement metrics, prediction history |
| **Interventions** | Kanban-style board (Planned / In Progress / Completed) |
| **Analytics** | Department breakdown bar chart, attendance heatmap, trend line |
| **Model Metrics** | Training history table, feature importance horizontal bar chart |

---

## License & Credits

### License

This project is licensed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

### Built With

- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python web framework
- [SQLAlchemy](https://sqlalchemy.org/) — Python SQL toolkit and ORM
- [scikit-learn](https://scikit-learn.org/) — Machine learning in Python
- [React](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Next-generation frontend tooling
- [shadcn/ui](https://ui.shadcn.com/) — Accessible React component library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Recharts](https://recharts.org/) — Composable chart library for React

### Acknowledgements

- EduPulse AI was developed as an academic capstone project.
- Inspired by real-world student success platforms and early-warning systems used at universities worldwide.

---

*Made with ❤️ for educators and students alike.*
