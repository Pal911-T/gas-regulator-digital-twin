from __future__ import annotations

import sys
from pathlib import Path

SIMULATOR_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SIMULATOR_DIR))

from model import build_sample


def test_sample_contains_required_telemetry() -> None:
    sample = build_sample(1)
    required = {
        "device_id",
        "timestamp",
        "quality",
        "inlet_pressure",
        "intermediate_pressure",
        "outlet_pressure",
        "stage1_displacement",
        "stage1_opening",
        "stage2_displacement",
        "stage2_opening",
        "standard_flow",
        "gas_temperature",
        "pressure_setpoint",
        "cutoff_state",
        "relief_state",
        "device_status",
        "communication_status",
        "signal_strength",
        "units",
    }
    assert required.issubset(sample)


def test_sample_values_stay_in_initial_design_bounds() -> None:
    for step in range(200):
        sample = build_sample(step)
        assert 0.1 <= sample["inlet_pressure"] <= 4.0
        assert 0.0 <= sample["intermediate_pressure"] <= 4.0
        assert 0.0 <= sample["outlet_pressure"] <= 2.5
        assert 0.0 <= sample["stage1_opening"] <= 100.0
        assert 0.0 <= sample["stage2_opening"] <= 100.0
        assert 400.0 <= sample["standard_flow"] <= 8000.0
        assert sample["quality"] == "good"
