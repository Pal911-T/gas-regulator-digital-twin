# Alarm and Early-Warning Rules

## Alarm classes

- **Information**: operating-state change requiring no immediate action.
- **Warning**: trend approaching an operating boundary.
- **Alarm**: measured value exceeds an operating limit or a persistent anomaly is detected.
- **Trip event**: local PLC or safety circuit has executed a protective action.

## Required measured-value alarms

Thresholds are configuration values and must be confirmed by product engineers and the applicable test standard.

- inlet pressure high / low;
- intermediate pressure high / low;
- outlet pressure high / low;
- standard flow high;
- calculated gas velocity high;
- stage-1 opening near full-open;
- stage-2 opening near full-open;
- valve-position signal invalid;
- pressure, flow, or temperature signal invalid;
- device offline or telemetry timeout;
- cut-off valve operated;
- relief state active;
- combustible-gas leak alarm when a leak detector is connected.

## Correlation alarms

- valve opening changes but pressure and flow show no corresponding response;
- outlet pressure deviation persists although both stages continue opening;
- stage-1 opening is near full-open while intermediate pressure continues to fall;
- stage-2 opening is near full-open while outlet pressure continues to fall;
- intermediate pressure oscillates with opposing stage-1 and stage-2 movements;
- measured valve position differs from the commanded target beyond tolerance;
- outlet pressure rises after a close command or near-zero-flow condition;
- repeated position jumps without corresponding pressure or flow changes.

## Predictive warnings

- forecast outlet pressure crosses the high or low warning limit within the forecast horizon;
- forecast intermediate pressure leaves the normal band;
- forecast flow or calculated velocity reaches the configured warning boundary;
- forecast stage-1 or stage-2 opening reaches the extreme operating region;
- increasing probability of oscillation, sticking, or dual-stage mismatch;
- declining pressure-regulation accuracy under comparable test conditions.

## Alarm quality rules

Each event must include:

- event time and device identifier;
- measured values used by the rule;
- threshold or model version;
- confidence level for model-generated warnings;
- alarm source: measured, calculated, rule-derived, or predicted;
- acknowledgement user and time;
- clear/reset time;
- related control command or test run, when applicable.

## Safety note

Cloud alarms supplement but do not replace local safety interlocks. Emergency shutdown is executed locally and reported to the platform as a trip event.
