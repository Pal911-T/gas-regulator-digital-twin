from __future__ import annotations

import argparse
import json

import paho.mqtt.client as mqtt


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect gas regulator MQTT telemetry")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument(
        "--topic",
        default="gas-regulator/+/telemetry",
        help="MQTT topic filter",
    )
    return parser.parse_args()


def on_connect(
    client: mqtt.Client,
    userdata: object,
    flags: mqtt.ConnectFlags,
    reason_code: mqtt.ReasonCode,
    properties: mqtt.Properties | None,
) -> None:
    topic = str(userdata)
    if reason_code.is_failure:
        raise RuntimeError(f"MQTT connection failed: {reason_code}")
    client.subscribe(topic, qos=1)
    print(f"Subscribed to {topic}")


def on_message(client: mqtt.Client, userdata: object, message: mqtt.MQTTMessage) -> None:
    try:
        payload = json.loads(message.payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        print(f"{message.topic}: invalid JSON payload")
        return
    print(f"{message.topic}: {json.dumps(payload, ensure_ascii=False, indent=2)}")


def main() -> None:
    args = parse_args()
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id="regulator-telemetry-inspector",
        userdata=args.topic,
    )
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(args.host, args.port, keepalive=60)
    client.loop_forever()


if __name__ == "__main__":
    main()
