def test_get_corridor_stations(client):
    response = client.get("/api/corridor/stations")
    assert response.status_code == 200
    stations = response.json()
    assert isinstance(stations, list)
    assert len(stations) > 0

    # Ensure chainage is strictly monotonically non-decreasing
    distances = [s["distance_km"] for s in stations]
    assert distances == sorted(distances)

    codes = [s["code"] for s in stations]
    assert "BINA" in codes
    assert "ET" in codes or "BPL" in codes

def test_get_corridor_sections(client):
    response = client.get("/api/corridor/sections")
    assert response.status_code == 200
    sections = response.json()
    assert isinstance(sections, list)
    assert len(sections) > 0

    first = sections[0]
    assert "section_id" in first
    assert "station_from" in first
    assert "station_to" in first
    assert "length_km" in first
    assert "kavach_status" in first
