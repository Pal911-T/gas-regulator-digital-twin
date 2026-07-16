# ThingsBoard Alarm Rules

These are initial engineering defaults for simulation and platform development. Site commissioning values must be approved against the real regulator, piping, instrumentation and local safety design.

## Outlet overpressure

- Key: `outlet_pressure`
- Warning: greater than `pressure_setpoint * 1.03` for 5 seconds
- Critical: greater than `pressure_setpoint * 1.05` for 2 seconds
- Clear: less than or equal to `pressure_setpoint * 1.02` for 10 seconds

## Outlet underpressure

- Warning: less than `pressure_setpoint * 0.97` for 10 seconds while `standard_flow > 400`
- Critical: less than `pressure_setpoint * 0.95` for 5 seconds while `standard_flow > 400`
- Clear: greater than or equal to `pressure_setpoint * 0.98` for 10 seconds

## Stage opening near limit

- Warning: `stage1_opening >= 90` or `stage2_opening >= 90` for 15 seconds
- Critical: either opening `>= 97` for 5 seconds
- Clear: both openings `< 85` for 15 seconds

## Pressure relationship fault

- Critical when the expected relation `inlet_pressure > intermediate_pressure > outlet_pressure` is violated for 3 consecutive samples.

## Communication offline

- Critical when `communication_status != online` or no telemetry is received for 30 seconds.
- Clear after 3 consecutive good telemetry samples.

## Sensor quality fault

- Warning when `quality != good`.
- Critical when invalid quality persists for 10 seconds.

## Cutoff or relief action

- Critical when `cutoff_state` indicates activated/open/tripped.
- Critical when `relief_state` indicates activated/open.

## Signal quality

- Warning when `signal_strength < -90 dBm` for 30 seconds.
- Clear when `signal_strength >= -85 dBm` for 30 seconds.

## Cloud safety restriction

These alarms inform operators and higher-level services. They must not replace local PLC trips, mechanical relief protection or independent emergency shutdown logic.
