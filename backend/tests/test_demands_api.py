import uuid

def test_get_demands_list(client):
    response = client.get("/api/demands")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_create_valid_demand(client):
    code = f"TEST-DEMAND-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_code": code,
        "source_system": "TMS",
        "department": "P_WAY",
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 10.0,
        "end_km": 18.5,
        "requested_date": "2026-09-25",
        "requested_start_minutes": 180,
        "requested_end_minutes": 360,
        "required_minutes": 120,
        "activity_description": "Automated Track Tamping (CSM)",
        "machinery_type": "TRACK_MACHINE",
        "machinery_id": "CSM-991",
        "power_block_required": False,
        "disconnection_required": True,
        "trust_score": 92.0,
        "severity_tier": "HIGH"
    }
    response = client.post("/api/demands", json=payload)
    assert response.status_code == 200
    created = response.json()
    assert created["demand_code"] == code
    assert created["required_minutes"] == 120
    assert "id" in created

    # Clean up
    del_resp = client.delete(f"/api/demands/{created['id']}")
    assert del_resp.status_code == 200

def test_create_demand_invalid_time_window(client):
    code = f"ERR-TIME-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_code": code,
        "source_system": "TMS",
        "department": "P_WAY",
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 10.0,
        "end_km": 18.5,
        "requested_date": "2026-09-25",
        "requested_start_minutes": 360,
        "requested_end_minutes": 180,  # Invalid: end < start
        "required_minutes": 60,
        "activity_description": "Invalid time window test",
        "machinery_type": "MANUAL",
    }
    response = client.post("/api/demands", json=payload)
    assert response.status_code == 422

def test_create_demand_invalid_duration_exceeding_window(client):
    code = f"ERR-DUR-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_code": code,
        "source_system": "TMS",
        "department": "P_WAY",
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 10.0,
        "end_km": 18.5,
        "requested_date": "2026-09-25",
        "requested_start_minutes": 100,
        "requested_end_minutes": 160,  # 60 min window
        "required_minutes": 120,       # Exceeds 60 min window!
        "activity_description": "Exceeding duration test",
        "machinery_type": "MANUAL",
    }
    response = client.post("/api/demands", json=payload)
    assert response.status_code == 422

def test_create_demand_invalid_spatial_boundary(client):
    code = f"ERR-KM-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_code": code,
        "source_system": "TMS",
        "department": "P_WAY",
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 50.0,
        "end_km": 20.0,  # Invalid: end < start
        "requested_date": "2026-09-25",
        "requested_start_minutes": 120,
        "requested_end_minutes": 240,
        "required_minutes": 60,
        "activity_description": "Invalid KM test",
        "machinery_type": "MANUAL",
    }
    response = client.post("/api/demands", json=payload)
    assert response.status_code == 422

def test_update_demand_and_filter(client):
    code = f"UPDATE-DEMAND-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "demand_code": code,
        "source_system": "TMS",
        "department": "OHE",
        "section_from": "BINA",
        "section_to": "KIKA",
        "start_km": 5.0,
        "end_km": 12.0,
        "requested_date": "2026-09-25",
        "requested_start_minutes": 60,
        "requested_end_minutes": 180,
        "required_minutes": 90,
        "activity_description": "Catenary wire replacement",
        "machinery_type": "OHE_WAGON",
    }
    create_resp = client.post("/api/demands", json=payload)
    assert create_resp.status_code == 200
    demand_id = create_resp.json()["id"]

    # Update description and required_minutes
    update_payload = {
        "activity_description": "Updated Catenary wire replacement (Speed Inspection)",
        "required_minutes": 80
    }
    update_resp = client.put(f"/api/demands/{demand_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["activity_description"] == update_payload["activity_description"]
    assert updated["required_minutes"] == 80

    # Filter by department
    filtered_resp = client.get("/api/demands?department=OHE")
    assert filtered_resp.status_code == 200
    matching = [d for d in filtered_resp.json() if d["id"] == demand_id]
    assert len(matching) == 1

    # Cleanup
    client.delete(f"/api/demands/{demand_id}")
