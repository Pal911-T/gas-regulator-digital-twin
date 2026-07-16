# Codex Project Instructions

## Goal

Build a digital-twin monitoring, testing, analysis and prediction platform for a dual-stage axial-flow gas regulator.

## Required architecture

- Use ThingsBoard CE as the IoT platform.
- Do not modify ThingsBoard source code in phase 1.
- Implement custom functions as separate services.
- Use Python 3.12 and FastAPI for backend services.
- Use Vue 3, TypeScript and Vite for the custom frontend.
- Use MQTT for telemetry and command messaging.
- Use PostgreSQL for business data.
- Use Docker Compose for local deployment.
- Keep the local PLC responsible for safety interlocks.

## Telemetry naming

Use snake_case keys:

- inlet_pressure
- intermediate_pressure
- outlet_pressure
- stage1_displacement
- stage1_opening
- stage2_displacement
- stage2_opening
- standard_flow
- gas_temperature
- pressure_setpoint
- cutoff_state
- relief_state
- device_status
- communication_status
- signal_strength

Each value must include a timestamp and data-quality status.

## Safety constraints

- Never implement cloud-only emergency shutdown.
- Never bypass local PLC validation.
- Never represent predicted values as measured values.
- Remote commands require authentication, bounds checking, acknowledgement and audit logging.
- Unsafe or incomplete commands must fail closed.

## Engineering rules

- Add type hints to Python code.
- Add unit tests for calculations and API endpoints.
- Keep units explicit in schemas and documentation.
- Validate all incoming telemetry.
- Prefer small, reviewable commits.
- Update documentation when schemas or interfaces change.
- Do not add heavyweight ML models before a baseline model and evaluation pipeline exist.
