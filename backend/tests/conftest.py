import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session")
def client():
    """
    Session-scoped TestClient for the full-stack FastAPI application.
    """
    with TestClient(app) as test_client:
        yield test_client
