# Gas Regulator Digital Twin Platform

面向双级轴流式燃气调压器的数字孪生试验与智控平台。

## 项目目标

平台以智能开度指示器/边缘采控终端为现场数据汇聚入口，集中接入并上传：

- 一级进口压力 `P1`
- 中间级压力 `Pm`
- 二级出口压力 `P2`
- 一级阀位 `X1`
- 二级阀位 `X2`
- 标准状态流量 `Qn`
- 燃气温度 `T`
- 出口压力设定值 `Pset`
- 切断、放散、通信及设备状态

平台实现实时监测、集中试验控制、调压精度分析、双级协调分析、压力与流量趋势预测、风险预警、试验报告和数字孪生可视化。

## 总体架构

- ThingsBoard CE：设备管理、MQTT接入、时序数据、看板、告警、RPC控制
- Edge Gateway：传感器接入、数据校验、缓存、5G/MQTT通信
- Analytics Service：精度、动态响应、双级协同及关闭性能分析
- Prediction Service：压力、流量、流速与风险预测
- Twin UI：Vue 3 + TypeScript + Three.js
- Local PLC：本地控制与独立安全联锁

## 安全原则

- 云端平台不承担最终紧急切断。
- 超压、泄漏和失控保护必须保留在本地PLC或独立安全回路。
- 预测值与实测值必须严格区分。
- 所有远程控制指令必须校验、授权并记录审计日志。

## 当前可运行组件

- Eclipse Mosquitto MQTT Broker
- 双级燃气调压器遥测模拟器
- FastAPI分析服务
- 调压精度计算接口
- MQTT遥测查看工具
- GitHub Actions自动测试与Docker Compose校验

## 本地启动

要求：Docker Desktop或Docker Engine，并支持Docker Compose。

```bash
cp .env.example .env
docker compose up --build
```

启动后：

- MQTT：`localhost:1883`
- 分析服务：`http://localhost:8000`
- API文档：`http://localhost:8000/docs`
- 健康检查：`http://localhost:8000/health`

查看容器状态：

```bash
docker compose ps
```

查看模拟器上传的数据：

```bash
docker compose logs -f simulator
```

停止服务：

```bash
docker compose down
```

## MQTT遥测验证

先安装Python 3.12，然后执行：

```bash
python -m venv .venv
```

Windows PowerShell：

```powershell
.venv\Scripts\Activate.ps1
pip install -r simulator/requirements.txt
python tools/mqtt_subscriber.py
```

Linux或macOS：

```bash
source .venv/bin/activate
pip install -r simulator/requirements.txt
python tools/mqtt_subscriber.py
```

默认订阅：

```text
gas-regulator/+/telemetry
```

## 调压精度接口验证

```bash
curl -X POST http://localhost:8000/v1/accuracy \
  -H "Content-Type: application/json" \
  -d '{
    "pressure_setpoint_mpa": 0.35,
    "outlet_pressure_mpa": [0.349, 0.351, 0.3505, 0.3485]
  }'
```

返回最大偏差、平均误差、平均绝对误差、标准差和最大相对误差。

## 自动测试

```bash
pip install -r analytics-service/requirements.txt
pip install -r simulator/requirements.txt
pytest -q analytics-service/tests simulator/tests
docker compose -f compose.yaml config
```

## 当前阶段

第一阶段正在完成工程骨架、数据协议、双级调压器模拟器、基础分析服务、自动测试和本地验证流程。下一阶段接入ThingsBoard CE并建立基础监控看板。
