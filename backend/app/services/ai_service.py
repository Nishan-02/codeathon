import logging
import json
import re
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def analyze_voice_assessment(
    subject_id: str,
    subject_name: str,
    answers: List[Dict[str, Any]],
    student_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Analyzes student voice assessment answers and returns structured JSON predictions and recommendations.
    """
    answers_by_id = {a.get("questionId"): a.get("answerText", "") for a in answers}

    # Extract answers
    confidence_raw = answers_by_id.get("confidence", "5")
    hours_raw = answers_by_id.get("daily_hours", "2")
    weak_raw = answers_by_id.get("difficult_topics", "")
    syllabus_raw = answers_by_id.get("syllabus_completion", "50%")
    consistency_raw = answers_by_id.get("consistency", "medium")
    exam_ready_raw = answers_by_id.get("exam_readiness", "")

    # Try LLM integration if OpenRouter key is set
    if settings.OPENROUTER_API_KEY:
        try:
            llm_result = _call_llm_assessment(subject_name, answers, student_data)
            if llm_result:
                return llm_result
        except Exception as e:
            logger.warning(f"LLM API call failed, using deterministic academic analyzer: {e}")

    # Fallback to intelligent deterministic academic evaluation
    return _heuristic_assessment(
        subject_name,
        confidence_raw,
        hours_raw,
        weak_raw,
        syllabus_raw,
        consistency_raw,
        exam_ready_raw,
        student_data
    )


def _call_llm_assessment(
    subject_name: str,
    answers: List[Dict[str, Any]],
    student_data: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    prompt = f"""
You are an expert academic tutor and study advisor. Analyze the following student self-assessment for the subject '{subject_name}'.

Student Answers:
{json.dumps(answers, indent=2)}

Additional Context:
{json.dumps(student_data or {}, indent=2)}

Return ONLY a raw valid JSON object with EXACTLY the following structure (no markdown code blocks, no extra text):
{{
  "readinessScore": <number between 0 and 100>,
  "riskLevel": "<low | medium | high>",
  "confidenceLevel": "<low | medium | high>",
  "estimatedStudyHoursPerDay": <number>,
  "weakAreas": [<list of string topics identified as difficult>],
  "recommendations": [<list of 3 actionable study advice strings>]
}}
"""
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": settings.OPENROUTER_MODEL or "openrouter/free",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2
    }

    with httpx.Client(timeout=10.0) as client:
        res = client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
        if res.status_code == 200:
            content = res.json()["choices"][0]["message"]["content"]
            clean_json = re.sub(r'```json\s*|\s*```', '', content).strip()
            parsed = json.loads(clean_json)
            if "readinessScore" in parsed and "riskLevel" in parsed:
                return parsed
    return None


def _heuristic_assessment(
    subject_name: str,
    confidence_raw: str,
    hours_raw: str,
    weak_raw: str,
    syllabus_raw: str,
    consistency_raw: str,
    exam_ready_raw: str,
    student_data: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    # Extract numerical confidence (1-10)
    conf_digits = re.findall(r'\b(10|[1-9])\b', confidence_raw)
    conf_score = int(conf_digits[0]) if conf_digits else 5

    # Extract daily hours
    hour_digits = re.findall(r'\b(\d+(?:\.\d+)?)\b', hours_raw)
    daily_hours = float(hour_digits[0]) if hour_digits else 2.0
    if daily_hours > 12:
        daily_hours = 2.5

    # Determine confidence level
    if conf_score >= 8:
        conf_level = "high"
    elif conf_score >= 5:
        conf_level = "medium"
    else:
        conf_level = "low"

    # Extract weak areas
    weak_areas = []
    if weak_raw:
        # Split by comma or 'and'
        raw_split = re.split(r'[,;&]|\band\b', weak_raw, flags=re.IGNORECASE)
        for item in raw_split:
            cleaned = item.strip().title()
            if cleaned and len(cleaned) > 2 and cleaned.lower() not in ["none", "nothing", "no", "n/a"]:
                weak_areas.append(cleaned)
    if not weak_areas:
        weak_areas = [f"{subject_name} Core Concepts", "Problem Solving"]

    # Calculate readiness score
    base_score = conf_score * 7
    if "yes" in exam_ready_raw.lower() or "ready" in exam_ready_raw.lower():
        base_score += 15
    elif "no" in exam_ready_raw.lower() or "not" in exam_ready_raw.lower():
        base_score -= 10

    if daily_hours >= 3.0:
        base_score += 10
    elif daily_hours < 1.0:
        base_score -= 10

    readiness = max(15, min(95, int(base_score)))

    # Risk level
    if readiness >= 75:
        risk_level = "low"
    elif readiness >= 50:
        risk_level = "medium"
    else:
        risk_level = "high"

    # Recommended daily study time
    rec_hours = round(max(1.5, round((100 - readiness) / 25, 1) + 1.0), 1)

    # Recommendations
    recommendations = [
        f"Allocate at least {rec_hours} hours daily for structured {subject_name} revision.",
        f"Focus specifically on strengthening: {', '.join(weak_areas[:2])}.",
        "Use active recall techniques and practice 25-minute Pomodoro focus blocks."
    ]

    return {
        "readinessScore": readiness,
        "riskLevel": risk_level,
        "confidenceLevel": conf_level,
        "estimatedStudyHoursPerDay": rec_hours,
        "weakAreas": weak_areas,
        "recommendations": recommendations,
    }
