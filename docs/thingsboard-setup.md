# ThingsBoard CE 接入步骤

## 1. 启动基础服务

```bash
docker compose up --build -d mqtt simulator analytics-service
```

## 2. 启动 ThingsBoard

```bash
docker compose --profile thingsboard up -d thingsboard
```

浏览器访问：

```text
http://localhost:8080
```

首次启动通常需要等待数分钟。

## 3. 创建调压器设备

在 ThingsBoard 中创建一个设备：

```text
名称：RTJ-25-4.0Z-001
类型：Gas Regulator
```

打开设备凭据，复制 Access Token。

## 4. 配置本地环境变量

将 `.env.example` 复制为 `.env`，并把：

```text
THINGSBOARD_DEVICE_TOKEN=CHANGE_ME
```

替换为设备的真实 Access Token。不要把真实 Token 提交到 GitHub。

## 5. 启动遥测桥接服务

```bash
docker compose --profile thingsboard up --build -d thingsboard-bridge
```

桥接服务订阅：

```text
gas-regulator/+/telemetry
```

并把遥测数据发送到 ThingsBoard 标准主题：

```text
v1/devices/me/telemetry
```

## 6. 检查数据

进入设备详情，打开 Latest telemetry。应看到：

- inlet_pressure
- intermediate_pressure
- outlet_pressure
- stage1_opening
- stage2_opening
- standard_flow
- gas_temperature
- pressure_setpoint
- communication_status

## 7. 停止服务

```bash
docker compose --profile thingsboard down
```

## 安全说明

ThingsBoard 当前只用于监测、试验编排和分析。紧急切断、超压联锁和失控保护仍由现场 PLC 或独立安全回路完成。
