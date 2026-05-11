import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app, raise_server_exceptions=False)

def test_cors_headers_allowed_origin():
    response = client.get(
        "/auth/reports",
        headers={"Origin": "https://primeiroolhar.app.br", "Authorization": "Bearer invalid"},
    )
    assert response.status_code == 401
    assert response.headers.get("access-control-allow-origin") == "https://primeiroolhar.app.br"
    assert response.headers.get("cross-origin-opener-policy") == "same-origin"

@pytest.mark.asyncio
async def test_exception_handler_no_wildcard_header():
    from api.main import global_exception_handler
    from fastapi import Request
    
    # Mock a simple request
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(b"origin", b"https://primeiroolhar.app.br")]
    }
    req = Request(scope)
    
    response = await global_exception_handler(req, RuntimeError("test exception"))
    
    assert response.status_code == 500
    # Our handler should NOT set this header (it's empty in our code)
    assert "access-control-allow-origin" not in response.headers
