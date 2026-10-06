from sqlalchemy.orm import Session
from app.models.user import User


class UserService:
    @staticmethod
    def get_by_firebase_uid(db: Session, firebase_uid: str) -> User | None:
        return db.query(User).filter(User.firebase_uid == firebase_uid).first()

    @staticmethod
    def create_user(db: Session, firebase_uid: str, email: str, name: str | None = None) -> User:
        user = User(firebase_uid=firebase_uid, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
