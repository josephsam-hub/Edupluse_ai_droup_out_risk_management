import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import engine, Base
from database.init_db import init_db
from api.auth import router as auth_router
from api.predict import router as predict_router
from api.batch import router as batch_router
from api.students import router as students_router
from api.model_info import router as model_info_router
from api.dashboard import router as dashboard_router
from api.interventions import router as interventions_router
from api.report import router as report_router
from api.notifications import router as notifications_router
from api.analytics import router as analytics_router
from api.teacher import router as teacher_router
from api.explainability import router as explainability_router

app = FastAPI(
    title="EduPulse AI – Student Engagement & Dropout Risk Prediction API",
    description="Machine Learning Powered Academic Analytics and Retention System",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(students_router)
app.include_router(model_info_router)
app.include_router(dashboard_router)
app.include_router(interventions_router)
app.include_router(report_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(teacher_router)
app.include_router(explainability_router)


@app.on_event("startup")
def on_startup():
    print("=" * 60)
    print("  EduPulse AI Backend - Startup")
    print("=" * 60)
    print("  Initializing database and seeding demo data...")
    init_db()
    print("  [OK] Database ready")
    print("  [OK] API running at http://localhost:8000")
    print("  [OK] Docs at http://localhost:8000/api/docs")
    print("=" * 60)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "EduPulse AI Machine Learning Backend",
        "api_version": "2.0.0",
        "docs": "/api/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
