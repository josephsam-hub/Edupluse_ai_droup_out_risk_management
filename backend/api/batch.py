import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from ml.predict_service import prediction_service

router = APIRouter(prefix="/api", tags=["Batch Prediction"])

@router.post("/batch-predict")
async def batch_predict(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Processes an uploaded CSV containing student features through the trained ML pipeline.
    Generates dropout predictions, risk levels, top risk factors, and downloadable results.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for batch processing")
        
    try:
        content = await file.read()
        df_uploaded = pd.read_csv(io.BytesIO(content))
        
        if df_uploaded.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")
            
        results = []
        low_count, med_count, high_count = 0, 0, 0
        total_prob = 0.0
        
        for idx, row in df_uploaded.iterrows():
            row_dict = row.to_dict()
            student_id = str(row_dict.get("student_id", f"BATCH_{idx+1:03d}"))
            name = str(row_dict.get("name", f"Student {idx+1}"))
            dept = str(row_dict.get("department", "Computer Science"))
            
            ml_output = prediction_service.predict_single(row_dict)
            prob = ml_output["dropout_probability"]
            risk = ml_output["risk_level"]
            top_factor = ml_output["risk_factors"][0] if ml_output["risk_factors"] else "Normal Academic Progress"
            rec = ml_output["recommendations"][0] if ml_output["recommendations"] else "Standard Progress Monitoring"
            
            if risk == "Low":
                low_count += 1
            elif risk == "Medium":
                med_count += 1
            else:
                high_count += 1
                
            total_prob += prob
            
            results.append({
                "student_id": student_id,
                "name": name,
                "department": dept,
                "previous_gpa": float(row_dict.get("previous_gpa", 7.0)),
                "current_gpa": float(row_dict.get("current_gpa", 7.0)),
                "attendance_percentage": float(row_dict.get("attendance_percentage", 80.0)),
                "dropout_probability": prob,
                "dropout_probability_percent": round(prob * 100, 1),
                "risk_level": risk,
                "top_risk_factor": top_factor,
                "recommended_action": rec
            })
            
        avg_prob = round(total_prob / len(results), 4) if results else 0.0
        
        # Build downloadable CSV
        results_df = pd.DataFrame(results)
        csv_buffer = io.StringIO()
        results_df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        return {
            "batch_summary": {
                "total_students_processed": len(results),
                "low_risk_count": low_count,
                "medium_risk_count": med_count,
                "high_risk_count": high_count,
                "average_dropout_probability": avg_prob
            },
            "predictions": results,
            "csv_data": csv_content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")
