from app.services.toc_engine import TOCEngine

def test_throughput_calculation():
    engine = TOCEngine()
    # Kumkumadi Oil: $50 price, $12 COGS, $6 shipping
    # Processing: 50 * 0.029 + 0.30 = 1.75
    # TVC: 12 + 6 + 1.75 = 19.75
    # Throughput: 50 - 19.75 = 30.25
    t = engine.calculate_throughput(price=50, cogs=12, shipping=6)
    assert t == 30.25

def test_tcu_ranking():
    engine = TOCEngine()
    products = [
        {"name": "Moisturizer", "throughput": 52, "constraint_units": 15},
        {"name": "Kumkumadi Oil", "throughput": 32, "constraint_units": 18},
        {"name": "Gheesutra Emulsion", "throughput": 68, "constraint_units": 55},
    ]
    ranked = engine.rank_by_tcu(products, constraint_capacity=15000)
    assert ranked[0]["name"] == "Moisturizer"  # Highest T/CU: 3.47
    assert ranked[1]["name"] == "Kumkumadi Oil"  # T/CU: 1.78
    assert ranked[2]["name"] == "Gheesutra Emulsion"  # T/CU: 1.24

def test_buffer_calculation():
    engine = TOCEngine()
    buf = engine.calculate_buffer(avg_daily_usage=5, lead_time_days=14)
    assert buf["buffer_quantity"] == 105  # 5 * 14 * 1.5

def test_channel_tcu():
    engine = TOCEngine()
    # Email: $500 spend, $8400 throughput = 16.8 T/CU
    assert engine.calculate_channel_tcu(500, 8400) == 16.8
    # Meta: $4000 spend, $3150 throughput = 0.79 T/CU
    assert engine.calculate_channel_tcu(4000, 3150) == 0.79
