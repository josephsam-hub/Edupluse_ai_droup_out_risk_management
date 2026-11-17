import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from pydantic import BaseModel, Field

from database.db import get_db
from database.models import StudentDB, PredictionLogDB, InterventionDB
from ml.predict_service import prediction_service

router = APIRouter(prefix="/api/students", tags=["Students Management"])

class StudentCreateSchema(BaseModel):
    student_id: str
    name: str
    department: str
    semester: int = Field(default=4, ge=1, le=8)
    age: int = Field(default=20, ge=16, le=60)
    
    previous_gpa: float = Field(default=7.0, ge=0.0, le=10.0)
    current_gpa: float = Field(default=7.0, ge=0.0, le=10.0)
    marks_percentage: float = Field(default=70.0, ge=0.0, le=100.0)
    failed_subjects: int = Field(default=0, ge=0, le=10)
    assignment_completion_rate: float = Field(default=80.0, ge=0.0, le=100.0)
    internal_assessment_score: float = Field(default=75.0, ge=0.0, le=100.0)
    exam_performance_score: float = Field(default=75.0, ge=0.0, le=100.0)
    
    attendance_percentage: float = Field(default=80.0, ge=0.0, le=100.0)
    absent_days: int = Field(default=5, ge=0, le=100)
    late_arrivals: int = Field(default=2, ge=0, le=50)
    
    lms_logins_per_week: int = Field(default=10, ge=0, le=100)
    study_hours_per_week: int = Field(default=15, ge=0, le=100)
    assignment_consistency: float = Field(default=80.0, ge=0.0, le=100.0)
    classroom_participation: int = Field(default=6, ge=1, le=10)
    online_activity_hours: float = Field(default=12.0, ge=0.0, le=100.0)
    
    scholarship: int = Field(default=0, ge=0, le=1)
    financial_difficulty: int = Field(default=0, ge=0, le=1)
    mentoring_available: int = Field(default=1, ge=0, le=1)
    parent_support_level: int = Field(default=4, ge=1, le=5)
    distance_from_institute: float = Field(default=10.0, ge=0.0, le=200.0)

@router.get("")
def list_students(
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    sort_by: Optional[str] = "probability_desc",
    db: Session = Depends(get_db)
):
    query = db.query(StudentDB)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(StudentDB.name.like(search_filter), StudentDB.student_id.like(search_filter)))
        
    if risk_level:
        query = query.filter(StudentDB.risk_level == risk_level)
        
    if department:
        query = query.filter(StudentDB.department == department)
        
    if semester:
        query = query.filter(StudentDB.semester == semester)
        
    if sort_by == "probability_desc":
        query = query.order_by(desc(StudentDB.probability))
    elif sort_by == "probability_asc":
        query = query.order_by(StudentDB.probability)
    elif sort_by == "gpa_asc":
        query = query.order_by(StudentDB.current_gpa)
    elif sort_by == "attendance_asc":
        query = query.order_by(StudentDB.attendance_percentage)
    else:
        query = query.order_by(desc(StudentDB.created_at))
        
    students = query.all()
    
    results = []
    for s in students:
        results.append({
            "student_id": s.student_id,
            "name": s.name,
            "department": s.department,
            "semester": s.semester,
            "previous_gpa": s.previous_gpa,
            "current_gpa": s.current_gpa,
            "attendance_percentage": s.attendance_percentage,
            "lms_logins_per_week": s.lms_logins_per_week,
            "failed_subjects": s.failed_subjects,
            "probability": s.probability,
            "probability_percent": round((s.probability or 0.0) * 100, 1),
            "risk_level": s.risk_level or "Low",
            "last_predicted_at": s.last_predicted_at.isoformat() if s.last_predicted_at else None
        })
        
    return results

@router.get("/{student_id}")
def get_student_detail(student_id: str, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student ID '{student_id}' not found")
        
    # Re-run live prediction to ensure explanation and recommendations are fresh
    student_dict = {
        "student_id": student.student_id,
        "name": student.name,
        "department": student.department,
        "semester": student.semester,
        "age": student.age,
        "previous_gpa": student.previous_gpa,
        "current_gpa": student.current_gpa,
        "marks_percentage": student.marks_percentage,
        "failed_subjects": student.failed_subjects,
        "assignment_completion_rate": student.assignment_completion_rate,
        "internal_assessment_score": student.internal_assessment_score,
        "exam_performance_score": student.exam_performance_score,
        "attendance_percentage": student.attendance_percentage,
        "absent_days": student.absent_days,
        "late_arrivals": student.late_arrivals,
        "lms_logins_per_week": student.lms_logins_per_week,
        "study_hours_per_week": student.study_hours_per_week,
        "assignment_consistency": student.assignment_consistency,
        "classroom_participation": student.classroom_participation,
        "online_activity_hours": student.online_activity_hours,
        "scholarship": student.scholarship,
        "financial_difficulty": student.financial_difficulty,
        "mentoring_available": student.mentoring_available,
        "parent_support_level": student.parent_support_level,
        "distance_from_institute": student.distance_from_institute
    }
    
    ml_output = prediction_service.predict_single(student_dict)
    
    # Get historical prediction logs
    logs = db.query(PredictionLogDB).filter(PredictionLogDB.student_id == student_id).order_by(desc(PredictionLogDB.timestamp)).all()
    history = []
    for log in logs:
        history.append({
            "id": log.id,
            "probability": log.probability,
            "probability_percent": round(log.probability * 100, 1),
            "risk_level": log.risk_level,
            "model_used": log.model_used,
            "timestamp": log.timestamp.isoformat()
        })
        
    # Get interventions
    interventions = db.query(InterventionDB).filter(InterventionDB.student_id == student_id).all()
    interventions_list = []
    for item in interventions:
        interventions_list.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "assigned_to": item.assigned_to,
            "status": item.status,
            "priority": item.priority,
            "created_at": item.created_at.isoformat()
        })
        
    return {
        "student_info": student_dict,
        "current_prediction": ml_output,
        "history": history,
        "interventions": interventions_list
    }

@router.post("")
def create_student(data: StudentCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(StudentDB).filter(StudentDB.student_id == data.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student ID '{data.student_id}' already exists")
        
    student_dict = data.dict()
    ml_output = prediction_service.predict_single(student_dict)
    
    new_student = StudentDB(
        **student_dict,
        probability=ml_output["dropout_probability"],
        risk_level=ml_output["risk_level"]
    )
    db.add(new_student)
    
    pred_log = PredictionLogDB(
        student_id=data.student_id,
        probability=ml_output["dropout_probability"],
        risk_level=ml_output["risk_level"],
        model_used=ml_output["model_used"],
        confidence=ml_output["confidence"],
        risk_factors_json=json.dumps(ml_output["risk_factors"]),
        recommendations_json=json.dumps(ml_output["recommendations"])
    )
    db.add(pred_log)
    
    if ml_output["risk_level"] in ["High", "Medium"]:
        db.add(InterventionDB(
            student_id=data.student_id,
            title=f"{ml_output['risk_level']} Risk Support Protocol",
            description=f"Automated risk detection flag ({ml_output['dropout_probability_percent']}% dropout risk).",
            status="Pending",
            priority=ml_output["risk_level"]
        ))
        
    db.commit()
    db.refresh(new_student)
    
    return {
        "message": "Student created successfully",
        "student_id": new_student.student_id,
        "prediction": ml_output
    }

@router.delete("/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    return {"message": f"Student '{student_id}' deleted successfully"}
