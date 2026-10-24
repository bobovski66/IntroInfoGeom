(function(){
'use strict';
const DT=.025,T=15;
const COLOR={teal:'#0e8295',orange:'#cf7944',purple:'#8659a6',green:'#268767',ink:'#334f5d',muted:'#5f7987',grid:'#e3ebef',axis:'#78909d'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),fmt=(x,n=4)=>!Number.isFinite(x)?'∞':(Math.abs(x)<.5*10**(-n)?0:x).toFixed(n);
const sum=a=>a.reduce((s,v)=>s+v,0);
const entropy=p=>p.reduce((s,v)=>s-(v>0?v*Math.log(v):0),0);
function kl(Q,P){let value=0;for(let i=0;i<Q.length;i++){if(Q[i]===0)continue;if(P[i]===0)return Infinity;value+=Q[i]*Math.log(Q[i]/P[i])}return Math.max(0,value)}
const bern=x=>[x,1-x],binaryEntropy=x=>entropy(bern(x));
function rhs(x,q,k){return x*(1-x)*k*(q-x)}
function trace(x0,q,k){let x=x0,states=[x];for(let i=0;i<Math.round(T/DT);i++){const a=rhs(x,q,k),b=rhs(x+DT*a/2,q,k),c=rhs(x+DT*b/2,q,k),d=rhs(x+DT*c,q,k);x=clamp(x+DT*(a+2*b+2*c+d)/6,1e-12,1-1e-12);states.push(x)}return states}
function at(states,t){const z=clamp(t/DT,0,states.length-1),i=Math.floor(z);return states[i]+(states[Math.min(i+1,states.length-1)]-states[i])*(z-i)}
function mix(p,q,t){return p.map((v,i)=>v*(1-t)+q[i]*t)}
function normalized(arr){const nonnegative=arr.map(x=>Math.max(0,x)),total=sum(nonnegative);return nonnegative.map(v=>v/total)}
function canvasStart(c){const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.lineCap='round';g.lineJoin='round';return g}
function seg(c,x,y,X,Y,col=COLOR.grid,w=1,dash=[]){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore()}
function label(c,s,x,y,col=COLOR.ink,n=13,align='left'){c.fillStyle=col;c.font=n+'px system-ui,Segoe UI,sans-serif';c.textAlign=align;c.fillText(s,x,y)}
function dot(c,x,y,col=COLOR.purple,r=6){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r+2,0,2*Math.PI);c.fill();c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill()}
function plot(c,fn,X,Y,domain,col,w=2.8,N=220,style=[]){c.save();c.strokeStyle=col;c.lineWidth=w;c.setLineDash(style);c.beginPath();let begun=false;for(let i=0;i<=N;i++){const x=domain[0]+(domain[1]-domain[0])*i/N,v=fn(x);if(!Number.isFinite(v)){begun=false;continue}if(!begun){c.moveTo(X(x),Y(v));begun=true}else c.lineTo(X(x),Y(v))}c.stroke();c.restore()}
function graph(canvas,title,xrange,yrange,xlabel,ylabel){const c=canvasStart(canvas),b={l:72,r:canvas.width-23,t:47,b:canvas.height-51},X=x=>b.l+(x-xrange[0])/(xrange[1]-xrange[0])*(b.r-b.l),Y=v=>b.b-(v-yrange[0])/(yrange[1]-yrange[0])*(b.b-b.t);for(let i=0;i<=4;i++){const xx=xrange[0]+i*(xrange[1]-xrange[0])/4,yy=yrange[0]+i*(yrange[1]-yrange[0])/4;seg(c,X(xx),b.t,X(xx),b.b);seg(c,b.l,Y(yy),b.r,Y(yy));label(c,fmt(xx,xx>=1?1:2),X(xx),b.b+18,COLOR.muted,11,'center');label(c,fmt(yy,yy>=1?2:3),b.l-9,Y(yy)+4,COLOR.muted,11,'right')}seg(c,b.l,b.t,b.l,b.b,COLOR.axis,1.6);seg(c,b.l,b.b,b.r,b.b,COLOR.axis,1.6);label(c,title,b.l,26,COLOR.ink,17);label(c,xlabel,b.r,b.b+39,COLOR.muted,12,'right');label(c,ylabel,13,39,COLOR.muted,12);return{c,X,Y,b}}
function drawPhase(canvas,s,x){const c=canvasStart(canvas),L=70,R=canvas.width-65,y=85,X=v=>L+v*(R-L);label(c,'Phase line: the equilibrium attracts from both sides',L,27,COLOR.ink,18);seg(c,L,y,R,y,COLOR.axis,3);for(let i=0;i<16;i++){const p=(i+.5)/16,v=rhs(p,s.q,s.k),D=Math.sign(v);if(D===0)continue;const xx=X(p),end=xx+15*D;seg(c,xx-15*D,y,end,y,COLOR.teal,3);seg(c,end,y,end-7*D,y-6,COLOR.teal,2.6);seg(c,end,y,end-7*D,y+6,COLOR.teal,2.6)}dot(c,X(s.q),y,COLOR.green,8);dot(c,X(x),y-26,COLOR.orange,8);seg(c,X(x),y-19,X(x),y-8,COLOR.orange,1.8);label(c,'reference q='+fmt(s.q,2),X(s.q),y+31,COLOR.green,13,'center');label(c,'current x(t)',X(x),y-44,COLOR.orange,12,'center');label(c,'0',L,y+28,COLOR.muted,12,'center');label(c,'1',R,y+28,COLOR.muted,12,'center')}
function drawLandscape(canvas,s,x){const q=s.q,forward=v=>kl(bern(q),bern(v)),reverse=v=>kl(bern(v),bern(q)),local=v=>(v-q)**2/(2*q*(1-q));const bound=Math.max(forward(.025),forward(.975),reverse(.025),reverse(.975));const max=Math.max(.32,Math.min(5,bound*1.06));const {c,X,Y,b}=graph(canvas,'KL landscape around the reference q',[0,1],[0,max],'current probability x','KL');plot(c,forward,X,Y,[.025,.975],COLOR.teal,3.3);plot(c,reverse,X,Y,[.025,.975],COLOR.orange,2.6);plot(c,local,X,Y,[Math.max(.025,q-.14),Math.min(.975,q+.14)],COLOR.purple,2.3,90,[5,5]);seg(c,X(q),b.t,X(q),b.b,COLOR.green,1.5,[5,5]);dot(c,X(x),Y(forward(x)),COLOR.teal,7);dot(c,X(x),Y(reverse(x)),COLOR.orange,6);label(c,'D(q || x)',b.l+10,b.t+16,COLOR.teal,12);label(c,'D(x || q)',b.l+125,b.t+16,COLOR.orange,12);label(c,'quadratic nearby',b.l+240,b.t+16,COLOR.purple,12)}
function drawEntropy(canvas,s,x){const {c,X,Y,b}=graph(canvas,'One solution, two different quantities',[0,T],[0,1.04],'time t','state / H'),xof=t=>at(s.path,t);plot(c,xof,X,Y,[0,T],COLOR.teal,3.2);plot(c,t=>binaryEntropy(xof(t)),X,Y,[0,T],COLOR.orange,2.7);seg(c,X(s.t),b.t,X(s.t),b.b,COLOR.purple,1.2,[5,5]);dot(c,X(s.t),Y(x),COLOR.teal,6);dot(c,X(s.t),Y(binaryEntropy(x)),COLOR.orange,6);label(c,'x(t)',b.r-116,b.t+16,COLOR.teal,13);label(c,'Shannon H(x(t))',b.r-63,b.t+16,COLOR.orange,12,'right')}
function drawKltime(canvas,s,x){const q=s.q,atT=t=>at(s.path,t),f=t=>kl(bern(q),bern(atT(t))),r=t=>kl(bern(atT(t)),bern(q));const upper=Math.max(.07,f(0),r(0))*1.14,{c,X,Y,b}=graph(canvas,'Relative entropy decreases along the flow',[0,T],[0,upper],'time t','KL');plot(c,f,X,Y,[0,T],COLOR.teal,3.3);plot(c,r,X,Y,[0,T],COLOR.orange,2.7);seg(c,X(s.t),b.t,X(s.t),b.b,COLOR.purple,1.2,[5,5]);dot(c,X(s.t),Y(f(s.t)),COLOR.teal,7);label(c,'D(q || x(t))',b.r-145,b.t+17,COLOR.teal,12);label(c,'D(x(t) || q)',b.r-145,b.t+37,COLOR.orange,12)}
function drawDissipation(canvas,s,x){const current=t=>at(s.path,t),fun=t=>s.k*(current(t)-s.q)**2,upper=Math.max(.05,fun(0))*1.14,{c,X,Y,b}=graph(canvas,'KL dissipation: -dD/dt = k(x−q)²',[0,T],[0,upper],'time t','-D′');plot(c,fun,X,Y,[0,T],COLOR.purple,3.3);seg(c,X(s.t),b.t,X(s.t),b.b,COLOR.orange,1.4,[4,5]);dot(c,X(s.t),Y(fun(s.t)),COLOR.purple,7);label(c,'Nonnegative, vanishing at equilibrium',b.l+9,b.t+16,COLOR.muted,12)}
const vertices={A:[450,52],B:[142,512],C:[758,512]};
function triP(p){return[p[0]*vertices.A[0]+p[1]*vertices.B[0]+p[2]*vertices.C[0],p[0]*vertices.A[1]+p[1]*vertices.B[1]+p[2]*vertices.C[1]]}
function pick(x,y){const a=clamp((512-y)/460,0,1),left=1-a,c=clamp((x-450*a-142*left)/(758-142),0,left);return[a,left-c,c]}
function cell(c,points,color){c.beginPath();c.moveTo(...points[0]);c.lineTo(...points[1]);c.lineTo(...points[2]);c.closePath();c.fillStyle=color;c.fill()}
function mapShade(v){const t=1-Math.exp(-Math.min(10,v)/.4);return'rgb('+Math.round(234-130*t)+','+Math.round(246-141*t)+','+Math.round(249-86*t)+')'}
let cachedHeatmap=null,cachedHeatmapKey='';
function drawHeatmap(canvas,s,P){const c=canvasStart(canvas),N=72,q=s.ref,forward=s.heat==='forward';const key=s.heat+':'+q.map(v=>v.toFixed(8)).join(',');if(key!==cachedHeatmapKey){cachedHeatmap=document.createElement('canvas');cachedHeatmap.width=canvas.width;cachedHeatmap.height=canvas.height;const fillContext=cachedHeatmap.getContext('2d');for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){const A=[i/N,j/N,1-(i+j)/N],B=[(i+1)/N,j/N,1-(i+j+1)/N],C=[i/N,(j+1)/N,1-(i+j+1)/N];const first=[A,B,C],cent=first[0].map((_,k)=>(A[k]+B[k]+C[k])/3),v=forward?kl(q,cent):kl(cent,q);cell(fillContext,first.map(triP),mapShade(v));if(j<N-i-1){const D=[(i+1)/N,(j+1)/N,1-(i+j+2)/N],second=[B,D,C],mid=second[0].map((_,k)=>(B[k]+D[k]+C[k])/3),v2=forward?kl(q,mid):kl(mid,q);cell(fillContext,second.map(triP),mapShade(v2))}}
cachedHeatmapKey=key;}c.drawImage(cachedHeatmap,0,0);
const v=vertices;c.strokeStyle=COLOR.teal;c.lineWidth=2.7;c.beginPath();c.moveTo(...v.A);c.lineTo(...v.B);c.lineTo(...v.C);c.closePath();c.stroke();
label(c,'KL landscape on the probability triangle',34,29,COLOR.ink,19);label(c,'A',v.A[0],v.A[1]-14,COLOR.teal,17,'center');label(c,'B',v.B[0]-10,v.B[1]+22,COLOR.orange,17,'center');label(c,'C',v.C[0]+10,v.C[1]+22,COLOR.green,17,'center');
const qLoc=triP(q),pLoc=triP(P),start=triP(s.start);
seg(c,...qLoc,...start,COLOR.purple,2,[7,5]);dot(c,...qLoc,COLOR.green,8);dot(c,...start,COLOR.orange,5);dot(c,...pLoc,COLOR.purple,9);
label(c,'Q: reference',qLoc[0]+11,qLoc[1]-14,COLOR.green,14);label(c,'P: model',pLoc[0]+11,pLoc[1]+21,COLOR.purple,14);label(c,'Click or drag to change starting model P₀',28,canvas.height-12,COLOR.muted,13)}
function drawPathDivergence(canvas,s){const f=t=>kl(s.ref,mix(s.start,s.ref,t)),g=t=>kl(mix(s.start,s.ref,t),s.ref),highest=Math.min(12,Math.max(.07,Number.isFinite(f(0))?f(0):f(.02),g(0)))*1.14;const {c,X,Y,b}=graph(canvas,'Mismatch while P moves linearly toward Q',[0,1],[0,highest],'interpolation t','KL');plot(c,f,X,Y,[0,1],COLOR.teal,3.3);plot(c,g,X,Y,[0,1],COLOR.orange,2.7);seg(c,X(s.u),b.t,X(s.u),b.b,COLOR.purple,1.4,[5,5]);if(Number.isFinite(f(s.u)))dot(c,X(s.u),Y(f(s.u)),COLOR.teal,7);label(c,'D(Q || P(t))',b.l+8,b.t+17,COLOR.teal,12);label(c,'D(P(t) || Q)',b.l+8,b.t+37,COLOR.orange,12)}
window.mountInfoDemo=function(week,host){if(week!==6)return;
host.innerHTML=[
'<div class="panel"><h2>Relative entropy and stable dynamics</h2><p>Use KL divergence to compare a changing distribution with a reference state. In binary mode the reference is a stable replicator equilibrium. In three-category mode, explore information mismatch across the whole probability simplex.</p>',
'<div class="toolbar"><label for="w6-mode">Explorer</label><select id="w6-mode"><option value="binary">Bernoulli dynamics and Lyapunov functions</option><option value="categorical">Categorical KL landscape</option></select><button id="w6-play" class="primary">Play</button><button id="w6-reset">Restart</button><label for="w6-speed">Speed</label><select id="w6-speed"><option value="1">1×</option><option value="3" selected>3×</option><option value="6">6×</option></select></div></div>',
'<div id="w6-binary-controls" class="panel"><h3>Stable replicator: x′ = k x(1−x)(q−x)</h3><p>The green reference q is the attracting equilibrium. The orange marker is the current state. Starting with q=0.75 and k=4 recovers our Week 1 example.</p>',
'<div class="demo-controls"><div class="control"><label for="w6-q">Equilibrium q = <strong id="w6-qv">0.750</strong></label><input id="w6-q" type="range" min=".1" max=".9" step=".01" value=".75"></div>',
'<div class="control"><label for="w6-k">Attraction strength k = <strong id="w6-kv">4.00</strong></label><input id="w6-k" type="range" min=".5" max="8" step=".1" value="4"></div>',
'<div class="control"><label for="w6-x0">Initial x(0) = <strong id="w6-x0v">0.100</strong></label><input id="w6-x0" type="range" min=".02" max=".98" step=".005" value=".1"></div></div>',
'<div class="toolbar" style="margin-top:15px"><button id="w6-week1">Week 1 coexistence model</button><button id="w6-near">Start near equilibrium</button></div></div>',
'<div id="w6-category-controls" class="panel" hidden><h3>Reference distribution and proposed model</h3><p>Q is the generating/reference distribution. P is the model that predicts outcomes. The heatmap color measures the chosen direction of divergence, not Euclidean distance.</p>',
'<div class="demo-controls"><div class="control"><label for="w6-qa">Reference qA <strong id="w6-qav">0.500</strong></label><input id="w6-qa" type="range" min=".05" max=".9" step=".01" value=".5"></div>',
'<div class="control"><label for="w6-qb">Reference qB <strong id="w6-qbv">0.300</strong></label><input id="w6-qb" type="range" min=".05" max=".9" step=".01" value=".3"></div>',
'<div class="control"><label>Reference qC</label><strong id="w6-qcv">0.200</strong></div></div>',
'<div class="toolbar" style="margin-top:13px"><label for="w6-heat">Map color</label><select id="w6-heat"><option value="forward">D(Q || P) — reference first</option><option value="reverse">D(P || Q) — model first</option></select><button id="w6-default">Restore model P₀</button><button id="w6-reference">Set P₀ = Q</button></div>',
'<p class="small muted">Drag the purple point to change P₀. Moving it toward Q with the interpolation control makes the divergence approach zero.</p></div>',
'<div class="panel"><label for="w6-time">Time / interpolation <strong id="w6-tv">0.00</strong></label><input type="range" id="w6-time" min="0" max="15" step=".025" value="0" style="width:100%"><div class="w6-metrics">',
'<div><span>Forward KL</span><strong id="w6-forward">—</strong></div><div><span>Reverse KL</span><strong id="w6-reverse">—</strong></div><div><span>Shannon entropy</span><strong id="w6-entropy">—</strong></div><div><span>Rate of KL change</span><strong id="w6-rate">—</strong></div></div><p id="w6-readout" class="small" aria-live="polite"></p>',
'<p id="w6-interp" class="small muted"></p></div>',
'<div id="w6-binary-views"><div class="panel" style="padding:12px"><canvas id="w6-phase" width="900" height="153" role="img" aria-label="Replicator phase line with moving state and attracting reference" style="width:100%;height:auto"></canvas></div>',
'<div class="w6-chart-grid"><div class="panel"><canvas id="w6-landscape" width="560" height="340" role="img" aria-label="Forward and reverse Bernoulli KL curves and their quadratic approximation" style="width:100%;height:auto"></canvas></div>',
'<div class="panel"><canvas id="w6-entropytime" width="560" height="340" role="img" aria-label="Evolution of Shannon entropy and probability state" style="width:100%;height:auto"></canvas></div>',
'<div class="panel"><canvas id="w6-kltime" width="560" height="340" role="img" aria-label="Forward and reverse KL along stable replicator flow" style="width:100%;height:auto"></canvas></div>',
'<div class="panel"><canvas id="w6-dissipation" width="560" height="340" role="img" aria-label="KL dissipation rate under the replicator equation" style="width:100%;height:auto"></canvas></div></div>',
'<p class="small muted">The dashed quadratic approximates forward KL near q. The dissipated quantity is k(x−q)², which is nonnegative. The identity dD(q||x)/dt = −k(x−q)² applies for all interior trajectories of this model.</p></div>',
'<div id="w6-category-views" hidden><div class="panel"><canvas id="w6-simplex" width="900" height="568" role="img" aria-label="Interactive triangular KL landscape with draggable model and fixed reference" style="width:100%;height:auto;touch-action:none"></canvas><p class="small muted">Pale colors indicate small mismatch; darker purple shades mean larger mismatch. At the simplex boundary, forward KL is infinite if Q assigns positive probability to an absent outcome.</p></div>',
'<div class="panel"><canvas id="w6-path" width="900" height="332" role="img" aria-label="Directional KL divergences along the interpolation path toward the reference distribution" style="width:100%;height:auto"></canvas><p class="small muted">This straight-line interpolation is not asserted to be a replicator trajectory. It illustrates a decreasing mismatch toward Q.</p></div></div>',
'<style>.w6-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.w6-metrics>div{padding:10px;background:var(--soft);border-radius:9px;min-width:0}.w6-metrics span{font-size:.79rem;color:var(--muted);display:block}.w6-metrics strong{font-size:1.25rem;font-variant-numeric:tabular-nums}.w6-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.w6-chart-grid>.panel{min-width:0;padding:12px}@media(max-width:890px){.w6-chart-grid{grid-template-columns:1fr}}@media(max-width:620px){.w6-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>'
].join('');
const el=id=>document.getElementById('w6-'+id);
const s={mode:'binary',q:.75,k:4,x0:.1,t:0,running:false,speed:3,path:[],last:0,ref:[.5,.3,.2],start:[.15,.2,.65],heat:'forward',u:0};
function pause(){s.running=false;el('play').textContent='Play'}
function totalTime(){return s.mode==='binary'?T:1}
function update(){const binary=s.mode==='binary';
el('binary-controls').hidden=!binary;el('category-controls').hidden=binary;el('binary-views').hidden=!binary;el('category-views').hidden=binary;
el('time').max=String(totalTime());el('time').value=String(binary?s.t:s.u);el('tv').textContent=(binary?s.t:s.u).toFixed(3);
if(binary){const x=at(s.path,s.t),D=kl(bern(s.q),bern(x)),reverse=kl(bern(x),bern(s.q)),Hd=binaryEntropy(x),rate=-s.k*(x-s.q)**2;
el('qv').textContent=fmt(s.q,3);el('kv').textContent=fmt(s.k,2);el('x0v').textContent=fmt(s.x0,3);
el('forward').textContent=fmt(D,5);el('reverse').textContent=fmt(reverse,5);el('entropy').textContent=fmt(Hd,5);el('rate').textContent=fmt(rate,5);
el('readout').textContent='Current x = '+fmt(x,4)+', equilibrium q = '+fmt(s.q,3)+'.  x′ = '+fmt(rhs(x,s.q,s.k),5)+'.  The forward KL derivative is −'+fmt(s.k*(x-s.q)**2,5)+'.';
el('interp').textContent='For k>0 and 0<q<1, D(q||x(t)) decreases along every nonstationary interior trajectory; Shannon entropy need not.';
drawPhase(el('phase'),s,x);drawLandscape(el('landscape'),s,x);drawEntropy(el('entropytime'),s,x);drawKltime(el('kltime'),s,x);drawDissipation(el('dissipation'),s,x);
}else{const P=mix(s.start,s.ref,s.u),D=kl(s.ref,P),reverse=kl(P,s.ref),H=entropy(s.ref);
el('qav').textContent=fmt(s.ref[0],3);el('qbv').textContent=fmt(s.ref[1],3);el('qcv').textContent=fmt(s.ref[2],3);
el('forward').textContent=fmt(D,5);el('reverse').textContent=fmt(reverse,5);el('entropy').textContent=fmt(H,5);el('rate').textContent='—';
el('readout').textContent='Reference Q = ('+s.ref.map(v=>fmt(v,3)).join(', ')+') · Model P = ('+P.map(v=>fmt(v,3)).join(', ')+') · Expected log loss CE(Q,P) = '+fmt(H+D,5)+' nats.';
el('interp').textContent='Excess expected log loss = D(Q||P) = '+fmt(D,5)+' nats. Interpolation P(u)=(1−u)P₀+uQ, with u='+fmt(s.u,3)+'.';
drawHeatmap(el('simplex'),s,P);drawPathDivergence(el('path'),s);}
}
function rerun(){pause();s.path=trace(s.x0,s.q,s.k);update()}
el('mode').addEventListener('change',()=>{pause();s.mode=el('mode').value;s.t=0;s.u=0;update()});
for(const key of ['q','k','x0'])el(key).addEventListener('input',()=>{s[key]=Number(el(key).value);if(key==='x0')s.t=0;rerun()});
el('week1').addEventListener('click',()=>{s.q=.75;s.k=4;s.x0=.1;s.t=0;el('q').value='.75';el('k').value='4';el('x0').value='.1';rerun()});
el('near').addEventListener('click',()=>{s.x0=clamp(s.q-.025,.02,.98);s.t=0;el('x0').value=String(s.x0);rerun()});
for(const key of ['qa','qb'])el(key).addEventListener('input',()=>{const a=key==='qa'?0:1,b=1-a,v=Number(el(key).value),newQ=s.ref.slice();newQ[a]=clamp(v,.05,.9);newQ[b]=Math.min(newQ[b],.95-newQ[a]);newQ[2]=1-newQ[0]-newQ[1];s.ref=newQ;el('qa').value=String(s.ref[0]);el('qb').value=String(s.ref[1]);pause();update()});
el('heat').addEventListener('change',()=>{s.heat=el('heat').value;update()});
el('default').addEventListener('click',()=>{s.start=[.15,.2,.65];s.u=0;pause();update()});
el('reference').addEventListener('click',()=>{s.start=s.ref.slice();s.u=0;pause();update()});
el('time').addEventListener('input',()=>{pause();if(s.mode==='binary')s.t=Number(el('time').value);else s.u=Number(el('time').value);update()});
el('reset').addEventListener('click',()=>{pause();s.t=0;s.u=0;update()});
el('speed').addEventListener('change',()=>{s.speed=Number(el('speed').value)});
el('play').addEventListener('click',()=>{s.running=!s.running;el('play').textContent=s.running?'Pause':'Play';if(s.running&&(s.mode==='binary'?s.t>=T:s.u>=1)){s.t=0;s.u=0} s.last=performance.now()});
let dragging=false;
function choose(ev){if(s.mode!=='categorical')return;const c=el('simplex'),r=c.getBoundingClientRect(),x=(ev.clientX-r.left)*c.width/r.width,y=(ev.clientY-r.top)*c.height/r.height;s.start=pick(x,y);s.u=0;pause();update()}
el('simplex').addEventListener('pointerdown',e=>{dragging=true;if(el('simplex').setPointerCapture)el('simplex').setPointerCapture(e.pointerId);choose(e)});
el('simplex').addEventListener('pointermove',e=>{if(dragging)choose(e)});
el('simplex').addEventListener('pointerup',()=>{dragging=false});el('simplex').addEventListener('pointercancel',()=>{dragging=false});
for(const [name,max] of [['entropytime',T],['kltime',T],['dissipation',T],['path',1]])el(name).addEventListener('click',e=>{const c=el(name),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,v=clamp((x-72)/(c.width-95),0,1)*max;pause();if(name==='path')s.u=Math.round(v/.005)*.005;else s.t=Math.round(v/DT)*DT;update()});
function frame(now){if(!host.isConnected)return;if(s.running){const d=clamp((now-s.last)/1000,0,.07),scale=s.mode==='binary'?1:.14;if(s.mode==='binary'){s.t=Math.min(T,s.t+d*s.speed*scale);if(s.t>=T)pause()}else{s.u=Math.min(1,s.u+d*s.speed*scale);if(s.u>=1)pause()}update()}s.last=now;requestAnimationFrame(frame)}
s.path=trace(s.x0,s.q,s.k);update();requestAnimationFrame(frame);
};
})();
