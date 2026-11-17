"""
api/teacher.py
--------------
Teacher-facing endpoints for EduPulse AI.

All routes require a valid JWT bearer token. Faculty role gets
their assigned students; Admin can see all.

NOTE: Until teacher_student_mapping is implemented,
Faculty sees ALL students. Add filtered join to extend.
"""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import InterventionDB, PredictionLogDB, StudentDB
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

# ---------------------------------------------------------------------------
# Helper: serialize student to dict
# ---------------------------------------------------------------------------
def _student_dict(s: StudentDB, intervention_count: int = 0) -> dict:
    return {
        "student_id": s.student_id,
        "name": s.name,
        "department": s.department,
        "semester": s.semester,
        "age": s.age,
        "attendance_percentage": round(s.attendance_percentage or 0, 1),
        "current_gpa": round(s.current_gpa or 0, 2),
        "marks_percentage": round(s.marks_percentage or 0, 1),
        "assignment_completion_rate": round(s.assignment_completion_rate or 0, 1),
        "risk_level": s.risk_level,
        "probability": round(s.probability or 0, 4),
        "last_predicted_at": s.last_predicted_at.isoformat() if s.last_predicted_at else None,
        "intervention_count": intervention_count,
    }


# ---------------------------------------------------------------------------
# GET /api/teacher/dashboard
# ---------------------------------------------------------------------------
@router.get("/dashboard")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Summary cards for the teacher dashboard.
    Returns: assigned_students, high/medium risk counts, follow-up needed.
    """
    students = db.query(StudentDB).all()

    high_risk   = [s for s in students if s.risk_level == "High"]
    medium_risk = [s for s in students if s.risk_level == "Medium"]

    # Students with no prediction or last prediction > 7 days ago
    import datetime
    week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    followup = [
        s for s in students
        if not s.last_predicted_at or s.last_predicted_at < week_ago
    ]

    pending_interventions = (
        db.query(InterventionDB)
        .filter(InterventionDB.status == "Pending")
        .count()
    )

    avg_attendance = (
        sum(s.attendance_percentage or 0 for s in students) / len(students)
        if students else 0
    )
    avg_gpa = (
        sum(s.current_gpa or 0 for s in students) / len(students)
        if students else 0
    )

    # Recent predictions (last 5)
    recent_preds = (
        db.query(PredictionLogDB)
        .order_by(PredictionLogDB.timestamp.desc())
        .limit(5)
        .all()
    )

    return {
        "assigned_students": len(students),
        "high_risk_count": len(high_risk),
        "medium_risk_count": len(medium_risk),
        "followup_needed": len(followup),
        "pending_interventions": pending_interventions,
        "avg_attendance": round(avg_attendance, 1),
        "avg_gpa": round(avg_gpa, 2),
        "recent_predictions": [
            {
                "student_id": p.student_id,
                "risk_level": p.risk_level,
                "probability": round(p.probability, 4),
                "timestamp": p.timestamp.isoformat(),
            }
            for p in recent_preds
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/teacher/students
# ---------------------------------------------------------------------------
@router.get("/students")
def get_teacher_students(
    risk_level: Optional[str] = Query(None, description="Filter: High | Medium | Low"),
    search: Optional[str] = Query(None, description="Search by name or student_id"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return students assigned to this teacher with their latest risk data.
    """
    query = db.query(StudentDB)

    if risk_level and risk_level in ("High", "Medium", "Low"):
        query = query.filter(StudentDB.risk_level == risk_level)

    if search:
        query = query.filter(
            (StudentDB.name.ilike(f"%{search}%")) |
            (StudentDB.student_id.ilike(f"%{search}%"))
        )

    students = query.order_by(
        # Sort High risk first
        StudentDB.probability.desc()
    ).all()

    # Intervention counts per student
    intervention_counts: dict = {}
    for s in students:
        cnt = db.query(func.count(InterventionDB.id)).filter(
            InterventionDB.student_id == s.student_id
        ).scalar() or 0
        intervention_counts[s.student_id] = cnt

    return {
        "students": [_student_dict(s, intervention_counts.get(s.student_id, 0)) for s in students],
        "total": len(students),
    }


# ---------------------------------------------------------------------------
# GET /api/teacher/at-risk
# ---------------------------------------------------------------------------
@router.get("/at-risk")
def get_at_risk_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return only High and Medium risk students, sorted by probability.
    """
    students = (
        db.query(StudentDB)
        .filter(StudentDB.risk_level.in_(["High", "Medium"]))
        .order_by(StudentDB.probability.desc())
        .all()
    )

    return {
        "at_risk_students": [_student_dict(s) for s in students],
        "high_risk": sum(1 for s in students if s.risk_level == "High"),
        "medium_risk": sum(1 for s in students if s.risk_level == "Medium"),
    }
