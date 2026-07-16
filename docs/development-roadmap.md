# Development Roadmap

## Phase 0 — Project preparation

- confirm architecture, telemetry names, units, data sources, and safety boundary;
- define test scenarios and alarm classes;
- create repository instructions for Codex;
- keep ThingsBoard CE external and avoid modifying upstream source.

## Phase 1 — Runnable engineering skeleton

Deliverables:

- Docker Compose for MQTT broker, PostgreSQL, analytics API, simulator, and placeholder UI;
- Python 3.12 simulator producing valid telemetry;
- FastAPI health endpoint and telemetry validation endpoint;
- shared JSON examples and environment templates;
- automated lint and unit-test workflow.

Exit criteria:

- one command starts all first-stage services;
- simulator messages are validated and stored or logged;
- no secrets are committed;
- README contains reproducible setup instructions.

## Phase 2 — IoT platform integration

- deploy ThingsBoard CE;
- create device profiles and telemetry mapping;
- configure MQTT connectivity;
- import initial dashboard and rule-chain configuration;
- implement device-offline and threshold alarms;
- test RPC request and PLC/edge acknowledgement simulation.

## Phase 3 — Test and analysis service

- steady-state regulation-accuracy metrics;
- step-response analysis;
- stage pressure-drop and coordination analysis;
- standard-to-operating flow conversion and average velocity calculation;
- automated test-run record and report data model.

## Phase 4 — Dedicated web application

- overview dashboard;
- dual-stage process diagram;
- live and historical trends;
- test orchestration page;
- alarm management;
- analysis report page;
- role-based control and audit display.

## Phase 5 — Prediction and digital twin

- baseline outlet- and intermediate-pressure forecasts;
- flow and velocity forecasts;
- extreme-opening and dual-stage mismatch warnings;
- model evaluation, versioning, and confidence reporting;
- Three.js equipment representation with measured, calculated, and predicted state layers.

## Phase 6 — Hardware and commissioning

- connect real edge terminal, PLC, pressure transmitters, flow meter, temperature sensor, and displacement sensors;
- calibrate units and ranges;
- verify local interlocks independently;
- compare simulator, laboratory, and field data;
- complete cybersecurity, backup, recovery, and acceptance documentation.

## Immediate next task

Create the Phase-1 engineering skeleton on a feature branch. It must remain runnable without real hardware or a ThingsBoard account and must include tests.
