"""
analytics.py – EduPulse AI
Aggregated analytics endpoints that power the dashboard charts.

Endpoints
---------
GET /api/analytics/overview          – High-level KPI counters
GET /api/analytics/risk-distribution – Risk-tier breakdown
GET /api/analytics/attendance        – Monthly attendance trends + dept averages
GET /api/analytics/engagement        – Engagement scores, weekly activity, dept comparison
"""

from typing import List, Optional
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.db import get_db
from database.models import StudentDB, InterventionDB, NotificationDB
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Curated demo data used to supplement real DB aggregations for monthly
# trend charts where the synthetic dataset lacks time-series granularity.
_MONTHLY_ATTENDANCE = [
    {"month": "Jun", "avg_attendance": 78.5, "below_75_pct": 22},
    {"month": "Jul", "avg_attendance": 80.2, "below_75_pct": 19},
    {"month": "Aug", "avg_attendance": 82.1, "below_75_pct": 16},
    {"month": "Sep", "avg_attendance": 79.4, "below_75_pct": 21},
    {"month": "Oct", "avg_attendance": 83.6, "below_75_pct": 14},
    {"month": "Nov", "avg_attendance": 85.0, "below_75_pct": 12},
]

_ATTENDANCE_TREND_ENGAGEMENT = [
    {"month": "Jun", "attendance": 78},
    {"month": "Jul", "attendance": 80},
    {"month": "Aug", "attendance": 82},
    {"month": "Sep", "attendance": 79},
    {"month": "Oct", "attendance": 84},
    {"month": "Nov", "attendance": 85},
]

_WEEKLY_ACTIVITY = [
    {"week": "Week 1", "logins": 450, "submissions": 320},
    {"week": "Week 2", "logins": 510, "submissions": 390},
    {"week": "Week 3", "logins": 480, "submissions": 350},
    {"week": "Week 4", "logins": 530, "submissions": 410},
]


def _dept_stats(db: Session):
    """
    Returns per-department aggregates computed from real StudentDB rows.
    Returns a dict keyed by department name.
    """
    rows = db.query(
        StudentDB.department,
        func.count(StudentDB.student_id).label("count"),
        func.avg(StudentDB.attendance_percentage).label("avg_attendance"),
        func.avg(StudentDB.assignment_completion_rate).label("avg_assignment"),
        func.avg(StudentDB.lms_logins_per_week).label("avg_logins"),
        func.avg(StudentDB.current_gpa).label("avg_gpa"),
        func.avg(
            # Composite engagement proxy: (attendance*0.4 + assignment*0.4 + clamp(logins,0,20)/20*100*0.2)
            StudentDB.attendance_percentage * 0.4
            + StudentDB.assignment_completion_rate * 0.4
            + func.min(StudentDB.lms_logins_per_week, 20) / 20.0 * 100.0 * 0.2
        ).label("avg_engagement"),
    ).group_by(StudentDB.department).all()

    result = {}
    for row in rows:
        result[row.department] = {
            "count": row.count,
            "avg_attendance": round(row.avg_attendance or 0, 1),
            "avg_assignment": round(row.avg_assignment or 0, 1),
            "avg_logins": round(row.avg_logins or 0, 1),
            "avg_gpa": round(row.avg_gpa or 0, 2),
            "avg_engagement": round(row.avg_engagement or 0, 1),
        }
    return result


# ---------------------------------------------------------------------------
# GET /api/analytics/overview
# ---------------------------------------------------------------------------

