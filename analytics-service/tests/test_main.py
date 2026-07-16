from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_accuracy_calculation() -> None:
    response = client.post(
        "/v1/accuracy",
        json={
            "pressure_setpoint_mpa": 0.35,
            "outlet_pressure_mpa": [0.348, 0.351, 0.352, 0.349],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["sample_count"] == 4
    assert body["maximum_positive_error_mpa"] == 0.002
    assert body["maximum_negative_error_mpa"] == -0.002
