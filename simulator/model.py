from __future__ import annotations

import math
import random
from datetime import datetime, timezone


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def bounded(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def build_sample(step: int) -> dict[str, object]:
    """Build one synthetic telemetry sample for the dual-stage regulator."""
    demand = 0.55 + 0.25 * math.sin(step / 35)
    inlet_pressure = 2.4 + 0.08 * math.sin(step / 50) + random.uniform(-0.01, 0.01)
    standard_flow = bounded(400 + demand * 6500 + random.uniform(-35, 35), 400, 8000)
    stage1_opening = bounded(28 + demand * 45 + random.uniform(-0.6, 0.6), 0, 100)
    intermediate_pressure = 0.92 + 0.025 * math.sin(step / 25) + random.uniform(-0.004, 0.004)
    stage2_opening = bounded(24 + demand * 38 + random.uniform(-0.6, 0.6), 0, 100)
    pressure_setpoint = 0.35
    outlet_pressure = pressure_setpoint + 0.006 * math.sin(step / 18) + random.uniform(-0.002, 0.002)

    return {
        "device_id": "RTJ-25-4.0Z-001",
        "timestamp": utc_now(),
        "quality": "good",
        "inlet_pressure": round(inlet_pressure, 4),
        "intermediate_pressure": round(intermediate_pressure, 4),
        "outlet_pressure": round(outlet_pressure, 4),
        "stage1_displacement": round(stage1_opening * 0.2, 3),
        "stage1_opening": round(stage1_opening, 2),
        "stage2_displacement": round(stage2_opening * 0.2, 3),
        "stage2_opening": round(stage2_opening, 2),
        "standard_flow": round(standard_flow, 2),
        "gas_temperature": round(18 + 1.5 * math.sin(step / 90), 2),
        "pressure_setpoint": pressure_setpoint,
        "cutoff_state": "closed",
        "relief_state": "closed",
        "device_status": "running",
        "communication_status": "online",
        "signal_strength": -68,
        "units": {
            "pressure": "MPa",
            "displacement": "mm",
            "opening": "%",
            "standard_flow": "Nm3/h",
            "temperature": "degC",
            "signal_strength": "dBm",
        },
    }
