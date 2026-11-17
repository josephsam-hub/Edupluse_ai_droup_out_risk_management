from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from database.db import get_db
from database.models import UserDB
from utils.auth_utils import verify_password, hash_password, create_access_token, oauth2_scheme, decode_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterSchema(BaseModel):
    username: str
    password: str
    role: str = "Faculty" # Admin, Counselor, Faculty
    full_name: str
    email: EmailStr

class LoginSchema(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user_data: RegisterSchema, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(UserDB.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    new_user = UserDB(
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        full_name=user_data.full_name,
        email=user_data.email
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
            "full_name": new_user.full_name,
            "email": new_user.email
        }
    }

@router.post("/login")
def login(login_data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name,
            "email": user.email
        }
    }

@router.get("/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email
    }
