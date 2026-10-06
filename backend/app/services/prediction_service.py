from typing import Any, Union


class PredictionService:
    @staticmethod
    def parse_difficulty(difficulty: Union[str, int, float, None]) -> float:
        if difficulty is None:
            return 6.0
        
        if isinstance(difficulty, (int, float)):
            return float(difficulty)
            
        diff_str = str(difficulty).strip().lower()
        mapping = {
            "easy": 3.0,
            "medium": 6.0,
            "hard": 9.0,
        }
        if diff_str in mapping:
            return mapping[diff_str]
            
        try:
            return float(diff_str)
        except ValueError:
            return 6.0

    @staticmethod
    def predict_performance(total_hours: float, completion_ratio: float, avg_diff: float) -> float:
        """
        Estimate exam performance (0 - 100%) based on:
        - Topic completion ratio (up to 70 pts)
        - Study hours dedicated (up to 20 pts)
        - Syllabus difficulty factor (up to 10 pts)
        """
        base_completion_score = completion_ratio * 70.0
        study_effort_score = min(total_hours * 2.0, 20.0)
        difficulty_bonus = max(0.0, min(10.0, (10.0 - avg_diff) * 1.0))
        
        raw_score = base_completion_score + study_effort_score + difficulty_bonus
        clamped_score = max(0.0, min(100.0, raw_score))
        return round(clamped_score, 1)


prediction_service = PredictionService()
