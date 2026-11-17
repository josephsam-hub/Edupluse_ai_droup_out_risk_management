from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from ml.predict_service import prediction_service
from ml.train import train_and_evaluate_models

router = APIRouter(prefix="/api", tags=["Machine Learning Model"])

@router.get("/model-info")
@router.get("/model-performance")
def get_model_performance_details():
    """
    Returns comprehensive evaluation metrics for all trained classification algorithms,
    hyperparameter tuning analysis, feature importances, and dataset metadata for academic presentation.
    """
    try:
        info = prediction_service.get_model_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving model performance details: {str(e)}")

@router.post("/train")
def train_model():
    """
    Executes real-time model retraining pipeline over the dataset.
    Compares Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting algorithms,
    applies GridSearchCV hyperparameter tuning, selects the best model, and reloads active prediction service.
    """
    try:
        new_bundle = train_and_evaluate_models()
        prediction_service.reload_model()
        
        return {
            "message": "Model training & evaluation completed successfully!",
            "best_model_name": new_bundle["best_model_name"],
            "results": new_bundle["results"],
            "tuning_info": new_bundle.get("tuning_info", {}),
            "dataset_stats": new_bundle["dataset_stats"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")
