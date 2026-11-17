import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any

from database.db import get_db
from database.models import StudentDB, PredictionLogDB
from ml.predict_service import prediction_service

router = APIRouter(prefix="/api", tags=["Prediction"])

class StudentPredictSchema(BaseModel):
    student_id: Optional[str] = None
    name: Optional[str] = "Anonymous Student"
    department: str = Field(default="Computer Science")
    semester: int = Field(default=4, ge=1, le=8)
    age: int = Field(default=20, ge=16, le=60)
    
    # Academic
    previous_gpa: float = Field(default=7.0, ge=0.0, le=10.0)
    current_gpa: float = Field(default=7.0, ge=0.0, le=10.0)
    marks_percentage: float = Field(default=70.0, ge=0.0, le=100.0)
    failed_subjects: int = Field(default=0, ge=0, le=10)
    assignment_completion_rate: float = Field(default=80.0, ge=0.0, le=100.0)
    internal_assessment_score: float = Field(default=75.0, ge=0.0, le=100.0)
    exam_performance_score: float = Field(default=75.0, ge=0.0, le=100.0)
    
    # Attendance
    attendance_percentage: float = Field(default=80.0, ge=0.0, le=100.0)
    absent_days: int = Field(default=5, ge=0, le=100)
    late_arrivals: int = Field(default=2, ge=0, le=50)
    
    # Engagement
    lms_logins_per_week: int = Field(default=10, ge=0, le=100)
    study_hours_per_week: int = Field(default=15, ge=0, le=100)
    assignment_consistency: float = Field(default=80.0, ge=0.0, le=100.0)
    classroom_participation: int = Field(default=6, ge=1, le=10)
    online_activity_hours: float = Field(default=12.0, ge=0.0, le=100.0)
    
    # Support
    scholarship: int = Field(default=0, ge=0, le=1)
    financial_difficulty: int = Field(default=0, ge=0, le=1)
    mentoring_available: int = Field(default=1, ge=0, le=1)
    parent_support_level: int = Field(default=4, ge=1, le=5)
    distance_from_institute: float = Field(default=10.0, ge=0.0, le=200.0)

@router.post("/predict")
def predict_risk(data: StudentPredictSchema, db: Session = Depends(get_db)):
    """
    Executes actual ML inference pipeline for a student record.
    Returns dropout probability, risk level classification (Low, Medium, High),
    explainable AI feature contributions, and rule-based intervention recommendations.
    """
    student_dict = data.dict()
    
    # Run ML Model Inference
    result = prediction_service.predict_single(student_dict)
    
    # Log prediction into DB if student_id is provided
    if data.student_id:
        student = db.query(StudentDB).filter(StudentDB.student_id == data.student_id).first()
        if student:
            student.probability = result["dropout_probability"]
            student.risk_level = result["risk_level"]
            
        pred_log = PredictionLogDB(
            student_id=data.student_id,
            probability=result["dropout_probability"],
            risk_level=result["risk_level"],
            model_used=result["model_used"],
            confidence=result["confidence"],
            risk_factors_json=json.dumps(result["risk_factors"]),
            recommendations_json=json.dumps(result["recommendations"])
        )
        db.add(pred_log)
        db.commit()
        
    return result
