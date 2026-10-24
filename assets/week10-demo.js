(function(){
'use strict';
const C={teal:'#0d8499',orange:'#cd7944',purple:'#805aa8',green:'#27896c',ink:'#36505d',muted:'#657f8b',axis:'#7b929f',grid:'#e2ecef'};
const SQ=Math.sqrt(2),TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(x,n=4)=>Number.isFinite(x)?(Math.abs(x)<.5*Math.pow(10,-n)?0:x).toFixed(n):'—';
const gaussian=(x,p)=>Math.exp(-.5*((x-p[0])/p[1])**2)/(p[1]*Math.sqrt(2*Math.PI));
const uv=p=>[p[0]/SQ,p[1]];
const gaussianKL=(a,b)=>Math.log(b[1]/a[1])+(a[1]*a[1]+(a[0]-b[0])**2)/(2*b[1]*b[1])-.5;
function hyperDelta(a,b){const x=uv(a),y=uv(b),h=((x[0]-y[0])**2+(x[1]-y[1])**2)/(2*x[1]*y[1]);return Math.acosh(1+h)}
const fisherDist=(a,b)=>SQ*hyperDelta(a,b);
function toHyper(p){const [u,v]=uv(p),z=(u*u+v*v);return[(z+1)/(2*v),u/v,(z-1)/(2*v)]}
function fromHyper(v){const z=v[0]-v[2];return[SQ*v[1]/z,1/z]}
function geodesic(a,b,t){const d=hyperDelta(a,b);if(d<1e-8)return a.map((x,i)=>x+(b[i]-x)*t);
const f=Math.sinh((1-t)*d)/Math.sinh(d),g=Math.sinh(t*d)/Math.sinh(d),A=toHyper(a),B=toHyper(b);return fromHyper(A.map((x,i)=>f*x+g*B[i]))}
const straight=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
function straightLen(a,b){const dm=b[0]-a[0],ds=b[1]-a[1],E=Math.hypot(dm,SQ*ds);return Math.abs(ds)<1e-10?E/a[1]:E*Math.log(b[1]/a[1])/ds}
const verticalDist=(s1,s2)=>SQ*Math.abs(Math.log(s2/s1));
function circle(a,b){const A=uv(a),B=uv(b);if(Math.abs(B[0]-A[0])<1e-10)return null;const center=(B[0]*B[0]+B[1]*B[1]-A[0]*A[0]-A[1]*A[1])/(2*(B[0]-A[0]));return {center,radius:Math.hypot(A[0]-center,A[1])}}
function distSpeed(p,velocity){return Math.hypot(velocity[0],SQ*velocity[1])/p[1]}
function finiteDifference(fn,t,h=1e-5){const left=fn(clamp(t-h,0,1)),right=fn(clamp(t+h,0,1));return left.map((x,i)=>(right[i]-x)/(clamp(t+h,0,1)-clamp(t-h,0,1)))}
function drawBegin(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.lineCap='round';c.lineJoin='round';return c}
function line(c,x,y,X,Y,color=C.grid,width=1,dash=[]){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.restore()}
function text(c,s,x,y,color=C.ink,size=13,align='left'){c.font=size+'px system-ui,Segoe UI,sans-serif';c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y)}
function marker(c,x,y,color=C.purple,r=7){c.beginPath();c.arc(x,y,r+2,0,TAU);c.fillStyle='#fff';c.fill();c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill()}
function curve(c,fn,projection,color,width=3,dashed=[],N=260){c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dashed);let started=false;for(let i=0;i<=N;i++){const value=fn(i/N),[x,y]=projection(value);if(!Number.isFinite(x)||!Number.isFinite(y)){started=false;continue}if(!started){c.moveTo(x,y);started=true}else c.lineTo(x,y)}c.stroke();c.restore()}
function drawDensities(canvas,s){const c=drawBegin(canvas),xL=-9,xR=9,yT=.9,L=68,R=canvas.width-28,T=57,B=canvas.height-60;
const X=x=>L+(x-xL)/(xR-xL)*(R-L),Y=y=>B-y/yT*(B-T);
for(let i=0;i<=6;i++){const x=-9+3*i;line(c,X(x),T,X(x),B);text(c,String(x),X(x),B+21,C.muted,12,'center')}
for(let i=0;i<=4;i++){const y=i*yT/4;line(c,L,Y(y),R,Y(y));text(c,fmt(y,2),L-9,Y(y)+4,C.muted,11,'right')}
line(c,L,T,L,B,C.axis,1.5);line(c,L,B,R,B,C.axis,1.5);
text(c,'Three Gaussian densities: endpoints and current state',L,29,C.ink,18);text(c,'observed value x',R,B+43,C.muted,12,'right');text(c,'density',12,45,C.muted,12);
function drawOne(p,color,dashes,width){curve(c,t=>{let x=xL+(xR-xL)*t;return[x,gaussian(x,p)]},q=>[X(q[0]),Y(q[1])],color,width,dashes,300)}
drawOne(s.P,C.teal,[],3);drawOne(s.R,C.orange,[],3);drawOne(current(s),C.purple,[7,5],3.4);
for(const [p,color,name] of [[s.P,C.teal,'P'],[s.R,C.orange,'R'],[current(s),C.purple,'current']]){const xp=X(p[0]);line(c,xp,Y(0),xp,Y(gaussian(p[0],p)),color,1.3,[4,5]);marker(c,xp,Y(gaussian(p[0],p)),color,5);text(c,name,xp+8,Y(gaussian(p[0],p))-10,color,12)}
}
const PLOT={L:80,R:836,TOP:60,B:645,uMin:-4.2,uMax:4.2,vMin:0,vMax:6.5};
const X=u=>PLOT.L+(u-PLOT.uMin)/(PLOT.uMax-PLOT.uMin)*(PLOT.R-PLOT.L);
const Y=v=>PLOT.B-v/(PLOT.vMax)*(PLOT.B-PLOT.TOP);
function chartPlane(canvas,s){const c=drawBegin(canvas),p=PLOT;
for(let j=-4;j<=4;j++){line(c,X(j),p.TOP,X(j),p.B);text(c,String(j),X(j),p.B+20,C.muted,12,'center')}
for(let j=0;j<=6;j++){line(c,p.L,Y(j),p.R,Y(j));text(c,String(j),p.L-11,Y(j)+4,C.muted,12,'right')}
line(c,p.L,p.TOP,p.L,p.B,C.axis,1.7);line(c,p.L,p.B,p.R,p.B,C.axis,2.2);
text(c,'Gaussian Fisher geometry: hyperbolic upper half-plane',p.L,29,C.ink,19);
text(c,'u = μ / √2',p.R,p.B+43,C.muted,13,'right');text(c,'v = σ',18,43,C.muted,13);
// Show equal-radius metric circles schematically via local ellipses at different heights.
for(const [u,v] of [[-3.5,1],[-3.5,2.3],[-3.5,3.7]]){c.beginPath();c.arc(X(u),Y(v),v*21,0,TAU);c.strokeStyle='#c1dce1';c.lineWidth=1.2;c.setLineDash([5,5]);c.stroke();c.setLineDash([])}
curve(c,t=>straight(s.P,s.R,t),v=>[X(v[0]/SQ),Y(v[1])],C.orange,2.5,[7,5],300);
curve(c,t=>geodesic(s.P,s.R,t),v=>[X(v[0]/SQ),Y(v[1])],C.purple,4,[],350);
const circ=circle(s.P,s.R);
if(circ){const c1=X(circ.center);if(Number.isFinite(c1)&&c1>p.L-450&&c1<p.R+450)text(c,'geodesic: Euclidean semicircle (center on v=0)',p.L+8,p.TOP+27,C.purple,12)}
else{text(c,'geodesic: vertical line',p.L+8,p.TOP+27,C.purple,12)}
for(const [v,color,name] of [[s.P,C.teal,'P'],[s.R,C.orange,'R'],[current(s),C.purple,'current']]){const x=X(v[0]/SQ),y=Y(v[1]);marker(c,x,y,color,name==='current'?8:7);text(c,name,x+11,y-10,color,13)}
text(c,'Click or drag an endpoint to change the Gaussian distribution.',p.L,p.B+57,C.muted,12);
}
function current(s){return s.path==='geo'?geodesic(s.P,s.R,s.t):straight(s.P,s.R,s.t)}
function drawProgress(canvas,s){
const c=drawBegin(canvas),L=70,R=canvas.width-26,T=59,B=canvas.height-57,N=220;
const dist=fisherDist(s.P,s.R),total=s.path==='geo'?dist:straightLen(s.P,s.R);
const max=Math.max(1,dist*1.45,straightLen(s.P,s.R)*1.2),X=t=>L+(R-L)*t,Y=v=>B-v/max*(B-T);
for(let j=0;j<=4;j++){const v=max*j/4;line(c,L,Y(v),R,Y(v));line(c,X(j/4),T,X(j/4),B);text(c,fmt(v,2),L-8,Y(v)+4,C.muted,11,'right');text(c,fmt(j/4,2),X(j/4),B+18,C.muted,11,'center')}
line(c,L,T,L,B,C.axis,1.5);line(c,L,B,R,B,C.axis,1.5);text(c,'Fisher distance traveled from P',L,29,C.ink,18);text(c,'interpolation t',R,B+39,C.muted,12,'right');
line(c,L,Y(dist),R,Y(dist),C.purple,1.4,[5,5]);text(c,'endpoint geodesic distance',R-7,Y(dist)-9,C.purple,12,'right');
const partial=t=>{
 if(s.path==='geo')return dist*t;
 const dmu=s.R[0]-s.P[0],ds=s.R[1]-s.P[1],e=Math.hypot(dmu,SQ*ds);
 return Math.abs(ds)<1e-10?e*t/s.P[1]:e*Math.log((s.P[1]+t*ds)/s.P[1])/ds;
};
curve(c,t=>[t,partial(t)],v=>[X(v[0]),Y(v[1])],s.path==='geo'?C.purple:C.orange,3,[],N);
marker(c,X(s.t),Y(partial(s.t)),C.teal,6);
text(c,'Fisher length of selected path: '+fmt(total,5),L+10,T+19,C.muted,12);
}
window.mountInfoDemo=function(week,host){if(week!==10)return;
host.innerHTML=[
'<div class="panel"><h2>Gaussian Fisher geometry explorer</h2><p>Each point (μ,σ) represents an entire normal distribution. Compare its bell curve with another Gaussian, then explore the upper-half-plane geometry. In the geometric plot, the horizontal coordinate is <strong>u=μ/√2</strong> and the vertical coordinate is <strong>v=σ</strong>, making hyperbolic semicircles visible.</p>',
'<div class="toolbar"><label for="w10-path">Interpolation</label><select id="w10-path"><option value="geo">Hyperbolic Fisher geodesic</option><option value="straight">Straight mean–standard-deviation path</option></select><button class="primary" id="w10-play">Play</button><button id="w10-reset">Restart</button><button id="w10-swap">Swap P and R</button><label for="w10-speed">Speed</label><select id="w10-speed"><option value="1">1×</option><option value="3" selected>3×</option><option value="6">6×</option></select></div><div class="toolbar" style="margin-top:13px"><label for="w10-time">Interpolation t = <strong id="w10-tv">0.00</strong></label><input type="range" id="w10-time" min="0" max="1" step=".005" value="0" style="flex:1;min-width:200px"></div></div>',
'<div class="panel"><h3>Choose two normal distributions</h3><div class="w10-endpoints"><div><strong>P (teal)</strong><label for="w10-m1">Mean μ₁ = <strong id="w10-m1v">−2.00</strong></label><input id="w10-m1" type="range" min="-5.5" max="5.5" step=".05" value="-2"><label for="w10-s1">Standard deviation σ₁ = <strong id="w10-s1v">1.00</strong></label><input id="w10-s1" type="range" min=".3" max="4.5" step=".05" value="1"></div><div><strong>R (orange)</strong><label for="w10-m2">Mean μ₂ = <strong id="w10-m2v">2.00</strong></label><input id="w10-m2" type="range" min="-5.5" max="5.5" step=".05" value="2"><label for="w10-s2">Standard deviation σ₂ = <strong id="w10-s2v">1.00</strong></label><input id="w10-s2" type="range" min=".3" max="4.5" step=".05" value="1"></div></div>',
'<div class="toolbar" style="margin-top:13px"><label for="w10-select">Drag endpoint</label><select id="w10-select"><option value="P">P (teal)</option><option value="R">R (orange)</option></select><button id="w10-horizontal">Different means, same σ</button><button id="w10-vertical">Same mean, different σ</button><button id="w10-close">Nearby pair</button><button id="w10-default">Restore example</button></div></div>',
'<div class="panel"><h3>Fisher geometry measurements</h3><div class="w10-metrics"><div><span>Fisher–Rao distance</span><strong id="w10-distance"></strong></div><div><span>Straight path Fisher length</span><strong id="w10-length"></strong></div><div><span>KL divergence D(P || R)</span><strong id="w10-klforward"></strong></div><div><span>KL divergence D(R || P)</span><strong id="w10-klreverse"></strong></div></div><p id="w10-readout" class="small" aria-live="polite"></p><p class="small muted" id="w10-note">The Gaussian Fisher metric is twice the Poincaré upper-half-plane metric: ds²=2(du²+dv²)/v². Its Gaussian curvature is −1/2.</p></div>',
'<div class="w10-grid"><div class="panel"><canvas id="w10-hplane" width="930" height="730" role="img" aria-label="Draggable Gaussian parameter upper half-plane showing hyperbolic geodesic and straight parameter interpolation" style="width:100%;height:auto;touch-action:none"></canvas></div><div class="panel"><canvas id="w10-density" width="930" height="380" role="img" aria-label="Gaussian probability densities of both endpoints and current interpolated distribution" style="width:100%;height:auto"></canvas><canvas id="w10-progress" width="930" height="340" role="img" aria-label="Accumulated Fisher length along currently selected path compared with geodesic distance" style="width:100%;height:auto"></canvas></div></div>',
'<style>.w10-endpoints{display:grid;grid-template-columns:1fr 1fr;gap:14px}.w10-endpoints>div{padding:13px;background:var(--soft);border-radius:11px;min-width:0}.w10-endpoints label{display:block;margin-top:10px}.w10-endpoints input{width:100%}.w10-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:13px 0}.w10-metrics>div{padding:10px;background:var(--soft);border-radius:10px;min-width:0}.w10-metrics span{display:block;font-size:.78rem;color:var(--muted)}.w10-metrics strong{font-size:1.17rem;font-variant-numeric:tabular-nums}.w10-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.w10-grid .panel{padding:11px;min-width:0}.w10-grid canvas+canvas{margin-top:14px}@media(max-width:960px){.w10-grid{grid-template-columns:1fr}}@media(max-width:680px){.w10-endpoints{grid-template-columns:1fr}.w10-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>'
].join('');
const el=id=>document.getElementById('w10-'+id);
const s={P:[-2,1],R:[2,1],path:'geo',t:0,select:'P',playing:false,speed:3,last:0};
function pause(){s.playing=false;el('play').textContent='Play'}
function update(){el('path').value=s.path;el('time').value=String(s.t);el('tv').textContent=fmt(s.t,2);
for(const [a,p] of [['1',s.P],['2',s.R]]){el('m'+a).value=String(p[0]);el('s'+a).value=String(p[1]);el('m'+a+'v').textContent=fmt(p[0],2);el('s'+a+'v').textContent=fmt(p[1],2)}
const dist=fisherDist(s.P,s.R),straightLength=straightLen(s.P,s.R),p=current(s),vel=finiteDifference(t=>s.path==='geo'?geodesic(s.P,s.R,t):straight(s.P,s.R,t),s.t);
el('distance').textContent=fmt(dist,6);el('length').textContent=fmt(straightLength,6);el('klforward').textContent=fmt(gaussianKL(s.P,s.R),6);el('klreverse').textContent=fmt(gaussianKL(s.R,s.P),6);
const special=Math.abs(s.P[0]-s.R[0])<1e-9?' The endpoints have the same mean, so their geodesic is vertical.':' The geodesic is a semicircle meeting the boundary v=0 orthogonally.';
el('readout').textContent='Current Gaussian N('+fmt(p[0],3)+', '+fmt(p[1],3)+'²). Fisher speed '+fmt(distSpeed(p,vel),5)+'. '+(s.path==='geo'?'The selected geodesic has constant Fisher speed equal to its total distance.':'The straight parameter path generally has a nonconstant Fisher speed.')+special;
chartPlane(el('hplane'),s);drawDensities(el('density'),s);drawProgress(el('progress'),s)}
function setPair(a,b){s.P=a.slice();s.R=b.slice();s.t=0;pause();update()}
for(const [index,prefix] of [[0,'1'],[1,'2']])for(const [i,k] of [[0,'m'],[1,'s']])el(k+prefix).addEventListener('input',()=>{s[index===0?'P':'R'][i]=Number(el(k+prefix).value);s.t=0;pause();update()});
el('path').addEventListener('change',()=>{s.path=el('path').value;pause();update()});
el('time').addEventListener('input',()=>{s.t=Number(el('time').value);pause();update()});
el('reset').addEventListener('click',()=>{s.t=0;pause();update()});
el('swap').addEventListener('click',()=>setPair(s.R,s.P));
el('speed').addEventListener('change',()=>{s.speed=Number(el('speed').value)});
el('play').addEventListener('click',()=>{s.playing=!s.playing;el('play').textContent=s.playing?'Pause':'Play';if(s.playing&&s.t>=1)s.t=0;s.last=performance.now()});
el('select').addEventListener('change',()=>{s.select=el('select').value});
el('horizontal').addEventListener('click',()=>setPair([-2,1],[2,1]));
el('vertical').addEventListener('click',()=>setPair([0,1],[0,2]));
el('close').addEventListener('click',()=>setPair([.2,1.2],[.6,1.4]));
el('default').addEventListener('click',()=>setPair([-2,1],[2,1]));
let dragging=false;
function drag(e){const c=el('hplane'),b=c.getBoundingClientRect(),x=(e.clientX-b.left)*c.width/b.width,y=(e.clientY-b.top)*c.height/b.height;
const u=PLOT.uMin+(x-PLOT.L)/(PLOT.R-PLOT.L)*(PLOT.uMax-PLOT.uMin),v=(PLOT.B-y)/(PLOT.B-PLOT.TOP)*PLOT.vMax;s[s.select]=[clamp(u*SQ,-5.5,5.5),clamp(v,.3,4.5)];s.t=0;pause();update()}
el('hplane').addEventListener('pointerdown',e=>{dragging=true;if(el('hplane').setPointerCapture)el('hplane').setPointerCapture(e.pointerId);drag(e)});
el('hplane').addEventListener('pointermove',e=>{if(dragging)drag(e)});
el('hplane').addEventListener('pointerup',()=>{dragging=false});el('hplane').addEventListener('pointercancel',()=>{dragging=false});
function animate(now){if(!host.isConnected)return;if(s.playing){s.t=Math.min(1,s.t+clamp((now-s.last)/1000,0,.07)*s.speed/7);if(s.t>=1)pause();update()}s.last=now;requestAnimationFrame(animate)}
update();requestAnimationFrame(animate);
};
})();
