# ThingsBoard Device Profile

## Profile name

`RTJ-25-4.0Z Dual-Stage Gas Regulator`

## Device type

`gas_regulator`

## Transport

- Protocol: MQTT
- Authentication: Access Token
- Telemetry topic: `v1/devices/me/telemetry`
- Attribute topic: `v1/devices/me/attributes`

## Expected telemetry

- `inlet_pressure`
- `intermediate_pressure`
- `outlet_pressure`
- `stage1_displacement`
- `stage1_opening`
- `stage2_displacement`
- `stage2_opening`
- `standard_flow`
- `gas_temperature`
- `pressure_setpoint`
- `cutoff_state`
- `relief_state`
- `device_status`
- `communication_status`
- `signal_strength`

## Server-side attributes

- `model`: `RTJ-25/4.0Z`
- `nominal_diameter_mm`: `25`
- `maximum_inlet_pressure_mpa`: `4.0`
- `maximum_outlet_pressure_mpa`: `2.5`
- `minimum_flow_nm3_h`: `400`
- `maximum_flow_nm3_h`: `8000`
- `regulation_accuracy_class`: `AC5`
- `lockup_pressure_class`: `SG5`
- `safety_controller`: `local_plc`

## Safety boundary

ThingsBoard is used for monitoring, test coordination, analytics and approved remote commands. Emergency shutdown, overpressure protection and final interlocks remain in the local PLC or independent safety circuit.
