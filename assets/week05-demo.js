(function(){
'use strict';
const C={teal:'#0e8295',orange:'#ce7841',purple:'#8059a7',green:'#318768',muted:'#677f8b',ink:'#35505c',grid:'#e2ebee',axis:'#75909e'};
const DT=.02, BINARY_T=16, CAT_T=8;
const clamp=(x,a,b)=>Math.max(a,Math.min(x,b)),fmt=(x,d=3)=>Number.isFinite(x)?(Math.abs(x)<.5*Math.pow(10,-d)?0:x).toFixed(d):'—';
const sum=a=>a.reduce((x,y)=>x+y,0);
function H(p){let v=0;for(const q of p)if(q>0)v-=q*Math.log(q);return v}
function xEntropy(x){return H([x,1-x])}
function odds(x){return Math.log(x/(1-x))}
function f(x,a,b){return x*(1-x)*(a-b*x)}
function binaryTrace(x0,a,b){let x=x0;const out=[x];const n=Math.round(BINARY_T/DT);for(let j=0;j<n;j++){const k1=f(x,a,b),k2=f(x+DT*k1/2,a,b),k3=f(x+DT*k2/2,a,b),k4=f(x+DT*k3,a,b);x=Math.min(1-1e-12,Math.max(1e-12,x+DT*(k1+2*k2+2*k3+k4)/6));out.push(x)}return out}
function timeValue(trajectory,time){const z=Math.min(trajectory.length-1,Math.max(0,time/DT)),i=Math.floor(z);return trajectory[i]+(trajectory[Math.min(i+1,trajectory.length-1)]-trajectory[i])*(z-i)}
function exponentialNormalized(p,f,t){const logs=p.map((v,i)=>v>0?Math.log(v)+f[i]*t:-Infinity),mx=Math.max(...logs);if(!Number.isFinite(mx))return [1/3,1/3,1/3];const weights=logs.map(z=>Number.isFinite(z)?Math.exp(z-mx):0),total=sum(weights);return weights.map(w=>w/total)}
function categoricalPath(p,f){const n=Math.round(CAT_T/DT),out=[];for(let i=0;i<=n;i++)out.push(exponentialNormalized(p,f,i*DT));return out}
function drawBegin(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.lineCap='round';c.lineJoin='round';return c}
function seg(c,x,y,X,Y,color=C.grid,width=1,dash=[]){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=width;c.stroke();c.restore()}
function tx(c,s,x,y,color=C.ink,size=13,align='left'){c.fillStyle=color;c.font=size+'px system-ui,Segoe UI,sans-serif';c.textAlign=align;c.fillText(s,x,y)}
function dot(c,x,y,col=C.purple,r=6){c.beginPath();c.arc(x,y,r+2,0,2*Math.PI);c.fillStyle='#fff';c.fill();c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=col;c.fill()}
function chart(canvas,title,domain,range,xlab,ylab){const c=drawBegin(canvas),box={l:66,r:canvas.width-26,t:51,b:canvas.height-52};
const X=x=>box.l+(x-domain[0])/(domain[1]-domain[0])*(box.r-box.l),Y=y=>box.b-(y-range[0])/(range[1]-range[0])*(box.b-box.t);
for(let k=0;k<=4;k++){const v=range[0]+(range[1]-range[0])*k/4,x=domain[0]+(domain[1]-domain[0])*k/4;seg(c,box.l,Y(v),box.r,Y(v));seg(c,X(x),box.t,X(x),box.b);tx(c,fmt(v,Math.abs(v)<1?2:1),box.l-8,Y(v)+4,C.muted,11,'right');tx(c,fmt(x,Math.abs(x)<1?2:1),X(x),box.b+17,C.muted,11,'center')}
seg(c,box.l,box.t,box.l,box.b,C.axis,1.7);seg(c,box.l,box.b,box.r,box.b,C.axis,1.7);
tx(c,title,box.l,29,C.ink,18);tx(c,xlab,box.r,box.b+38,C.muted,12,'right');tx(c,ylab,15,42,C.muted,12);return{c,X,Y,box}}
function plot(c,fn,domain,X,Y,color,stroke=3,points=240){c.save();c.beginPath();let begin=true;for(let j=0;j<=points;j++){const x=domain[0]+(domain[1]-domain[0])*j/points,y=fn(x);if(!Number.isFinite(y)){begin=true;continue}if(begin){c.moveTo(X(x),Y(y));begin=false}else c.lineTo(X(x),Y(y))}c.strokeStyle=color;c.lineWidth=stroke;c.stroke();c.restore()}
function track(t,max,len){return Math.min(len-1,Math.round(t/DT))}
function drawBinaryEntropy(canvas,state,x){const item=chart(canvas,'Binary entropy as a function of state',[0,1],[0,Math.log(2)+.08],'Bernoulli proportion x','H(x)');const {c,X,Y}=item;
const fun=p=>xEntropy(p);plot(c,fun,[0,1],X,Y,C.teal,3.3);seg(c,X(.5),Y(0),X(.5),Y(Math.log(2)),C.purple,1.3,[6,5]);dot(c,X(x),Y(fun(x)),C.orange,7);tx(c,'max at x=0.5',X(.5)+9,Y(Math.log(2))+18,C.purple,12);
}
function drawBinaryTime(canvas,state,x){const item=chart(canvas,'Proportion and entropy through time',[0,BINARY_T],[0,1],'time t','value'),{c,X,Y}=item;
const xof=t=>timeValue(state.path,t);plot(c,xof,[0,BINARY_T],X,Y,C.teal,3.2,400);plot(c,t=>xEntropy(xof(t)),[0,BINARY_T],X,Y,C.purple,2.8,400);seg(c,X(state.t),Y(0),X(state.t),Y(1),C.orange,1.2,[5,5]);dot(c,X(state.t),Y(x),C.teal,6);dot(c,X(state.t),Y(xEntropy(x)),C.purple,6);tx(c,'x(t)',X(BINARY_T)-112,43,C.teal,13);tx(c,'H(t)',X(BINARY_T)-55,43,C.purple,13)}
function drawBinaryLog(canvas,state,x){const trace=state.path,logs=trace.map(odds),lo=Math.min(...logs),hi=Math.max(...logs),pad=Math.max(.6,(hi-lo)*.14),v=odds(x);
const item=chart(canvas,'Log-odds: L(t) = ln[x/(1−x)]',[0,BINARY_T],[lo-pad,hi+pad],'time t','L(t)'),{c,X,Y}=item;
plot(c,t=>odds(timeValue(trace,t)),[0,BINARY_T],X,Y,C.orange,3.5,400);dot(c,X(state.t),Y(v),C.purple,7);
tx(c,state.b===0?'Straight line: L′=a':'Slope varies with fitness difference',item.box.l+10,item.box.t+16,C.muted,12);
}
function categoricalView(canvas,state,p){const c=drawBegin(canvas),w=canvas.width,h=canvas.height,margin=55,base=h-62,unit=(h-128),names=['A','B','C'],colors=[C.teal,C.orange,C.green];
tx(c,'Constant-fitness exponential normalization',margin,31,C.ink,18);tx(c,'Current probabilities sum to one',margin,53,C.muted,13);
seg(c,margin,base,w-40,base,C.axis,1.5);
for(let j=0;j<3;j++){const barw=110,x=margin+85+j*200;const v=p[j];c.fillStyle='#e6f0f3';c.fillRect(x,base-unit,barw,unit);c.fillStyle=colors[j];c.fillRect(x,base-unit*v,barw,unit*v);tx(c,fmt(v,4),x+barw/2,base-unit*v-12,colors[j],15,'center');tx(c,names[j],x+barw/2,base+25,C.ink,15,'center')}
}
function drawCategoryTime(canvas,state,p){const item=chart(canvas,'Three evolving probabilities',[0,CAT_T],[0,1],'time t','p_i'),{c,X,Y}=item;
const colors=[C.teal,C.orange,C.green];for(let j=0;j<3;j++){plot(c,t=>exponentialNormalized(state.init,state.fit,t)[j],[0,CAT_T],X,Y,colors[j],3,240);dot(c,X(state.t),Y(p[j]),colors[j],5)}
seg(c,X(state.t),Y(0),X(state.t),Y(1),C.purple,1.1,[4,5]);tx(c,'A',item.box.r-110,35,C.teal,13);tx(c,'B',item.box.r-75,35,C.orange,13);tx(c,'C',item.box.r-40,35,C.green,13)}
function drawCategoryEntropy(canvas,state,p){const item=chart(canvas,'Entropy along the exponential trajectory',[0,CAT_T],[0,Math.log(3)+.06],'time t','H(t)'),{c,X,Y}=item;
plot(c,t=>H(exponentialNormalized(state.init,state.fit,t)),[0,CAT_T],X,Y,C.purple,3.2,240);dot(c,X(state.t),Y(H(p)),C.orange,7);
seg(c,item.box.l,Y(Math.log(3)),item.box.r,Y(Math.log(3)),C.muted,1,[5,5]);tx(c,'ln 3: maximum',item.box.r-6,Y(Math.log(3))-8,C.muted,12,'right')}
window.mountInfoDemo=function(week,host){if(week!==5)return;
host.innerHTML=[
'<div class="panel"><h2>From replicator dynamics to information theory</h2><p>Explore how uncertainty, log-odds, and probability distributions evolve. The <strong>binary</strong> mode links directly to our Week 1 equation; the <strong>three-outcome</strong> mode shows exact exponential normalization for constant fitness.</p>',
'<div class="toolbar"><label for="w5-mode">Choose view</label><select id="w5-mode"><option value="binary">Two strategies: log-odds and entropy</option><option value="category">Three outcomes: softmax evolution</option></select><button id="w5-play" class="primary">Play</button><button id="w5-restart">Restart time</button><label for="w5-speed">Speed</label><select id="w5-speed"><option value="1">1×</option><option value="3" selected>3×</option><option value="6">6×</option></select></div></div>',
'<div id="w5-binary" class="panel"><h3>Binary replicator system</h3><p>We model <strong>x′ = x(1−x)(a−bx)</strong>. With b=0, the fitness difference is constant. With a=3, b=4, the stable interior equilibrium is x*=0.75.</p>',
'<div class="toolbar"><label for="w5-preset">Example</label><select id="w5-preset"><option value="coexist">Stable coexistence (Week 1)</option><option value="constant">Constant fitness advantage</option><option value="bistable">Unstable threshold</option><option value="custom" disabled>Custom model</option></select></div>',
'<div class="demo-controls" style="margin-top:15px"><div class="control"><label for="w5-a">a = <strong id="w5-av">3.0</strong></label><input id="w5-a" type="range" min="-3" max="4" step=".1" value="3"></div>',
'<div class="control"><label for="w5-b">b = <strong id="w5-bv">4.0</strong></label><input id="w5-b" type="range" min="-4" max="6" step=".1" value="4"></div>',
'<div class="control"><label for="w5-x0">x(0) = <strong id="w5-x0v">0.100</strong></label><input id="w5-x0" type="range" min=".01" max=".99" step=".005" value=".1"></div></div></div>',
'<div id="w5-category" class="panel" hidden><h3>Three-strategy constant fitness</h3><p>For f=(fA,fB,fC), evolve from a starting distribution by <strong>pᵢ(t) = pᵢ(0)e^(fᵢt) / Σ pⱼ(0)e^(fⱼt)</strong>. Only differences between fitnesses matter.</p>',
'<div class="demo-controls"><div class="control"><label for="w5-fa">fA</label><input id="w5-fa" type="number" value="1" step=".25" min="-6" max="6"></div><div class="control"><label for="w5-fb">fB</label><input id="w5-fb" type="number" value="0" step=".25" min="-6" max="6"></div><div class="control"><label for="w5-fc">fC</label><input id="w5-fc" type="number" value="-1" step=".25" min="-6" max="6"></div></div>',
'<div class="demo-controls" style="margin-top:12px"><div class="control"><label for="w5-pa">Initial pA: <strong id="w5-pav">0.200</strong></label><input id="w5-pa" type="range" min="0" max="1" step=".005" value=".2"></div><div class="control"><label for="w5-pb">Initial pB: <strong id="w5-pbv">0.300</strong></label><input id="w5-pb" type="range" min="0" max="1" step=".005" value=".3"></div><div class="control"><label>Initial pC</label><strong id="w5-pcv">0.500</strong></div></div>',
'<div class="toolbar" style="margin-top:13px"><button id="w5-add">Add 1 to every fitness</button><button id="w5-creset">Restore initial fitness</button></div></div>',
'<div class="panel"><label for="w5-time">Time t = <strong id="w5-tv">0.00</strong></label><input id="w5-time" type="range" min="0" max="16" step=".02" value="0" style="width:100%"><div id="w5-binary-stats"><div class="w5-metrics"><div><span>Proportion x(t)</span><strong id="w5-x"></strong></div><div><span>Shannon entropy (nats)</span><strong id="w5-H"></strong></div><div><span>Log-odds L(t)</span><strong id="w5-L"></strong></div><div><span>Entropy rate H′(t)</span><strong id="w5-Hdot"></strong></div></div><p class="small" id="w5-binary-readout"></p></div>',
'<div id="w5-cat-stats" hidden><div class="w5-metrics"><div><span>Shannon entropy (nats)</span><strong id="w5-catH"></strong></div><div><span>Mean fitness</span><strong id="w5-fmean"></strong></div><div><span>Probability total</span><strong id="w5-total"></strong></div><div><span>Log ratio ln(pA/pB)</span><strong id="w5-ratio"></strong></div></div><p id="w5-cat-readout" class="small"></p></div>',
'<div class="w5-shares"><div id="w5-shareA"></div><div id="w5-shareB"></div><div id="w5-shareC"></div></div><p class="small muted" id="w5-explain"></p></div>',
'<div id="w5-binary-charts" class="w5-chartgrid"><div class="panel"><canvas id="w5-entropygraph" width="570" height="365" role="img" aria-label="Binary entropy curve with current state marker" style="width:100%;height:auto"></canvas></div><div class="panel"><canvas id="w5-timegraph" width="570" height="365" role="img" aria-label="State and entropy versus time with synchronized markers" style="width:100%;height:auto"></canvas></div><div class="panel" style="grid-column:1/-1"><canvas id="w5-loggraph" width="1000" height="330" role="img" aria-label="Log odds versus time and current state" style="width:100%;height:auto"></canvas></div></div>',
'<div id="w5-cat-charts" class="w5-chartgrid" hidden><div class="panel" style="grid-column:1/-1"><canvas id="w5-catbars" width="820" height="360" role="img" aria-label="Normalized softmax probabilities as three bars" style="width:100%;height:auto"></canvas></div><div class="panel"><canvas id="w5-cattime" width="570" height="345" role="img" aria-label="Three constant fitness strategy proportions over time" style="width:100%;height:auto"></canvas></div><div class="panel"><canvas id="w5-catentropy" width="570" height="345" role="img" aria-label="Shannon entropy over time under exponential normalization" style="width:100%;height:auto"></canvas></div></div>',
'<style>.w5-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}.w5-metrics>div{background:var(--soft);padding:10px;border-radius:10px;min-width:0}.w5-metrics span{display:block;font-size:.79rem;color:var(--muted)}.w5-metrics strong{font-size:1.22rem;font-variant-numeric:tabular-nums}.w5-chartgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.w5-chartgrid .panel{min-width:0;padding:11px}.w5-shares{width:100%;height:36px;display:flex;border-radius:9px;overflow:hidden}.w5-shares>div{color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;white-space:nowrap}#w5-shareA{background:#0e8295}#w5-shareB{background:#ce7841}#w5-shareC{background:#318768}.demo-controls input[type=number]{background:var(--panel);color:var(--ink);padding:7px 8px;border:1px solid var(--line);border-radius:8px;max-width:100%}@media(max-width:890px){.w5-chartgrid{grid-template-columns:1fr}.w5-chartgrid>.panel{grid-column:auto!important}}@media(max-width:650px){.w5-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>'
].join('');
const el=id=>host.querySelector('#w5-'+id);
const s={mode:'binary',a:3,b:4,x0:.1,t:0,speed:3,running:false,path:[],last:0,init:[.2,.3,.5],fit:[1,0,-1]};
const presets={coexist:[3,4,.1],constant:[1.2,0,.2],bistable:[-1,-2,.3]};
const maxTime=()=>s.mode==='binary'?BINARY_T:CAT_T;
function pause(){s.running=false;el('play').textContent='Play'}
function update(){
const cat=s.mode==='category',timeMax=maxTime();
el('binary').hidden=cat;el('category').hidden=!cat;el('binary-stats').hidden=cat;el('cat-stats').hidden=!cat;el('binary-charts').hidden=cat;el('cat-charts').hidden=!cat;
el('time').max=String(timeMax);if(s.t>timeMax)s.t=timeMax;el('time').value=String(s.t);el('tv').textContent=s.t.toFixed(2);
const shares=[el('shareA'),el('shareB'),el('shareC')];
if(!cat){
el('av').textContent=s.a.toFixed(1);el('bv').textContent=s.b.toFixed(1);el('x0v').textContent=s.x0.toFixed(3);
const x=timeValue(s.path,s.t),entropy=xEntropy(x),L=odds(x),rate=f(x,s.a,s.b),Hdot=Math.log((1-x)/x)*rate;
el('x').textContent=fmt(x,4);el('H').textContent=fmt(entropy,4);el('L').textContent=fmt(L,4);el('Hdot').textContent=fmt(Hdot,4);
el('binary-readout').textContent='At this moment x′='+fmt(rate,5)+' and L′=a−bx='+fmt(s.a-s.b*x,5)+'. Surprisal: type A '+fmt(-Math.log(x),3)+' nats; type B '+fmt(-Math.log(1-x),3)+' nats.';
el('explain').textContent='The two bars are probability weights, not absolute population sizes. Entropy is greatest at x=1/2 even if the equilibrium occurs elsewhere.';
for(let j=0;j<2;j++){const v=j===0?x:1-x;shares[j].style.width=(100*v)+'%';shares[j].textContent=v>.16?['A','B'][j]+': '+(100*v).toFixed(1)+'%':''}
shares[2].style.width='0%';shares[2].textContent='';
drawBinaryEntropy(el('entropygraph'),s,x);drawBinaryTime(el('timegraph'),s,x);drawBinaryLog(el('loggraph'),s,x);
}else{
const p=exponentialNormalized(s.init,s.fit,s.t),bar=sum(p.map((v,i)=>v*s.fit[i]));
el('pav').textContent=fmt(s.init[0]);el('pbv').textContent=fmt(s.init[1]);el('pcv').textContent=fmt(s.init[2]);el('catH').textContent=fmt(H(p),4);el('fmean').textContent=fmt(bar,4);el('total').textContent=fmt(sum(p),4);el('ratio').textContent=p[0]>0&&p[1]>0?fmt(Math.log(p[0]/p[1]),4):'undefined';
el('cat-readout').textContent='Initial p = ('+s.init.map(x=>fmt(x)).join(', ')+'), fitness f = ('+s.fit.map(x=>fmt(x,2)).join(', ')+'), current p = ('+p.map(x=>fmt(x,4)).join(', ')+').';
el('explain').textContent='These probabilities are obtained by multiplying each initial weight by e^(fᵢt), then dividing every weight by the same total. Adding a common constant to fitness changes the unnormalized weights but cancels in normalization.';
for(let j=0;j<3;j++){shares[j].style.width=(100*p[j])+'%';shares[j].textContent=p[j]>.15?['A','B','C'][j]+': '+(100*p[j]).toFixed(1)+'%':''}
categoricalView(el('catbars'),s,p);drawCategoryTime(el('cattime'),s,p);drawCategoryEntropy(el('catentropy'),s,p);
}
}
function redo(){pause();s.path=binaryTrace(s.x0,s.a,s.b);update()}
function setModel(mode){pause();s.mode=mode;s.t=0;el('mode').value=mode;update()}
el('mode').addEventListener('change',()=>setModel(el('mode').value));
el('preset').addEventListener('change',()=>{const values=presets[el('preset').value];if(!values)return;[s.a,s.b,s.x0]=values;s.t=0;el('a').value=String(s.a);el('b').value=String(s.b);el('x0').value=String(s.x0);redo()});
for(const k of ['a','b','x0'])el(k).addEventListener('input',()=>{s[k]=Number(el(k).value);el('preset').value='custom';if(k==='x0')s.t=0;redo()});
for(let i=0;i<3;i++){const key=['fa','fb','fc'][i];el(key).addEventListener('change',()=>{const val=Number(el(key).value);if(!Number.isFinite(val)){el(key).value=String(s.fit[i]);return}s.fit[i]=Math.max(-6,Math.min(6,val));el(key).value=String(s.fit[i]);pause();update()})}
for(const k of ['pa','pb'])el(k).addEventListener('input',()=>{const idx=k==='pa'?0:1,j=1-idx,p=s.init.slice();p[idx]=Number(el(k).value);p[j]=Math.min(p[j],1-p[idx]);p[2]=Math.max(0,1-p[0]-p[1]);s.init=p;el('pa').value=String(p[0]);el('pb').value=String(p[1]);pause();update()});
el('add').addEventListener('click',()=>{s.fit=s.fit.map(z=>z+1);for(const [i,k] of ['fa','fb','fc'].entries())el(k).value=String(s.fit[i]);pause();update()});
el('creset').addEventListener('click',()=>{s.fit=[1,0,-1];s.init=[.2,.3,.5];for(const [i,k] of ['fa','fb','fc'].entries())el(k).value=String(s.fit[i]);el('pa').value='.2';el('pb').value='.3';s.t=0;pause();update()});
el('time').addEventListener('input',()=>{s.t=Number(el('time').value);pause();update()});
el('restart').addEventListener('click',()=>{s.t=0;pause();update()});
el('speed').addEventListener('change',()=>{s.speed=Number(el('speed').value)});
el('play').addEventListener('click',()=>{s.running=!s.running;el('play').textContent=s.running?'Pause':'Play';if(s.running&&s.t>=maxTime())s.t=0;s.last=performance.now()});
for(const [id,graphMax,left,right] of [['timegraph',BINARY_T,66,26],['loggraph',BINARY_T,66,26],['cattime',CAT_T,66,26],['catentropy',CAT_T,66,26]]){el(id).addEventListener('click',e=>{const cv=el(id),rect=cv.getBoundingClientRect(),x=(e.clientX-rect.left)*cv.width/rect.width;s.t=Math.round(clamp((x-left)/(cv.width-left-right),0,1)*graphMax/DT)*DT;pause();update()})}
function loop(t){if(!host.isConnected)return;if(s.running){const delta=Math.min(.07,Math.max(0,(t-s.last)/1000));s.t=Math.min(maxTime(),s.t+delta*s.speed);if(s.t>=maxTime())pause();update()}s.last=t;requestAnimationFrame(loop)}
s.path=binaryTrace(s.x0,s.a,s.b);update();requestAnimationFrame(loop);
};
})();