from __future__ import annotations

from math import sqrt
from statistics import fmean

from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator

app = FastAPI(title="Gas Regulator Analytics Service", version="0.1.0")


class AccuracyRequest(BaseModel):
    pressure_setpoint_mpa: float = Field(gt=0)
    outlet_pressure_mpa: list[float] = Field(min_length=2)

    @model_validator(mode="after")
    def validate_samples(self) -> "AccuracyRequest":
        if any(value < 0 for value in self.outlet_pressure_mpa):
            raise ValueError("pressure samples must be non-negative")
        return self


class AccuracyResult(BaseModel):
    sample_count: int
    mean_pressure_mpa: float
    mean_error_mpa: float
    mean_absolute_error_mpa: float
    maximum_positive_error_mpa: float
    maximum_negative_error_mpa: float
    standard_deviation_mpa: float
    maximum_absolute_relative_error_percent: float


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/accuracy", response_model=AccuracyResult)
def calculate_accuracy(request: AccuracyRequest) -> AccuracyResult:
    errors = [value - request.pressure_setpoint_mpa for value in request.outlet_pressure_mpa]
    mean_pressure = fmean(request.outlet_pressure_mpa)
    mean_error = fmean(errors)
    mean_absolute_error = fmean(abs(value) for value in errors)
    variance = fmean((value - mean_pressure) ** 2 for value in request.outlet_pressure_mpa)
    maximum_relative_error = max(abs(value) for value in errors) / request.pressure_setpoint_mpa * 100

    return AccuracyResult(
        sample_count=len(request.outlet_pressure_mpa),
        mean_pressure_mpa=round(mean_pressure, 8),
        mean_error_mpa=round(mean_error, 8),
        mean_absolute_error_mpa=round(mean_absolute_error, 8),
        maximum_positive_error_mpa=round(max(errors), 8),
        maximum_negative_error_mpa=round(min(errors), 8),
        standard_deviation_mpa=round(sqrt(variance), 8),
        maximum_absolute_relative_error_percent=round(maximum_relative_error, 6),
    )