@router.get("/overview")
def analytics_overview(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns top-level KPI counters: total students, risk distribution counts,
    average GPA/attendance, and pending intervention count.
    """
    total_students = db.query(func.count(StudentDB.student_id)).scalar() or 0
    high_risk = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "High").scalar() or 0
    medium_risk = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "Medium").scalar() or 0
    low_risk = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "Low").scalar() or 0

    avg_gpa = db.query(func.avg(StudentDB.current_gpa)).scalar() or 0.0
    avg_attendance = db.query(func.avg(StudentDB.attendance_percentage)).scalar() or 0.0
    avg_probability = db.query(func.avg(StudentDB.probability)).scalar() or 0.0

    pending_interventions = (
        db.query(func.count(InterventionDB.id))
        .filter(InterventionDB.status == "Pending")
        .scalar() or 0
    )

    unread_notifications = (
        db.query(func.count(NotificationDB.id))
        .filter(NotificationDB.is_read == 0)
        .scalar() or 0
    )

    return {
        "total_students": total_students,
        "risk_summary": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
        },
        "averages": {
            "gpa": round(float(avg_gpa), 2),
            "attendance_pct": round(float(avg_attendance), 1),
            "dropout_probability_pct": round(float(avg_probability) * 100, 1),
        },
        "pending_interventions": pending_interventions,
        "unread_notifications": unread_notifications,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/risk-distribution
# ---------------------------------------------------------------------------

@router.get("/risk-distribution")
def risk_distribution(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns risk tier counts and per-department breakdown suitable for
    pie/bar chart rendering.
    """
    total = db.query(func.count(StudentDB.student_id)).scalar() or 1  # avoid div-by-zero

    high = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "High").scalar() or 0
    medium = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "Medium").scalar() or 0
    low = db.query(func.count(StudentDB.student_id)).filter(StudentDB.risk_level == "Low").scalar() or 0

    # Per-department breakdown
    dept_rows = (
        db.query(StudentDB.department, StudentDB.risk_level, func.count(StudentDB.student_id).label("cnt"))
        .group_by(StudentDB.department, StudentDB.risk_level)
        .all()
    )
    dept_map: dict = defaultdict(lambda: {"High": 0, "Medium": 0, "Low": 0, "total": 0})
    for row in dept_rows:
        dept_map[row.department][row.risk_level] = row.cnt
        dept_map[row.department]["total"] += row.cnt

    dept_breakdown = [
        {
            "department": dept,
            "high": vals["High"],
            "medium": vals["Medium"],
            "low": vals["Low"],
            "total": vals["total"],
        }
        for dept, vals in dept_map.items()
    ]

    return {
        "overall": [
            {"name": "High Risk",   "value": high,   "color": "#ef4444"},
            {"name": "Medium Risk", "value": medium, "color": "#f59e0b"},
            {"name": "Low Risk",    "value": low,    "color": "#10b981"},
        ],
        "percentages": {
            "high_pct":   round(high   / total * 100, 1),
            "medium_pct": round(medium / total * 100, 1),
            "low_pct":    round(low    / total * 100, 1),
        },
        "dept_breakdown": dept_breakdown,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/attendance
# ---------------------------------------------------------------------------

@router.get("/attendance")
def attendance_analytics(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns monthly attendance trends (demo-supplemented) and real per-department
    averages derived from StudentDB.

    Response
    --------
    ```json
    {
      "monthly_trend": [{"month": "Jun", "avg_attendance": 78.5, "below_75_pct": 22}, ...],
      "department_attendance": [{"department": "CSE", "avg": 83.2}, ...]
    }
    ```
    """
    dept_stats = _dept_stats(db)

    department_attendance = [
        {"department": dept, "avg": stats["avg_attendance"]}
        for dept, stats in sorted(dept_stats.items())
    ]

    # Real overall stats for the summary card
    avg_attendance = db.query(func.avg(StudentDB.attendance_percentage)).scalar() or 0.0
    below_75_count = (
        db.query(func.count(StudentDB.student_id))
        .filter(StudentDB.attendance_percentage < 75)
        .scalar() or 0
    )
    total_students = db.query(func.count(StudentDB.student_id)).scalar() or 1

    return {
        "summary": {
            "overall_avg_attendance": round(float(avg_attendance), 1),
            "below_75_pct": round(below_75_count / total_students * 100, 1),
            "students_below_75": below_75_count,
        },
        "monthly_trend": _MONTHLY_ATTENDANCE,
        "department_attendance": department_attendance,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/engagement
# ---------------------------------------------------------------------------

@router.get("/engagement")
def engagement_analytics(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns engagement analytics blending real DB aggregates with curated
    demo time-series data.

    Response fields
    ---------------
    - summary              – aggregate engagement KPIs
    - attendance_trend     – monthly attendance list
    - assignment_by_dept   – per-department assignment completion
    - engagement_distribution – pie slice data for High/Medium/Low engagement
    - weekly_activity      – login + submission counts per week
    - dept_comparison      – per-department engagement/attendance/assignment matrix
    """
    dept_stats = _dept_stats(db)
    total_students = db.query(func.count(StudentDB.student_id)).scalar() or 1

    # --- Compute real engagement distribution buckets ---
    # Engagement proxy = 0.4*attendance + 0.4*assignment_completion + 0.2*(min(logins,20)/20*100)
    # We approximate by counting students where the proxy falls into tiers.
    high_engagement_count = (
        db.query(func.count(StudentDB.student_id))
        .filter(
            StudentDB.attendance_percentage >= 85,
            StudentDB.assignment_completion_rate >= 85,
        )
        .scalar() or 0
    )
    low_engagement_count = (
        db.query(func.count(StudentDB.student_id))
        .filter(
            StudentDB.attendance_percentage < 70,
            StudentDB.assignment_completion_rate < 65,
        )
        .scalar() or 0
    )
    medium_engagement_count = total_students - high_engagement_count - low_engagement_count

    high_pct  = round(high_engagement_count   / total_students * 100, 1)
    low_pct   = round(low_engagement_count    / total_students * 100, 1)
    medium_pct = round(medium_engagement_count / total_students * 100, 1)

    # --- Overall engagement score (weighted avg across dept stats) ---
    all_engagement_scores = [s["avg_engagement"] for s in dept_stats.values() if s["avg_engagement"]]
    avg_engagement_score = round(sum(all_engagement_scores) / len(all_engagement_scores), 1) if all_engagement_scores else 72.5

    # Active students = those with ≥1 LMS login per week
    active_students = (
        db.query(func.count(StudentDB.student_id))
        .filter(StudentDB.lms_logins_per_week >= 1)
        .scalar() or 0
    )

    # --- Per-department assignment completion (real data) ---
    assignment_by_dept = [
        {"department": dept, "completion": stats["avg_assignment"]}
        for dept, stats in sorted(dept_stats.items())
    ]

    # --- Per-department comparison matrix (real data) ---
    dept_comparison = [
        {
            "department": dept,
            "engagement": stats["avg_engagement"],
            "attendance": stats["avg_attendance"],
            "assignments": stats["avg_assignment"],
        }
        for dept, stats in sorted(dept_stats.items())
    ]

    return {
        "summary": {
            "avg_engagement_score": avg_engagement_score,
            "high_engagement_pct": high_pct,
            "low_engagement_pct": low_pct,
            "active_students": active_students,
        },
        "attendance_trend": _ATTENDANCE_TREND_ENGAGEMENT,
        "assignment_by_dept": assignment_by_dept,
        "engagement_distribution": [
            {"name": "High",   "value": int(high_pct),   "color": "#10b981"},
            {"name": "Medium", "value": int(medium_pct), "color": "#f59e0b"},
            {"name": "Low",    "value": int(low_pct),    "color": "#ef4444"},
        ],
        "weekly_activity": _WEEKLY_ACTIVITY,
        "dept_comparison": dept_comparison,
    }
