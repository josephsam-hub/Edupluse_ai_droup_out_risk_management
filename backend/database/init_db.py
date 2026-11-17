import os
import sys
import json
import pandas as pd
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import engine, Base, SessionLocal
from database.models import UserDB, StudentDB, PredictionLogDB, InterventionDB, NotificationDB
from utils.auth_utils import hash_password
from ml.dataset_generator import ensure_dataset_exists
from ml.predict_service import prediction_service

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed Demo Users if not present
        if db.query(UserDB).count() == 0:
            print("Seeding default role-based demo users...")
            users = [
                UserDB(username="admin", hashed_password=hash_password("admin123"), role="Admin", full_name="System Administrator", email="admin@edupulse.edu"),
                UserDB(username="counselor", hashed_password=hash_password("counselor123"), role="Counselor", full_name="Dr. Sarah Jenkins (Counselor)", email="s.jenkins@edupulse.edu"),
                UserDB(username="faculty", hashed_password=hash_password("faculty123"), role="Faculty", full_name="Prof. David Miller", email="d.miller@edupulse.edu")
            ]
            db.add_all(users)
            db.commit()
            
        # 2. Seed Initial Student Records from CSV if not present
        if db.query(StudentDB).count() == 0:
            print("Seeding initial student records and running ML predictions...")
            data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
            csv_path = ensure_dataset_exists(os.path.join(data_dir, "synthetic_student_dropout_dataset.csv"))
            df = pd.read_csv(csv_path)
            
            # Load first 120 student records into DB for quick dashboard browsing
            sample_df = df.head(120)
            
            for idx, row in sample_df.iterrows():
                student_dict = row.to_dict()
                
                # Execute REAL ML inference
                ml_res = prediction_service.predict_single(student_dict)
                
                student_db = StudentDB(
                    student_id=str(row["student_id"]),
                    name=str(row["name"]),
                    department=str(row["department"]),
                    semester=int(row["semester"]),
                    age=int(row.get("age", 20)),
                    previous_gpa=float(row["previous_gpa"]),
                    current_gpa=float(row["current_gpa"]),
                    marks_percentage=float(row["marks_percentage"]),
                    failed_subjects=int(row["failed_subjects"]),
                    assignment_completion_rate=float(row["assignment_completion_rate"]),
                    internal_assessment_score=float(row["internal_assessment_score"]),
                    exam_performance_score=float(row["exam_performance_score"]),
                    attendance_percentage=float(row["attendance_percentage"]),
                    absent_days=int(row["absent_days"]),
                    late_arrivals=int(row["late_arrivals"]),
                    lms_logins_per_week=int(row["lms_logins_per_week"]),
                    study_hours_per_week=int(row["study_hours_per_week"]),
                    assignment_consistency=float(row["assignment_consistency"]),
                    classroom_participation=int(row["classroom_participation"]),
                    online_activity_hours=float(row["online_activity_hours"]),
                    scholarship=int(row["scholarship"]),
                    financial_difficulty=int(row["financial_difficulty"]),
                    mentoring_available=int(row["mentoring_available"]),
                    parent_support_level=int(row["parent_support_level"]),
                    distance_from_institute=float(row["distance_from_institute"]),
                    probability=ml_res["dropout_probability"],
                    risk_level=ml_res["risk_level"]
                )
                db.add(student_db)
                
                # Add prediction log entry
                pred_log = PredictionLogDB(
                    student_id=str(row["student_id"]),
                    probability=ml_res["dropout_probability"],
                    risk_level=ml_res["risk_level"],
                    model_used=ml_res["model_used"],
                    confidence=ml_res["confidence"],
                    risk_factors_json=json.dumps(ml_res["risk_factors"]),
                    recommendations_json=json.dumps(ml_res["recommendations"])
                )
                db.add(pred_log)
                
                # If High or Medium risk, create initial intervention recommendation entry
                if ml_res["risk_level"] in ["High", "Medium"]:
                    intervention = InterventionDB(
                        student_id=str(row["student_id"]),
                        title=f"{ml_res['risk_level']} Risk Intervention Protocol",
                        description=f"ML Model identified {ml_res['risk_level']} Risk ({ml_res['dropout_probability_percent']}%). Primary factor: {ml_res['risk_factors'][0] if ml_res['risk_factors'] else 'Academic trend'}",
                        assigned_to="Academic Counselor",
                        status="Pending" if ml_res["risk_level"] == "High" else "In Progress",
                        priority=ml_res["risk_level"]
                    )
                    db.add(intervention)
                    
            db.commit()
            print(f"Successfully seeded {len(sample_df)} student records with live ML predictions!")

        # 3. Seed Sample Notifications if not present
        if db.query(NotificationDB).count() == 0:
            print("Seeding sample notifications...")
            # Fetch user IDs for targeted notifications
            admin_user   = db.query(UserDB).filter(UserDB.username == "admin").first()
            counselor    = db.query(UserDB).filter(UserDB.username == "counselor").first()
            faculty_user = db.query(UserDB).filter(UserDB.username == "faculty").first()

            # Pick a few real high-risk students (if any) for realistic alerts
            high_risk_students = (
                db.query(StudentDB)
                .filter(StudentDB.risk_level == "High")
                .order_by(StudentDB.probability.desc())
                .limit(3)
                .all()
            )

            sample_notifications = []

            # --- Broadcast alerts for high-risk students ---
            for stu in high_risk_students:
                sample_notifications.append(
                    NotificationDB(
                        user_id=None,  # broadcast
                        title=f"High Risk Alert: {stu.name}",
                        message=(
                            f"Student {stu.name} ({stu.student_id}) has been classified as "
                            f"HIGH RISK with {round((stu.probability or 0) * 100, 1)}% dropout probability. "
                            "Immediate intervention is recommended."
                        ),
                        priority="High",
                        notification_type="alert",
                        related_student_id=stu.student_id,
                        is_read=0,
                    )
                )

            # --- Attendance warning (broadcast) ---
            sample_notifications.append(
                NotificationDB(
                    user_id=None,
                    title="Attendance Drop Detected",
                    message=(
                        "Overall campus attendance has fallen below 80% this week. "
                        "Please review students with attendance under 75% for follow-up."
                    ),
                    priority="Medium",
                    notification_type="warning",
                    is_read=0,
                )
            )

            # --- System info (broadcast) ---
            sample_notifications.append(
                NotificationDB(
                    user_id=None,
                    title="ML Model Retrained Successfully",
                    message=(
                        "The dropout prediction model has been retrained with the latest dataset. "
                        "Prediction accuracy improved to 92.4%. All student risk scores have been refreshed."
                    ),
                    priority="Low",
                    notification_type="info",
                    is_read=0,
                )
            )

            # --- Counselor-specific reminder ---
            if counselor:
                sample_notifications.append(
                    NotificationDB(
                        user_id=counselor.id,
                        title="Counseling Session Reminder",
                        message=(
                            "You have 3 pending counseling sessions scheduled for this week. "
                            "Please check the intervention queue and confirm appointments."
                        ),
                        priority="Medium",
                        notification_type="info",
                        is_read=0,
                    )
                )

            # --- Admin-specific system notice ---
            if admin_user:
                sample_notifications.append(
                    NotificationDB(
                        user_id=admin_user.id,
                        title="New Faculty Registration Pending",
                        message=(
                            "2 new faculty account registrations are awaiting admin approval. "
                            "Please review and approve or reject them in the user management panel."
                        ),
                        priority="Low",
                        notification_type="info",
                        is_read=0,
                    )
                )

            # --- Faculty-specific notice ---
            if faculty_user:
                sample_notifications.append(
                    NotificationDB(
                        user_id=faculty_user.id,
                        title="Assignment Submission Rate Low",
                        message=(
                            "Assignment completion rate in your department has dropped to 68% this month. "
                            "Consider sending reminders to students with 0 submissions."
                        ),
                        priority="High",
                        notification_type="warning",
                        is_read=0,
                    )
                )

            db.add_all(sample_notifications)
            db.commit()
            print(f"Successfully seeded {len(sample_notifications)} sample notifications!")

    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
