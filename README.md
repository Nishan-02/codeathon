# Student Study Planner & Progress Tracker

A full-stack, cross-platform Student Study Planner & Progress Tracker built with React Native (Expo Router) for frontend and Python (FastAPI + PostgreSQL) for backend, using Firebase Authentication.

## Project Overview

This application helps students organize their academic life by managing subjects, topics, exam dates, assignment deadlines, available study hours, and generating personalized daily study schedules with progress tracking.

The architecture is designed to be modular and scalable, allowing advanced AI capabilities (AI Study Assistant, quiz generator, document processing/RAG, adaptive scheduling) to be integrated easily in future phases.

## Technology Stack

- **Frontend**: React Native, Expo (SDK 51+), Expo Router, TypeScript, Firebase Auth SDK
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, Firebase Admin SDK
- **Database**: PostgreSQL
- **Authentication**: Firebase Authentication (ID Tokens verified via FastAPI middleware)

## Architecture

```
React Native + Expo App
          │
          │ Firebase Authentication
          ▼
   Firebase ID Token
          │
          │ REST API (Header: Authorization: Bearer <token>)
          ▼
    FastAPI Backend
          │
          │ Firebase Admin SDK Token Verification
          ▼
     PostgreSQL DB (SQLAlchemy)
```

## Directory Structure

```
student-study-planner/
├── frontend/             # Expo React Native mobile/web app
│   ├── app/              # Expo Router pages and tabs
│   ├── components/       # Reusable UI components
│   ├── context/          # React contexts (AuthContext)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API clients and Firebase integration
│   ├── types/            # TypeScript data interfaces
│   └── utils/            # Utility functions
├── backend/              # Python FastAPI server
│   ├── app/
│   │   ├── core/         # Security, config, dependencies, Firebase admin
│   │   ├── database/     # DB engine and session configuration
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic data schemas
│   │   ├── routers/      # API route handlers
│   │   ├── services/     # Business logic services
│   │   └── utils/        # Backend helper functions
│   └── tests/            # Test suites
├── docker-compose.yml    # Docker configuration for local PostgreSQL
└── README.md
```

## Prerequisites

- Node.js (v18+) & npm
- Python (v3.10+)
- Docker & Docker Compose (optional, for local PostgreSQL)

## Setup & Running

### 1. Database Setup (PostgreSQL)

Using Docker:
```bash
docker-compose up -d
```
Alternatively, use a local PostgreSQL instance listening on `localhost:5432` with database `study_planner`.

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Update .env with your PostgreSQL credentials and Firebase Admin SDK setup

uvicorn app.main:app --reload --port 8000
```
Backend API docs will be accessible at: `http://localhost:8000/docs`
Health check: `http://localhost:8000/api/health`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Update .env with your Expo Public variables and Firebase Web configuration

npx expo start
```

## Authentication Flow

1. User registers/logins on the frontend via Firebase Authentication.
2. Frontend retrieves the Firebase ID Token using `getIdToken()`.
3. Every REST request to the FastAPI backend includes `Authorization: Bearer <token>`.
4. FastAPI `get_current_user` dependency uses Firebase Admin SDK to verify the token, extract `uid`, and retrieve/create the user record in PostgreSQL.

## Environment Variables

See `frontend/.env.example` and `backend/.env.example` for required environment variable templates.
