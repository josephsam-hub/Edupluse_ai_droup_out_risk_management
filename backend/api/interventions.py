from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
import datetime

from database.db import get_db
from database.models import InterventionDB, StudentDB

router = APIRouter(prefix="/api/interventions", tags=["Interventions"])

class InterventionCreateSchema(BaseModel):
    student_id: str
    title: str
    description: str
    assigned_to: str = "Academic Counselor"
    priority: str = "Medium" # Low, Medium, High

class InterventionUpdateSchema(BaseModel):
    status: Optional[str] = None # Pending, In Progress, Resolved
    assigned_to: Optional[str] = None
    description: Optional[str] = None

@router.get("")
def list_interventions(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterventionDB)
    if status:
        query = query.filter(InterventionDB.status == status)
    if priority:
        query = query.filter(InterventionDB.priority == priority)
        
    interventions = query.order_by(desc(InterventionDB.created_at)).all()
    
    results = []
    for item in interventions:
        student = db.query(StudentDB).filter(StudentDB.student_id == item.student_id).first()
        results.append({
            "id": item.id,
            "student_id": item.student_id,
            "student_name": student.name if student else "Unknown",
            "department": student.department if student else "N/A",
            "risk_level": student.risk_level if student else item.priority,
            "dropout_probability": student.probability if student else 0.0,
            "title": item.title,
            "description": item.description,
            "assigned_to": item.assigned_to,
            "status": item.status,
            "priority": item.priority,
            "created_at": item.created_at.isoformat()
        })
    return results

@router.post("")
def create_intervention(data: InterventionCreateSchema, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.student_id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    item = InterventionDB(
        student_id=data.student_id,
        title=data.title,
        description=data.description,
        assigned_to=data.assigned_to,
        priority=data.priority,
        status="Pending"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return {"message": "Intervention record created", "id": item.id}

@router.put("/{intervention_id}")
def update_intervention(intervention_id: int, data: InterventionUpdateSchema, db: Session = Depends(get_db)):
    item = db.query(InterventionDB).filter(InterventionDB.id == intervention_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervention not found")
        
    if data.status:
        item.status = data.status
    if data.assigned_to:
        item.assigned_to = data.assigned_to
    if data.description:
        item.description = data.description
        
    item.updated_at = datetime.datetime.utcnow()
    db.commit()
    
    return {"message": "Intervention updated successfully", "id": item.id, "status": item.status}
