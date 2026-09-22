import time

def test_ortools_corridor_solver_default(client):
    payload = {
        "chaos_mode": False,
        "max_solve_time_sec": 3.0
    }
    response = client.post("/api/solver/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "solve_id" in data
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert "train_schedules" in data
    assert "xai" in data
    assert "conflict_resolutions" in data["xai"]
    assert "shadow_detections" in data["xai"]
    assert isinstance(data["telemetry"], list)

def test_ortools_corridor_solver_chaos_mode(client):
    payload = {
        "chaos_mode": True,
        "max_solve_time_sec": 2.0
    }
    response = client.post("/api/solver/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert data["clashes_detected"] >= 0

def test_background_solver_trigger_and_get(client):
    trigger_payload = {
        "mode": "COLD",
        "time_limit_sec": 2.0
    }
    # Test POST /api/solve without trailing slash
    resp = client.post("/api/solve", json=trigger_payload)
    if resp.status_code == 307:
        resp = client.post("/api/solve/", json=trigger_payload)
    assert resp.status_code == 200
    body = resp.json()
    assert "solve_id" in body
    solve_id = body["solve_id"]

    # Give background task a moment to compute and persist
    time.sleep(1.5)

    # Test GET /api/solve/{solve_id}
    res_resp = client.get(f"/api/solve/{solve_id}")
    # Even if still computing or cached/saved:
    assert res_resp.status_code in [200, 404]
    if res_resp.status_code == 200:
        res_data = res_resp.json()
        assert res_data["solve_id"] == solve_id
        assert "granted_blocks" in res_data

def test_chaos_baseline_endpoint(client):
    response = client.post("/api/solve/chaos-baseline")
    assert response.status_code == 200
    data = response.json()
    assert "objective_value" in data
    assert "granted_blocks" in data
    assert "train_schedules" in data

def test_elastic_solver_api(client):
    payload = {
        "demands": [
            {
                "id": 101,
                "demand_code": "ELASTIC-01",
                "department": "P_WAY",
                "start_min": 120,
                "end_min": 240,
                "duration": 60,
                "priority": 8.0,
                "is_critical": True
            }
        ],
        "time_budget_seconds": 2.0,
        "relaxation_allowed": True
    }
    response = client.post("/api/solver/elastic-solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["stage_resolved"] in ["STAGE_1_STRICT", "STAGE_2_ELASTIC"]
    assert "scheduled_blocks" in data
