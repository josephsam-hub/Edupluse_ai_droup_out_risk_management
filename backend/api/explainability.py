"""
api/explainability.py
---------------------
SHAP-based explainable AI endpoints for EduPulse AI.

Provides:
  GET /api/ml/feature-importance  – global importances from trained model
  GET /api/ml/shap-explanation/{student_id} – per-student SHAP explanation
"""

from __future__ import annotations
import os
import json
import numpy as np
import pandas as pd
import joblib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import StudentDB
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/ml", tags=["Explainability"])

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "ml", "model", "edupulse_model.pkl"
)

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False


def _load_model():
    """Load the trained model bundle or raise 404."""
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=404,
            detail="Trained model not found. Please train the model first via POST /api/train."
        )
    return joblib.load(MODEL_PATH)


def _build_student_df(student: StudentDB) -> pd.DataFrame:
    """
    Convert a StudentDB record into a DataFrame row that matches the
    training feature schema, including engineered features.
    """
    from ml.preprocessing import engineer_features
    row = {
        "student_id": student.student_id,
        "name": student.name,
        "attendance_percentage": student.attendance_percentage or 0,
        "previous_gpa": student.previous_gpa or 0,
        "current_gpa": student.current_gpa or 0,
        "marks_percentage": student.marks_percentage or 0,
        "failed_subjects": student.failed_subjects or 0,
        "assignment_completion_rate": student.assignment_completion_rate or 0,
        "internal_assessment_score": student.internal_assessment_score or 0,
        "exam_performance_score": student.exam_performance_score or 0,
        "absent_days": student.absent_days or 0,
        "late_arrivals": student.late_arrivals or 0,
        "lms_logins_per_week": student.lms_logins_per_week or 0,
        "study_hours_per_week": student.study_hours_per_week or 0,
        "assignment_consistency": student.assignment_consistency or 0,
        "classroom_participation": student.classroom_participation or 0,
        "online_activity_hours": student.online_activity_hours or 0,
        "scholarship": student.scholarship or 0,
        "financial_difficulty": student.financial_difficulty or 0,
        "mentoring_available": student.mentoring_available or 1,
        "parent_support_level": student.parent_support_level or 4,
        "distance_from_institute": student.distance_from_institute or 10,
        "age": student.age or 20,
        "semester": student.semester or 1,
        "department": student.department or "CSE",
    }
    df = pd.DataFrame([row])
    # Apply the same feature engineering used during training
    df = engineer_features(df)
    # Drop non-feature columns (student_id, name, dropout_risk if present)
    for col in ["student_id", "name", "dropout_risk"]:
        if col in df.columns:
            df = df.drop(columns=[col])
    return df


# ---------------------------------------------------------------------------
# GET /api/ml/feature-importance
# ---------------------------------------------------------------------------
@router.get("/feature-importance")
def get_feature_importance(
    top_n: int = 15,
    current_user: dict = Depends(get_current_user),
):
    """
    Return global feature importances from the best trained model.
    """
    bundle = _load_model()
    feature_importances = bundle.get("feature_importances", [])
    best_model_name = bundle.get("best_model_name", "Unknown")
    results = bundle.get("results", {})
    best_metrics = results.get(best_model_name, {})

    return {
        "best_model_name": best_model_name,
        "best_model_metrics": best_metrics,
        "feature_importances": feature_importances[:top_n],
        "total_features": len(feature_importances),
        "explanation": (
            "Feature importances indicate how much each input variable "
            "contributes to the model's dropout risk prediction. Higher "
            "importance values mean the feature has stronger influence."
        ),
    }


