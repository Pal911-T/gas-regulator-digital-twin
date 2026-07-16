export type Scenario = '正常运行' | '出口超压' | '出口欠压' | '流量突升' | '一级阀位卡涩' | '通信中断'

export type Telemetry = {
  timestamp: string
  inletPressure: number
  intermediatePressure: number
  outletPressure: number
  stage1Opening: number
  stage2Opening: number
  standardFlow: number
  gasTemperature: number
  pressureSetpoint: number
  communicationStatus: '在线' | '中断'
  quality: 'GOOD' | 'BAD'
}

export type AlarmRecord = {
  id: number
  level: '提示' | '警告' | '严重'
  name: string
  actual: string
  threshold: string
  status: '活动' | '已恢复'
  time: string
}

export type LinkNode = {
  name: string
  subtitle: string
  status: '正常' | '模拟' | '异常'
  detail: string
}
