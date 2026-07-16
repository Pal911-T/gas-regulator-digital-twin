# 遥测数据规范

## 1. 通用要求

每条遥测消息必须包含：

- `device_id`：设备唯一编号
- `timestamp`：UTC毫秒时间戳
- `quality`：`good`、`uncertain`或`bad`
- `source`：传感器、PLC或计算服务

## 2. 核心实测数据

| 字段 | 含义 | 建议单位 |
|---|---|---|
| inlet_pressure | 一级进口压力 | MPa |
| intermediate_pressure | 中间级压力 | MPa |
| outlet_pressure | 二级出口压力 | MPa |
| stage1_displacement | 一级阀位移 | mm |
| stage1_opening | 一级开度 | % |
| stage2_displacement | 二级阀位移 | mm |
| stage2_opening | 二级开度 | % |
| standard_flow | 标准状态流量 | Nm3/h |
| gas_temperature | 燃气温度 | °C |
| pressure_setpoint | 出口压力设定值 | MPa |
| cutoff_state | 切断阀状态 | enum |
| relief_state | 放散阀状态 | enum |

## 3. 设备与通信数据

| 字段 | 含义 |
|---|---|
| device_status | 运行、停止、故障、维护 |
| communication_status | 在线、离线、重连 |
| signal_strength | 5G信号强度 |
| supply_voltage | 终端供电电压 |
| gateway_temperature | 网关温度 |
| packet_loss_rate | 丢包率 |
| upload_latency_ms | 上传延迟 |

## 4. 计算数据

计算数据不得伪装成实测数据，必须标记 `source=analytics`：

- actual_flow
- average_velocity
- pressure_error
- stage1_pressure_drop
- stage2_pressure_drop
- response_time
- settling_time
- overshoot
- regulation_accuracy

## 5. 预测数据

预测数据必须包含预测时间范围和模型版本：

- predicted_outlet_pressure
- predicted_intermediate_pressure
- predicted_standard_flow
- predicted_velocity
- overpressure_probability
- underpressure_probability
- stage_limit_probability
- coordination_fault_probability

## 6. MQTT示例

Topic：

```text
gas-regulator/{device_id}/telemetry
```

Payload：

```json
{
  "device_id": "RTJ-25-4.0Z-001",
  "timestamp": 1780000000000,
  "quality": "good",
  "source": "edge_gateway",
  "inlet_pressure": 2.5,
  "intermediate_pressure": 0.9,
  "outlet_pressure": 0.35,
  "stage1_opening": 42.6,
  "stage2_opening": 37.8,
  "standard_flow": 3200.0,
  "gas_temperature": 18.5,
  "pressure_setpoint": 0.35
}
```
