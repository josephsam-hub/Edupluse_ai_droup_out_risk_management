import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="Faculty") # Admin, Counselor, Faculty
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)

class StudentDB(Base):
    __tablename__ = "students"

    student_id = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    age = Column(Integer, default=20)
    
    # Academic
    previous_gpa = Column(Float, default=7.0)
    current_gpa = Column(Float, default=7.0)
    marks_percentage = Column(Float, default=70.0)
    failed_subjects = Column(Integer, default=0)
    assignment_completion_rate = Column(Float, default=80.0)
    internal_assessment_score = Column(Float, default=75.0)
    exam_performance_score = Column(Float, default=75.0)
    
    # Attendance
    attendance_percentage = Column(Float, default=80.0)
    absent_days = Column(Integer, default=5)
    late_arrivals = Column(Integer, default=2)
    
    # Engagement
    lms_logins_per_week = Column(Integer, default=10)
    study_hours_per_week = Column(Integer, default=15)
    assignment_consistency = Column(Float, default=80.0)
    classroom_participation = Column(Integer, default=6)
    online_activity_hours = Column(Float, default=12.0)
    
    # Support
    scholarship = Column(Integer, default=0)
    financial_difficulty = Column(Integer, default=0)
    mentoring_available = Column(Integer, default=1)
    parent_support_level = Column(Integer, default=4)
    distance_from_institute = Column(Float, default=10.0)
    
    # ML Computed fields
    probability = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True) # Low, Medium, High
    last_predicted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    predictions = relationship("PredictionLogDB", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("InterventionDB", back_populates="student", cascade="all, delete-orphan")

class PredictionLogDB(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    model_used = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    risk_factors_json = Column(Text, nullable=False) # JSON array string
    recommendations_json = Column(Text, nullable=False) # JSON array string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("StudentDB", back_populates="predictions")

class InterventionDB(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String(100), default="Academic Counselor")
    status = Column(String(30), default="Pending") # Pending, In Progress, Resolved
    priority = Column(String(20), default="Medium") # Low, Medium, High
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("StudentDB", back_populates="interventions")

class NotificationDB(Base):
    """Stores system notifications for individual users or as broadcast (user_id=None)."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    # None means broadcast – visible to every authenticated user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium")          # High | Medium | Low
    is_read = Column(Integer, default=0)                     # 0=unread, 1=read
    notification_type = Column(String(50), default="info")  # info | warning | alert
    related_student_id = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship back to UserDB
    user = relationship("UserDB", backref="notifications", foreign_keys=[user_id])
