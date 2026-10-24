(function(){
'use strict';
const C={teal:'#0d8397',orange:'#cd7945',purple:'#845bab',green:'#27896b',ink:'#334d59',muted:'#627a87',axis:'#7b929d',grid:'#dfebef'};
const DT=.03,MAX=30;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sum=a=>a.reduce((s,x)=>s+x,0),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const fmt=(x,n=4)=>Number.isFinite(x)?(Math.abs(x)<.5*10**(-n)?0:x).toFixed(n):'—';
const normalize=a=>{const r=a.map(x=>Math.max(0,x)),s=sum(r);return s?r.map(x=>x/s):[1/3,1/3,1/3]};
const softmax=y=>{const m=Math.max(...y),w=y.map(x=>Math.exp(x-m)),s=sum(w);return w.map(x=>x/s)};
const H=p=>p.reduce((s,x)=>s-(x>0?x*Math.log(x):0),0);
const KL=(q,p)=>q.reduce((s,x,i)=>s+(x>0?x*Math.log(x/p[i]):0),0);
const product=p=>p.reduce((s,x)=>s*x,1);
function fitness(p,kind,q){
 if(kind==='linear')return[2,1,0];
 if(kind==='kl')return p.map((x,i)=>q[i]/x);
 if(kind==='entropy')return p.map(x=>-Math.log(x)-1);
 if(kind==='quadratic')return p.map((x,i)=>q[i]-x);
 return[p[1]-p[2],p[2]-p[0],p[0]-p[1]];
}
function objective(p,kind,q){
 if(kind==='linear')return dot(p,[2,1,0]);
 if(kind==='kl')return -KL(q,p);
 if(kind==='entropy')return H(p);
 if(kind==='quadratic')return-.5*sum(p.map((x,i)=>(x-q[i])**2));
 return product(p);
}
function naturalVelocity(p,fit){const mean=dot(p,fit);return p.map((x,i)=>x*(fit[i]-mean))}
function variance(p,fit){const mean=dot(p,fit);return sum(p.map((x,i)=>x*(fit[i]-mean)**2))}
function flowAt(initial,kind,q,t,trace){
 if(kind==='linear')return softmax(initial.map((x,i)=>Math.log(x)+[2,1,0][i]*t));
 if(kind==='kl')return initial.map((x,i)=>q[i]+(x-q[i])*Math.exp(-t));
 if(kind==='entropy')return softmax(initial.map(x=>Math.log(x)*Math.exp(-t)));
 let i=clamp(t/DT,0,trace.length-1),j=Math.floor(i),a=trace[j],b=trace[Math.min(j+1,trace.length-1)];return normalize(a.map((x,k)=>x+(b[k]-x)*(i-j)));
}
function integrate(initial,kind,q){if(!['cyclic','quadratic'].includes(kind))return [];
const n=Math.ceil(MAX/DT),states=[initial.slice()],y=initial.map(Math.log);
function field(u){return fitness(softmax(u),kind,q)}
for(let i=0;i<n;i++){let a=field(y),b=field(y.map((v,j)=>v+DT*a[j]/2)),c=field(y.map((v,j)=>v+DT*b[j]/2)),d=field(y.map((v,j)=>v+DT*c[j]));for(let j=0;j<3;j++)y[j]+=DT*(a[j]+2*b[j]+2*c[j]+d[j])/6;states.push(softmax(y))}
return states}
const bernF=x=>x*(1-x)*(3-4*x),bernPhi=x=>3*x-2*x*x;
function binaryPath(x0){const list=[x0];let x=x0;for(let i=0;i<Math.round(12/DT);i++){const a=bernF(x),b=bernF(x+DT*a/2),c=bernF(x+DT*b/2),d=bernF(x+DT*c);x=clamp(x+DT*(a+2*b+2*c+d)/6,0,1);list.push(x)}return list}
function sample(arr,t){const j=clamp(t/DT,0,arr.length-1),k=Math.floor(j);return arr[k]+(arr[Math.min(k+1,arr.length-1)]-arr[k])*(j-k)}
const verts=[[402,40],[95,507],[710,507]];
const tri=p=>[dot(p,verts.map(x=>x[0])),dot(p,verts.map(x=>x[1]))];
function pick(x,y){const a=clamp((507-y)/467,0,1),rem=1-a,c=clamp((x-verts[0][0]*a-verts[1][0]*rem)/(verts[2][0]-verts[1][0]),0,rem);return[a,rem-c,c]}
const bhatt=(p,q)=>sum(p.map((x,i)=>Math.sqrt(x*q[i])));
function geo(p,q,t){const alpha=Math.acos(clamp(bhatt(p,q),0,1));if(alpha<1e-9)return p.slice();const a=Math.sin((1-t)*alpha)/Math.sin(alpha),b=Math.sin(t*alpha)/Math.sin(alpha);return normalize(p.map((x,i)=>(a*Math.sqrt(x)+b*Math.sqrt(q[i]))**2))}
function canvasStart(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.lineCap='round';c.lineJoin='round';return c}
function line(c,x,y,X,Y,col=C.grid,w=1,dash=[]){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash);c.stroke();c.restore()}
function label(c,str,x,y,col=C.ink,n=13,align='left'){c.font=n+'px system-ui,Segoe UI,sans-serif';c.fillStyle=col;c.textAlign=align;c.fillText(str,x,y)}
function dotCircle(c,x,y,color=C.purple,r=6){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r+2,0,2*Math.PI);c.fill();c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill()}
function arrow(c,p,v,col,scale=1){const a=tri(p),b=tri(p.map((x,i)=>x+v[i]*scale)),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<2)return;const u=dx/l,z=dy/l;line(c,a[0],a[1],b[0],b[1],col,2.6);line(c,b[0],b[1],b[0]-u*8+z*5,b[1]-z*8-u*5,col,2.3);line(c,b[0],b[1],b[0]-u*8-z*5,b[1]-z*8+u*5,col,2.3)}
function poly(c,fn,X,Y,lo,hi,color,w=3,N=220,dash=[]){c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=w;c.setLineDash(dash);let started=false;for(let j=0;j<=N;j++){let x=lo+(hi-lo)*j/N,v=fn(x);if(!Number.isFinite(v)){started=false;continue}if(!started){c.moveTo(X(x),Y(v));started=true}else c.lineTo(X(x),Y(v))}c.stroke();c.restore()}
function chart(canvas,title,xrange,yrange,xLabel,yLabel){const c=canvasStart(canvas),b={l:72,r:canvas.width-26,t:47,bot:canvas.height-53},X=x=>b.l+(x-xrange[0])/(xrange[1]-xrange[0])*(b.r-b.l),Y=y=>b.bot-(y-yrange[0])/(yrange[1]-yrange[0])*(b.bot-b.t);
for(let k=0;k<=4;k++){const x=xrange[0]+(xrange[1]-xrange[0])*k/4,y=yrange[0]+(yrange[1]-yrange[0])*k/4;line(c,X(x),b.t,X(x),b.bot);line(c,b.l,Y(y),b.r,Y(y));label(c,fmt(x,1),X(x),b.bot+18,C.muted,11,'center');label(c,fmt(y,Math.abs(y)<1?3:2),b.l-9,Y(y)+4,C.muted,11,'right')}
line(c,b.l,b.t,b.l,b.bot,C.axis,1.6);line(c,b.l,b.bot,b.r,b.bot,C.axis,1.6);label(c,title,b.l,29,C.ink,18);label(c,xLabel,b.r,b.bot+39,C.muted,12,'right');label(c,yLabel,12,40,C.muted,12);return{c,X,Y,b}}
function binaryPotential(canvas,s){const {c,X,Y,b}=chart(canvas,'Potential Φ(x)=3x−2x²',[0,1],[0,1.18],'probability x','Φ(x)');poly(c,bernPhi,X,Y,0,1,C.teal,3.5);line(c,X(.75),b.t,X(.75),b.bot,C.green,1.2,[5,5]);const x=sample(s.bin,s.t);dotCircle(c,X(x),Y(bernPhi(x)),C.purple,8);label(c,'maximum at x=0.75',X(.75)-7,b.t+18,C.green,12,'right')}
function binaryPhase(canvas,s){const c=canvasStart(canvas),L=64,R=canvas.width-45,y=80,X=x=>L+x*(R-L);label(c,'Natural-gradient phase line',L,25,C.ink,18);line(c,L,y,R,y,C.axis,2.5);for(let i=0;i<18;i++){const x=(i+.5)/18,dir=Math.sign(bernF(x)),cx=X(x),ex=cx+dir*14;line(c,cx-dir*10,y,ex,y,C.teal,2.6);line(c,ex,y,ex-dir*6,y-5,C.teal,2);line(c,ex,y,ex-dir*6,y+5,C.teal,2)}dotCircle(c,X(.75),y,C.green,7);const x=sample(s.bin,s.t);dotCircle(c,X(x),y-25,C.purple,7);label(c,'0',L,y+26,C.muted,13,'center');label(c,'1',R,y+26,C.muted,13,'center');label(c,'x*=0.75',X(.75),y+28,C.green,13,'center')}
function binaryTime(canvas,s){const T=12,{c,X,Y,b}=chart(canvas,'Trajectory and potential versus time',[0,T],[0,1.18],'time t','value'),xx=t=>sample(s.bin,t);
poly(c,xx,X,Y,0,T,C.teal,3);poly(c,t=>bernPhi(xx(t)),X,Y,0,T,C.purple,3);line(c,X(s.t),b.t,X(s.t),b.bot,C.orange,1.3,[5,5]);dotCircle(c,X(s.t),Y(xx(s.t)),C.teal,6);dotCircle(c,X(s.t),Y(bernPhi(xx(s.t))),C.purple,6);label(c,'x(t)',b.r-170,b.t+17,C.teal,13);label(c,'Φ(x(t))',b.r-105,b.t+17,C.purple,13)}
function fillTriangle(c,pts,color){c.beginPath();c.moveTo(...tri(pts[0]));c.lineTo(...tri(pts[1]));c.lineTo(...tri(pts[2]));c.closePath();c.fillStyle=color;c.fill()}
function shade(value,kind){let t;if(kind==='linear')t=clamp(value/2,0,1);else if(kind==='kl')t=Math.exp(Math.min(0,value)/.34);else if(kind==='entropy')t=clamp(value/Math.log(3),0,1);else if(kind==='quadratic')t=Math.exp(value/.045);else t=clamp(value*27,0,1);return'rgb('+Math.round(236-112*t)+','+Math.round(247-71*t)+','+Math.round(248-94*t)+')'}
let cache=null,cacheKey='';
function drawHeatmap(canvas,s,c){const key=s.kind+":"+s.q.map(x=>fmt(x,5)).join(',');
if(key!==cacheKey){cache=document.createElement('canvas');cache.width=canvas.width;cache.height=canvas.height;const ctx=cache.getContext('2d'),N=47;
for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){
const A=[i/N,j/N,1-(i+j)/N],B=[(i+1)/N,j/N,1-(i+j+1)/N],D=[i/N,(j+1)/N,1-(i+j+1)/N],E=[(i+1)/N,(j+1)/N,1-(i+j+2)/N];
const a=[A,B,D],center=a[0].map((_,k)=>(A[k]+B[k]+D[k])/3);fillTriangle(ctx,a,shade(objective(center,s.kind,s.q),s.kind));
if(i+j+1<N){const b=[B,E,D],middle=b[0].map((_,k)=>(B[k]+E[k]+D[k])/3);fillTriangle(ctx,b,shade(objective(middle,s.kind,s.q),s.kind))}}
cacheKey=key}
c.drawImage(cache,0,0)}
function simplexCanvas(canvas,s){const c=canvasStart(canvas),maxT=s.kind==='cyclic'?MAX:8,cur=at(s,s.t);drawHeatmap(canvas,s,c);c.beginPath();c.moveTo(...verts[0]);c.lineTo(...verts[1]);c.lineTo(...verts[2]);c.closePath();c.strokeStyle=C.teal;c.lineWidth=2.3;c.stroke();
label(c,s.kind==='cyclic'?'Cyclic field: conserved product K':'Fisher natural-gradient field',35,25,C.ink,20);
for(const [i,name] of ['A','B','C'].entries())label(c,name,verts[i][0],verts[i][1]+(i===0?-11:24),[C.teal,C.orange,C.green][i],16,'center');
// Tangent arrows in the triangle, sampled from the true dynamical field.
for(let i=1;i<=7;i++)for(let j=1;i+j<=8;j++){const p=[i/9,j/9,1-(i+j)/9],v=naturalVelocity(p,fitness(p,s.kind,s.q));arrow(c,p,v,'#427c8d',.17)}
const pathT=s.kind==='cyclic'?MAX:8;const coords=[];for(let j=0;j<=450;j++){const t=pathT*j/450;coords.push(tri(at(s,t)))}
c.beginPath();for(let j=0;j<coords.length;j++){const [x,y]=coords[j];if(j===0)c.moveTo(x,y);else c.lineTo(x,y)}c.strokeStyle='#a8bcc7';c.lineWidth=1.8;c.stroke();
c.beginPath();for(let j=0;j<=450;j++){const time=s.t*j/450,[x,y]=tri(at(s,time));if(j===0)c.moveTo(x,y);else c.lineTo(x,y)}c.strokeStyle=C.purple;c.lineWidth=3.6;c.stroke();
if(s.kind==='kl'){c.save();c.beginPath();for(let i=0;i<=150;i++){const p=geo(s.p0,s.q,i/150),xy=tri(p);if(i===0)c.moveTo(...xy);else c.lineTo(...xy)}c.strokeStyle=C.orange;c.lineWidth=2.2;c.setLineDash([6,5]);c.stroke();c.restore()}
const p0=tri(s.p0),now=tri(cur);dotCircle(c,...p0,C.teal,6);dotCircle(c,...now,C.purple,8);
if(['kl','quadratic'].includes(s.kind)){dotCircle(c,...tri(s.q),C.orange,6);label(c,'q',tri(s.q)[0]+10,tri(s.q)[1]-12,C.orange,13)}
if(s.kind==='entropy'||s.kind==='cyclic'){const center=tri([1/3,1/3,1/3]);dotCircle(c,...center,C.green,5)}
const v=naturalVelocity(cur,fitness(cur,s.kind,s.q));arrow(c,cur,v,C.purple,1.3);
label(c,s.kind==='cyclic'?'Closed-orbit dynamics: no ascent potential':s.kind==='kl'?'Orange dashed: Fisher geodesic. Purple: KL-gradient path.':'Gray: full trajectory; purple: trajectory traveled',25,canvas.height-15,C.muted,13)}
function at(s,t){return flowAt(s.p0,s.kind,s.q,t,s.trace)}
function graphSeries(canvas,s,type){const T=s.kind==='cyclic'?MAX:8,values=[];for(let i=0;i<=200;i++){const t=T*i/200,p=at(s,t),f=fitness(p,s.kind,s.q);values.push(type==='potential'?objective(p,s.kind,s.q):variance(p,f))}
const min=Math.min(...values),max=Math.max(...values),lo=type==='potential'?Math.min(0,min):0,hi=Math.max(lo+.025,max+(max-min)*.1),top=Math.max(0.01,hi);
const title=type==='potential'?(s.kind==='cyclic'?'Conserved product K(t)':'Potential Φ(p(t)) increases'):'Squared Fisher speed = fitness variance';
const {c,X,Y,b}=chart(canvas,title,[0,T],[lo,top],'time t',type==='potential'?'scalar':'speed²');
const fn=t=>{const p=at(s,t);return type==='potential'?objective(p,s.kind,s.q):variance(p,fitness(p,s.kind,s.q))};
poly(c,fn,X,Y,0,T,type==='potential'?C.purple:C.teal,3.3,300);
line(c,X(s.t),b.t,X(s.t),b.bot,C.orange,1.3,[4,5]);const val=fn(s.t);dotCircle(c,X(s.t),Y(val),C.purple,6);
if(s.kind==='cyclic'&&type==='potential')label(c,'K is conserved; this is not a potential',b.l+14,b.t+18,C.muted,12)}
window.mountInfoDemo=function(week,host,controlsHost){if(week!==9)return;
controlsHost.innerHTML=[
'<div class="w9-control-rail"><h2>Explore the model</h2>',
'<div class="w9-rail-group"><label for="w9-mode">Family</label><select id="w9-mode"><option value="binary">Bernoulli gradient (1D)</option><option value="simplex">Three-category simplex</option></select></div>',
'<div class="w9-rail-group"><label for="w9-time">Time t = <strong id="w9-tv">0.00</strong></label><input type="range" id="w9-time" min="0" max="12" step=".03" value="0"><div class="w9-button-row"><button id="w9-play" class="primary">Play</button><button id="w9-reset">Restart</button></div><label for="w9-speed">Playback speed</label><select id="w9-speed"><option value="1">1×</option><option value="3" selected>3×</option><option value="6">6×</option></select></div>',
'<details class="w9-rail-group" id="w9-binary-controls" open><summary>Bernoulli start</summary><div class="w9-rail-inner"><label for="w9-x0">Initial x(0) = <strong id="w9-x0v">0.100</strong></label><input id="w9-x0" type="range" min=".01" max=".99" step=".005" value=".1"><div class="w9-preset-buttons"><button id="w9-bleft">Below maximum</button><button id="w9-bright">Above maximum</button></div></div></details>',
'<details class="w9-rail-group" id="w9-simplex-controls" open hidden><summary>Three-category settings</summary><div class="w9-rail-inner"><label for="w9-kind">Model</label><select id="w9-kind"><option value="linear">Linear potential</option><option value="kl">Negative KL potential</option><option value="quadratic">Quadratic potential</option><option value="entropy">Shannon entropy potential</option><option value="cyclic">Balanced cyclic competition</option></select>',
'<div class="w9-parameter-grid"><div><h3>Initial probability p(0)</h3><label for="w9-pa">pA = <strong id="w9-pav">0.650</strong></label><input id="w9-pa" type="range" min=".01" max=".98" step=".005" value=".65"><label for="w9-pb">pB = <strong id="w9-pbv">0.200</strong></label><input id="w9-pb" type="range" min=".01" max=".98" step=".005" value=".2"><p>pC = <strong id="w9-pcv">0.150</strong></p></div>',
'<div id="w9-target-controls"><h3>Target q</h3><label for="w9-qa">qA = <strong id="w9-qav">0.300</strong></label><input id="w9-qa" type="range" min=".05" max=".9" step=".005" value=".3"><label for="w9-qb">qB = <strong id="w9-qbv">0.400</strong></label><input id="w9-qb" type="range" min=".05" max=".9" step=".005" value=".4"><p>qC = <strong id="w9-qcv">0.300</strong></p></div></div>',
'<div class="w9-preset-buttons"><button id="w9-default">Default start</button><button id="w9-unequal">Near edge</button><button id="w9-uniform">Uniform</button></div><p class="w9-rail-tip">Drag the purple start point in the simplex to choose another positive distribution. The q sliders appear for KL and quadratic potentials.</p></div></details></div>'
].join('');
host.innerHTML=[
'<div id="w9-binary-view"><p class="w9-view-intro">For Φ(x)=3x−2x², the ordinary derivative is Φ′(x)=3−4x. Its Fisher gradient, x(1−x)Φ′(x), is the Week 1 replicator equation.</p><div class="panel w9-phase-panel"><canvas id="w9-phase" width="890" height="147" role="img" aria-label="Bernoulli Fisher-gradient phase line"></canvas></div><div class="w9-chartgrid"><div class="panel"><canvas id="w9-potential" width="560" height="342" role="img" aria-label="Bernoulli potential curve with current point"></canvas></div><div class="panel"><canvas id="w9-bintime" width="560" height="342" role="img" aria-label="Bernoulli state and potential through time"></canvas></div></div></div>',
'<div id="w9-simplex-view" hidden><div class="panel w9-triangle-panel"><canvas id="w9-triangle" width="840" height="561" role="img" aria-label="Draggable probability simplex with potential landscape, tangent field, gradient trajectories or cyclic orbits"></canvas><p class="small muted">For the KL model, the orange dashed curve is the Fisher geodesic toward q; the purple gradient trajectory follows the straight probability mixture.</p></div><div class="w9-chartgrid"><div class="panel"><canvas id="w9-scalar" width="560" height="340" role="img" aria-label="Potential or conserved product along the trajectory"></canvas></div><div class="panel"><canvas id="w9-speedgraph" width="560" height="340" role="img" aria-label="Fisher squared speed and fitness variance"></canvas></div></div></div>',
'<div class="panel w9-results"><h2>Reading the experiment</h2><div class="w9-metrics"><div><span id="w9-label1">State x</span><strong id="w9-value1">—</strong></div><div><span id="w9-label2">Potential Φ</span><strong id="w9-value2">—</strong></div><div><span id="w9-label3">Potential ascent rate</span><strong id="w9-value3">—</strong></div><div><span id="w9-label4">Fisher squared speed</span><strong id="w9-value4">—</strong></div></div><p id="w9-readout" class="small" aria-live="polite"></p><p id="w9-conclusion" class="small muted"></p></div>'
].join('');
const el=id=>document.getElementById('w9-'+id);
const s={mode:'binary',x0:.1,bin:[],kind:'linear',p0:[.65,.2,.15],q:[.3,.4,.3],trace:[],t:0,speed:3,playing:false,last:0};
function stop(){s.playing=false;el('play').textContent='Play'}
const horizon=()=>s.mode==='binary'?12:s.kind==='cyclic'?MAX:8;
function setT(){const T=horizon();el('time').max=String(T);if(s.t>T)s.t=T;el('time').value=String(s.t);el('tv').textContent=fmt(s.t,2)}
function metrics(labels,vals){for(let i=0;i<4;i++){el('label'+(i+1)).textContent=labels[i];el('value'+(i+1)).textContent=vals[i]}}
function refresh(){const binary=s.mode==='binary';el('binary-controls').hidden=!binary;el('binary-view').hidden=!binary;el('simplex-controls').hidden=binary;el('simplex-view').hidden=binary;setT();
if(binary){const x=sample(s.bin,s.t),v=bernF(x),phi=bernPhi(x),rate=(3-4*x)*v;
metrics(['Proportion x(t)','Potential Φ(x)','Potential ascent dΦ/dt','Squared Fisher speed'],[fmt(x,5),fmt(phi,5),fmt(rate,6),fmt(v*v/(x*(1-x)),6)]);
el('x0v').textContent=fmt(s.x0,3);el('x0').value=String(s.x0);
el('readout').textContent='Φ′(x)='+fmt(3-4*x,4)+', x′='+fmt(v,5)+', Fisher coefficient g(x)='+fmt(1/(x*(1-x)),4)+'.';
el('conclusion').textContent='The potential increases at exactly the squared Fisher speed, becoming stationary at the interior maximum x=0.75.';
binaryPotential(el('potential'),s);binaryPhase(el('phase'),s);binaryTime(el('bintime'),s);return}
const p=at(s,s.t),fit=fitness(p,s.kind,s.q),v=naturalVelocity(p,fit),speed2=variance(p,fit),val=objective(p,s.kind,s.q);
const cyc=s.kind==='cyclic',rate=cyc?0:speed2;
metrics([cyc?'Conserved product K':'Potential Φ(p)',cyc?'Product rate dK/dt':'Potential ascent dΦ/dt','Squared Fisher speed','Probability sum'],[fmt(val,7),fmt(rate,7),fmt(speed2,7),fmt(sum(p),5)]);
for(const [id,vect] of [['p',s.p0],['q',s.q]])for(const [i,l] of ['a','b','c'].entries()){
  el(id+l+'v').textContent=fmt(vect[i],3);
  if(l!=='c')el(id+l).value=String(vect[i]);
}
el('target-controls').hidden=!['kl','quadratic'].includes(s.kind);
el('readout').textContent='p(t)=('+p.map(x=>fmt(x,4)).join(', ')+'), fitness=('+fit.map(x=>fmt(x,3)).join(', ')+'), velocity=('+v.map(x=>fmt(x,5)).join(', ')+').';
el('conclusion').textContent=cyc?'This model conserves pA·pB·pC. It has nonstationary closed orbits: Fisher speed is positive while dK/dt=0. The product is not an ascent potential.':s.kind==='kl'?'KL decreases and the state contracts straight toward q. The orange dashed geodesic gives a different shortest path.':s.kind==='entropy'?'Shannon entropy increases under its own Fisher-gradient flow; the distribution approaches uniform.':s.kind==='linear'?'The exact softmax trajectory climbs the linear potential; potential ascent equals current fitness variance.':'The quadratic potential increases toward its maximum at the reference state q.';
simplexCanvas(el('triangle'),s);graphSeries(el('scalar'),s,'potential');graphSeries(el('speedgraph'),s,'speed');
}
function rebuild(){stop();s.trace=integrate(s.p0,s.kind,s.q);refresh()}
el('mode').addEventListener('change',()=>{stop();s.mode=el('mode').value;s.t=0;refresh()});
el('kind').addEventListener('change',()=>{s.kind=el('kind').value;s.t=0;rebuild()});
el('x0').addEventListener('input',()=>{s.x0=Number(el('x0').value);s.t=0;s.bin=binaryPath(s.x0);stop();refresh()});
el('bleft').addEventListener('click',()=>{s.x0=.1;s.t=0;s.bin=binaryPath(s.x0);stop();refresh()});
el('bright').addEventListener('click',()=>{s.x0=.92;s.t=0;s.bin=binaryPath(s.x0);stop();refresh()});
for(const prefix of ['p','q'])for(const l of ['a','b'])el(prefix+l).addEventListener('input',()=>{const key=prefix==='p'?'p0':'q',i=l==='a'?0:1,j=1-i,arr=s[key].slice(),v=Number(el(prefix+l).value),lower=prefix==='q'?.05:.01;arr[i]=clamp(v,lower,1-2*lower);arr[j]=clamp(arr[j],lower,1-lower-arr[i]);arr[2]=1-arr[0]-arr[1];s[key]=arr;s.t=0;rebuild()});
el('default').addEventListener('click',()=>{s.p0=[.65,.2,.15];s.t=0;rebuild()});
el('unequal').addEventListener('click',()=>{s.p0=[.83,.13,.04];s.t=0;rebuild()});
el('uniform').addEventListener('click',()=>{s.p0=[1/3,1/3,1/3];s.t=0;rebuild()});
el('time').addEventListener('input',()=>{s.t=Number(el('time').value);stop();refresh()});
el('reset').addEventListener('click',()=>{s.t=0;stop();refresh()});
el('speed').addEventListener('change',()=>{s.speed=Number(el('speed').value)});
el('play').addEventListener('click',()=>{s.playing=!s.playing;el('play').textContent=s.playing?'Pause':'Play';if(s.playing&&s.t>=horizon())s.t=0;s.last=performance.now()});
for(const [id,T] of [['bintime',12],['scalar',8],['speedgraph',8]])el(id).addEventListener('click',ev=>{const can=el(id),r=can.getBoundingClientRect(),x=(ev.clientX-r.left)*can.width/r.width;s.t=clamp((x-72)/(can.width-98),0,1)*(s.kind==='cyclic'&&id!=='bintime'?MAX:T);stop();refresh()});
let dragging=false;
function select(e){if(s.mode==='binary')return;const can=el('triangle'),r=can.getBoundingClientRect(),x=(e.clientX-r.left)*can.width/r.width,y=(e.clientY-r.top)*can.height/r.height;const v=pick(x,y).map(a=>Math.max(.01,a));s.p0=normalize(v);s.t=0;rebuild()}
el('triangle').addEventListener('pointerdown',e=>{if(s.mode==='binary')return;dragging=true;if(el('triangle').setPointerCapture)el('triangle').setPointerCapture(e.pointerId);select(e)});
el('triangle').addEventListener('pointermove',e=>{if(dragging)select(e)});
el('triangle').addEventListener('pointerup',()=>{dragging=false});el('triangle').addEventListener('pointercancel',()=>{dragging=false});
function frame(now){if(!host.isConnected)return;if(s.playing){s.t=Math.min(horizon(),s.t+clamp((now-s.last)/1000,0,.07)*s.speed);if(s.t>=horizon())stop();refresh()}s.last=now;requestAnimationFrame(frame)}
s.bin=binaryPath(s.x0);s.trace=integrate(s.p0,s.kind,s.q);refresh();requestAnimationFrame(frame);
};
})();
