from pathlib import Path
import importlib.util

MODULE_PATH = Path(__file__).resolve().parents[1] / "init.py"
SPEC = importlib.util.spec_from_file_location("thingsboard_init", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_build_device_payload() -> None:
    payload = MODULE.build_device_payload("RTJ-25-4.0Z-001", "dual_stage_axial_flow_gas_regulator")
    assert payload["name"] == "RTJ-25-4.0Z-001"
    assert payload["type"] == "dual_stage_axial_flow_gas_regulator"
    assert "local PLC" in payload["additionalInfo"]["description"]


def test_load_attributes() -> None:
    root = Path(__file__).resolve().parents[3]
    attributes = MODULE.load_json(root / "thingsboard-config" / "sample-device-attributes.json")
    assert attributes["model"] == "RTJ-25/4.0Z"
    assert attributes["cloud_emergency_shutdown_authority"] is False
    assert attributes["maximum_inlet_pressure_mpa"] == 4.0
