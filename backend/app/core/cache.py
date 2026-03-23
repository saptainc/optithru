"""Simple TTL cache for expensive computations."""
import time
from typing import Any

_cache: dict[str, tuple[Any, float]] = {}
DEFAULT_TTL = 300  # 5 minutes


def cache_get(key: str) -> Any | None:
    if key in _cache:
        value, expires_at = _cache[key]
        if time.time() < expires_at:
            return value
        del _cache[key]
    return None


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL):
    _cache[key] = (value, time.time() + ttl)


def cache_invalidate(prefix: str = ""):
    keys_to_delete = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_delete:
        del _cache[k]
