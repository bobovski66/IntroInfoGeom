(function(){
'use strict';
const T=12,dt=.025;
const C={ink:'#334c5b',muted:'#657e8b',grid:'#e4ebef',teal:'#0e8295',orange:'#d47746',purple:'#7857a2',green:'#298466',red:'#b95d40'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fmt=x=>Math.abs(x)<1e-8?'0':x.toFixed(3);
function F(x,a,b){return x*(1-x)*(a-b*x)}
function dF(x,a,b){return(1-2*x)*(a-b*x)-b*x*(1-x)}
function roots(a,b){const z=[0,1];if(Math.abs(b)>1e-8){const q=a/b;if(q>1e-6&&q<1-1e-6)z.push(q)}return z.sort((p,q)=>p-q).map(x=>{const d=dF(x,a,b);return{x,type:d< -1e-8?'stable':d>1e-8?'unstable':'nonhyperbolic'}})}
function solve(x0,a,b){let x=x0;const arr=[x];for(let i=0;i<T/dt;i++){const k1=F(x,a,b),k2=F(x+dt*k1/2,a,b),k3=F(x+dt*k2/2,a,b),k4=F(x+dt*k3,a,b);x=clamp(x+dt*(k1+2*k2+2*k3+k4)/6,0,1);arr.push(x)}return arr}
function value(arr,t){const k=clamp(t/dt,0,arr.length-1),i=Math.floor(k);return arr[i]+(arr[Math.min(arr.length-1,i+1)]-arr[i])*(k-i)}
function canvas(c){const q=c.getContext('2d');q.fillStyle='#fff';q.fillRect(0,0,c.width,c.height);q.font='13px system-ui';q.textAlign='left';return q}
function segment(c,x,y,X,Y,color=C.grid,width=1,dashes=[]){c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dashes);c.moveTo(x,y);c.lineTo(X,Y);c.stroke();c.restore()}
function write(c,s,x,y,col=C.ink,size=13,align='left'){c.fillStyle=col;c.font=size+'px system-ui';c.textAlign=align;c.fillText(s,x,y)}
function dot(c,x,y,color=C.orange,r=6){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r+2,0,2*Math.PI);c.fill();c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill()}
function arrow(c,x,y,dir){segment(c,x-15*dir,y,x+15*dir,y,C.teal,2.8);segment(c,x+15*dir,y,x+7*dir,y-6,C.teal,2.8);segment(c,x+15*dir,y,x+7*dir,y+6,C.teal,2.8)}
function phase(c,s){const q=canvas(c),X=x=>65+x*(c.width-130),y=81,x=value(s.trace,s.t);
 write(q,'Phase line · which way is the state moving?',65,27,C.ink,18);segment(q,X(0),y,X(1),y,C.muted,2.5);
 for(let i=0;i<15;i++){const u=(i+.5)/15,r=F(u,s.a,s.b);if(Math.abs(r)>1e-5)arrow(q,X(u),y,r>0?1:-1)}
 for(const r of roots(s.a,s.b)){const px=X(r.x);q.fillStyle=r.type==='stable'?C.green:'#fff';q.strokeStyle=r.type==='unstable'?C.red:r.type==='stable'?C.green:C.purple;q.lineWidth=2.5;q.beginPath();q.arc(px,y,7,0,Math.PI*2);q.fill();q.stroke();write(q,r.x===0?'0':r.x===1?'1':fmt(r.x),px,110,C.ink,13,'center');write(q,r.type,px,128,r.type==='stable'?C.green:r.type==='unstable'?C.red:C.purple,11,'center')}
 dot(q,X(x),y-23,C.orange,7);segment(q,X(x),y-15,X(x),y-5,C.orange,2);write(q,'current x(t)',X(x),44,C.orange,12,'center')
}
function chartspec(c){return{l:61,r:c.width-24,top:40,bottom:c.height-52}}
function field(c,s){const q=canvas(c),b=chartspec(c),x=value(s.trace,s.t),rate=F(x,s.a,s.b);
 let max=.07;for(let i=0;i<=200;i++)max=Math.max(max,Math.abs(F(i/200,s.a,s.b)));max*=1.18;
 const X=z=>b.l+(b.r-b.l)*z,Y=z=>b.bottom-(z+max)/(2*max)*(b.bottom-b.top);
 for(let j=0;j<=4;j++){const v=(j-2)*max/2,u=j/4;segment(q,b.l,Y(v),b.r,Y(v));write(q,fmt(v),b.l-8,Y(v)+4,C.muted,11,'right');segment(q,X(u),b.top,X(u),b.bottom);write(q,u.toFixed(2),X(u),b.bottom+18,C.muted,11,'center')}
 segment(q,b.l,Y(0),b.r,Y(0),C.muted,2);segment(q,b.l,b.top,b.l,b.bottom,C.muted,1.5);
 q.beginPath();for(let i=0;i<=320;i++){const z=i/320;if(!i)q.moveTo(X(z),Y(F(z,s.a,s.b)));else q.lineTo(X(z),Y(F(z,s.a,s.b)))}q.strokeStyle=C.teal;q.lineWidth=3;q.stroke();
 segment(q,X(x),Y(0),X(x),Y(rate),C.orange,1.8,[5,4]);dot(q,X(x),Y(rate));write(q,"Vector field: x′ = F(x)",b.l,24,C.ink,17);write(q,'state x',b.r,b.bottom+40,C.muted,12,'right');
}
function solution(c,s){const q=canvas(c),b=chartspec(c),X=t=>b.l+t/T*(b.r-b.l),Y=x=>b.bottom-x*(b.bottom-b.top);
 for(let j=0;j<=4;j++){const u=j/4,t=T*u;segment(q,b.l,Y(u),b.r,Y(u));segment(q,X(t),b.top,X(t),b.bottom);write(q,u.toFixed(2),b.l-8,Y(u)+4,C.muted,11,'right');write(q,String(t),X(t),b.bottom+18,C.muted,11,'center')}
 segment(q,b.l,b.top,b.l,b.bottom,C.muted,1.5);segment(q,b.l,b.bottom,b.r,b.bottom,C.muted,1.5);
 for(const r of roots(s.a,s.b)){if(r.x>0&&r.x<1){segment(q,b.l,Y(r.x),b.r,Y(r.x),C.purple,1.5,[5,5]);write(q,'equilibrium '+fmt(r.x),b.r-4,Y(r.x)-7,C.purple,11,'right')}}
 function trace(a,color,width,dash=[]){q.save();q.beginPath();q.strokeStyle=color;q.lineWidth=width;q.setLineDash(dash);for(let i=0;i<a.length;i+=2){const x=X(i*dt),y=Y(a[i]);if(i===0)q.moveTo(x,y);else q.lineTo(x,y)}q.stroke();q.restore()}
 if(s.compare)for(const x0 of [.1,.5,.9])if(Math.abs(x0-s.x0)>.001)trace(solve(x0,s.a,s.b),'#9eb6c5',1.4,[4,4]);
 trace(s.trace,C.teal,3);
 const x=value(s.trace,s.t),f=F(x,s.a,s.b);
 segment(q,X(s.t),b.bottom,X(s.t),Y(x),C.orange,1.7,[4,4]);dot(q,X(s.t),Y(x));
 if(s.t>.35&&s.t<T-.35)segment(q,X(s.t-.35),Y(x-.35*f),X(s.t+.35),Y(x+.35*f),C.orange,2.5);
 write(q,'Solution: x(t)',b.l,24,C.ink,17);write(q,'time t',b.r,b.bottom+40,C.muted,12,'right');
}
window.mountInfoDemo=function(week,host){if(week!==1)return;
host.innerHTML=[
'<div class="panel"><h2>One equation, three synchronized views</h2><p>Change the initial proportion and advance time. The orange marker represents the same state in each visualization. The equation is <strong>x′ = x(1−x)(a − bx)</strong>.</p>',
'<div class="toolbar"><label for="w1-preset">Example:</label><select id="w1-preset"><option value="custom" disabled>Custom parameters</option><option value="coexist">Stable coexistence</option><option value="bistable">Bistability</option><option value="dominantA">A dominates</option><option value="dominantB">B dominates</option></select><button id="w1-play" class="primary">Play</button><button id="w1-reset">Restart time</button></div>',
'<div class="demo-controls"><div class="control"><label for="w1-a">a = <strong id="w1-av">3.00</strong></label><input type="range" id="w1-a" min="-4" max="4" step=".1" value="3"></div>',
'<div class="control"><label for="w1-b">b = <strong id="w1-bv">4.00</strong></label><input type="range" id="w1-b" min="-5" max="6" step=".1" value="4"></div>',
'<div class="control"><label for="w1-x0">Initial x(0) = <strong id="w1-x0v">0.20</strong></label><input type="range" id="w1-x0" min="0" max="1" step=".01" value=".2"></div></div>',
'<div class="toolbar" style="margin-top:16px"><label for="w1-time">Time t = <strong id="w1-tv">0.00</strong></label><input type="range" id="w1-time" min="0" max="12" step=".025" value="0" style="flex:1;min-width:160px"><label><input type="checkbox" id="w1-compare"> Compare other initial states</label></div>',
'<p class="small muted">Click the phase line to choose an initial state; click the solution graph to choose a time.</p></div>',
'<div class="panel"><h3>Composition of the population</h3><div style="height:39px;display:flex;width:100%;border-radius:9px;overflow:hidden"><div id="w1-shareA" style="background:#0e8295;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px"></div><div id="w1-shareB" style="background:#d47746;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px"></div></div><p id="w1-readout" aria-live="polite" class="small"></p></div>',
'<div class="panel" style="padding:13px"><canvas id="w1-phase" width="900" height="143" role="img" aria-label="Phase line with moving state marker" style="width:100%;height:auto"></canvas></div>',
'<div class="w1-chart-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="panel" style="min-width:0;padding:12px"><canvas id="w1-field" width="540" height="325" role="img" aria-label="Graph of instantaneous velocity with moving state marker" style="width:100%;height:auto"></canvas><p class="small muted">Orange height is x′: the instantaneous rate of change at the current state.</p></div>',
'<div class="panel" style="min-width:0;padding:12px"><canvas id="w1-solution" width="540" height="325" role="img" aria-label="Graph of the solution versus time with marked current time and tangent" style="width:100%;height:auto"></canvas><p class="small muted">Orange dot gives x(t); the short orange segment is tangent to the curve, with slope x′.</p></div></div>',
'<div class="panel"><h3>Interpreting your experiment</h3><p id="w1-analysis" aria-live="polite"></p><p class="small muted">Green equilibria attract nearby trajectories, outlined orange equilibria repel, and purple indicates a nonhyperbolic equilibrium whose stability requires a sign chart. Endpoint stability is relative to [0,1].</p></div>',
'<style>@media(max-width:850px){.w1-chart-pair{grid-template-columns:1fr!important}}</style>'
].join('');
const el=id=>host.querySelector('#w1-'+id);
const s={a:3,b:4,x0:.2,t:0,playing:false,compare:false,trace:[],last:0};
const presets={coexist:[3,4,.2],bistable:[-1,-2,.3],dominantA:[2,0,.2],dominantB:[-2,0,.8]};
const play=el('play'),time=el('time');
function pause(){s.playing=false;play.textContent='Play'}
function render(){const x=value(s.trace,s.t),f=F(x,s.a,s.b);el('av').textContent=s.a.toFixed(2);el('bv').textContent=s.b.toFixed(2);el('x0v').textContent=s.x0.toFixed(2);el('tv').textContent=s.t.toFixed(2);time.value=String(s.t);el('shareA').style.width=(100*x)+'%';el('shareB').style.width=(100*(1-x))+'%';el('shareA').textContent=x>.17?'A: '+(100*x).toFixed(1)+'%':'';el('shareB').textContent=(1-x)>.17?'B: '+(100*(1-x)).toFixed(1)+'%':'';
el('readout').textContent='At t = '+s.t.toFixed(2)+': x = '+fmt(x)+', x′ = '+fmt(f)+'. '+(f>1e-5?'A is becoming more common.':f< -1e-5?'B is becoming more common.':'The state is nearly stationary.');
phase(el('phase'),s);field(el('field'),s);solution(el('solution'),s);el('analysis').textContent='Equilibria: '+roots(s.a,s.b).map(r=>fmt(r.x)+' ('+r.type+')').join('; ')+'. Current fitness difference a−bx = '+fmt(s.a-s.b*x)+'. The tangent slope of x(t) is '+fmt(f)+'.'}
function refresh(){pause();s.trace=solve(s.x0,s.a,s.b);render()}
el('preset').addEventListener('change',()=>{[s.a,s.b,s.x0]=presets[el('preset').value];s.t=0;el('a').value=String(s.a);el('b').value=String(s.b);el('x0').value=String(s.x0);refresh()});
for(const key of ['a','b','x0'])el(key).addEventListener('input',()=>{s[key]=Number(el(key).value);if(key==='x0')s.t=0;else el('preset').value='custom';refresh()});
time.addEventListener('input',()=>{pause();s.t=Number(time.value);render()});
el('compare').addEventListener('change',()=>{s.compare=el('compare').checked;render()});
el('reset').addEventListener('click',()=>{pause();s.t=0;render()});
play.addEventListener('click',()=>{s.playing=!s.playing;play.textContent=s.playing?'Pause':'Play';if(s.playing&&s.t>=T)s.t=0;s.last=performance.now()});
el('phase').addEventListener('click',e=>{const box=el('phase').getBoundingClientRect(),px=(e.clientX-box.left)*el('phase').width/box.width;s.x0=Math.round(clamp((px-65)/(el('phase').width-130),0,1)*100)/100;el('x0').value=String(s.x0);s.t=0;refresh()});
el('solution').addEventListener('click',e=>{const box=el('solution').getBoundingClientRect(),px=(e.clientX-box.left)*el('solution').width/box.width;s.t=Math.round(clamp((px-61)/(el('solution').width-85),0,1)*T/dt)*dt;pause();render()});
function loop(ms){if(!host.isConnected)return;if(s.playing){s.t=Math.min(T,s.t+clamp((ms-s.last)/1000,0,.08)*1.5);if(s.t>=T)pause();render()}s.last=ms;requestAnimationFrame(loop)}
s.trace=solve(s.x0,s.a,s.b);render();requestAnimationFrame(loop);
};
})();