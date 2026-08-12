import time
from collections import defaultdict

from fastapi import HTTPException, Request, status


class RateLimiter:
    """
    In-memory sliding-window limiter, keyed by client IP. Good enough for a
    single-process app at this scale - would move to a shared store (Redis)
    if this ever ran as multiple worker processes/instances, since each
    process would otherwise track its own separate counts.
    """

    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def __call__(self, request: Request) -> None:
        key = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window_seconds
        hits = self._hits[key]
        while hits and hits[0] < cutoff:
            hits.pop(0)
        if len(hits) >= self.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a few minutes and try again.",
            )
        hits.append(now)


# separate limiters per endpoint so a login lockout doesn't also block signup
login_rate_limit = RateLimiter(max_attempts=8, window_seconds=300)
signup_rate_limit = RateLimiter(max_attempts=5, window_seconds=600)
email_action_rate_limit = RateLimiter(max_attempts=5, window_seconds=600)
code_guess_rate_limit = RateLimiter(max_attempts=10, window_seconds=600)
