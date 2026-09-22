import uuid
from sqlmodel import Session, select
from app.database import sync_engine
from app.models.block_demand import BlockDemand

def test_lifecycle_stage_transitions(client):
    code = f"LC-{uuid.uuid4().hex[:6].upper()}"
    with Session(sync_engine) as session:
        demand = BlockDemand(
            demand_code=code,
            source_system="TMS",
            department="P_WAY",
            section_from="BINA",
            section_to="KIKA",
            start_km=5.0,
            end_km=15.0,
            requested_date="2026-09-25",
            requested_start_minutes=120,
            requested_end_minutes=300,
            required_minutes=120,
            activity_description="Ultrasonic Rail Flaw Detection (USFD)",
            machinery_type="USFD_TROLLEY",
            status="PROPOSED",
            severity_tier="MEDIUM",
            priority_weight=5,
        )
        session.add(demand)
        session.commit()
        session.refresh(demand)
        demand_id = demand.id

    try:
        # Step 1: Legal transition PROPOSED -> REVIEWED
        rev_payload = {
            "to_stage": "REVIEWED",
            "actor_id": "EMP-4401",
            "actor_role": "SectionController",
            "justification": "Checked line capacity, feasible slot identified."
        }
        resp = client.patch(f"/api/lifecycle/demands/{code}/transition", json=rev_payload)
        assert resp.status_code == 200
        assert resp.json()["status"] == "REVIEWED"

        # Step 2: Legal transition REVIEWED -> APPROVED
        appr_payload = {
            "to_stage": "APPROVED",
            "actor_id": "OFF-1092",
            "actor_role": "SrDOM",
            "justification": "Approved for execution in upcoming corridor window."
        }
        resp = client.patch(f"/api/lifecycle/demands/{code}/transition", json=appr_payload)
        assert resp.status_code == 200
        assert resp.json()["status"] == "APPROVED"

        # Step 3: Illegal transition APPROVED -> PROPOSED (must fail 400)
        illegal_payload = {
            "to_stage": "PROPOSED",
            "actor_id": "EMP-4401",
            "actor_role": "SectionController",
            "justification": "Attempting illegal backward progression"
        }
        resp = client.patch(f"/api/lifecycle/demands/{code}/transition", json=illegal_payload)
        assert resp.status_code == 400

        # Step 4: Legal rejection from APPROVED -> REJECTED
        rej_payload = {
            "to_stage": "REJECTED",
            "actor_id": "OFF-1092",
            "actor_role": "SrDOM",
            "justification": "Emergency rake movement takes priority."
        }
        resp = client.patch(f"/api/lifecycle/demands/{code}/transition", json=rej_payload)
        assert resp.status_code == 200
        assert resp.json()["status"] == "REJECTED"

        # Step 5: Verify Audit Log Trail
        audit_resp = client.get(f"/api/lifecycle/demands/{code}/audit")
        assert audit_resp.status_code == 200
        logs = audit_resp.json()
        assert len(logs) >= 3
        stages = [log["to_stage"] for log in logs]
        assert "REVIEWED" in stages
        assert "APPROVED" in stages
        assert "REJECTED" in stages

    finally:
        with Session(sync_engine) as session:
            del_demand = session.exec(select(BlockDemand).where(BlockDemand.id == demand_id)).first()
            if del_demand:
                session.delete(del_demand)
                session.commit()
