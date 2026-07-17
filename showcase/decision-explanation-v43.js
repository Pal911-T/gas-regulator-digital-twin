(() => {
  const q = (s, r = document) => r.querySelector(s);
  const fmt = (v, n = 1) => Number(v).toFixed(n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function numberFrom(selector, fallback = 0) {
    const el = q(selector);
    const value = parseFloat(el?.value ?? el?.textContent ?? '');
    return Number.isFinite(value) ? value : fallback;
  }

  function findControlPanel() {
    return q('#v39PressureRoot .v39-side')
      || q('#v39PressureRoot .v39-side-panel')
      || q('#tab-pressure .v39-side')
      || q('#tab-pressure .v39-side-panel');
  }

  function ensurePanel() {
    const host = findControlPanel();
    if (!host || q('#v43DecisionPanel')) return;

    const style = document.createElement('style');
    style.id = 'v43DecisionStyle';
    style.textContent = `
      #v43DecisionPanel{margin-top:12px;padding:14px;border:1px solid rgba(0,229,255,.14);border-radius:14px;background:rgba(4,20,38,.88)}
      #v43DecisionPanel h4{margin:0 0 10px;color:#d9f8ff;font-size:15px}
      .v43-chain{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:stretch;gap:8px}
      .v43-node{padding:10px 11px;border:1px solid rgba(0,229,255,.11);border-radius:10px;background:rgba(255,255,255,.025)}
      .v43-node span{display:block;color:#7fb3c7;font-size:12px}
      .v43-node strong{display:block;margin-top:5px;color:#00e5ff;font-family:'Share Tech Mono',monospace;font-size:18px}
      .v43-arrow{display:flex;align-items:center;color:#4dbed2;font-size:18px}
      .v43-basis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
      .v43-basis div{padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.02);color:#91bfd0;font-size:12px;line-height:1.55}
      .v43-summary{margin-top:10px;padding:9px 10px;border-left:3px solid #00e5ff;background:rgba(0,229,255,.045);color:#a8d2df;font-size:12.5px;line-height:1.7}
      @media(max-width:1400px){.v43-chain{grid-template-columns:1fr}.v43-arrow{justify-content:center;transform:rotate(90deg)}.v43-basis{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'v43DecisionPanel';
    panel.innerHTML = `
      <h4>调节决策解释</h4>
      <div class="v43-chain">
        <div class="v43-node"><span>当前状态</span><strong id="v43State">P2 7.15 kPa</strong></div>
        <div class="v43-arrow">→</div>
        <div class="v43-node"><span>调节决策</span><strong id="v43Decision">一级维持 · 二级微调</strong></div>
        <div class="v43-arrow">→</div>
        <div class="v43-node"><span>预计结果</span><strong id="v43Outcome">约 2.5 min 恢复</strong></div>
      </div>
      <div class="v43-basis">
        <div id="v43Error">当前偏差：-0.35 kPa</div>
        <div id="v43Disturbance">扰动输入：上游 0% · 负荷 0%</div>
        <div id="v43Delay">响应延迟：80 ms</div>
        <div id="v43Margin">阀位余量：充足</div>
      </div>
      <div class="v43-summary" id="v43Summary">当前出口压力略低于目标值，一级主调节无需明显动作，二级稳压阀承担小幅补偿。</div>
    `;
    host.appendChild(panel);
  }

  function updatePanel() {
    ensurePanel();
    if (!q('#v43DecisionPanel')) return;

    const p2 = numberFrom('#v39P2', numberFrom('#v37P2', 7.15));
    const target = numberFrom('#v39Target', numberFrom('#v37Target', 7.5));
    const up = numberFrom('#v39Up', numberFrom('#v37Up', 0));
    const load = numberFrom('#v39Load', numberFrom('#v37Load', 0));
    const delay = numberFrom('#v39Delay', numberFrom('#v37Delay', 80));
    const v1 = numberFrom('#v39V1', numberFrom('#v37RecV1', 0));
    const v2 = numberFrom('#v39V2', numberFrom('#v37RecV2', 0));
    const restore = numberFrom('#v39Restore', numberFrom('#v37Restore', 2.5));
    const error = p2 - target;

    const x1 = numberFrom('#v36RtX1', 61);
    const x2 = numberFrom('#v36RtX2', 59);
    const margin1 = clamp(100 - x1, 0, 100);
    const margin2 = clamp(100 - x2, 0, 100);
    const marginText = Math.min(margin1, margin2) > 20 ? '充足' : Math.min(margin1, margin2) > 10 ? '一般' : '不足';

    const stateText = `P2 ${fmt(p2, 2)} kPa · 偏差 ${error >= 0 ? '+' : ''}${fmt(error, 2)} kPa`;
    const decisionText = `${Math.abs(v1) < 0.4 ? '一级维持' : `一级${v1 >= 0 ? '开大' : '关小'} ${fmt(Math.abs(v1), 1)}%`} · ${Math.abs(v2) < 0.4 ? '二级维持' : `二级${v2 >= 0 ? '开大' : '关小'} ${fmt(Math.abs(v2), 1)}%`}`;
    const outcomeText = `约 ${fmt(restore, 1)} min 恢复 · 风险${q('#v39Risk')?.textContent?.trim() || '低'}`;

    q('#v43State').textContent = stateText;
    q('#v43Decision').textContent = decisionText;
    q('#v43Outcome').textContent = outcomeText;
    q('#v43Error').textContent = `当前偏差：${error >= 0 ? '+' : ''}${fmt(error, 2)} kPa`;
    q('#v43Disturbance').textContent = `扰动输入：上游 ${up >= 0 ? '+' : ''}${fmt(up, 0)}% · 负荷 ${load >= 0 ? '+' : ''}${fmt(load, 0)}%`;
    q('#v43Delay').textContent = `响应延迟：${fmt(delay, 0)} ms`;
    q('#v43Margin').textContent = `阀位余量：${marginText}（X1 ${fmt(margin1, 0)}% · X2 ${fmt(margin2, 0)}%）`;

    let summary;
    if (Math.abs(error) <= 0.15) {
      summary = '出口压力已接近目标值，当前以保持双级阀位和持续观察为主，避免不必要的反复调节。';
    } else if (error < 0) {
      summary = `出口压力低于目标值 ${fmt(Math.abs(error), 2)} kPa。一级阀用于补偿主负荷扰动，二级阀用于消除剩余偏差；当前建议以${Math.abs(v1) < 0.4 ? '二级微调' : '一级补偿后由二级压稳'}为主。`;
    } else {
      summary = `出口压力高于目标值 ${fmt(error, 2)} kPa。应优先减小主调节开度，再由二级阀抑制超调，并观察响应延迟是否导致压力回落过慢。`;
    }
    q('#v43Summary').textContent = summary;
  }

  function boot() {
    ensurePanel();
    updatePanel();
    setInterval(updatePanel, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
