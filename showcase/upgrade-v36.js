(() => {
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=(v,n=1)=>Number(v).toFixed(n);
  const text=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  const state={history:[],last:Date.now()};

  function addPressureUpgrade(){
    const stage=q('.v34-stage');
    if(!stage || stage.dataset.v36) return;
    stage.dataset.v36='1';
    stage.innerHTML = `
      <div class="v36-stage-toolbar">
        <button class="v36-view active" data-mode="mix">综合</button>
        <button class="v36-view" data-mode="pressure">压力场</button>
        <button class="v36-view" data-mode="velocity">流速场</button>
        <button class="v36-view" data-mode="structure">结构</button>
        <span class="v36-window">分析时窗：最近 10 分钟滚动窗口</span>
      </div>
      <div class="v36-cutaway mode-mix" id="v36Cutaway">
        <div class="v36-shell v36-left-shell"></div><div class="v36-shell v36-center-shell"></div><div class="v36-shell v36-right-shell"></div>
        <div class="v36-flow-lane"></div><div class="v36-zone v36-inlet"></div><div class="v36-zone v36-throat"></div><div class="v36-zone v36-outlet"></div>
        <div class="v36-diaphragm"></div><div class="v36-seat"></div><div class="v36-core"></div><div class="v36-rod"></div><div class="v36-topcase"></div><div class="v36-botcase"></div><div class="v36-flow-glow"></div>
        <div class="v36-particle p1"></div><div class="v36-particle p2"></div><div class="v36-particle p3"></div><div class="v36-particle p4"></div><div class="v36-particle p5"></div>
        <div class="v36-chip p1"><small>进口压力 P1 · 仿真值</small><strong id="v36P1">0.272 MPa</strong></div>
        <div class="v36-chip pm"><small>中间压力 Pm · 计算值</small><strong id="v36Pm">0.091 MPa</strong></div>
        <div class="v36-chip p2"><small>出口压力 P2 · 预测值</small><strong id="v36P2">7.50 kPa</strong></div>
        <div class="v36-zone-label inlet">高压进口腔</div><div class="v36-zone-label throat">一级节流 / 主调节区</div><div class="v36-zone-label outlet">二级稳压 / 低压出口腔</div>
        <div class="v36-caption">基于 RTJ-25/4.0Z 结构机理展示高压来气、节流加速、稳压恢复和出口流束变化。分析与预测基于最近 10 分钟滚动序列持续更新，用于说明趋势与逻辑，不替代真实 CFD 结果。</div>
      </div>
      <div class="v36-mini-grid">
        <div class="v36-mini"><span>节流口相对流速</span><strong id="v36RelVel">1.00 x</strong></div>
        <div class="v36-mini"><span>一级阀位余量</span><strong id="v36Margin1">35.0 %</strong></div>
        <div class="v36-mini"><span>二级阀位余量</span><strong id="v36Margin2">41.0 %</strong></div>
        <div class="v36-mini"><span>调压能力利用率</span><strong id="v36Use">58.0 %</strong></div>
      </div>
      <div class="v36-diagnosis-grid">
        <div class="v36-diag"><h4>压力响应诊断</h4><p id="v36DiagPressure">基于最近10分钟 P1、Pm、P2 序列，出口压力围绕目标值小幅波动，当前偏差处于可控范围。</p></div>
        <div class="v36-diag"><h4>阀位与执行机构诊断</h4><p id="v36DiagValve">一级阀负责粗调，二级阀负责细调；当前响应延迟未显著削弱双级协同能力。</p></div>
        <div class="v36-diag"><h4>流动与稳定性诊断</h4><p id="v36DiagFlow">节流区流速提升明显，但出口恢复段未出现高频振荡征兆，稳压恢复趋势较清晰。</p></div>
      </div>`;
    qa('.v36-view', stage).forEach(btn=>btn.addEventListener('click', ()=>{
      qa('.v36-view', stage).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const box=q('#v36Cutaway'); if(box) box.className='v36-cutaway mode-'+btn.dataset.mode;
    }));
  }

  function addRealtimeUpgrade(){
    const page=q('#tab-realtime .main');
    if(!page || q('#v36RealtimePanel')) return;
    const rtCard=q('#tab-realtime .card');
    const panel=document.createElement('div');
    panel.id='v36RealtimePanel';
    panel.className='card';
    panel.style.marginBottom='14px';
    panel.innerHTML=`<div class="card-head"><div class="card-title">关键运行指标实时面板</div><div style="font-size:14px;color:var(--text-muted)">结合计划书与双级调压监测逻辑</div></div>
    <div class="v36-rt-grid">
      <div class="v36-rt-kpi"><span>中间压力 Pm</span><strong id="v36RtPm">0.091 MPa</strong><small>一级出口 / 二级进口</small></div>
      <div class="v36-rt-kpi"><span>出口设定值 Pset</span><strong id="v36RtSet">7.50 kPa</strong><small>稳压目标</small></div>
      <div class="v36-rt-kpi"><span>估算工况流速 v</span><strong id="v36RtVel">18.6 m/s</strong><small>由 Q 与有效流通截面估算</small></div>
      <div class="v36-rt-kpi"><span>一级阀位 X1</span><strong id="v36RtX1">61.2 %</strong><small>主调节阀位</small></div>
      <div class="v36-rt-kpi"><span>二级阀位 X2</span><strong id="v36RtX2">56.8 %</strong><small>精细稳压阀位</small></div>
      <div class="v36-rt-kpi"><span>瞬时调压偏差</span><strong id="v36RtErr">-0.38 kPa</strong><small>P2 - Pset</small></div>
      <div class="v36-rt-kpi"><span>稳压精度指标</span><strong id="v36RtAcc">94.9 %</strong><small>演示指标，参考 AC5 目标</small></div>
      <div class="v36-rt-kpi"><span>5G / 通信质量</span><strong id="v36RtComm">GOOD</strong><small id="v36RtLatency">16 ms · 丢包率 0.2%</small></div>
    </div>
    <div class="v36-rt-detail-grid">
      <div class="v36-rt-detail"><h4>实时监控重点</h4><ul><li>P1、Pm、P2 三级压力联动观察</li><li>Q、T 与估算流速共同判断工况变化</li><li>X1/X2 双级阀位反映调节分工与余量</li><li>偏差、精度、通信质量用于辅助诊断</li></ul></div>
      <div class="v36-rt-detail"><h4>当前运行判读</h4><p id="v36RtSummary">当前出口压力接近设定值，中间压力稳定，一级与二级阀位仍具调节余量，未见明显异常放大趋势。</p></div>
    </div>`;
    rtCard.after(panel);
  }

  function movingStats(arr){if(!arr.length) return {avg:0,max:0,std:0,slope:0}; const avg=arr.reduce((a,b)=>a+b,0)/arr.length; const max=Math.max(...arr); const std=Math.sqrt(arr.reduce((a,b)=>a+(b-avg)**2,0)/arr.length); const slope=arr.length>1?(arr[arr.length-1]-arr[0])/(arr.length-1):0; return {avg,max,std,slope};}
  function readBaseRealtime(){return {inP:parseFloat(q('#rt_in')?.textContent)||0.258,outP:parseFloat(q('#rt_out')?.textContent)||7.12,valve:parseFloat(q('#rt_valve')?.textContent)||65,flow:parseFloat(q('#rt_flow')?.textContent)||94,temp:parseFloat(q('#rt_temp')?.textContent)||13.2};}

  function update(){
    const t=Date.now()/1000, up=parseFloat(q('#v34Up')?.value)||0, load=parseFloat(q('#v34Load')?.value)||0, target=parseFloat(q('#v34Target')?.value)||7.5, delay=parseFloat(q('#v34Delay')?.value)||80;
    text('v34UpText',up+'%'); text('v34LoadText',load+'%'); text('v34TargetText',fmt(target,1)+' kPa'); text('v34DelayText',delay+' ms');
    const p1=0.272*(1+up*0.006)+0.0025*Math.sin(t/7), pm=clamp(0.091+up*0.0007-load*0.0009+0.0018*Math.sin(t/8+0.4),0.05,0.18), p2=clamp(target+up*0.017-load*0.021-delay*0.0012+0.10*Math.sin(t/7),2,12.6);
    const natural=target+up*0.045-load*0.055-delay*0.003+0.20*Math.sin(t/6), relVel=clamp(1+load*0.015+up*0.004+delay*0.0015,0.7,2.6), x1=clamp(58+load*0.55-up*0.18+delay*0.03+2*Math.sin(t/9),8,95), x2=clamp(52+load*0.48+up*0.1+delay*0.02+2*Math.cos(t/10),5,93), use=clamp(58+load*0.9+up*0.25+delay*0.04,18,96);
    state.history.push(p2); if(state.history.length>120) state.history.shift(); const stats=movingStats(state.history); const residual=clamp(1.8+Math.abs(load)*0.03+delay*0.008+Math.abs(up)*0.02,0.8,8.5), conf=clamp(96-residual*2.2-delay*0.025,54,96), restore=clamp(1.6+Math.abs(load)*0.035+delay*0.004+Math.abs(up)*0.015,0.8,9.5), highProb=clamp((Math.max(0,natural-target)*6+delay*0.04+Math.max(0,load)*0.08),0.4,32), lowProb=clamp((Math.max(0,target-natural)*5+Math.max(0,-up)*0.12+Math.max(0,load)*0.03),0.4,28), steady=Math.abs(stats.avg-target), over=Math.max(0,stats.max-target), risk=((highProb*0.35+lowProb*0.25+residual*4+delay*0.03)<18)?'低':((highProb*0.35+lowProb*0.25+residual*4+delay*0.03)<34?'中':'高');
    ['v36P1','v34P1'].forEach(id=>text(id,fmt(p1,3)+' MPa')); ['v36Pm','v34Pm'].forEach(id=>text(id,fmt(pm,3)+' MPa')); ['v36P2','v34P2'].forEach(id=>text(id,fmt(p2,2)+' kPa'));
    text('v36RelVel',fmt(relVel,2)+' x'); text('v36Margin1',fmt(100-x1,1)+' %'); text('v36Margin2',fmt(100-x2,1)+' %'); text('v36Use',fmt(use,1)+' %');
    text('v34V1',(x1>60?'+':'')+fmt((x1-58)/3,1)+'%'); text('v34V2',(x2>52?'+':'')+fmt((x2-52)/3,1)+'%'); text('v34Restore',fmt(restore,1)+' min'); text('v34Overshoot',fmt(over,2)+' kPa'); text('v34Steady',fmt(steady,2)+' kPa'); text('v34Risk',risk); text('v34RiskNote',risk==='低'?'未触及安全边界':risk==='中'?'需关注调节余量':'存在边界逼近风险'); text('v34Recommendation',risk==='低'?'当前扰动可由双级调节吸收，建议保持设定并持续观察。':risk==='中'?'建议一级阀优先补偿负荷变化，再由二级阀抑制出口偏差。':'建议立即缩小扰动、检查执行机构响应，并核验传感器与阀位反馈。');
    text('v34HighProb',fmt(highProb,1)+'%'); text('v34LowProb',fmt(lowProb,1)+'%'); text('v34Confidence',fmt(conf,0)+'%'); text('v34ConfidenceLevel',conf>86?'高':conf>72?'中':'低'); const cbar=q('#v34ConfidenceBar'); if(cbar)cbar.style.width=conf+'%';
    [['v34PressureMatch',conf+2],['v34ValveMatch',conf-1.5],['v34FlowMatch',conf-3]].forEach(([id,v])=>text(id,fmt(clamp(v,0,100),1)+'%')); ['v34PressureBar','v34ValveBar','v34FlowBar'].forEach((id,i)=>{const e=q('#'+id); if(e)e.style.width=clamp([conf+2,conf-1.5,conf-3][i],0,100)+'%';});
    text('v34Margin',fmt(clamp(12-stats.max,0.8,9.9),1)+' kPa'); text('v34Residual',fmt(residual,1)+'%'); text('v34Trust',conf>86?'高可信':conf>72?'中可信':'谨慎参考');
    text('v34MarginExplain',`最近10分钟 P2 平均值 ${fmt(stats.avg,2)} kPa，距 12.0 kPa 上界仍有 ${fmt(clamp(12-stats.max,0,99),1)} kPa 裕度；一级/二级阀位余量分别为 ${fmt(100-x1,1)}% / ${fmt(100-x2,1)}%。`);
    text('v34ResidualExplain',`综合模型残差 ${fmt(residual,1)}%，其中响应延迟贡献 ${fmt(delay*0.01,1)}%、上游来压贡献 ${fmt(Math.abs(up)*0.06,1)}%、负荷贡献 ${fmt(Math.abs(load)*0.05,1)}%。`);
    text('v36DiagPressure',`最近10分钟 P2 平均 ${fmt(stats.avg,2)} kPa，目标值 ${fmt(target,1)} kPa，稳态误差 ${fmt(steady,2)} kPa；P1→Pm→P2 压降分配体现粗调与精调协同。`); text('v36DiagValve',`一级阀位 ${fmt(x1,1)}%，二级阀位 ${fmt(x2,1)}%；响应延迟 ${delay} ms 时，预计恢复时间 ${fmt(restore,1)} min。`); text('v36DiagFlow',`节流口相对流速约 ${fmt(relVel,2)}x，能力利用率 ${fmt(use,1)}%；出口恢复段当前未见强烈振荡征兆。`);
    const ev=q('#v34Evidence'); if(ev)ev.innerHTML=`<li>最近10分钟 P2 平均值 ${fmt(stats.avg,2)} kPa，标准差 ${fmt(stats.std,2)} kPa，趋势斜率 ${fmt(stats.slope,3)} kPa/步。</li><li>综合残差 ${fmt(residual,1)}%，预测可信度 ${fmt(conf,0)}%，具备短时推演条件。</li><li>自然响应峰值 ${fmt(stats.max+Math.max(0,natural-p2),2)} kPa，推荐调节后预测峰值 ${fmt(Math.max(stats.max,p2),2)} kPa。</li>`;
    text('v34Mechanism','上游来压变化首先改变一级有效压差，下游负荷变化则直接拉动流量需求；一级阀优先补偿主扰动，二级阀再对 P2 偏差进行细调。若阀位延迟增大，将同步抬高恢复时间、残差和短时超调。'); text('v34Action',risk==='低'?'建议维持设定，持续监测 Pm 与 P2 联动趋势，并记录本轮扰动后的恢复过程。':risk==='中'?'建议适度提高一级补偿并压缩二级超调，复核阀位反馈与执行延迟。':'建议立即降低扰动输入、检查执行机构与传感器状态，并结合历史记录进行人工确认。');
    const rt=readBaseRealtime(), pmRt=clamp(rt.inP*0.36+0.003*Math.sin(t/8),0.06,0.16), x1Rt=clamp(rt.valve+4*Math.sin(t/11),0,100), x2Rt=clamp(rt.valve-6+4*Math.cos(t/13),0,100), pset=7.5, err=rt.outP-pset, area=0.0016, vel=rt.flow/3600/area, acc=clamp(100-Math.abs(err)/pset*100*3.2,72,99.2), latency=12+Math.abs(Math.sin(t/5))*14;
    text('v36RtPm',fmt(pmRt,3)+' MPa'); text('v36RtSet',fmt(pset,2)+' kPa'); text('v36RtVel',fmt(vel,1)+' m/s'); text('v36RtX1',fmt(x1Rt,1)+' %'); text('v36RtX2',fmt(x2Rt,1)+' %'); text('v36RtErr',(err>=0?'+':'')+fmt(err,2)+' kPa'); text('v36RtAcc',fmt(acc,1)+' %'); text('v36RtComm',latency<20?'GOOD':latency<28?'FAIR':'WARN'); text('v36RtLatency',`${fmt(latency,0)} ms · 丢包率 ${fmt(clamp((latency-10)/100,0.1,0.8),1)}%`); text('v36RtSummary',`当前 P1=${fmt(rt.inP,3)} MPa、Pm=${fmt(pmRt,3)} MPa、P2=${fmt(rt.outP,2)} kPa，Q≈${fmt(rt.flow,0)} m³/h、v≈${fmt(vel,1)} m/s；双级阀位 X1/X2 为 ${fmt(x1Rt,1)}% / ${fmt(x2Rt,1)}%，调压偏差 ${err>=0?'+':''}${fmt(err,2)} kPa，通信质量 ${latency<20?'良好':'需关注'}。`);
  }
  function boot(){addPressureUpgrade(); addRealtimeUpgrade(); update(); setInterval(update,1000);} if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();