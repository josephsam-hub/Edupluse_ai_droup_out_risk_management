import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline

DEFAULT_FEATURE_VALUES = {
    "department": "Computer Science",
    "semester": 4,
    "age": 20,
    "previous_gpa": 7.0,
    "current_gpa": 7.0,
    "marks_percentage": 70.0,
    "failed_subjects": 0,
    "assignment_completion_rate": 75.0,
    "internal_assessment_score": 75.0,
    "exam_performance_score": 75.0,
    "attendance_percentage": 80.0,
    "absent_days": 8,
    "late_arrivals": 2,
    "lms_logins_per_week": 10,
    "study_hours_per_week": 15,
    "assignment_consistency": 80.0,
    "classroom_participation": 6,
    "online_activity_hours": 12.0,
    "scholarship": 0,
    "financial_difficulty": 0,
    "mentoring_available": 1,
    "parent_support_level": 4,
    "distance_from_institute": 10.0
}

NUMERICAL_FEATURES = [
    "previous_gpa",
    "current_gpa",
    "marks_percentage",
    "failed_subjects",
    "assignment_completion_rate",
    "internal_assessment_score",
    "exam_performance_score",
    "attendance_percentage",
    "absent_days",
    "late_arrivals",
    "lms_logins_per_week",
    "study_hours_per_week",
    "assignment_consistency",
    "classroom_participation",
    "online_activity_hours",
    "scholarship",
    "financial_difficulty",
    "mentoring_available",
    "parent_support_level",
    "distance_from_institute",
    "age",
    "semester",
    # Derived engineered features
    "academic_trend",
    "attendance_risk",
    "engagement_score",
    "academic_risk_index",
    "submission_consistency_rate"
]

CATEGORICAL_FEATURES = ["department"]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies consistent feature engineering logic to both raw training data and single inference requests.
    Ensures missing feature columns are safely filled with default baselines.
    """
    data = df.copy()
    
    # Fill any missing feature columns with sensible defaults
    for col, default_val in DEFAULT_FEATURE_VALUES.items():
        if col not in data.columns:
            data[col] = default_val
        else:
            data[col] = data[col].fillna(default_val)
            
    # 1. Academic trend (current GPA relative to previous GPA)
    data["academic_trend"] = data["current_gpa"] - data["previous_gpa"]
    
    # 2. Attendance risk factor (0.0 to 1.0 indicator)
    data["attendance_risk"] = np.where(
        data["attendance_percentage"] < 70, 1.0,
        np.where(data["attendance_percentage"] < 85, 0.5, 0.0)
    )
    
    # 3. Composite engagement score
    data["engagement_score"] = (
        data["lms_logins_per_week"] * 2.0 + 
        data["study_hours_per_week"] * 1.5 + 
        data["classroom_participation"] * 3.0 + 
        data["online_activity_hours"] * 0.5
    ) / 4.0
    
    # 4. Composite academic risk index
    data["academic_risk_index"] = (
        data["failed_subjects"] * 2.5 + 
        (10.0 - data["current_gpa"]) + 
        (100.0 - data["exam_performance_score"]) / 10.0
    )
    
    # 5. Assignment submission consistency rate
    data["submission_consistency_rate"] = (
        (data["assignment_completion_rate"] / 100.0) * 
        (data["assignment_consistency"] / 100.0) * 100.0
    )
    
    return data

def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Creates the scikit-learn ColumnTransformer for numerical scaling & categorical encoding.
    """
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, NUMERICAL_FEATURES),
            ('cat', categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )
    
    return preprocessor
