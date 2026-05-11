import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_cors_headers_allowed_origin():
    response = client.get(
        "/api/reports",
        headers={"Origin": "https://primeiroolhar.app.br", "Authorization": "Bearer invalid"},
    )
    assert response.status_code == 401
    assert response.headers.get("access-control-allow-origin") == "https://primeiroolhar.app.br"
    assert response.headers.get("cross-origin-opener-policy") == "same-origin"

def test_exception_handler_no_wildcard_header():
    @app.get("/test-exception")
    def raise_error():
        raise RuntimeError("test exception")
    response = client.get(
        "/test-exception",
        headers={"Origin": "https://primeiroolhar.app.br"},
    )
    assert response.status_code == 500
    assert response.headers.get("access-control-allow-origin") == "https://primeiroolhar.app.br"
