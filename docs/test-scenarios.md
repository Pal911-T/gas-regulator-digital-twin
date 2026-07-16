# Test Scenarios

## Test objectives

The platform shall support repeatable collection, analysis, comparison, and reporting for the dual-stage gas-regulator test bench.

## Baseline tests

### 1. Sensor and zero-point validation

- verify stage-1 and stage-2 displacement zero and full-scale values;
- compare calculated opening with physical reference positions;
- verify pressure, flow, and temperature ranges;
- verify timestamps, sampling period, missing-data flags, and 5G reconnect behavior.

### 2. Steady-state accuracy test

For each approved combination of inlet pressure, target outlet pressure, and flow:

- wait for stabilization;
- record inlet, intermediate, and outlet pressure;
- record both stage openings, standard flow, and gas temperature;
- calculate mean error, maximum positive and negative deviation, standard deviation, and valid-time ratio;
- associate the result with the target accuracy requirement.

### 3. Flow-step response

- step the test-bench demand from low to medium and medium to high flow;
- calculate delay, pressure undershoot/overshoot, recovery time, and two-stage opening sequence;
- repeat in the reverse direction.

### 4. Inlet-pressure-step response

- vary inlet pressure while holding target outlet pressure and demand condition;
- measure intermediate- and outlet-pressure rejection performance;
- calculate stage-1 and stage-2 response timing and pressure-sharing behavior.

### 5. Closing-performance test

- reduce downstream demand toward zero;
- record closing travel, closing time, outlet-pressure rise, and final valve positions;
- flag possible closing abnormality without claiming leakage unless supported by pressure or flow evidence.

## Fault and abnormal scenarios

- stage-1 opening stuck or slow;
- stage-2 opening stuck or slow;
- stage-1 and stage-2 oscillation;
- inlet-pressure loss;
- excessive downstream demand;
- outlet-pressure sensor drift;
- intermediate-pressure sensor drift;
- flow-signal freeze or jump;
- position-sensor jump, offset, or disconnection;
- 5G delay, packet loss, disconnect, and recovery;
- PLC command rejection;
- local trip and platform event synchronization.

## Acceptance evidence

Every automated test shall produce:

- test configuration and operator;
- device and sensor identifiers;
- raw and cleaned data references;
- calculated metrics;
- alarm and control timeline;
- algorithm and configuration versions;
- pass/fail/needs-review result;
- notes and reviewer approval.
