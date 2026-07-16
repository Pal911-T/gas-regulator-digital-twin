from __future__ import annotations

import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "app.py"
SPEC = importlib.util.spec_from_file_location("regulator_simulator", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_sample_contains_required_telemetry() -> None:
    sample = MODULE.build_sample(1)
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
        sample = MODULE.build_sample(step)
        assert 0.1 <= sample["inlet_pressure"] <= 4.0
        assert 0.0 <= sample["intermediate_pressure"] <= 4.0
        assert 0.0 <= sample["outlet_pressure"] <= 2.5
        assert 0.0 <= sample["stage1_opening"] <= 100.0
        assert 0.0 <= sample["stage2_opening"] <= 100.0
        assert 400.0 <= sample["standard_flow"] <= 8000.0
        assert sample["quality"] == "good"
