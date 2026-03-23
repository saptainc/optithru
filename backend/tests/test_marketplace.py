import pytest
from app.services.amazon_sync import AmazonSyncService
from app.services.meesho_sync import MeeshoCSVParser


@pytest.mark.asyncio
async def test_amazon_sync_placeholder():
    """Amazon sync returns placeholder when no real credentials."""
    service = AmazonSyncService(
        seller_id="TEST123",
        access_token="fake-token",
        supabase_client=None,
        org_id="test-org",
    )
    result = await service.sync_catalog()
    assert result["products"] == 0
    assert "Configure" in result["message"]

    orders = await service.sync_orders()
    assert orders["orders"] == 0


@pytest.mark.asyncio
async def test_amazon_default_marketplace():
    """Amazon defaults to India marketplace."""
    service = AmazonSyncService(
        seller_id="TEST123",
        access_token="fake-token",
    )
    assert service.marketplace_id == "A21TJRUUN4KGV"


@pytest.mark.asyncio
async def test_meesho_csv_empty():
    """Meesho parser handles empty CSV."""

    class FakeTable:
        def upsert(self, *args, **kwargs):
            return self
        def execute(self):
            return None

    class FakeSupabase:
        def table(self, name):
            return FakeTable()

    parser = MeeshoCSVParser(FakeSupabase(), "test-org")
    result = await parser.parse_and_import("")
    assert result["orders"] == 0


@pytest.mark.asyncio
async def test_meesho_csv_parse():
    """Meesho parser correctly parses CSV rows."""
    upserted = []

    class FakeTable:
        def upsert(self, data, **kwargs):
            upserted.append(data)
            return self
        def execute(self):
            return None

    class FakeSupabase:
        def table(self, name):
            return FakeTable()

    csv_content = "order_id,selling_price\nMSH001,499\nMSH002,899\n"
    parser = MeeshoCSVParser(FakeSupabase(), "test-org")
    result = await parser.parse_and_import(csv_content)
    assert result["orders"] == 2
    assert len(upserted) == 2
    assert upserted[0]["order_number"] == "MSH001"
    assert upserted[0]["total"] == 499.0
    assert upserted[1]["external_id"] == "meesho_MSH002"
