from __future__ import annotations

import json
import os
import time

import paho.mqtt.client as mqtt

from model import build_sample

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "gas-regulator/RTJ-25-4.0Z-001/telemetry")
INTERVAL = float(os.getenv("PUBLISH_INTERVAL_SECONDS", "1"))


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="regulator-simulator")
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            break
        except OSError:
            time.sleep(2)

    client.loop_start()
    step = 0
    try:
        while True:
            payload = build_sample(step)
            result = client.publish(MQTT_TOPIC, json.dumps(payload, ensure_ascii=False), qos=1)
            result.wait_for_publish()
            print(json.dumps(payload, ensure_ascii=False), flush=True)
            step += 1
            time.sleep(INTERVAL)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
