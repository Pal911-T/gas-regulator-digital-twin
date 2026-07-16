# ThingsBoard Dashboard Specification

## Dashboard name

`RTJ-25/4.0Z 双级调压器监控与试验平台`

## Page 1: 实时总览

- 设备在线状态
- 进口压力 `inlet_pressure`
- 中间压力 `intermediate_pressure`
- 出口压力 `outlet_pressure`
- 出口设定压力 `pressure_setpoint`
- 一级开度 `stage1_opening`
- 二级开度 `stage2_opening`
- 标况流量 `standard_flow`
- 燃气温度 `gas_temperature`
- 信号强度 `signal_strength`

Recommended widgets:

- Latest value cards
- Status indicator
- Gauge widgets for pressure and opening
- Timeseries chart for P1, Pm, P2 and Pset

## Page 2: 双级动态过程

Timeseries groups:

1. `inlet_pressure`, `intermediate_pressure`, `outlet_pressure`, `pressure_setpoint`
2. `stage1_opening`, `stage2_opening`
3. `standard_flow`
4. `stage1_displacement`, `stage2_displacement`

Default time window: last 15 minutes.

## Page 3: 试验与精度

Display calculated results returned by the analytics service:

- sample count
- mean pressure
- mean error
- mean absolute error
- maximum positive error
- maximum negative error
- standard deviation
- maximum absolute relative error

The first version may display these through custom widgets or mirrored telemetry keys.

## Page 4: 告警中心

Show active and historical alarms:

- outlet overpressure
- outlet underpressure
- stage opening near limit
- pressure oscillation
- sensor quality fault
- communication offline
- cutoff activated
- relief activated

## Page 5: 设备档案

Show server-side attributes, device token state, model, pressure range, flow range, accuracy class and safety-controller ownership.
