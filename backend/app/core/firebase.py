import logging
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def initialize_firebase():
    global _firebase_app
    if not firebase_admin._apps:
        try:
            if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
                # Format key if newline characters were escaped
                private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "private_key": private_key,
                }
                cred = credentials.Certificate(cred_dict)
                _firebase_app = firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized with service account dict.")
            else:
                # Default application credentials or mock fallback for local dev when env not provided
                _firebase_app = firebase_admin.initialize_app()
                logger.info("Firebase Admin initialized with default credentials.")
        except Exception as e:
            logger.warning(f"Firebase Admin SDK initialization warning: {e}. Token verification might require proper env variables.")


def verify_firebase_token(id_token: str) -> dict:
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
