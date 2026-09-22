def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert "kavach_status" in data
    assert data["kavach_status"] == "SIL-4 ACTIVE"
    assert data["api_v1"] == "/api"

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["database"] == "CONNECTED"
    assert "OR-Tools" in data["solver_engine"]
