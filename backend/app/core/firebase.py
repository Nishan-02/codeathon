import logging
import os
import uuid
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_app = None
db = None

# Mock Firestore store for local offline testing when Firebase credentials are not provided
_mock_storage = {
    "topics": {
        "sample_1": {
            "id": "sample_1",
            "user_id": "test_user_1",
            "subject": "Operating Systems",
            "topic": "Process Synchronization",
            "difficulty": 8,
            "hours_allocated": 2.5,
            "actual_hours_spent": 2.0,
            "due_date": datetime.now().strftime("%Y-%m-%d"),
            "is_completed": True,
            "status": "completed",
        },
        "sample_2": {
            "id": "sample_2",
            "user_id": "test_user_1",
            "subject": "Database Management",
            "topic": "Normalization & BCNF",
            "difficulty": 6,
            "hours_allocated": 3.0,
            "actual_hours_spent": 1.0,
            "due_date": datetime.now().strftime("%Y-%m-%d"),
            "is_completed": False,
            "status": "pending",
        },
    }
}


class MockDocRef:
    def __init__(self, collection_name: str, doc_id: str):
        self.collection_name = collection_name
        self.id = doc_id

    def set(self, data: dict):
        _mock_storage.setdefault(self.collection_name, {})[self.id] = data

    def update(self, data: dict):
        if self.id in _mock_storage.get(self.collection_name, {}):
            _mock_storage[self.collection_name][self.id].update(data)

    def get(self):
        data = _mock_storage.get(self.collection_name, {}).get(self.id)
        return MockDocSnapshot(self.id, data)


class MockDocSnapshot:
    def __init__(self, doc_id: str, data: dict):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data.copy() if self._data else {}


class MockCollectionQuery:
    def __init__(self, collection_name: str, field: str = None, op: str = None, value: any = None):
        self.collection_name = collection_name
        self.field = field
        self.op = op
        self.value = value

    def where(self, field: str, op: str, value: any):
        return MockCollectionQuery(self.collection_name, field, op, value)

    def document(self, doc_id: str = None):
        if not doc_id:
            doc_id = str(uuid.uuid4())[:8]
        return MockDocRef(self.collection_name, doc_id)

    def stream(self):
        docs = _mock_storage.get(self.collection_name, {}).values()
        if self.field and self.op == "==":
            docs = [d for d in docs if d.get(self.field) == self.value]
        return [MockDocSnapshot(d.get("id", ""), d) for d in docs]


class MockFirestoreClient:
    def collection(self, name: str):
        return MockCollectionQuery(name)


def initialize_firebase():
    global _firebase_app, db
    if not firebase_admin._apps:
        try:
            if (
                hasattr(settings, "FIREBASE_PROJECT_ID")
                and settings.FIREBASE_PROJECT_ID
                and getattr(settings, "FIREBASE_CLIENT_EMAIL", None)
                and getattr(settings, "FIREBASE_PRIVATE_KEY", None)
            ):
                private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "private_key": private_key,
                }
                cred = credentials.Certificate(cred_dict)
                _firebase_app = firebase_admin.initialize_app(cred)
                db = firestore.client()
                logger.info("Firebase Admin and Firestore initialized via settings credentials.")
            else:
                _firebase_app = firebase_admin.initialize_app()
                db = firestore.client()
                logger.info("Firebase Admin and Firestore initialized with default credentials.")
        except Exception as e:
            logger.warning(f"Firebase credentials missing or failed ({e}). Falling back to local Mock Firestore.")
            db = MockFirestoreClient()
    else:
        try:
            db = firestore.client()
        except Exception:
            db = MockFirestoreClient()


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


# Initialize immediately upon import so `db` is globally available to routers
initialize_firebase()