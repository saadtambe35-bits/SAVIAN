import uuid
from sqlmodel import Session, select
from app.database import sync_engine
from app.models.block_demand import BlockDemand
from app.models.schedule_result import ScheduleResult

def test_t409_generation_and_ledger(client):
    code = f"T409-DEM-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_id": 999,
        "demand_code": code,
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 12.0,
        "end_km": 18.0,
        "machinery_type": "BCM",
        "machinery_id": "BCM-102",
        "power_block_required": True,
        "disconnection_required": True,
        "requested_start_minutes": 120,
        "requested_end_minutes": 240,
        "required_minutes": 120,
        "station_master": "SM / BINA",
        "section_controller": "Sr DOM / BPL"
    }

    # 1. Generate Form T/409 Token
    gen_resp = client.post("/api/t409/generate", json=payload)
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert "auth_number" in gen_data
    assert "kavach_hash" in gen_data
    assert gen_data["demand_code"] == code
    assert gen_data["status"] == "APPROVED_SIL4"

    # 2. Verify RDSO Audit Ledger
    ledger_resp = client.get("/api/t409/ledger")
    assert ledger_resp.status_code == 200
    records = ledger_resp.json()
    matching = [r for r in records if r["token_id"] == gen_data["auth_number"]]
    assert len(matching) == 1
    assert matching[0]["demand_code"] == code

def test_pdf_possession_and_permit(client):
    code = f"PDF-DEM-{uuid.uuid4().hex[:6].upper()}"
    with Session(sync_engine) as session:
        demand = BlockDemand(
            demand_code=code,
            source_system="TMS",
            department="P_WAY",
            section_from="BINA",
            section_to="KIKA",
            start_km=4.0,
            end_km=10.0,
            requested_date="2026-09-25",
            requested_start_minutes=60,
            requested_end_minutes=180,
            required_minutes=120,
            activity_description="Turnout Sleeper Renewal",
            machinery_type="T-28",
            status="APPROVED",
            severity_tier="MEDIUM",
            priority_weight=5,
        )
        session.add(demand)
        session.commit()
        session.refresh(demand)
        demand_id = demand.id

    try:
        # Test /api/pdf/possession/{code}
        resp = client.get(f"/api/pdf/possession/{code}")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert resp.content.startswith(b"%PDF")

        # Test /api/pdf/permit/{code} alias
        alias_resp = client.get(f"/api/pdf/permit/{code}")
        assert alias_resp.status_code == 200
        assert alias_resp.headers["content-type"] == "application/pdf"
        assert alias_resp.content.startswith(b"%PDF")
    finally:
        with Session(sync_engine) as session:
            d = session.exec(select(BlockDemand).where(BlockDemand.id == demand_id)).first()
            if d:
                session.delete(d)
                session.commit()
