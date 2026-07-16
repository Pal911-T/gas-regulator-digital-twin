from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import requests

DEFAULT_DEVICE_NAME = "RTJ-25-4.0Z-001"
DEFAULT_DEVICE_TYPE = "dual_stage_axial_flow_gas_regulator"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        value = json.load(file)
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object in {path}")
    return value


def build_device_payload(name: str, device_type: str) -> dict[str, Any]:
    return {
        "name": name,
        "type": device_type,
        "label": "RTJ-25/4.0Z 双级轴流式燃气调压器",
        "additionalInfo": {
            "description": "Digital-twin simulation device. Safety interlocks remain in the local PLC."
        },
    }


class ThingsBoardClient:
    def __init__(self, base_url: str, username: str, password: str, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.timeout = timeout
        self.session = requests.Session()

    def login(self) -> None:
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"username": self.username, "password": self.password},
            timeout=self.timeout,
        )
        response.raise_for_status()
        token = response.json().get("token")
        if not token:
            raise RuntimeError("ThingsBoard login response did not contain a token")
        self.session.headers.update({"X-Authorization": f"Bearer {token}"})

    def find_device(self, name: str) -> dict[str, Any] | None:
        response = self.session.get(
            f"{self.base_url}/api/tenant/devices",
            params={"deviceName": name},
            timeout=self.timeout,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        payload = response.json()
        return payload if payload.get("id", {}).get("id") else None

    def create_device(self, payload: dict[str, Any], access_token: str | None) -> dict[str, Any]:
        params = {"accessToken": access_token} if access_token else None
        response = self.session.post(
            f"{self.base_url}/api/device",
            params=params,
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def save_server_attributes(self, device_id: str, attributes: dict[str, Any]) -> None:
        response = self.session.post(
            f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/SERVER_SCOPE",
            json=attributes,
            timeout=self.timeout,
        )
        response.raise_for_status()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize the RTJ-25/4.0Z device in ThingsBoard CE")
    parser.add_argument("--apply", action="store_true", help="Apply changes. Without this flag, only print the plan.")
    parser.add_argument("--device-name", default=os.getenv("TB_DEVICE_NAME", DEFAULT_DEVICE_NAME))
    parser.add_argument("--device-type", default=os.getenv("TB_DEVICE_TYPE", DEFAULT_DEVICE_TYPE))
    parser.add_argument(
        "--attributes",
        type=Path,
        default=Path("thingsboard-config/sample-device-attributes.json"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    attributes = load_json(args.attributes)
    device_payload = build_device_payload(args.device_name, args.device_type)

    plan = {
        "mode": "apply" if args.apply else "dry-run",
        "device": device_payload,
        "server_attributes": attributes,
    }
    print(json.dumps(plan, ensure_ascii=False, indent=2))

    if not args.apply:
        return

    base_url = os.environ.get("TB_BASE_URL", "http://localhost:8080")
    username = os.environ.get("TB_USERNAME")
    password = os.environ.get("TB_PASSWORD")
    access_token = os.environ.get("TB_DEVICE_ACCESS_TOKEN")
    if not username or not password:
        raise RuntimeError("TB_USERNAME and TB_PASSWORD are required with --apply")

    client = ThingsBoardClient(base_url, username, password)
    client.login()
    device = client.find_device(args.device_name)
    if device is None:
        device = client.create_device(device_payload, access_token)
        print(f"Created device: {args.device_name}")
    else:
        print(f"Device already exists: {args.device_name}")

    device_id = device["id"]["id"]
    client.save_server_attributes(device_id, attributes)
    print(f"Saved {len(attributes)} server attributes to device {device_id}")


if __name__ == "__main__":
    main()
