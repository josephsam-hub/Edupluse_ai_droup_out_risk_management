"""
notifications.py – EduPulse AI
Provides API endpoints for managing user notifications.

Endpoints
---------
GET  /api/notifications            – List notifications for the current user
PUT  /api/notifications/read-all   – Mark every notification as read (current user)
PUT  /api/notifications/{id}/read  – Mark a single notification as read
POST /api/notifications            – Create a notification (Admin only)
"""

import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import NotificationDB, UserDB
from utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class NotificationCreateSchema(BaseModel):
    """Payload for creating a new notification (Admin only)."""
    title: str
    message: str
    priority: str = "Medium"           # High | Medium | Low
    notification_type: str = "info"    # info | warning | alert
    related_student_id: Optional[str] = None
    # If None the notification is broadcast to every user
    target_username: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper: resolve the UserDB row for the authenticated user
# ---------------------------------------------------------------------------

def _resolve_user(current_user: dict, db: Session) -> UserDB:
    """Return the UserDB row that matches the JWT subject."""
    user = db.query(UserDB).filter(UserDB.username == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Authenticated user not found in database")
    return user


def _serialize(n: NotificationDB) -> dict:
    """Convert a NotificationDB row to the canonical response dict."""
    return {
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "priority": n.priority,
        "is_read": bool(n.is_read),
        "notification_type": n.notification_type,
        "related_student_id": n.related_student_id,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


# ---------------------------------------------------------------------------
# GET /api/notifications
# ---------------------------------------------------------------------------

@router.get("")
def list_notifications(
    unread_only: bool = Query(False, description="When true, return only unread notifications"),
    priority: Optional[str] = Query(None, description="Filter by priority: High | Medium | Low"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return notifications addressed to the current user **or** broadcast
    (user_id = NULL).  Supports optional filtering by read-status and priority.

    Response
    --------
    ```json
    {
      "notifications": [...],
      "unread_count": 3,
      "total": 10
    }
    ```
    """
    user = _resolve_user(current_user, db)

    # Base query: own notifications + broadcast notifications
    query = db.query(NotificationDB).filter(
        or_(
            NotificationDB.user_id == user.id,
            NotificationDB.user_id.is_(None),
        )
    )

    if unread_only:
        query = query.filter(NotificationDB.is_read == 0)

    if priority:
        query = query.filter(NotificationDB.priority == priority)

    # Newest first
    query = query.order_by(NotificationDB.created_at.desc())
    notifications = query.all()

    # Count unread across the full (unfiltered) set for the badge indicator
    unread_count = (
        db.query(NotificationDB)
        .filter(
            or_(
                NotificationDB.user_id == user.id,
                NotificationDB.user_id.is_(None),
            ),
            NotificationDB.is_read == 0,
        )
        .count()
    )

    return {
        "notifications": [_serialize(n) for n in notifications],
        "unread_count": unread_count,
        "total": len(notifications),
    }


# ---------------------------------------------------------------------------
# PUT /api/notifications/read-all  – must be defined BEFORE /{notification_id}
# ---------------------------------------------------------------------------

@router.put("/read-all")
def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark **all** unread notifications (own + broadcast) as read for the
    current user.  Broadcast notifications are updated globally since EduPulse
    does not maintain per-user read-receipts for broadcast rows; this matches
    the simplest dashboard UX expectation.
    """
    user = _resolve_user(current_user, db)

    updated = (
        db.query(NotificationDB)
        .filter(
            or_(
                NotificationDB.user_id == user.id,
                NotificationDB.user_id.is_(None),
            ),
            NotificationDB.is_read == 0,
        )
        .all()
    )

    for n in updated:
        n.is_read = 1

    db.commit()
    return {"message": f"{len(updated)} notification(s) marked as read"}


# ---------------------------------------------------------------------------
# PUT /api/notifications/{notification_id}/read
# ---------------------------------------------------------------------------

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a single notification as read.  The user must own the notification
    or it must be a broadcast notification.
    """
    user = _resolve_user(current_user, db)

    notification = (
        db.query(NotificationDB)
        .filter(
            NotificationDB.id == notification_id,
            or_(
                NotificationDB.user_id == user.id,
                NotificationDB.user_id.is_(None),
            ),
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notification_id} not found or not accessible",
        )

    notification.is_read = 1
    db.commit()

    return {"message": "Notification marked as read", "notification": _serialize(notification)}


# ---------------------------------------------------------------------------
# POST /api/notifications  – Admin only
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new notification.  **Requires Admin role.**

    - Set ``target_username`` to send to a specific user.
    - Omit ``target_username`` (or set to ``null``) for a broadcast notification
      visible to all users.
    """
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin users can create notifications",
        )

    target_user_id: Optional[int] = None
    if payload.target_username:
        target_user = (
            db.query(UserDB)
            .filter(UserDB.username == payload.target_username)
            .first()
        )
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target user '{payload.target_username}' not found",
            )
        target_user_id = target_user.id

    new_notification = NotificationDB(
        user_id=target_user_id,
        title=payload.title,
        message=payload.message,
        priority=payload.priority,
        notification_type=payload.notification_type,
        related_student_id=payload.related_student_id,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {
        "message": "Notification created successfully",
        "notification": _serialize(new_notification),
    }