# ---------------------------------------------------------------------------
# GET /api/ml/shap-explanation/{student_id}
# ---------------------------------------------------------------------------
@router.get("/shap-explanation/{student_id}")
def get_shap_explanation(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return a SHAP-based (or feature-importance proxy) explanation for why
    a specific student received their dropout risk classification.
    """
    # Fetch student
    student = db.query(StudentDB).filter(StudentDB.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")

    bundle = _load_model()
    pipeline = bundle["pipeline"]
    feature_names: list = bundle.get("feature_names", [])
    best_model_name: str = bundle.get("best_model_name", "Unknown")

    # Build input DataFrame
    input_df = _build_student_df(student)

    # Run prediction
    prob = float(pipeline.predict_proba(input_df)[0][1])
    thresholds = {"High": 0.6, "Medium": 0.35}
    if prob >= thresholds["High"]:
        risk_level = "High"
    elif prob >= thresholds["Medium"]:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # -----------------------------------------------------------------------
    # Try SHAP
    # -----------------------------------------------------------------------
    shap_values_list = []
    explanation_method = "Feature Importance Proxy"
    base_value = None

    if HAS_SHAP:
        try:
            preprocessor = pipeline.named_steps["preprocessor"]
            classifier = pipeline.named_steps["classifier"]
            X_transformed = preprocessor.transform(input_df)

            # Choose explainer type
            model_type = type(classifier).__name__
            if model_type in ("RandomForestClassifier", "DecisionTreeClassifier",
                              "GradientBoostingClassifier", "XGBClassifier"):
                explainer = shap.TreeExplainer(classifier)
                shap_out = explainer.shap_values(X_transformed)
                # For binary classifiers, shap_values returns list[2 arrays]
                if isinstance(shap_out, list):
                    sv = shap_out[1][0]   # positive-class SHAP values
                else:
                    sv = shap_out[0]
                base_value = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
                explanation_method = f"SHAP TreeExplainer ({best_model_name})"
            else:
                # Logistic Regression / linear models
                explainer = shap.LinearExplainer(classifier, X_transformed)
                sv = explainer.shap_values(X_transformed)[0]
                base_value = float(explainer.expected_value)
                explanation_method = f"SHAP LinearExplainer ({best_model_name})"

            # Pair each feature with its SHAP value
            fn = feature_names if feature_names else [f"feature_{i}" for i in range(len(sv))]
            shap_pairs = sorted(
                zip(fn, [float(v) for v in sv]),
                key=lambda x: abs(x[1]),
                reverse=True,
            )
            shap_values_list = [{"feature": f, "shap_value": round(v, 4)} for f, v in shap_pairs]
        except Exception as ex:
            # Fallback: use global feature importances as proxy
            HAS_SHAP_RUNTIME = False
            explanation_method = f"Feature Importance Proxy (SHAP error: {str(ex)[:60]})"

    # Fallback when SHAP not available or failed
    if not shap_values_list:
        fi = bundle.get("feature_importances", [])
        # Map global importances to this student's data directionally
        student_dict = input_df.iloc[0].to_dict()
        for entry in fi[:15]:
            feat = entry["feature"]
            imp = entry["importance"]
            # Simple heuristic: low values on positive features → risk
            raw_val = student_dict.get(feat)
            # Assign sign heuristically
            direction = 1 if raw_val is not None and raw_val < 50 else -1
            shap_values_list.append({
                "feature": feat,
                "shap_value": round(imp * direction * prob, 4),
            })

    # Build factor lists
    positive_factors = [
        {"feature": f["feature"], "impact": f["shap_value"],
         "direction": "increases_risk"}
        for f in shap_values_list if f["shap_value"] > 0
    ][:5]

    negative_factors = [
        {"feature": f["feature"], "impact": f["shap_value"],
         "direction": "decreases_risk"}
        for f in shap_values_list if f["shap_value"] < 0
    ][:5]

    # Build a human-readable explanation
    top_risk_features = [f["feature"].replace("_", " ") for f in positive_factors[:3]]
    if top_risk_features:
        feat_str = ", ".join(top_risk_features)
        explanation_text = (
            f"This student is classified as {risk_level.upper()} RISK "
            f"(predicted probability: {prob * 100:.1f}%). "
            f"The model identifies the following as the most influential factors: {feat_str}. "
            f"Note: This is a model estimate, not a definitive prediction."
        )
    else:
        explanation_text = (
            f"This student is classified as {risk_level.upper()} RISK "
            f"with a predicted probability of {prob * 100:.1f}%. "
            f"Please review the student's academic record for context."
        )

    return {
        "student_id": student.student_id,
        "student_name": student.name,
        "risk_level": risk_level,
        "probability": round(prob, 4),
        "probability_pct": round(prob * 100, 1),
        "shap_available": HAS_SHAP,
        "explanation_method": explanation_method,
        "base_value": base_value,
        "top_positive_factors": positive_factors,
        "top_negative_factors": negative_factors,
        "all_shap_values": shap_values_list[:20],
        "explanation_text": explanation_text,
        "disclaimer": (
            "The predicted probability is a model estimate based on available "
            "student data. It reflects patterns from training data and should "
            "be used to guide — not replace — professional educator judgment."
        ),
    }
