from __future__ import annotations

import json
import os
import time
from typing import Any

import paho.mqtt.client as mqtt

SOURCE_HOST = os.getenv("SOURCE_MQTT_HOST", "mqtt")
SOURCE_PORT = int(os.getenv("SOURCE_MQTT_PORT", "1883"))
SOURCE_TOPIC = os.getenv("SOURCE_MQTT_TOPIC", "gas-regulator/+/telemetry")
TB_HOST = os.getenv("THINGSBOARD_MQTT_HOST", "thingsboard")
TB_PORT = int(os.getenv("THINGSBOARD_MQTT_PORT", "1883"))
TB_TOKEN = os.getenv("THINGSBOARD_DEVICE_TOKEN", "")
TB_TOPIC = "v1/devices/me/telemetry"


def telemetry_payload(source_payload: dict[str, Any]) -> dict[str, Any]:
    excluded = {"device_id", "timestamp", "quality", "units"}
    return {key: value for key, value in source_payload.items() if key not in excluded}


def connect_with_retry(client: mqtt.Client, host: str, port: int) -> None:
    while True:
        try:
            client.connect(host, port, keepalive=60)
            return
        except OSError as exc:
            print(f"MQTT connection to {host}:{port} failed: {exc}; retrying", flush=True)
            time.sleep(3)


def main() -> None:
    if not TB_TOKEN or TB_TOKEN == "CHANGE_ME":
        raise RuntimeError("THINGSBOARD_DEVICE_TOKEN must be set to the device access token")

    target = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="thingsboard-target")
    target.username_pw_set(TB_TOKEN)
    connect_with_retry(target, TB_HOST, TB_PORT)
    target.loop_start()

    source = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="thingsboard-source")

    def on_connect(client: mqtt.Client, userdata: object, flags: object, reason_code: object, properties: object) -> None:
        client.subscribe(SOURCE_TOPIC, qos=1)
        print(f"Subscribed to {SOURCE_TOPIC}", flush=True)

    def on_message(client: mqtt.Client, userdata: object, message: mqtt.MQTTMessage) -> None:
        try:
            decoded = json.loads(message.payload.decode("utf-8"))
            payload = telemetry_payload(decoded)
            result = target.publish(TB_TOPIC, json.dumps(payload, ensure_ascii=False), qos=1)
            result.wait_for_publish()
            print(f"Forwarded {len(payload)} telemetry fields to ThingsBoard", flush=True)
        except (UnicodeDecodeError, json.JSONDecodeError, TypeError) as exc:
            print(f"Rejected malformed telemetry: {exc}", flush=True)

    source.on_connect = on_connect
    source.on_message = on_message
    connect_with_retry(source, SOURCE_HOST, SOURCE_PORT)

    try:
        source.loop_forever()
    finally:
        target.loop_stop()
        target.disconnect()


if __name__ == "__main__":
    main()
