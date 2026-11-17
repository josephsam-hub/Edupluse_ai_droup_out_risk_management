from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
import datetime

from database.db import get_db
from database.models import StudentDB
from ml.predict_service import prediction_service

router = APIRouter(prefix="/api/report", tags=["Report Generation"])

@router.get("/{student_id}")
def get_student_report_json(student_id: str, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
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
    
    prediction = prediction_service.predict_single(student_dict)
    
    return {
        "report_generated_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "institution": "EduPulse AI Student Retention & Analytics System",
        "student_details": student_dict,
        "prediction_results": prediction
    }
