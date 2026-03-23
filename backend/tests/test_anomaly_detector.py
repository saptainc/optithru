import pytest
from app.services.anomaly_detector import AnomalyDetector


class FakeQueryBuilder:
    """Chainable fake query builder for Supabase."""

    def __init__(self, data=None):
        self._data = data or []

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def is_(self, *args, **kwargs):
        return self

    def gte(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def insert(self, data):
        self._data = data
        return self

    def execute(self):
        class Result:
            pass
        r = Result()
        r.data = self._data
        return r


class FakeSupabase:
    def __init__(self, table_data=None):
        self._table_data = table_data or {}

    def table(self, name):
        return FakeQueryBuilder(self._table_data.get(name, []))


@pytest.mark.asyncio
async def test_anomaly_detector_no_issues():
    """Detector returns empty list when no anomalies."""
    supabase = FakeSupabase({
        "buffer_targets": [],
        "toc_snapshots": [],
        "anomalies": [],
    })
    detector = AnomalyDetector(supabase, "test-org")
    result = await detector.run_checks()
    assert result == []


@pytest.mark.asyncio
async def test_anomaly_detector_throughput_decline():
    """Detector flags throughput decline >15%."""
    supabase = FakeSupabase({
        "buffer_targets": [],
        "toc_snapshots": [
            {"total_throughput": 8000, "snapshot_date": "2026-03-22"},
            {"total_throughput": 10000, "snapshot_date": "2026-03-15"},
        ],
        "anomalies": [],
    })
    detector = AnomalyDetector(supabase, "test-org")
    result = await detector.run_checks()
    assert len(result) == 1
    assert result[0]["rule_id"] == "throughput_down_15pct"
    assert result[0]["severity"] == "warning"
    assert "20.0%" in result[0]["message"]
