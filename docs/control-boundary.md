# Control and Safety Boundary

## Purpose

Define which functions may be executed by the cloud platform and which must remain in the local PLC or independent safety circuit.

## Local safety layer

The following functions must remain local and must not depend on 5G, MQTT, cloud services, AI models, or browser availability:

- emergency shutdown;
- overpressure trip;
- combustible-gas leak interlock;
- fail-safe valve position;
- communication-loss protection;
- hard upper and lower pressure limits;
- actuator electrical and mechanical protection.

## Platform control layer

The platform may:

- start or stop an approved test sequence;
- write a pressure setpoint within configured limits;
- request a test flow or inlet-pressure operating point through the PLC;
- acknowledge alarms;
- request device reset;
- switch between manual, test, and monitoring modes when permitted;
- configure non-safety thresholds and sampling parameters.

## Command workflow

1. User submits a command.
2. Platform checks role and permission.
3. Platform validates parameter range and mode.
4. Command is sent to the PLC through the edge terminal.
5. PLC performs a second range and interlock check.
6. PLC executes or rejects the command.
7. Execution result and actual feedback are returned.
8. Platform stores a complete audit record.

## Non-negotiable rules

- Predicted values must never be used as the sole trigger for emergency shutdown.
- A cloud timeout must never leave the regulator in an undefined state.
- Remote commands require actual-state feedback.
- Measured, calculated, commanded, and predicted values must be clearly separated.
- Safety thresholds and test thresholds must be stored independently.
