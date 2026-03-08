import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_strategic_success():
    payload = {
        "persona": "Recent Graduate",
        "resume": "Python, SQL, Java",
        "job_description": "Cloud Engineer"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "match_percentage" in data
    assert "interview_prep" in data
    assert isinstance(data["match_percentage"], int)

    assert "missing_skills" in data
    assert isinstance(data["missing_skills"], list)
    assert len(data["missing_skills"]) > 0
    assert "market_demand" in data["missing_skills"][0]
    assert "salary_impact" in data["missing_skills"][0]

def test_roadmap_structure():
    payload = {
        "persona": "Career Switcher",
        "resume": "React, JavaScript",
        "job_description": "Frontend Lead"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "roadmap" in data
    assert isinstance(data["roadmap"], list)
    assert len(data["roadmap"]) > 0
    assert "time" in data["roadmap"][0]
    assert "type" in data["roadmap"][0]

def test_analyze_empty_inputs_validation():
    payload = {
        "persona": "Mentor",
        "resume": "",
        "job_description": ""
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422