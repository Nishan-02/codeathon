from datetime import datetime, date


def format_datetime(dt: datetime | None) -> str | None:
    if not dt:
        return None
    return dt.isoformat()


def format_date(d: date | None) -> str | None:
    if not d:
        return None
    return d.isoformat()
