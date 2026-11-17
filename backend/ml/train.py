import os
import sys
import joblib
import pandas as pd
import numpy as np

# Ensure parent directory (backend) is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from ml.dataset_generator import ensure_dataset_exists
from ml.preprocessing import engineer_features, build_preprocessing_pipeline, NUMERICAL_FEATURES, CATEGORICAL_FEATURES

MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "model", "edupulse_model.pkl")

def train_and_evaluate_models(dataset_path: str = None):
    """
    Complete ML Training Pipeline with hyperparameter tuning, model comparison,
    metrics calculation, and joblib model persistence.
    """
    if dataset_path is None or not os.path.exists(dataset_path):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
        csv_file = os.path.join(data_dir, "synthetic_student_dropout_dataset.csv")
        dataset_path = ensure_dataset_exists(csv_file)
        
    df = pd.read_csv(dataset_path)
    
    # 1. Dataset stats
    total_samples = len(df)
    missing_values = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())
    class_counts = df['dropout_risk'].value_counts().to_dict()
    
    # 2. Feature Engineering
    df_engineered = engineer_features(df)
    
    # Target and Features
    X = df_engineered.drop(columns=['student_id', 'name', 'dropout_risk'])
    y = df_engineered['dropout_risk']
    
    # 3. Train-Test Split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    preprocessor = build_preprocessing_pipeline()
    
    # Define models dictionary
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, class_weight='balanced', random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    }
    
    if HAS_XGBOOST:
        models["XGBoost"] = XGBClassifier(n_estimators=100, max_depth=4, random_state=42, eval_metric='logloss')

    results = {}
    fitted_pipelines = {}
    
    for name, model_inst in models.items():
        pipe = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model_inst)
        ])
        
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1] if hasattr(pipe, "predict_proba") else y_pred
        
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_proba))
        
        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm
        }
        fitted_pipelines[name] = pipe

    # 4. Hyperparameter Tuning for Random Forest
    print("Performing Hyperparameter Tuning for Random Forest...")
    rf_untuned_f1 = results["Random Forest"]["f1_score"]
    
    param_grid = {
        'classifier__n_estimators': [50, 100, 150],
        'classifier__max_depth': [6, 8, 12],
        'classifier__min_samples_split': [2, 5],
        'classifier__min_samples_leaf': [1, 2]
    }
    
    rf_base_pipe = Pipeline(steps=[
        ('preprocessor', build_preprocessing_pipeline()),
        ('classifier', RandomForestClassifier(class_weight='balanced', random_state=42))
    ])
    
    grid_search = GridSearchCV(
        rf_base_pipe, param_grid, cv=3, scoring='f1', n_jobs=-1
    )
    grid_search.fit(X_train, y_train)
    
    best_rf_pipe = grid_search.best_estimator_
    y_pred_tuned = best_rf_pipe.predict(X_test)
    y_proba_tuned = best_rf_pipe.predict_proba(X_test)[:, 1]
    
    tuned_rf_metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred_tuned)), 4),
        "precision": round(float(precision_score(y_test, y_pred_tuned, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred_tuned, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred_tuned, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba_tuned)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred_tuned).tolist()
    }
    
    best_params = {k.replace('classifier__', ''): v for k, v in grid_search.best_params_.items()}
    
    tuning_info = {
        "model": "Random Forest",
        "before_tuning_f1": rf_untuned_f1,
        "after_tuning_f1": tuned_rf_metrics["f1_score"],
        "best_params": best_params
    }
    
    fitted_pipelines["Random Forest (Tuned)"] = best_rf_pipe
    results["Random Forest (Tuned)"] = tuned_rf_metrics

    # Select Best Model based on F1 Score
    best_model_name = max(results, key=lambda k: results[k]["f1_score"])
    best_pipeline = fitted_pipelines[best_model_name]
    
    # Extract Feature Importances from Best Model if available
    classifier = best_pipeline.named_steps['classifier']
    preproc = best_pipeline.named_steps['preprocessor']
    
    cat_encoder = preproc.named_transformers_['cat'].named_steps['onehot']
    encoded_cat_features = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    all_transformed_feature_names = NUMERICAL_FEATURES + encoded_cat_features
    
    feature_importances = []
    if hasattr(classifier, 'feature_importances_'):
        importances = classifier.feature_importances_
        for feat, imp in zip(all_transformed_feature_names, importances):
            feature_importances.append({"feature": feat, "importance": round(float(imp), 4)})
    elif hasattr(classifier, 'coef_'):
        importances = np.abs(classifier.coef_[0])
        importances = importances / np.sum(importances)
        for feat, imp in zip(all_transformed_feature_names, importances):
            feature_importances.append({"feature": feat, "importance": round(float(imp), 4)})
            
    feature_importances = sorted(feature_importances, key=lambda x: x['importance'], reverse=True)
    
    model_bundle = {
        "pipeline": best_pipeline,
        "best_model_name": best_model_name,
        "results": results,
        "feature_importances": feature_importances,
        "tuning_info": tuning_info,
        "dataset_stats": {
            "total_samples": total_samples,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features_count": X.shape[1],
            "transformed_features_count": len(all_transformed_feature_names),
            "missing_values": missing_values,
            "duplicates": duplicates,
            "class_distribution": {
                "Low Risk (0)": int(class_counts.get(0, 0)),
                "High Risk (1)": int(class_counts.get(1, 0))
            }
        },
        "feature_names": all_transformed_feature_names
    }
    
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(model_bundle, MODEL_SAVE_PATH)
    print(f"Model successfully saved to {MODEL_SAVE_PATH}")
    print(f"Best performing model: {best_model_name} (F1 Score: {results[best_model_name]['f1_score']})")
    
    return model_bundle

if __name__ == "__main__":
    train_and_evaluate_models()
