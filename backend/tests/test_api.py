"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/v1/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "time" in data


def test_get_config():
    """Test config endpoint."""
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert "strategy" in data
    assert "refresh_interval" in data


def test_get_frames():
    """Test frames endpoint."""
    response = client.get("/api/v1/frames")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        frame = data[0]
        assert "id" in frame
        assert "name" in frame
        assert "parts" in frame


def test_get_opportunities():
    """Test opportunities endpoint."""
    response = client.get("/api/v1/opportunities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_opportunities_with_filters():
    """Test opportunities endpoint with filters."""
    response = client.get("/api/v1/opportunities?min_profit=10&min_margin=0.2")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Verify all results meet threshold
    for opp in data:
        assert opp["profit_plat"] >= 10
        assert opp["profit_margin"] >= 0.2


def test_get_frame_details():
    """Test frame details endpoint."""
    # First get a frame ID
    frames_response = client.get("/api/v1/frames")
    frames = frames_response.json()

    if len(frames) > 0:
        frame_id = frames[0]["id"]
        response = client.get(f"/api/v1/frames/{frame_id}")
        assert response.status_code == 200
        data = response.json()
        assert "frame" in data
        assert "snapshots" in data

