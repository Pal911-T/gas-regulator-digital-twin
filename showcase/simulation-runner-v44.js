(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const fmt=(v,n=1)=>Number(v).toFixed(n);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const state={running:false,stepSeconds:5,stepIndex:0,timer:null,p1:0.258,pm:0.091,p2:7.15,history:[],chart:null};

  function readNum(sel,fallback){const el=q(sel);const v=parseFloat(el?.value??el?.textContent??'');return Number.isFinite(v)?v:fallback;}
  function setText(sel,val){const el=q(sel);if(el)el.textContent=val;}

  function ensureStyle(){
    if(q('#v44Style'))return;
    const style=document.createElement('style');style.id='v44Style';style.textContent=`
      #tab-pressure .v39-tag.t2{left:50%!important;transform:translateX(-50%)!important;bottom:72px!important;top:auto!important;z-index:6!important}
      #tab-pressure .v39-label.l4{left:50%!important;transform:translateX(-50%)!important;bottom:122px!important;max-width:340px!important;z-index:6!important}
      #tab-pressure .v39-caption{bottom:10px!important;z-index:5!important}
      #v44Runner{margin-top:12px;padding:14px;border:1px solid rgba(0,229,255,.16);border-radius:14px;background:rgba(4,20,38,.9)}
      #v44Runner .v44-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      #v44Runner .v44-title{font-size:15px;color:#d9f8ff}
      #v44Runner .v44-status{font-family:'Share Tech Mono',monospace;color:#00e5ff;font-size:13px}
      #v44Runner .v44-actions{display:flex;gap:8px;flex-wrap:wrap}
      #v44Runner button{padding:7px 12px;border-radius:8px;border:1px solid rgba(0,229,255,.18);background:#071d34;color:#9fd7e8;cursor:pointer}
      #v44Runner button.primary{background:rgba(0,229,255,.14);color:#fff;border-color:#00e5ff}
      #v44Runner .v44-note{margin-top:10px;padding:9px 10px;border-left:3px solid #00e5ff;background:rgba(0,229,255,.045);color:#9ecbd9;font-size:12.5px;line-height:1.65}
    `;document.head.appendChild(style);
  }

  function controlHost(){
    const label=qa('span,div,b,strong').find(el=>el.children.length===0&&(el.textContent||'').includes('预计恢复时间'));
    if(!label)return null;
    let node=label.parentElement;
    for(let i=0;i<5&&node;i++,node=node.parentElement){const txt=node.textContent||'';if(txt.includes('一级阀建议调整')&&txt.includes('风险等级'))return node.parentElement||node;}
    return null;
  }

  function ensureRunner(){
    if(q('#v44Runner'))return;
    const host=controlHost();if(!host)return;
    const box=document.createElement('div');box.id='v44Runner';box.innerHTML=`
      <div class="v44-head"><div class="v44-title">推演运行模式</div><div class="v44-status" id="v44Status">已暂停 · 等待启动</div></div>
      <div class="v44-actions"><button class="primary" id="v44Start">开始运行</button><button id="v44Pause">暂停</button><button id="v44Step">单步 +5s</button><button id="v44Reset">重置</button></div>
      <div class="v44-note">运行后平台每 5 秒读取一次完整工况输入，推进一个仿真步长，并同步更新 P1、Pm、P2、调节建议和下方“历史实测—未来预测”曲线。未运行时数据保持静止。</div>`;
    host.appendChild(box);
    q('#v44Start').onclick=start;
    q('#v44Pause').onclick=pause;
    q('#v44Step').onclick=()=>{pause();advance();};
    q('#v44Reset').onclick=reset;
  }

  function getInputs(){return {up:readNum('#v39Up',0),load:readNum('#v39Load',0),target:readNum('#v39Target',7.5),delay:readNum('#v39Delay',80)};}

  function initState(){
    state.p1=readNum('#v39P1',0.258);state.pm=readNum('#v39Pm',0.091);state.p2=readNum('#v39P2',7.15);
    state.history=Array.from({length:120},(_,i)=>state.p2+Math.sin(i/9)*0.06);
    replaceForecastCanvas();
    render();
  }

  function replaceForecastCanvas(){
    const old=q('#v39ForecastChart')||q('#v37ForecastChart');
    if(!old||q('#v44ForecastChart'))return;
    const parent=old.parentElement;old.style.display='none';
    const canvas=document.createElement('canvas');canvas.id='v44ForecastChart';parent.appendChild(canvas);
    if(!window.Chart)return;
    state.chart=new Chart(canvas,{type:'line',data:{labels:[],datasets:[
      {label:'历史实测 P2',data:[],borderColor:'#4fc3f7',backgroundColor:'rgba(79,195,247,.05)',fill:true,borderWidth:2.2},
      {label:'自然响应预测',data:[],borderColor:'#ffc107',borderDash:[8,5],fill:false,borderWidth:2,spanGaps:true},
      {label:'优化控制预测',data:[],borderColor:'#00e5ff',fill:false,borderWidth:2.5,spanGaps:true}
    ]},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#8fbfd0'}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a',maxTicksLimit:10}},y:{min:0,max:14,grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4a7a9a'}}},elements:{point:{radius:0},line:{tension:.35}}}});
  }

  function advance(){
    const {up,load,target,delay}=getInputs();
    const alpha=clamp(0.14-delay/3000,0.04,0.18);
    const targetP1=0.258*(1+up/100);
    const targetP2=target + up*0.012 - load*0.018;
    state.p1 += (targetP1-state.p1)*alpha;
    state.pm += ((state.p1*0.35 + state.p2*0.004)-state.pm)*alpha;
    state.p2 += (targetP2-state.p2)*alpha;
    state.stepIndex++;
    state.history.push(state.p2);if(state.history.length>120)state.history.shift();
    render();
  }

  function buildForecast(){
    const {up,load,target,delay}=getInputs();
    const natural=[],controlled=[];const inertia=2.2+delay/130;const disturbance=up*0.02-load*0.03;
    for(let i=0;i<120;i++){
      const r=1-Math.exp(-(i+1)/(inertia*8));
      natural.push(state.p2+disturbance*r);
      controlled.push(state.p2+(target-state.p2)*r+disturbance*0.2*r);
    }
    return {natural,controlled};
  }

  function render(){
    const {target}=getInputs();
    const error=state.p2-target;const v1=clamp((target-state.p2)*0.7,-8,8);const v2=clamp((target-state.p2)*3.8,-14,14);const restore=clamp(1.8+Math.abs(error)*2.2+readNum('#v39Delay',80)/220,1.5,8);
    setText('#v39P1',`${fmt(state.p1,3)} MPa`);setText('#v39Pm',`${fmt(state.pm,3)} MPa`);setText('#v39P2',`${fmt(state.p2,2)} kPa`);
    setText('#v39V1',`${v1>=0?'+':''}${fmt(v1,1)}%`);setText('#v39V2',`${v2>=0?'+':''}${fmt(v2,1)}%`);setText('#v39Restore',`${fmt(restore,1)} min`);
    setText('#v44Status',state.running?`运行中 · 第 ${state.stepIndex} 步 · 步长 5s`:`已暂停 · 第 ${state.stepIndex} 步`);

    if(state.chart){
      const {natural,controlled}=buildForecast();
      const labels=[];for(let i=0;i<120;i++)labels.push(`${Math.ceil((120-i)*5/60)}min前`);labels.push('当前');for(let i=1;i<=120;i++)labels.push(`${Math.ceil(i*5/60)}min`);
      state.chart.data.labels=labels;
      state.chart.data.datasets[0].data=[...state.history,state.p2,...Array(120).fill(null)];
      state.chart.data.datasets[1].data=[...Array(120).fill(null),state.p2,...natural];
      state.chart.data.datasets[2].data=[...Array(120).fill(null),state.p2,...controlled];
      state.chart.update('none');
    }
  }

  function start(){if(state.running)return;state.running=true;setText('#v44Status',`运行中 · 第 ${state.stepIndex} 步 · 步长 5s`);state.timer=setInterval(advance,state.stepSeconds*1000);}
  function pause(){state.running=false;if(state.timer){clearInterval(state.timer);state.timer=null;}render();}
  function reset(){pause();state.stepIndex=0;initState();}

  function freezeLoop(){
    if(!state.running)render();
    requestAnimationFrame(()=>setTimeout(freezeLoop,250));
  }

  function boot(){ensureStyle();ensureRunner();initState();freezeLoop();const observer=new MutationObserver(()=>ensureRunner());observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
