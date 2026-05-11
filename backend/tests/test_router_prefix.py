import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_auth_route_exists():
    response = client.post(
        "/auth/google",
        json={"token": "dummy"},
        headers={"Origin": "https://primeiroolhar.app.br"},
    )
    assert response.status_code in (401, 400, 422)

def test_auth_route_not_under_api():
    response = client.post(
        "/api/google",
        json={"token": "dummy"},
        headers={"Origin": "https://primeiroolhar.app.br"},
    )
    assert response.status_code == 404
