import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Student Study Planner API"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/study_planner"
    
    # Firebase configuration
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    
    # OpenRouter / AI Configuration
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openrouter/free"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
