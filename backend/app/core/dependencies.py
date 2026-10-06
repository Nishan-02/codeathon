from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.firebase import verify_firebase_token
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    decoded_token = verify_firebase_token(token)
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email", "")
    name = decoded_token.get("name") or decoded_token.get("email", "").split("@")[0] or "Student"
    
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing UID",
        )
        
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        # Auto-provision user record in PostgreSQL on first API call after Firebase signup
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user
