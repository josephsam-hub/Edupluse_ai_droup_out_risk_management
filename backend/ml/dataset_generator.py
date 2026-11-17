import pandas as pd
import numpy as np
import os

def generate_synthetic_dataset(num_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic educational dataset for Student Dropout Risk Prediction.
    Follows academic patterns: attendance, GPA, LMS engagement, and financial/support factors
    strongly influence academic persistence.
    """
    np.random.seed(random_state)
    
    departments = ["Computer Science", "Electronics & Comm", "Mechanical Eng", "Civil Eng", "Business Admin", "Data Science"]
    first_names = ["Aarav", "Ananya", "Rohan", "Priya", "Vikram", "Neha", "Aditya", "Sneha", "Rahul", "Kavya",
                   "Arjun", "Ishita", "Siddharth", "Meera", "Kabir", "Riya", "Dev", "Pooja", "Amit", "Diya",
                   "Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Cameron", "Dakota"]
    last_names = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Joshi", "Kumar", "Mehta",
                  "Rao", "Chowdhury", "Deshmukh", "Iyer", "Banerjee", "Smith", "Johnson", "Williams", "Brown", "Jones"]
    
    student_ids = [f"STU{str(i).zfill(4)}" for i in range(1, num_samples + 1)]
    names = [f"{np.random.choice(first_names)} {np.random.choice(last_names)}" for _ in range(num_samples)]
    dept_choices = np.random.choice(departments, size=num_samples)
    semesters = np.random.randint(1, 9, size=num_samples)
    ages = np.random.randint(18, 25, size=num_samples)
    
    # Base continuous distributions
    previous_gpa = np.round(np.clip(np.random.normal(7.2, 1.4, num_samples), 3.0, 10.0), 2)
    # Current GPA correlated with previous GPA with potential trend
    gpa_delta = np.random.normal(-0.1, 0.8, num_samples)
    current_gpa = np.round(np.clip(previous_gpa + gpa_delta, 2.5, 10.0), 2)
    
    marks_percentage = np.round(np.clip(current_gpa * 9.5 + np.random.normal(0, 4, num_samples), 30.0, 100.0), 1)
    
    # Failed subjects: inverse to current GPA
    failed_subjects_prob = np.clip((8.5 - current_gpa) / 6.0, 0.05, 0.85)
    failed_subjects = np.array([np.random.binomial(4, p) for p in failed_subjects_prob])
    
    attendance_percentage = np.round(np.clip(np.random.normal(78, 15, num_samples) - failed_subjects * 3, 35.0, 100.0), 1)
    absent_days = np.round(np.clip((100 - attendance_percentage) * 0.4 + np.random.normal(0, 2, num_samples), 0, 35)).astype(int)
    late_arrivals = np.random.randint(0, 15, num_samples)
    
    # Engagement
    lms_logins_per_week = np.round(np.clip(attendance_percentage / 5.0 + np.random.normal(0, 3, num_samples), 1, 30)).astype(int)
    study_hours_per_week = np.round(np.clip(current_gpa * 2.5 + np.random.normal(0, 3, num_samples), 2, 40)).astype(int)
    assignment_completion_rate = np.round(np.clip(attendance_percentage * 0.85 + np.random.normal(5, 10, num_samples), 20.0, 100.0), 1)
    internal_assessment_score = np.round(np.clip(marks_percentage * 0.9 + np.random.normal(0, 5, num_samples), 20.0, 100.0), 1)
    exam_performance_score = np.round(np.clip(marks_percentage + np.random.normal(-2, 6, num_samples), 20.0, 100.0), 1)
    
    assignment_consistency = np.round(np.clip(assignment_completion_rate + np.random.normal(0, 8, num_samples), 15.0, 100.0), 1)
    classroom_participation = np.clip(np.round(attendance_percentage / 12.0 + np.random.normal(0, 1, num_samples)), 1, 10).astype(int)
    online_activity_hours = np.round(np.clip(lms_logins_per_week * 1.2 + np.random.normal(0, 2, num_samples), 0.5, 45.0), 1)
    
    # Support & Behavioral
    scholarship = np.random.choice([0, 1], size=num_samples, p=[0.75, 0.25])
    financial_difficulty = np.random.choice([0, 1], size=num_samples, p=[0.7, 0.3])
    mentoring_available = np.random.choice([0, 1], size=num_samples, p=[0.4, 0.6])
    parent_support_level = np.random.randint(1, 6, num_samples)
    distance_from_institute = np.round(np.clip(np.random.exponential(12, num_samples), 1, 60), 1)
    
    # Calculate ground truth probability logit for dropout risk
    # Risk factors: Low attendance (<70), Low GPA (<5.5), High failed subjects, Low assignment completion, financial difficulty
    risk_score = (
        (75.0 - attendance_percentage) * 0.08
        + (6.0 - current_gpa) * 0.65
        + (previous_gpa - current_gpa) * 0.4
        + failed_subjects * 0.75
        + (65.0 - assignment_completion_rate) * 0.04
        + (5 - lms_logins_per_week) * 0.12
        + financial_difficulty * 0.5
        - scholarship * 0.4
        - mentoring_available * 0.3
        + (distance_from_institute / 30.0) * 0.3
        - (parent_support_level - 3) * 0.2
        + np.random.normal(0, 0.6, num_samples) # Realistic noise
    )
    
    # Convert risk_score to binary dropout_risk (0 or 1) using sigmoid threshold
    prob = 1 / (1 + np.exp(-risk_score))
    dropout_risk = (prob > 0.52).astype(int)
    
    df = pd.DataFrame({
        "student_id": student_ids,
        "name": names,
        "department": dept_choices,
        "semester": semesters,
        "age": ages,
        "previous_gpa": previous_gpa,
        "current_gpa": current_gpa,
        "marks_percentage": marks_percentage,
        "failed_subjects": failed_subjects,
        "assignment_completion_rate": assignment_completion_rate,
        "internal_assessment_score": internal_assessment_score,
        "exam_performance_score": exam_performance_score,
        "attendance_percentage": attendance_percentage,
        "absent_days": absent_days,
        "late_arrivals": late_arrivals,
        "lms_logins_per_week": lms_logins_per_week,
        "study_hours_per_week": study_hours_per_week,
        "assignment_consistency": assignment_consistency,
        "classroom_participation": classroom_participation,
        "online_activity_hours": online_activity_hours,
        "scholarship": scholarship,
        "financial_difficulty": financial_difficulty,
        "mentoring_available": mentoring_available,
        "parent_support_level": parent_support_level,
        "distance_from_institute": distance_from_institute,
        "dropout_risk": dropout_risk
    })
    
    return df

def ensure_dataset_exists(csv_path: str = "../../data/synthetic_student_dropout_dataset.csv"):
    abs_path = os.path.abspath(csv_path)
    if not os.path.exists(abs_path):
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        df = generate_synthetic_dataset(num_samples=1000)
        df.to_csv(abs_path, index=False)
        print(f"Generated synthetic dataset with {len(df)} records at: {abs_path}")
    return abs_path

if __name__ == "__main__":
    path = ensure_dataset_exists()
    print("Dataset verification complete:", path)
