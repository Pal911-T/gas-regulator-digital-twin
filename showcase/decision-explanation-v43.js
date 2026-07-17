(() => {
  const q = (s, r = document) => r.querySelector(s);
  const fmt = (v, n = 1) => Number(v).toFixed(n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function textElement(fragment) {
    return Array.from(document.querySelectorAll('span,small,div,b,strong,h4')).find(el =>
      el.children.length === 0 && (el.textContent || '').trim().includes(fragment)
    );
  }

  function numericNear(label, fallback = 0) {
    const labelEl = textElement(label);
    if (!labelEl) return fallback;
    let node = labelEl.parentElement;
    for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
      const candidates = Array.from(node.querySelectorAll('strong,b,.metric-val,.rt-number'));
      for (const el of candidates) {
        const value = parseFloat(el.textContent || '');
        if (Number.isFinite(value)) return value;
      }
    }
    return fallback;
  }

  function sliderNear(label, fallback = 0) {
    const labelEl = textElement(label);
    if (!labelEl) return fallback;
    let node = labelEl.parentElement;
    for (let i = 0; i < 5 && node; i++, node = node.parentElement) {
      const input = node.querySelector('input[type="range"]');
      if (input) {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : fallback;
      }
    }
    return fallback;
  }

  function commonAncestor(a, b) {
    if (!a || !b) return null;
    const ancestors = [];
    let node = a;
    while (node) { ancestors.push(node); node = node.parentElement; }
    node = b;
    while (node) {
      if (ancestors.includes(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function findInsertionPoint() {
    const first = textElement('一级阀建议调整');
    const risk = textElement('风险等级');
    const grid = commonAncestor(first, risk);
    if (!grid) return null;

    let candidate = grid;
    while (candidate.parentElement && candidate.parentElement !== document.body) {
      const text = candidate.textContent || '';
      if (text.includes('上游来压变化') && text.includes('预计恢复时间')) break;
      candidate = candidate.parentElement;
    }
    return { grid, panel: candidate };
  }

  function ensureStyle() {
    if (q('#v43DecisionStyle')) return;
    const style = document.createElement('style');
    style.id = 'v43DecisionStyle';
    style.textContent = `
      #v43DecisionPanel{margin:12px 0 0;padding:14px;border:1px solid rgba(0,229,255,.18);border-radius:14px;background:linear-gradient(180deg,rgba(6,29,52,.96),rgba(4,20,38,.96));box-shadow:inset 0 0 0 1px rgba(0,229,255,.035)}
      #v43DecisionPanel h4{margin:0 0 10px;color:#d9f8ff;font-size:15px}
      .v43-chain{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:stretch;gap:8px}
      .v43-node{padding:10px 11px;border:1px solid rgba(0,229,255,.13);border-radius:10px;background:rgba(255,255,255,.025)}
      .v43-node span{display:block;color:#7fb3c7;font-size:12px}
      .v43-node strong{display:block;margin-top:5px;color:#00e5ff;font-family:'Share Tech Mono',monospace;font-size:17px;line-height:1.35}
      .v43-arrow{display:flex;align-items:center;color:#4dbed2;font-size:18px}
      .v43-basis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
      .v43-basis div{padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.025);color:#91bfd0;font-size:12px;line-height:1.55}
      .v43-summary{margin-top:10px;padding:9px 10px;border-left:3px solid #00e5ff;background:rgba(0,229,255,.05);color:#a8d2df;font-size:12.5px;line-height:1.7}
      @media(max-width:1450px){.v43-chain{grid-template-columns:1fr}.v43-arrow{justify-content:center;transform:rotate(90deg)}.v43-basis{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    if (q('#v43DecisionPanel')) return;
    const point = findInsertionPoint();
    if (!point) return;
    ensureStyle();

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
        <div id="v43Margin">阀位余量：根据当前建议判断</div>
      </div>
      <div class="v43-summary" id="v43Summary">当前出口压力略低于目标值，一级主调节无需明显动作，二级稳压阀承担小幅补偿。</div>
    `;

    point.grid.insertAdjacentElement('afterend', panel);
  }

  function updatePanel() {
    ensurePanel();
    if (!q('#v43DecisionPanel')) return;

    const p2 = numericNear('P2 出口压力', numericNear('出口压力', 7.15));
    const target = sliderNear('目标出口压力', 7.5);
    const up = sliderNear('上游来压变化', 0);
    const load = sliderNear('下游负荷变化', 0);
    const delay = sliderNear('阀位响应延迟', 80);
    const v1 = numericNear('一级阀建议调整', 0);
    const v2 = numericNear('二级阀建议调整', 0);
    const restore = numericNear('预计恢复时间', 2.5);
    const risk = (textElement('风险等级')?.parentElement?.textContent || '低').match(/低|中|高/)?.[0] || '低';
    const error = p2 - target;

    const stateText = `P2 ${fmt(p2, 2)} kPa · 偏差 ${error >= 0 ? '+' : ''}${fmt(error, 2)} kPa`;
    const decisionText = `${Math.abs(v1) < 0.4 ? '一级维持' : `一级${v1 >= 0 ? '开大' : '关小'} ${fmt(Math.abs(v1), 1)}%`} · ${Math.abs(v2) < 0.4 ? '二级维持' : `二级${v2 >= 0 ? '开大' : '关小'} ${fmt(Math.abs(v2), 1)}%`}`;
    const outcomeText = `约 ${fmt(restore, 1)} min 恢复 · 风险${risk}`;

    q('#v43State').textContent = stateText;
    q('#v43Decision').textContent = decisionText;
    q('#v43Outcome').textContent = outcomeText;
    q('#v43Error').textContent = `当前偏差：${error >= 0 ? '+' : ''}${fmt(error, 2)} kPa`;
    q('#v43Disturbance').textContent = `扰动输入：上游 ${up >= 0 ? '+' : ''}${fmt(up, 0)}% · 负荷 ${load >= 0 ? '+' : ''}${fmt(load, 0)}%`;
    q('#v43Delay').textContent = `响应延迟：${fmt(delay, 0)} ms`;

    const activity = Math.max(Math.abs(v1), Math.abs(v2));
    const marginText = activity < 4 ? '充足' : activity < 9 ? '一般' : '偏紧';
    q('#v43Margin').textContent = `调节余量判断：${marginText}（最大建议动作 ${fmt(activity, 1)}%）`;

    let summary;
    if (Math.abs(error) <= 0.15) {
      summary = '出口压力已接近目标值，建议保持双级阀位并持续观察，避免无必要的反复调节。';
    } else if (error < 0) {
      summary = `出口压力低于目标值 ${fmt(Math.abs(error), 2)} kPa。一级阀承担主扰动补偿，二级阀消除剩余偏差；当前决策以${Math.abs(v1) < 0.4 ? '二级细调' : '一级补偿后由二级压稳'}为主。`;
    } else {
      summary = `出口压力高于目标值 ${fmt(error, 2)} kPa。应优先减小一级主调节开度，再由二级阀抑制超调，并关注响应延迟是否造成回落过慢。`;
    }
    q('#v43Summary').textContent = summary;
  }

  function boot() {
    updatePanel();
    const observer = new MutationObserver(() => {
      if (!q('#v43DecisionPanel')) ensurePanel();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(updatePanel, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
