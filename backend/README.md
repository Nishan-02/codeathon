# Student Study Planner - Backend API

FastAPI backend application with PostgreSQL database and Firebase Authentication.

## Setup Instructions

1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/macOS: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in configuration values:
   ```bash
   cp .env.example .env
   ```
5. Run PostgreSQL database (e.g. using `docker-compose up -d` at project root).
6. Start dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Endpoints Summary

- `GET /api/health` - System health status
- `GET /api/users/me` - Authenticated user info
- `GET /api/subjects` - List user subjects
- `POST /api/subjects` - Create subject
- `GET /api/subjects/{id}` - Get subject detail
- `PUT /api/subjects/{id}` - Update subject
- `DELETE /api/subjects/{id}` - Delete subject
- `GET /api/subjects/{subject_id}/topics` - List subject topics
- `POST /api/subjects/{subject_id}/topics` - Create topic
- `PUT /api/topics/{id}` - Update topic
- `DELETE /api/topics/{id}` - Delete topic
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `PUT /api/exams/{id}` - Update exam
- `DELETE /api/exams/{id}` - Delete exam
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/{id}` - Update assignment
- `DELETE /api/assignments/{id}` - Delete assignment
- `GET /api/planner` - List schedule items
- `POST /api/planner/generate` - Generate study schedule
- `PUT /api/planner/{id}` - Update schedule item
- `DELETE /api/planner/{id}` - Delete schedule item
- `GET /api/progress` - Get user overall & subject progress
- `GET /api/progress/{subject_id}` - Get specific subject progress
