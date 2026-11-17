from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db
from database.models import StudentDB, InterventionDB

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated KPI metrics and interactive chart distributions calculated from database student records.
    """
    students = db.query(StudentDB).all()
    total_students = len(students)
    
    if total_students == 0:
        return {
            "kpis": {
                "total_students": 0,
                "low_risk_count": 0,
                "medium_risk_count": 0,
                "high_risk_count": 0,
                "avg_attendance": 0,
                "avg_gpa": 0,
                "interventions_needed": 0
            },
            "charts": {
                "risk_distribution": [],
                "department_risk": [],
                "semester_risk": [],
                "gpa_vs_risk": [],
                "attendance_vs_risk": []
            }
        }
        
    low_count = sum(1 for s in students if s.risk_level == "Low")
    med_count = sum(1 for s in students if s.risk_level == "Medium")
    high_count = sum(1 for s in students if s.risk_level == "High")
    
    avg_attendance = round(sum(s.attendance_percentage for s in students) / total_students, 1)
    avg_gpa = round(sum(s.current_gpa for s in students) / total_students, 2)
    
    pending_interventions = db.query(InterventionDB).filter(InterventionDB.status.in_(["Pending", "In Progress"])).count()
    
    # Chart 1: Risk Distribution
    risk_distribution = [
        {"name": "Low Risk", "value": low_count, "color": "#10B981"},
        {"name": "Medium Risk", "value": med_count, "color": "#F59E0B"},
        {"name": "High Risk", "value": high_count, "color": "#EF4444"}
    ]
    
    # Chart 2: Department-wise Risk Breakdown
    depts = set(s.department for s in students)
    dept_risk = []
    for dept in sorted(depts):
        dept_students = [s for s in students if s.department == dept]
        dept_risk.append({
            "department": dept,
            "Low": sum(1 for s in dept_students if s.risk_level == "Low"),
            "Medium": sum(1 for s in dept_students if s.risk_level == "Medium"),
            "High": sum(1 for s in dept_students if s.risk_level == "High"),
            "total": len(dept_students)
        })
        
    # Chart 3: Semester-wise Risk Breakdown
    sem_risk = []
    for sem in range(1, 9):
        sem_students = [s for s in students if s.semester == sem]
        if sem_students:
            sem_risk.append({
                "semester": f"Sem {sem}",
                "Low": sum(1 for s in sem_students if s.risk_level == "Low"),
                "Medium": sum(1 for s in sem_students if s.risk_level == "Medium"),
                "High": sum(1 for s in sem_students if s.risk_level == "High")
            })
            
    # Chart 4: GPA vs Risk
    gpa_buckets = [
        {"label": "< 5.0 GPA", "min": 0, "max": 4.99},
        {"label": "5.0 - 6.5 GPA", "min": 5.0, "max": 6.49},
        {"label": "6.5 - 8.0 GPA", "min": 6.5, "max": 7.99},
        {"label": "> 8.0 GPA", "min": 8.0, "max": 10.0}
    ]
    gpa_vs_risk = []
    for b in gpa_buckets:
        b_students = [s for s in students if b["min"] <= s.current_gpa <= b["max"]]
        gpa_vs_risk.append({
            "bucket": b["label"],
            "Low": sum(1 for s in b_students if s.risk_level == "Low"),
            "Medium": sum(1 for s in b_students if s.risk_level == "Medium"),
            "High": sum(1 for s in b_students if s.risk_level == "High")
        })
        
    # Chart 5: Attendance vs Risk
    att_buckets = [
        {"label": "< 60% Attendance", "min": 0, "max": 59.9},
        {"label": "60% - 75%", "min": 60.0, "max": 74.9},
        {"label": "75% - 85%", "min": 75.0, "max": 84.9},
        {"label": "> 85%", "min": 85.0, "max": 100.0}
    ]
    attendance_vs_risk = []
    for b in att_buckets:
        b_students = [s for s in students if b["min"] <= s.attendance_percentage <= b["max"]]
        attendance_vs_risk.append({
            "bucket": b["label"],
            "Low": sum(1 for s in b_students if s.risk_level == "Low"),
            "Medium": sum(1 for s in b_students if s.risk_level == "Medium"),
            "High": sum(1 for s in b_students if s.risk_level == "High")
        })

    return {
        "kpis": {
            "total_students": total_students,
            "low_risk_count": low_count,
            "medium_risk_count": med_count,
            "high_risk_count": high_count,
            "avg_attendance": avg_attendance,
            "avg_gpa": avg_gpa,
            "interventions_needed": pending_interventions
        },
        "charts": {
            "risk_distribution": risk_distribution,
            "department_risk": dept_risk,
            "semester_risk": sem_risk,
            "gpa_vs_risk": gpa_vs_risk,
            "attendance_vs_risk": attendance_vs_risk
        }
    }
