<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { LinkNode, Scenario, Telemetry } from './domain/types'
import { createTelemetry, evaluateAlarms } from './simulation/engine'

const navItems = ['运行总览', '实时监控', '采集链路', '历史数据', '告警中心', '精度试验', '预测预警', '设备档案']
const scenarios: Scenario[] = ['正常运行', '出口超压', '出口欠压', '流量突升', '一级阀位卡涩', '通信中断']
const active = ref('运行总览')
const scenario = ref<Scenario>('正常运行')
const tick = ref(0)
const collecting = ref(true)
const history = ref<Telemetry[]>([])
let timer: number | undefined

const telemetry = computed(() => createTelemetry(tick.value, scenario.value))
const alarms = computed(() => evaluateAlarms(telemetry.value))
const accuracy = computed(() => Math.abs((telemetry.value.outletPressure - telemetry.value.pressureSetpoint) / telemetry.value.pressureSetpoint * 100))
const systemState = computed(() => alarms.value.some(item => item.level === '严重') ? '严重异常' : alarms.value.length ? '存在告警' : '系统运行正常')
const dataCount = computed(() => 18640 + history.value.length)

const linkNodes = computed<LinkNode[]>(() => [
  { name: '现场传感器', subtitle: 'P1 / Pm / P2 / Qn / T', status: telemetry.value.quality === 'GOOD' ? '正常' : '异常', detail: '8个采集通道' },
  { name: '智能阀位指示器', subtitle: 'RTJ-EDGE-001', status: telemetry.value.quality === 'GOOD' ? '正常' : '异常', detail: '边缘采集与时间戳' },
  { name: '5G网络', subtitle: '逻辑模拟', status: telemetry.value.communicationStatus === '在线' ? '模拟' : '异常', detail: telemetry.value.communicationStatus === '在线' ? '-71 dBm · 42 ms' : '链路中断' },
  { name: 'MQTT接入层', subtitle: '逻辑模拟', status: telemetry.value.communicationStatus === '在线' ? '模拟' : '异常', detail: 'telemetry topic' },
  { name: '时序数据库', subtitle: '浏览器本地模拟', status: '模拟', detail: `${dataCount.value.toLocaleString()} 条记录` },
  { name: '告警与分析服务', subtitle: '前端业务逻辑', status: alarms.value.length ? '异常' : '模拟', detail: `${alarms.value.length} 条活动告警` },
])

function resetScenario(next: Scenario) {
  scenario.value = next
  tick.value = 0
}

function clearHistory() {
  history.value = []
}

