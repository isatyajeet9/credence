from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import PlanType
from app.models.usage import Usage
from app.models.user import User

FREE_MONTHLY_CHECKS = 5
PRO_MONTHLY_CHECKS = 200


def _current_period_start() -> date:
    today = date.today()
    return today.replace(day=1)


def _get_or_create_usage(db: Session, user_id) -> Usage:
    period_start = _current_period_start()
    usage = (
        db.query(Usage)
        .filter(Usage.user_id == user_id, Usage.period_start == period_start)
        .first()
    )
    if usage is None:
        usage = Usage(user_id=user_id, period_start=period_start, checks_used=0, bulk_checks_used=0)
        db.add(usage)
        db.flush()
    return usage


def enforce_and_increment_check_limit(db: Session, user: User) -> Usage:
    usage = _get_or_create_usage(db, user.id)
    limit = PRO_MONTHLY_CHECKS if user.plan == PlanType.pro else FREE_MONTHLY_CHECKS

    if usage.checks_used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly check limit reached ({limit} checks on the {user.plan.value} plan). "
            + ("Upgrade to Pro for a higher limit." if user.plan == PlanType.free else "Your limit resets next month."),
        )

    usage.checks_used += 1
    db.flush()
    return usage


def enforce_pro_plan(user: User) -> None:
    if user.plan != PlanType.pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available on the Pro plan.",
        )


def record_bulk_check(db: Session, user: User) -> None:
    usage = _get_or_create_usage(db, user.id)
    usage.bulk_checks_used += 1
    db.flush()
