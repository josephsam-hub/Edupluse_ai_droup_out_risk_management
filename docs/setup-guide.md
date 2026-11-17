# EduPulse AI — Setup Guide

## Prerequisites

- **Python 3.10+** (tested with Python 3.14)
- **Node.js 18+** and npm
- **Git** (optional)
- **PostgreSQL** 13+

---

## Quick Start (5 minutes)

### Step 1: Clone / Download the Project

```bash
cd your-projects-folder
# If using git:
git clone <repo-url> edupulse-ai
cd edupulse-ai
```

### Step 2: Backend Setup

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Train the ML Model

```bash
# From the backend directory
python -c "from ml.train import train_and_evaluate_models; train_and_evaluate_models()"
```

This will:
- Generate/load the training dataset
- Train 5 ML algorithms (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost)
- Perform hyperparameter tuning on Random Forest
- Select the best model by F1-Score
- Save the model to `ml/model/edupulse_model.pkl`

### Step 4: Start the Backend Server

```bash
# From the backend directory
python main.py
```

The API server starts at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/api/docs**

### Step 5: Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The frontend starts at: **http://localhost:5173**

### Step 6: Open in Browser

1. Go to **http://localhost:5173**
2. You'll see the landing page
3. Click "Login" or "Get Started"
4. Use demo credentials:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Full admin access |
| `faculty` | `faculty123` | Teacher dashboard |
| `counselor` | `counselor123` | Interventions & support |

---

## PostgreSQL Setup

Create the PostgreSQL database (the app creates its tables on startup):

```bash
psql -U postgres -c "CREATE DATABASE edupulse_ai;"
```

Copy `.env.example` to `.env` in the project root and set your PostgreSQL
credentials:

```env
DB_TYPE=postgresql
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=edupulse_ai
```

To keep the existing SQLite records, run the migration from the `backend`
directory before starting the API:

```bash
python -m database.migrate_sqlite_to_postgres
```

The migration stops if PostgreSQL already contains rows in the destination
tables. If you are starting fresh, skip the migration; the API creates and
seeds its tables at startup. SQLite remains available by setting `DB_TYPE=sqlite`.

---

## Common Issues

### "Module not found" errors
Make sure you're running commands from the correct directory (`backend/` or `frontend/`) and that your virtual environment is activated.

### Backend won't start
- Check that port 8000 is not in use
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (needs 3.10+)

### Frontend build errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (needs 18+)

### Model not found
- Run the training command from Step 3 before starting the backend
- Check that `backend/ml/model/edupulse_model.pkl` exists

### CORS errors in browser
- Ensure both backend (port 8000) and frontend (port 5173) are running
- The backend is configured to allow all origins in development mode

---

## Production Build

```bash
# Build the frontend for production
cd frontend
npm run build

# The output is in frontend/dist/
# Serve with any static file server or configure FastAPI to serve it
```
