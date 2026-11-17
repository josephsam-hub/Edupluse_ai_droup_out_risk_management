import os
import sys
import joblib
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.preprocessing import engineer_features
from ml.train import train_and_evaluate_models, MODEL_SAVE_PATH

class PredictionService:
    def __init__(self):
        self.bundle = None
        self.load_model()
        
    def load_model(self):
        if not os.path.exists(MODEL_SAVE_PATH):
            print("Model file not found. Executing automatic training pipeline...")
            self.bundle = train_and_evaluate_models()
        else:
            try:
                self.bundle = joblib.load(MODEL_SAVE_PATH)
                print(f"Loaded existing model bundle. Active Model: {self.bundle['best_model_name']}")
            except Exception as e:
                print(f"Error loading model bundle: {e}. Retraining...")
                self.bundle = train_and_evaluate_models()
                
    def reload_model(self):
        self.load_model()
        
    def predict_single(self, student_data: dict) -> dict:
        """
        Runs full feature engineering & ML pipeline prediction for a student data record.
        Generates probability, risk level, explainable feature importances, and intervention recommendations.
        """
        if self.bundle is None:
            self.load_model()
            
        pipeline = self.bundle["pipeline"]
        best_model_name = self.bundle["best_model_name"]
        
        # Convert dictionary to DataFrame
        df_raw = pd.DataFrame([student_data])
        
        # Ensure default categorical fields if missing
        if "department" not in df_raw.columns or not df_raw["department"].iloc[0]:
            df_raw["department"] = "Computer Science"
            
        # Apply identical feature engineering pipeline
        df_engineered = engineer_features(df_raw)
        
        # Drop columns not used as model inputs if present
        model_input = df_engineered.drop(columns=[c for c in ['student_id', 'name', 'dropout_risk'] if c in df_engineered.columns])
        
        # Obtain prediction probability for Dropout Class (1)
        proba_class_1 = float(pipeline.predict_proba(model_input)[0][1])
        proba_class_0 = 1.0 - proba_class_1
        
        # Classify risk level
        if proba_class_1 < 0.30:
            risk_level = "Low"
            risk_color = "emerald"
        elif proba_class_1 <= 0.60:
            risk_level = "Medium"
            risk_color = "amber"
        else:
            risk_level = "High"
            risk_color = "rose"
            
        confidence = round(max(proba_class_1, proba_class_0), 4)
        
        # Compute student-specific explainable risk factors
        risk_factors = []
        feature_impacts = []
        
        # Extract features for rule-based risk factor identification & display
        curr_gpa = float(student_data.get("current_gpa", 7.0))
        prev_gpa = float(student_data.get("previous_gpa", 7.0))
        attendance = float(student_data.get("attendance_percentage", 80.0))
        failed_sub = int(student_data.get("failed_subjects", 0))
        assignment_comp = float(student_data.get("assignment_completion_rate", 80.0))
        lms_logins = float(student_data.get("lms_logins_per_week", 10.0))
        study_hours = float(student_data.get("study_hours_per_week", 15.0))
        fin_diff = int(student_data.get("financial_difficulty", 0))
        scholarship = int(student_data.get("scholarship", 0))

        if attendance < 75.0:
            risk_factors.append(f"Critical Attendance Deficit ({attendance}% < 75%)")
            feature_impacts.append({"feature": "Attendance Rate", "impact": "High", "direction": "Negative", "score": 0.88})
            
        if curr_gpa < 6.0:
            risk_factors.append(f"Low Current Academic GPA ({curr_gpa} / 10.0)")
            feature_impacts.append({"feature": "Current GPA", "impact": "High", "direction": "Negative", "score": 0.82})
            
        if (curr_gpa - prev_gpa) < -0.5:
            risk_factors.append(f"Declining Academic Trend (GPA dropped by {round(prev_gpa - curr_gpa, 2)} points)")
            feature_impacts.append({"feature": "Academic Trend", "impact": "High", "direction": "Negative", "score": 0.76})
            
        if failed_sub > 0:
            risk_factors.append(f"Failed Course Modules ({failed_sub} subject(s) pending)")
            feature_impacts.append({"feature": "Failed Subjects", "impact": "High", "direction": "Negative", "score": 0.80})
            
        if assignment_comp < 65.0:
            risk_factors.append(f"Incomplete Assignment Submissions ({assignment_comp}%)")
            feature_impacts.append({"feature": "Assignment Completion", "impact": "Medium", "direction": "Negative", "score": 0.65})
            
        if lms_logins < 5.0:
            risk_factors.append(f"Low LMS Digital Activity ({int(lms_logins)} logins/week)")
            feature_impacts.append({"feature": "LMS Logins", "impact": "Medium", "direction": "Negative", "score": 0.58})
            
        if fin_diff == 1 and scholarship == 0:
            risk_factors.append("Financial Strain without Active Scholarship")
            feature_impacts.append({"feature": "Financial Status", "impact": "Medium", "direction": "Negative", "score": 0.54})
            
        if not risk_factors:
            risk_factors.append("Satisfactory Academic & Engagement Indicators")
            feature_impacts.append({"feature": "Overall Academic Performance", "impact": "Positive", "direction": "Positive", "score": 0.90})

        # Generate Rule-based Intervention Recommendations based on active risk factors
        recommendations = []
        if attendance < 75.0:
            recommendations.append("Assign Academic Attendance Monitor & initiate bi-weekly attendance check-ins.")
        if curr_gpa < 6.0 or failed_sub > 0:
            recommendations.append("Enroll student in subject-specific Remedial Tutoring & Peer Study Group.")
        if (curr_gpa - prev_gpa) < -0.5:
            recommendations.append("Schedule Academic Counselor One-on-One to review workload and course difficulty.")
        if assignment_comp < 65.0 or lms_logins < 5.0:
            recommendations.append("Set automated LMS deadline reminders & require weekly assignment submissions.")
        if fin_diff == 1 and scholarship == 0:
            recommendations.append("Connect student with Financial Aid Office for Emergency Grant or Scholarship application.")
        if risk_level == "High":
            recommendations.append("High Priority Intervention: Convene multi-disciplinary Faculty & Counseling Committee.")
        elif risk_level == "Low" and not recommendations:
            recommendations.append("Continue standard academic progress monitoring & encourage honor program participation.")

        return {
            "dropout_probability": round(proba_class_1, 4),
            "dropout_probability_percent": round(proba_class_1 * 100, 1),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "confidence": confidence,
            "model_used": best_model_name,
            "risk_factors": risk_factors,
            "feature_impacts": feature_impacts,
            "recommendations": recommendations,
            "engineered_metrics": {
                "academic_trend": round(float(df_engineered["academic_trend"].iloc[0]), 2),
                "attendance_risk": float(df_engineered["attendance_risk"].iloc[0]),
                "engagement_score": round(float(df_engineered["engagement_score"].iloc[0]), 2),
                "academic_risk_index": round(float(df_engineered["academic_risk_index"].iloc[0]), 2),
                "submission_consistency_rate": round(float(df_engineered["submission_consistency_rate"].iloc[0]), 1)
            }
        }
        
    def get_model_info(self) -> dict:
        if self.bundle is None:
            self.load_model()
            
        return {
            "best_model_name": self.bundle["best_model_name"],
            "results": self.bundle["results"],
            "feature_importances": self.bundle["feature_importances"][:12], # top 12 features
            "tuning_info": self.bundle.get("tuning_info", {}),
            "dataset_stats": self.bundle["dataset_stats"]
        }

prediction_service = PredictionService()
