# EduPulse AI — API Documentation

## Base URL

```
http://localhost:8000
```

Interactive API docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs) (Swagger UI)

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/login

Login and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "full_name": "System Administrator",
    "email": "admin@edupulse.ai"
  }
}
```

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "username": "new_faculty",
  "password": "password123",
  "role": "Faculty",
  "full_name": "Dr. New Faculty",
  "email": "faculty@university.edu"
}
```

### GET /api/auth/me

Returns the current authenticated user's profile.

---

## Students

### GET /api/students
List all students. Supports query params: `search`, `department`, `risk_level`.

### POST /api/students
Create a new student record.

### GET /api/students/{student_id}
Get a specific student's details with prediction history.

### PUT /api/students/{student_id}
Update student information.

### DELETE /api/students/{student_id}
Delete a student (Admin only).

---

## Predictions

### POST /api/predict
Predict dropout risk for a single student.

**Request Body:**
```json
{
  "student_id": "STU001"
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "student_name": "Aarav Sharma",
  "risk_level": "High",
  "probability": 0.82,
  "probability_pct": 82.0,
  "model_used": "Random Forest (Tuned)",
  "risk_factors": ["Low attendance", "Poor GPA"],
  "recommendations": ["Attendance counselling", "Academic support"]
}
```

### POST /api/batch-predict
Upload a CSV file for batch prediction. Uses `multipart/form-data`.

---

## Explainability (SHAP)

### GET /api/ml/feature-importance
Returns global feature importance from the trained model.

### GET /api/ml/shap-explanation/{student_id}
Returns SHAP-based explanation for a specific student's prediction.

---

## Analytics

### GET /api/analytics/overview
System-wide overview statistics.

### GET /api/analytics/risk-distribution
Risk category distribution data for charts.

### GET /api/analytics/attendance
Attendance trends by department and month.

### GET /api/analytics/engagement
Student engagement metrics and trends.

---

## Teacher

### GET /api/teacher/dashboard
Teacher-specific KPI summary.

### GET /api/teacher/students
Students visible to the authenticated teacher.

### GET /api/teacher/at-risk
High and medium risk students sorted by probability.

---

## Notifications

### GET /api/notifications
List notifications. Params: `unread_only`, `priority`.

### PUT /api/notifications/{id}/read
Mark a notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

---

## Model

### GET /api/model-performance
Returns metrics for all trained models plus dataset statistics.

### POST /api/train
Trigger model retraining pipeline.

---

## Reports

### GET /api/report/{student_id}
Generate a report for a specific student.

---

## Health Check

### GET /api/health
```json
{
  "status": "healthy",
  "system": "EduPulse AI Machine Learning Backend",
  "api_version": "2.0.0"
}
```

---

## Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| faculty | faculty123 | Faculty |
| counselor | counselor123 | Counselor |
