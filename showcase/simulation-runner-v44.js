(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const fmt=(v,n=1)=>Number(v).toFixed(n);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state={mode:'auto',running:true,stepSeconds:5,stepIndex:0,timer:null,p1:0.258,pm:0.091,p2:7.15,q:94,historyP2:[],historyQ:[],pressureChart:null,flowChart:null};

  function readNum(sel,fallback){const el=q(sel);const v=parseFloat(el?.value??el?.textContent??'');return Number.isFinite(v)?v:fallback;}
  function setText(sel,val){const el=q(sel);if(el)el.textContent=val;}

  function ensureStyle(){
    if(q('#v44Style'))return;
    const style=document.createElement('style');style.id='v44Style';style.textContent=`
      #tab-pressure .v39-tag.t2{left:50%!important;transform:translateX(-50%)!important;bottom:86px!important;top:auto!important;z-index:7!important}
      #tab-pressure .v39-label.l4{left:50%!important;transform:translateX(-50%)!important;bottom:132px!important;max-width:340px!important;z-index:7!important}
      #tab-pressure .v39-caption{bottom:10px!important;z-index:5!important}
      #v44Runner{margin-top:12px;padding:14px;border:1px solid rgba(0,229,255,.16);border-radius:14px;background:rgba(4,20,38,.94)}
      #v44Runner .v44-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      #v44Runner .v44-title{font-size:15px;color:#d9f8ff}.v44-status{font-family:'Share Tech Mono',monospace;color:#00e5ff;font-size:13px}
      .v44-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.v44-mode{padding:10px;border-radius:10px;border:1px solid rgba(0,229,255,.15);background:#071d34;color:#91c8d9;cursor:pointer;text-align:left}.v44-mode.active{border-color:#00e5ff;background:rgba(0,229,255,.12);color:#fff}.v44-mode b{display:block;margin-bottom:4px}.v44-mode small{display:block;color:#74a7ba;line-height:1.5}
      #v44Runner .v44-actions{display:flex;gap:8px;flex-wrap:wrap}#v44Runner button{padding:7px 12px;border-radius:8px;border:1px solid rgba(0,229,255,.18);background:#071d34;color:#9fd7e8;cursor:pointer}#v44Runner button.primary{background:rgba(0,229,255,.14);color:#fff;border-color:#00e5ff}#v44Runner button:disabled{opacity:.35;cursor:not-allowed}
      #v44Runner .v44-note{margin-top:10px;padding:9px 10px;border-left:3px solid #00e5ff;background:rgba(0,229,255,.045);color:#9ecbd9;font-size:12.5px;line-height:1.7}
      .v44-auto .v39-slider,.v44-auto input[type=range]{opacity:.42;pointer-events:none}.v44-scenario .v39-slider,.v44-scenario input[type=range]{opacity:1;pointer-events:auto}
      #v44FlowForecastWrap{margin-top:12px;height:260px;padding:10px 14px;border-top:1px solid rgba(0,229,255,.08)}#v44FlowForecastWrap h4{margin:0 0 8px;color:#bceeff;font-size:14px}
    `;document.head.appendChild(style);
  }

  function controlHost(){
    const label=qa('span,div,b,strong').find(el=>el.children.length===0&&(el.textContent||'').includes('预计恢复时间'));
    if(!label)return null;
    let node=label.parentElement;
    for(let i=0;i<6&&node;i++,node=node.parentElement){const txt=node.textContent||'';if(txt.includes('一级阀建议调整')&&txt.includes('风险等级'))return node.parentElement||node;}
    return null;
  }

  function ensureRunner(){
    if(q('#v44Runner'))return;
    const host=controlHost();if(!host)return;
    const box=document.createElement('div');box.id='v44Runner';box.innerHTML=`
      <div class="v44-head"><div class="v44-title">预测与工况推演模式</div><div class="v44-status" id="v44Status">自动预测 · 5s 更新</div></div>
      <div class="v44-modes">
        <button class="v44-mode active" id="v44AutoMode"><b>自动运行预测</b><small>基于最近10分钟真实/演示运行序列，预测未来压力与流量趋势。右侧滑块不参与计算。</small></button>
        <button class="v44-mode" id="v44ScenarioMode"><b>假设工况推演</b><small>以当前状态为起点，右侧四个滑块作为人为设定的假设扰动条件。</small></button>
      </div>
      <div class="v44-actions"><button class="primary" id="v44Start">开始</button><button id="v44Pause">暂停</button><button id="v44Step">单步 +5s</button><button id="v44Reset">重置</button></div>
      <div class="v44-note" id="v44Note">自动预测模式每5秒读取一次最新 P1、P2、Q 等运行数据，更新历史窗口，并根据近期水平、趋势和波动性生成未来10分钟预测。此时右侧四个滑块仅显示，不参与预测。</div>`;
    host.appendChild(box);
    q('#v44AutoMode').onclick=()=>setMode('auto');q('#v44ScenarioMode').onclick=()=>setMode('scenario');q('#v44Start').onclick=start;q('#v44Pause').onclick=pause;q('#v44Step').onclick=()=>{pause();advance();};q('#v44Reset').onclick=reset;
    applyModeUI();
  }

  function getInputs(){return {up:readNum('#v39Up',0),load:readNum('#v39Load',0),target:readNum('#v39Target',7.5),delay:readNum('#v39Delay',80)};}
  function readObserved(){return {p1:readNum('#rt_in',readNum('#v39P1',state.p1)),p2:readNum('#rt_out',readNum('#v39P2',state.p2)),q:readNum('#rt_flow',state.q)};}

  function initState(){
    const obs=readObserved();state.p1=obs.p1;state.p2=obs.p2;state.q=obs.q;state.pm=readNum('#v39Pm',0.091);state.stepIndex=0;
    state.historyP2=Array.from({length:120},(_,i)=>state.p2+Math.sin(i/10)*0.05);state.historyQ=Array.from({length:120},(_,i)=>state.q+Math.sin(i/12)*2.2);
    replaceForecastCanvas();render();
  }

  function replaceForecastCanvas(){
    const old=q('#v39ForecastChart')||q('#v37ForecastChart');if(!old)return;
    const parent=old.parentElement;old.style.display='none';
    if(!q('#v44ForecastChart')){const canvas=document.createElement('canvas');canvas.id='v44ForecastChart';parent.appendChild(canvas);if(window.Chart)state.pressureChart=new Chart(canvas,{type:'line',data:{labels:[],datasets:[{label:'历史实测 P2',data:[],borderColor:'#4fc3f7',backgroundColor:'rgba(79,195,247,.05)',fill:true,borderWidth:2.2},{label:'未来 P2 预测',data:[],borderColor:'#00e5ff',fill:false,borderWidth:2.5,spanGaps:true},{label:'假设工况响应',data:[],borderColor:'#ffc107',borderDash:[8,5],fill:false,borderWidth:2,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#8fbfd0'}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a',maxTicksLimit:10}},y:{min:0,max:14,grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a'}}},elements:{point:{radius:0},line:{tension:.35}}}});}
    if(!q('#v44FlowForecastWrap')){const wrap=document.createElement('div');wrap.id='v44FlowForecastWrap';wrap.innerHTML='<h4>流量与估算流速预测（Q为预测量，v由Q和有效截面估算）</h4><canvas id="v44FlowForecastChart"></canvas>';parent.parentElement.appendChild(wrap);if(window.Chart)state.flowChart=new Chart(q('#v44FlowForecastChart'),{type:'line',data:{labels:[],datasets:[{label:'历史流量 Q',data:[],borderColor:'#26c6da',fill:false,borderWidth:2},{label:'未来流量 Q',data:[],borderColor:'#00e676',fill:false,borderWidth:2.2,spanGaps:true},{label:'估算流速 v',data:[],borderColor:'#ffab40',borderDash:[6,4],fill:false,borderWidth:2,spanGaps:true,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{labels:{color:'#8fbfd0'}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a',maxTicksLimit:10}},y:{position:'left',grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a'}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#ffab40'}}},elements:{point:{radius:0},line:{tension:.35}}}});}
  }

  function trend(arr){if(arr.length<12)return 0;const n=12;return (arr[arr.length-1]-arr[arr.length-n])/(n-1);}
  function volatility(arr){const tail=arr.slice(-24);const mean=tail.reduce((a,b)=>a+b,0)/tail.length;return Math.sqrt(tail.reduce((a,b)=>a+(b-mean)**2,0)/tail.length);}

  function advance(){
    if(state.mode==='auto'){
      const obs=readObserved();state.p1=obs.p1;state.p2=obs.p2;state.q=obs.q;state.pm=state.p1*0.35+state.p2*0.004;
    }else{
      const {up,load,target,delay}=getInputs();const alpha=clamp(0.14-delay/3000,0.04,0.18);const targetP1=0.258*(1+up/100);const targetP2=target+up*0.012-load*0.018;const targetQ=94*(1+load/100)*clamp(1+up*0.15/100,0.7,1.3);state.p1+=(targetP1-state.p1)*alpha;state.p2+=(targetP2-state.p2)*alpha;state.q+=(targetQ-state.q)*alpha;state.pm+=((state.p1*0.35+state.p2*0.004)-state.pm)*alpha;
    }
    state.stepIndex++;state.historyP2.push(state.p2);state.historyQ.push(state.q);if(state.historyP2.length>120)state.historyP2.shift();if(state.historyQ.length>120)state.historyQ.shift();render();
  }

  function buildForecast(){
    const pTrend=trend(state.historyP2),qTrend=trend(state.historyQ),pVol=volatility(state.historyP2),qVol=volatility(state.historyQ);const {up,load,target,delay}=getInputs();const futureP=[],scenarioP=[],futureQ=[],futureV=[];const area=0.0016;
    for(let i=1;i<=120;i++){
      const damp=Math.exp(-i/65);const autoP=state.p2+pTrend*i*damp;const autoQ=Math.max(0,state.q+qTrend*i*damp);futureP.push(autoP);futureQ.push(autoQ);futureV.push(autoQ/3600/area);
      const r=1-Math.exp(-i/(18+delay/20));const scenarioTarget=target+up*0.012-load*0.018;scenarioP.push(state.p2+(scenarioTarget-state.p2)*r);
    }
    return {futureP,scenarioP,futureQ,futureV,pVol,qVol};
  }

  function render(){
    const {target}=getInputs(),error=state.p2-target,v1=clamp((target-state.p2)*0.7,-8,8),v2=clamp((target-state.p2)*3.8,-14,14),restore=clamp(1.8+Math.abs(error)*2.2+readNum('#v39Delay',80)/220,1.5,8);
    setText('#v39P1',`${fmt(state.p1,3)} MPa`);setText('#v39Pm',`${fmt(state.pm,3)} MPa`);setText('#v39P2',`${fmt(state.p2,2)} kPa`);setText('#v39V1',`${v1>=0?'+':''}${fmt(v1,1)}%`);setText('#v39V2',`${v2>=0?'+':''}${fmt(v2,1)}%`);setText('#v39Restore',`${fmt(restore,1)} min`);
    setText('#v44Status',`${state.mode==='auto'?'自动预测':'假设推演'} · ${state.running?'运行中':'已暂停'} · 第${state.stepIndex}步 · 5s/步`);
    const {futureP,scenarioP,futureQ,futureV}=buildForecast();const labels=[];for(let i=0;i<120;i++)labels.push(`${Math.ceil((120-i)*5/60)}min前`);labels.push('当前');for(let i=1;i<=120;i++)labels.push(`${Math.ceil(i*5/60)}min`);
    if(state.pressureChart){state.pressureChart.data.labels=labels;state.pressureChart.data.datasets[0].data=[...state.historyP2,state.p2,...Array(120).fill(null)];state.pressureChart.data.datasets[1].data=[...Array(120).fill(null),state.p2,...futureP];state.pressureChart.data.datasets[2].data=state.mode==='scenario'?[...Array(120).fill(null),state.p2,...scenarioP]:Array(241).fill(null);state.pressureChart.update('none');}
    if(state.flowChart){state.flowChart.data.labels=labels;state.flowChart.data.datasets[0].data=[...state.historyQ,state.q,...Array(120).fill(null)];state.flowChart.data.datasets[1].data=[...Array(120).fill(null),state.q,...futureQ];state.flowChart.data.datasets[2].data=[...Array(121).fill(null),...futureV];state.flowChart.update('none');}
  }

  function applyModeUI(){
    const host=controlHost();if(host){host.classList.toggle('v44-auto',state.mode==='auto');host.classList.toggle('v44-scenario',state.mode==='scenario');}
    q('#v44AutoMode')?.classList.toggle('active',state.mode==='auto');q('#v44ScenarioMode')?.classList.toggle('active',state.mode==='scenario');q('#v44Step').disabled=state.mode==='auto';q('#v44Reset').disabled=state.mode==='auto';
    setText('#v44Note',state.mode==='auto'?'自动预测模式每5秒读取一次最新 P1、P2、Q 等运行数据，更新历史窗口，并依据近期水平、趋势与波动性预测未来10分钟。右侧滑块不参与计算。':'假设工况推演以当前状态为初始条件，右侧四个滑块表示人为假设的上游来压、下游负荷、目标压力和响应延迟。结果属于条件推演，不代表真实未来。');
  }

  function setMode(mode){pause();state.mode=mode;applyModeUI();if(mode==='auto')start();else render();}
  function start(){if(state.running)return;state.running=true;render();state.timer=setInterval(advance,state.stepSeconds*1000);}
  function pause(){state.running=false;if(state.timer){clearInterval(state.timer);state.timer=null;}render();}
  function reset(){pause();initState();}

  function boot(){ensureStyle();ensureRunner();initState();applyModeUI();start();const observer=new MutationObserver(()=>{ensureRunner();applyModeUI();});observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