onMounted(() => {
  timer = window.setInterval(() => {
    if (!collecting.value) return
    tick.value += 1
    history.value.unshift(telemetry.value)
    history.value = history.value.slice(0, 40)
  }, 1200)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">GT</div><div><strong>GasTwin</strong><span>调压器数字孪生原型</span></div></div>
      <nav><button v-for="item in navItems" :key="item" :class="{ active: active === item }" @click="active = item"><span class="dot"></span>{{ item }}</button></nav>
      <div class="device-card"><span class="online-dot" :class="{ off: telemetry.communicationStatus === '中断' }"></span><div><strong>RTJ-25/4.0Z-001</strong><small>{{ telemetry.communicationStatus === '在线' ? '设备在线' : '通信中断' }} · 仿真数据</small></div></div>
    </aside>

    <main>
      <header>
        <div><p class="eyebrow">RTJ-25/4.0Z AXIAL-FLOW REGULATOR</p><h1>{{ active }}</h1></div>
        <div class="header-actions"><span class="status-pill" :class="{ warning: alarms.length }">● {{ systemState }}</span><span class="source-pill">数据来源：仿真</span></div>
      </header>

      <div class="demo-note">当前平台展示完整的数据采集、5G传输、MQTT接入、数据库、告警和分析逻辑；所有运行值依据设备设计范围与典型工况生成，不代表真实现场测量值。</div>

      <template v-if="active === '运行总览'">
        <section class="metrics">
          <article class="metric-card"><span>进口压力 P1</span><div><strong>{{ telemetry.inletPressure.toFixed(3) }}</strong><em>MPa</em></div><small>设计范围 0.1–4.0 MPa</small></article>
          <article class="metric-card"><span>中间压力 Pm</span><div><strong>{{ telemetry.intermediatePressure.toFixed(3) }}</strong><em>MPa</em></div><small>双级调压中间状态</small></article>
          <article class="metric-card"><span>出口压力 P2</span><div><strong>{{ telemetry.outletPressure.toFixed(3) }}</strong><em>MPa</em></div><small>设定值 0.350 MPa</small></article>
          <article class="metric-card"><span>标准流量 Qn</span><div><strong>{{ telemetry.standardFlow.toFixed(0) }}</strong><em>Nm³/h</em></div><small>设计范围 400–8000</small></article>
        </section>
        <section class="grid">
          <article class="panel process-panel">
            <div class="panel-title"><div><span>双级调压数字孪生</span><small>阀位—压力—流量联动仿真</small></div><b>LIVE</b></div>
            <div class="process"><div class="pipe"></div><div class="node source"><span>P1</span><strong>{{ telemetry.inletPressure.toFixed(2) }}</strong><small>MPa</small></div><div class="valve stage-one"><div class="valve-core"></div><span>一级调压</span><strong>{{ telemetry.stage1Opening.toFixed(1) }}%</strong></div><div class="node middle"><span>Pm</span><strong>{{ telemetry.intermediatePressure.toFixed(2) }}</strong><small>MPa</small></div><div class="valve stage-two"><div class="valve-core"></div><span>二级调压</span><strong>{{ telemetry.stage2Opening.toFixed(1) }}%</strong></div><div class="node outlet" :class="{ danger: telemetry.outletPressure >= .38 || telemetry.outletPressure <= .32 }"><span>P2</span><strong>{{ telemetry.outletPressure.toFixed(3) }}</strong><small>MPa</small></div></div>
            <div class="progress-row"><label>一级阀位<div><i :style="{ width: telemetry.stage1Opening + '%' }"></i></div><b>{{ telemetry.stage1Opening.toFixed(1) }}%</b></label><label>二级阀位<div><i :style="{ width: telemetry.stage2Opening + '%' }"></i></div><b>{{ telemetry.stage2Opening.toFixed(1) }}%</b></label></div>
          </article>
          <article class="panel accuracy-panel"><div class="panel-title"><div><span>调压精度</span><small>仿真评价</small></div><b>AC5</b></div><div class="gauge"><div class="gauge-ring"><strong>{{ accuracy.toFixed(2) }}%</strong><span>当前相对偏差</span></div></div><dl><div><dt>目标压力</dt><dd>0.350 MPa</dd></div><div><dt>数据质量</dt><dd :class="telemetry.quality === 'GOOD' ? 'good' : 'bad'">{{ telemetry.quality }}</dd></div><div><dt>活动告警</dt><dd :class="alarms.length ? 'bad' : 'good'">{{ alarms.length }}</dd></div></dl></article>
          <article class="panel chart-panel"><div class="panel-title"><div><span>压力趋势</span><small>最近采集记录</small></div><b>REAL-TIME</b></div><div class="bars"><i v-for="(item,index) in history.slice(0,24).reverse()" :key="index" :style="{ height: Math.max(14, (item.outletPressure - .28) * 700) + 'px' }"></i></div><div class="legend"><span><i class="cyan"></i>出口压力 P2</span><span>最后更新 {{ telemetry.timestamp }}</span></div></article>
          <article class="panel alarm-panel"><div class="panel-title"><div><span>最新告警</span><small>自动阈值判断</small></div><b>{{ alarms.length }}</b></div><ul><li v-if="!alarms.length"><span class="正常">正常</span><div><strong>当前无活动告警</strong><small>双级调压器运行稳定</small></div></li><li v-for="alarm in alarms" :key="alarm.id"><span :class="alarm.level">{{ alarm.level }}</span><div><strong>{{ alarm.name }}</strong><small>{{ alarm.actual }} · {{ alarm.time }}</small></div></li></ul></article>
        </section>
      </template>

      <template v-else-if="active === '实时监控'">
        <section class="page-grid"><article class="panel wide"><div class="panel-title"><div><span>典型工况切换</span><small>用于演示因果关联和告警响应</small></div><b>SCENARIO</b></div><div class="scenario-buttons"><button v-for="item in scenarios" :key="item" :class="{ selected: scenario === item }" @click="resetScenario(item)">{{ item }}</button></div></article><article class="panel"><div class="panel-title"><div><span>实时遥测</span><small>1秒级仿真采集</small></div><b>{{ telemetry.quality }}</b></div><div class="telemetry-list"><div><span>P1进口压力</span><b>{{ telemetry.inletPressure.toFixed(3) }} MPa</b></div><div><span>Pm中间压力</span><b>{{ telemetry.intermediatePressure.toFixed(3) }} MPa</b></div><div><span>P2出口压力</span><b>{{ telemetry.outletPressure.toFixed(3) }} MPa</b></div><div><span>一级开度</span><b>{{ telemetry.stage1Opening.toFixed(1) }}%</b></div><div><span>二级开度</span><b>{{ telemetry.stage2Opening.toFixed(1) }}%</b></div><div><span>标准流量</span><b>{{ telemetry.standardFlow.toFixed(0) }} Nm³/h</b></div><div><span>气体温度</span><b>{{ telemetry.gasTemperature.toFixed(1) }} ℃</b></div></div></article><article class="panel"><div class="panel-title"><div><span>数据标识</span><small>避免混淆测量、仿真和预测</small></div><b>METADATA</b></div><div class="telemetry-list"><div><span>数据性质</span><b>仿真值</b></div><div><span>采集终端</span><b>RTJ-EDGE-001</b></div><div><span>通信方式</span><b>5G / MQTT（模拟）</b></div><div><span>质量码</span><b>{{ telemetry.quality }}</b></div><div><span>最后时间戳</span><b>{{ telemetry.timestamp }}</b></div></div></article></section>
      </template>

      <template v-else-if="active === '采集链路'">
        <section class="panel"><div class="panel-title"><div><span>从现场到平台的数据链路</span><small>底层逻辑完整展示，通信节点当前为逻辑模拟</small></div><b>ARCHITECTURE</b></div><div class="link-flow"><template v-for="(node,index) in linkNodes" :key="node.name"><div class="link-node" :class="node.status"><span>{{ node.status }}</span><strong>{{ node.name }}</strong><small>{{ node.subtitle }}</small><em>{{ node.detail }}</em></div><div v-if="index < linkNodes.length - 1" class="arrow">→</div></template></div></section>
        <section class="page-grid"><article class="panel"><div class="panel-title"><div><span>智能阀位指示器</span><small>边缘采集终端角色</small></div><b>EDGE</b></div><div class="telemetry-list"><div><span>内部位移通道</span><b>X1 / X2</b></div><div><span>外接压力通道</span><b>P1 / Pm / P2</b></div><div><span>外接流量通道</span><b>Qn</b></div><div><span>外接温度通道</span><b>T</b></div><div><span>PLC开关量</span><b>切断 / 放散 / 状态</b></div></div></article><article class="panel"><div class="panel-title"><div><span>模拟通信状态</span><small>未来真实系统的接口位置</small></div><b>5G</b></div><div class="telemetry-list"><div><span>网络状态</span><b>{{ telemetry.communicationStatus }}</b></div><div><span>信号强度</span><b>-71 dBm</b></div><div><span>上行延迟</span><b>42 ms</b></div><div><span>MQTT主题</span><b>gas-regulator/.../telemetry</b></div><div><span>报文丢失率</span><b>0.03%</b></div></div></article></section>
      </template>

      <template v-else-if="active === '历史数据'">
        <section class="panel"><div class="panel-title"><div><span>历史数据查询</span><small>当前由浏览器内存模拟时序数据库</small></div><div class="actions"><button class="ghost" @click="collecting = !collecting">{{ collecting ? '暂停采集' : '恢复采集' }}</button><button class="ghost" @click="clearHistory">清空记录</button></div></div><table><thead><tr><th>时间</th><th>P1</th><th>Pm</th><th>P2</th><th>Qn</th><th>一级阀位</th><th>二级阀位</th><th>质量</th></tr></thead><tbody><tr v-for="(row,index) in history" :key="index"><td>{{ row.timestamp }}</td><td>{{ row.inletPressure.toFixed(3) }}</td><td>{{ row.intermediatePressure.toFixed(3) }}</td><td>{{ row.outletPressure.toFixed(3) }}</td><td>{{ row.standardFlow.toFixed(0) }}</td><td>{{ row.stage1Opening.toFixed(1) }}%</td><td>{{ row.stage2Opening.toFixed(1) }}%</td><td>{{ row.quality }}</td></tr></tbody></table></section>
      </template>

      <template v-else-if="active === '告警中心'">
        <section class="metrics"><article class="metric-card"><span>活动告警</span><div><strong>{{ alarms.length }}</strong><em>条</em></div><small>自动阈值引擎</small></article><article class="metric-card"><span>严重告警</span><div><strong>{{ alarms.filter(a => a.level === '严重').length }}</strong><em>条</em></div><small>需立即关注</small></article><article class="metric-card"><span>今日历史</span><div><strong>12</strong><em>条</em></div><small>演示统计</small></article><article class="metric-card"><span>已确认率</span><div><strong>83.3</strong><em>%</em></div><small>演示统计</small></article></section><section class="panel"><div class="panel-title"><div><span>当前告警记录</span><small>实际值、阈值和状态完整展示</small></div><b>ALARM</b></div><table><thead><tr><th>级别</th><th>告警名称</th><th>实际值</th><th>阈值</th><th>状态</th><th>发生时间</th></tr></thead><tbody><tr v-if="!alarms.length"><td colspan="6">当前无活动告警，请在“实时监控”切换异常工况。</td></tr><tr v-for="alarm in alarms" :key="alarm.id"><td>{{ alarm.level }}</td><td>{{ alarm.name }}</td><td>{{ alarm.actual }}</td><td>{{ alarm.threshold }}</td><td>{{ alarm.status }}</td><td>{{ alarm.time }}</td></tr></tbody></table></section>
      </template>

      <template v-else>
        <section class="panel placeholder"><div><strong>{{ active }}</strong><p>该页面已纳入功能原型路线，下一批将补充完整交互、统计、试验流程和报告样式。</p></div></section>
      </template>
    </main>
  </div>
</template>
