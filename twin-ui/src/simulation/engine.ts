import type { AlarmRecord, Scenario, Telemetry } from '../domain/types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const wave = (tick: number, base: number, amplitude: number, rate: number) => base + Math.sin(tick / rate) * amplitude

export function createTelemetry(tick: number, scenario: Scenario): Telemetry {
  let inlet = wave(tick, 2.42, 0.05, 5)
  let middle = wave(tick, 0.92, 0.02, 4)
  let outlet = wave(tick, 0.35, 0.004, 3)
  let flow = wave(tick, 4210, 150, 4)
  let stage1 = wave(tick, 57, 4, 4)
  let stage2 = wave(tick, 48, 3, 3)
  let communicationStatus: Telemetry['communicationStatus'] = '在线'
  let quality: Telemetry['quality'] = 'GOOD'

  if (scenario === '出口超压') {
    outlet = clamp(0.35 + tick * 0.0022, 0.35, 0.405)
    stage2 = clamp(48 + tick * 0.7, 48, 78)
  }
  if (scenario === '出口欠压') {
    outlet = clamp(0.35 - tick * 0.0018, 0.285, 0.35)
    flow = clamp(4210 + tick * 90, 4210, 7200)
  }
  if (scenario === '流量突升') {
    flow = clamp(4210 + tick * 145, 4210, 7600)
    stage1 = clamp(57 + tick * 0.8, 57, 88)
    stage2 = clamp(48 + tick * 0.65, 48, 82)
  }
  if (scenario === '一级阀位卡涩') {
    stage1 = 63.4
    flow = wave(tick, 4700, 380, 2)
    outlet = wave(tick, 0.35, 0.011, 2)
  }
  if (scenario === '通信中断') {
    communicationStatus = '中断'
    quality = 'BAD'
  }

  return {
    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    inletPressure: inlet,
    intermediatePressure: middle,
    outletPressure: outlet,
    stage1Opening: stage1,
    stage2Opening: stage2,
    standardFlow: flow,
    gasTemperature: wave(tick, 18.6, 0.7, 8),
    pressureSetpoint: 0.35,
    communicationStatus,
    quality,
  }
}

export function evaluateAlarms(data: Telemetry): AlarmRecord[] {
  const alarms: AlarmRecord[] = []
  const time = data.timestamp
  if (data.communicationStatus === '中断') alarms.push({ id: 1, level: '严重', name: '5G/MQTT通信中断', actual: '离线', threshold: '连续5秒无报文', status: '活动', time })
  if (data.outletPressure >= 0.38) alarms.push({ id: 2, level: data.outletPressure >= 0.4 ? '严重' : '警告', name: '出口压力高', actual: `${data.outletPressure.toFixed(3)} MPa`, threshold: '≥ 0.380 MPa', status: '活动', time })
  if (data.outletPressure <= 0.32) alarms.push({ id: 3, level: '警告', name: '出口压力低', actual: `${data.outletPressure.toFixed(3)} MPa`, threshold: '≤ 0.320 MPa', status: '活动', time })
  if (data.stage1Opening >= 85) alarms.push({ id: 4, level: '提示', name: '一级阀位高负荷', actual: `${data.stage1Opening.toFixed(1)}%`, threshold: '≥ 85%', status: '活动', time })
  return alarms
}
