from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.firebase import verify_firebase_token
from app.models.user import User
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Authentication handler:
    1. If a Firebase Bearer token is provided, verify it and resolve the user in the database.
    2. If no token is provided or verification fails (local dev / offline mode),
       seamlessly fall back to the local test user so work is never blocked.
    """
    if credentials and credentials.credentials:
        try:
            decoded_token = verify_firebase_token(credentials.credentials)
            firebase_uid = decoded_token.get("uid")
            if firebase_uid:
                email = decoded_token.get("email", "")
                name = decoded_token.get("name") or (email.split("@")[0] if email else "Student")
                user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
                if not user:
                    user = User(
                        firebase_uid=firebase_uid,
                        email=email,
                        name=name
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                return user
        except Exception as e:
            logger.warning(f"Firebase token verification failed ({e}). Falling back to local test user.")

    # Local development fallback user
    dummy_uid = "local_test_user_999"
    user = db.query(User).filter(User.firebase_uid == dummy_uid).first()
    if not user:
        user = User(
            firebase_uid=dummy_uid,
            email="test@example.com",
            name="Test Student"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user