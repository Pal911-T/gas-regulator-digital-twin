<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Metric = { label: string; value: number; unit: string; trend: string }
type Alarm = { level: '正常' | '提示' | '警告'; text: string; time: string }

const navItems = ['运行总览', '实时监控', '精度试验', '预测预警', '告警中心', '设备档案']
const active = ref('运行总览')
const tick = ref(0)
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => tick.value += 1, 1200)
})
onBeforeUnmount(() => window.clearInterval(timer))

const wave = (base: number, amplitude: number, rate: number) =>
  base + Math.sin(tick.value / rate) * amplitude

const metrics = computed<Metric[]>(() => [
  { label: '进口压力 P1', value: wave(2.42, 0.04, 5), unit: 'MPa', trend: '+0.8%' },
  { label: '中间压力 Pm', value: wave(0.92, 0.018, 4), unit: 'MPa', trend: '-0.2%' },
  { label: '出口压力 P2', value: wave(0.350, 0.004, 3), unit: 'MPa', trend: '+0.1%' },
  { label: '标准流量 Qn', value: wave(4210, 135, 4), unit: 'Nm³/h', trend: '+2.4%' },
])

const stage1 = computed(() => wave(57, 4, 4))
const stage2 = computed(() => wave(48, 3, 3))
const accuracy = computed(() => Math.abs((metrics.value[2].value - 0.35) / 0.35 * 100))

const alarms: Alarm[] = [
  { level: '正常', text: '双级调压器运行稳定', time: '刚刚' },
  { level: '提示', text: '一级阀位进入高负荷区间', time: '2 分钟前' },
  { level: '正常', text: '5G 通信质量良好', time: '5 分钟前' },
]
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">GT</div>
        <div>
          <strong>GasTwin</strong>
          <span>调压器数字孪生</span>
        </div>
      </div>
      <nav>
        <button
          v-for="item in navItems"
          :key="item"
          :class="{ active: active === item }"
          @click="active = item"
        >
          <span class="dot"></span>{{ item }}
        </button>
      </nav>
      <div class="device-card">
        <span class="online-dot"></span>
        <div><strong>RTJ-25/4.0Z-001</strong><small>设备在线 · 仿真数据</small></div>
      </div>
    </aside>

    <main>
      <header>
        <div>
          <p class="eyebrow">RTJ-25/4.0Z AXIAL-FLOW REGULATOR</p>
          <h1>{{ active }}</h1>
        </div>
        <div class="header-actions">
          <span class="status-pill">● 系统运行正常</span>
          <button class="ghost">导出报告</button>
        </div>
      </header>

      <section class="metrics">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <div><strong>{{ metric.value.toFixed(metric.unit === 'MPa' ? 3 : 0) }}</strong><em>{{ metric.unit }}</em></div>
          <small>{{ metric.trend }} 较上一周期</small>
        </article>
      </section>

      <section class="grid">
        <article class="panel process-panel">
          <div class="panel-title"><div><span>双级调压流程</span><small>Digital Twin Process</small></div><b>LIVE</b></div>
          <div class="process">
            <div class="pipe line-a"></div>
            <div class="node source"><span>P1</span><strong>{{ metrics[0].value.toFixed(2) }}</strong><small>MPa</small></div>
            <div class="valve stage-one"><div class="valve-core"></div><span>一级调压</span><strong>{{ stage1.toFixed(1) }}%</strong></div>
            <div class="node middle"><span>Pm</span><strong>{{ metrics[1].value.toFixed(2) }}</strong><small>MPa</small></div>
            <div class="valve stage-two"><div class="valve-core"></div><span>二级调压</span><strong>{{ stage2.toFixed(1) }}%</strong></div>
            <div class="node outlet"><span>P2</span><strong>{{ metrics[2].value.toFixed(3) }}</strong><small>MPa</small></div>
          </div>
          <div class="progress-row">
            <label>一级阀位<div><i :style="{ width: stage1 + '%' }"></i></div><b>{{ stage1.toFixed(1) }}%</b></label>
            <label>二级阀位<div><i :style="{ width: stage2 + '%' }"></i></div><b>{{ stage2.toFixed(1) }}%</b></label>
          </div>
        </article>

        <article class="panel accuracy-panel">
          <div class="panel-title"><div><span>调压精度</span><small>Accuracy Evaluation</small></div><b>AC5</b></div>
          <div class="gauge">
            <div class="gauge-ring"><strong>{{ accuracy.toFixed(2) }}%</strong><span>当前偏差</span></div>
          </div>
          <dl>
            <div><dt>目标压力</dt><dd>0.350 MPa</dd></div>
            <div><dt>稳定性评价</dt><dd class="good">优秀</dd></div>
            <div><dt>预测风险</dt><dd class="good">低</dd></div>
          </dl>
        </article>

        <article class="panel chart-panel">
          <div class="panel-title"><div><span>压力趋势</span><small>近 60 秒仿真曲线</small></div><b>REAL-TIME</b></div>
          <svg viewBox="0 0 800 220" preserveAspectRatio="none" aria-label="压力趋势模拟图">
            <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>
            <g class="grid-lines"><line v-for="y in [40,80,120,160,200]" :key="y" x1="0" :y1="y" x2="800" :y2="y" /></g>
            <path d="M0 145 C80 120 120 150 200 130 S330 120 410 135 S540 115 620 130 S730 115 800 125 L800 220 L0 220Z" fill="url(#area)"/>
            <path d="M0 145 C80 120 120 150 200 130 S330 120 410 135 S540 115 620 130 S730 115 800 125" class="line pressure"/>
            <path d="M0 70 C90 77 150 63 240 72 S390 80 480 67 S650 76 800 68" class="line middle-line"/>
          </svg>
          <div class="legend"><span><i class="cyan"></i>出口压力 P2</span><span><i class="purple"></i>中间压力 Pm</span></div>
        </article>

        <article class="panel alarm-panel">
          <div class="panel-title"><div><span>运行事件</span><small>最新状态与告警</small></div><b>3</b></div>
          <ul>
            <li v-for="alarm in alarms" :key="alarm.text"><span :class="alarm.level">{{ alarm.level }}</span><div><strong>{{ alarm.text }}</strong><small>{{ alarm.time }}</small></div></li>
          </ul>
        </article>
      </section>
    </main>
  </div>
</template>
