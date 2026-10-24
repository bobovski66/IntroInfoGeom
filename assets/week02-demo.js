(function(){
'use strict';
const T=12,dt=.025;
const C={ink:'#344d5d',muted:'#617c8a',grid:'#e4ecef',axis:'#688394',A:'#0e8295',B:'#d47846',state:'#8b4ca3',stable:'#278565',unstable:'#c86944'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=x=>Math.abs(x)<.0005?'0.000':x.toFixed(3);
function fA(x,s){return s.a*x+s.b*(1-x)}
function fB(x,s){return s.c*x+s.d*(1-x)}
function diff(x,s){return fA(x,s)-fB(x,s)}
function F(x,s){return x*(1-x)*diff(x,s)}
function deriv(x,s){return (1-2*x)*diff(x,s)+x*(1-x)*(s.a-s.b-s.c+s.d)}
function equilibria(s){const root=[0,1];let den=s.a-s.b-s.c+s.d;
 if(Math.abs(den)>1e-9){let p=(s.d-s.b)/den;if(p>1e-7&&p<1-1e-7)root.push(p)}
 return root.sort((x,y)=>x-y).map(x=>{const rate=deriv(x,s);return {x,type:rate< -1e-7?'stable':rate>1e-7?'unstable':'nonhyperbolic'}})
}
function classify(s){let l=s.b-s.d,r=s.a-s.c;
 if(Math.abs(l)<1e-8&&Math.abs(r)<1e-8)return ['Neutral selection','All compositions are equilibrium states because the two fitnesses are identical at every frequency.'];
 if(l>1e-8&&r< -1e-8)return ['Stable coexistence','Both types can increase when rare. The interior equilibrium attracts all other interior initial conditions.'];
 if(l< -1e-8&&r>1e-8)return ['Bistability / coordination','The interior equilibrium is an unstable threshold. Initial conditions on opposite sides approach different pure states.'];
 if(l>=-1e-8&&r>=-1e-8)return [Math.abs(l)<1e-8||Math.abs(r)<1e-8?'A dominates (boundary collision)':'A dominates','Type A has a nonnegative advantage throughout the interval, and a strictly positive advantage in the interior.'];
 if(l<=1e-8&&r<=1e-8)return [Math.abs(l)<1e-8||Math.abs(r)<1e-8?'B dominates (boundary collision)':'B dominates','Type B has a nonnegative advantage throughout the interval, and a strictly positive advantage in the interior.'];
 return ['Parameter boundary','Inspect the sign of the fitness difference on either side of each equilibrium.']
}
function trace(x0,s){let x=x0,a=[x];for(let k=0;k<T/dt;k++){const k1=F(x,s),k2=F(x+dt*k1/2,s),k3=F(x+dt*k2/2,s),k4=F(x+dt*k3,s);x=clamp(x+dt*(k1+2*k2+2*k3+k4)/6,0,1);a.push(x)}return a}
function xAt(a,t){let k=clamp(t/dt,0,a.length-1),i=Math.floor(k);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(k-i)}
function prepare(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.textAlign='left';c.font='13px system-ui';c.lineJoin='round';c.lineCap='round';return c}
function stroke(c,x0,y0,x1,y1,col=C.grid,width=1,dash=[]){c.save();c.beginPath();c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=width;c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore()}
function label(c,t,x,y,col=C.ink,size=13,align='left'){c.font=size+'px system-ui';c.fillStyle=col;c.textAlign=align;c.fillText(t,x,y)}
function circle(c,x,y,col=C.state,r=6){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r+2,0,Math.PI*2);c.fill();c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function arrow(c,x,y,d){stroke(c,x-13*d,y,x+13*d,y,C.A,2.5);stroke(c,x+13*d,y,x+6*d,y-5,C.A,2.5);stroke(c,x+13*d,y,x+6*d,y+5,C.A,2.5)}
function phase(canvas,s){const c=prepare(canvas),L=65,R=canvas.width-65,Y=77,X=x=>L+(R-L)*x,current=xAt(s.path,s.t);
 label(c,'Phase line: arrows show movement in x',L,27,C.ink,18);stroke(c,L,Y,R,Y,C.axis,2.5);
 for(let j=0;j<14;j++){let x=(j+.5)/14,v=F(x,s);if(Math.abs(v)>1e-7)arrow(c,X(x),Y,v>0?1:-1)}
 if(classify(s)[0]==='Neutral selection'){label(c,'Every x is an equilibrium',X(.5),Y-27,C.stable,14,'center')}
 else for(let z of equilibria(s)){let px=X(z.x),col=z.type==='stable'?C.stable:z.type==='unstable'?C.unstable:C.state;c.fillStyle=z.type==='stable'?col:'#fff';c.strokeStyle=col;c.lineWidth=2.7;c.beginPath();c.arc(px,Y,7,0,Math.PI*2);c.fill();c.stroke();label(c,z.x===0?'0':z.x===1?'1':fmt(z.x),px,Y+30,C.ink,13,'center');label(c,z.type,px,Y+48,col,11,'center')}
 circle(c,X(current),Y-21,C.state,7);stroke(c,X(current),Y-15,X(current),Y-6,C.state,1.8);label(c,'current x(t)',X(current),Y-40,C.state,12,'center')}
function graphFrame(canvas){return {l:60,r:canvas.width-20,top:48,bottom:canvas.height-48}}
function drawPayoff(canvas,s){const c=prepare(canvas),b=graphFrame(canvas),vals=[s.a,s.b,s.c,s.d],lo=Math.min(...vals),hi=Math.max(...vals),pad=Math.max(.4,(hi-lo)*.15);let min=lo-pad,max=hi+pad;
 const X=x=>b.l+(b.r-b.l)*x,Y=v=>b.bottom-(v-min)/(max-min)*(b.bottom-b.top),current=xAt(s.path,s.t);
 for(let j=0;j<=4;j++){let x=j/4,v=min+(max-min)*j/4;stroke(c,X(x),b.top,X(x),b.bottom);label(c,x.toFixed(2),X(x),b.bottom+18,C.muted,11,'center');stroke(c,b.l,Y(v),b.r,Y(v));label(c,fmt(v),b.l-7,Y(v)+4,C.muted,11,'right')}
 stroke(c,b.l,b.top,b.l,b.bottom,C.axis,1.5);stroke(c,b.l,b.bottom,b.r,b.bottom,C.axis,1.5);
 function L(fn,color,dashed){c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=3;c.setLineDash(dashed?[8,5]:[]);c.moveTo(X(0),Y(fn(0,s)));c.lineTo(X(1),Y(fn(1,s)));c.stroke();c.restore()}
 L(fA,C.A,false);L(fB,C.B,Math.abs(s.a-s.c)<1e-8&&Math.abs(s.b-s.d)<1e-8);
 stroke(c,X(current),b.top,X(current),b.bottom,C.state,1.4,[4,4]);circle(c,X(current),Y(fA(current,s)),C.A,6);circle(c,X(current),Y(fB(current,s)),C.B,6);
 label(c,'Expected fitness vs composition',b.l,26,C.ink,17);label(c,'x',b.r,b.bottom+38,C.muted,12,'right');
 label(c,'A',b.r-24,Math.max(b.top+13,Math.min(b.bottom-12,Y(fA(1,s))-9)),C.A,13);
 label(c,'B',b.r-11,Math.max(b.top+13,Math.min(b.bottom-12,Y(fB(1,s))+19)),C.B,13);
}
function drawField(canvas,s){const c=prepare(canvas),b=graphFrame(canvas),current=xAt(s.path,s.t),rate=F(current,s);
 let m=.045;for(let j=0;j<=250;j++)m=Math.max(m,Math.abs(F(j/250,s)));m*=1.3;
 const X=x=>b.l+(b.r-b.l)*x,Y=v=>b.bottom-(v+m)/(2*m)*(b.bottom-b.top);
 for(let j=0;j<=4;j++){let x=j/4,v=(j-2)*m/2;stroke(c,b.l,Y(v),b.r,Y(v));stroke(c,X(x),b.top,X(x),b.bottom);label(c,x.toFixed(2),X(x),b.bottom+17,C.muted,11,'center');label(c,fmt(v),b.l-7,Y(v)+4,C.muted,11,'right')}
 stroke(c,b.l,Y(0),b.r,Y(0),C.axis,1.8);stroke(c,b.l,b.top,b.l,b.bottom,C.axis,1.5);
 c.beginPath();for(let j=0;j<=250;j++){const x=j/250;if(!j)c.moveTo(X(x),Y(F(x,s)));else c.lineTo(X(x),Y(F(x,s)))}c.strokeStyle=C.A;c.lineWidth=3;c.stroke();
 stroke(c,X(current),Y(0),X(current),Y(rate),C.state,1.6,[4,4]);circle(c,X(current),Y(rate),C.state,7);
 label(c,'Vector field: x′ = F(x)',b.l,26,C.ink,17);label(c,'composition x',b.r,b.bottom+38,C.muted,12,'right')}
function drawSolution(canvas,s){const c=prepare(canvas),b=graphFrame(canvas),X=t=>b.l+t/T*(b.r-b.l),Y=x=>b.bottom-x*(b.bottom-b.top);
 for(let j=0;j<=4;j++){let x=j/4,t=j*T/4;stroke(c,b.l,Y(x),b.r,Y(x));stroke(c,X(t),b.top,X(t),b.bottom);label(c,x.toFixed(2),b.l-7,Y(x)+4,C.muted,11,'right');label(c,String(t),X(t),b.bottom+17,C.muted,11,'center')}
 stroke(c,b.l,b.top,b.l,b.bottom,C.axis,1.5);stroke(c,b.l,b.bottom,b.r,b.bottom,C.axis,1.5);
 if(classify(s)[0]!=='Neutral selection')for(const eq of equilibria(s)){if(eq.x>0&&eq.x<1){stroke(c,b.l,Y(eq.x),b.r,Y(eq.x),C.state,1.3,[5,5]);label(c,'x*='+fmt(eq.x),b.r-8,Y(eq.x)-8,C.state,12,'right')}}
 const draw=(points,color,width,dash=[])=>{c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);for(let j=0;j<points.length;j+=2){if(!j)c.moveTo(X(0),Y(points[0]));else c.lineTo(X(j*dt),Y(points[j]))}c.stroke();c.restore()};
 if(s.compare)for(const init of [.1,.5,.9])if(Math.abs(init-s.x0)>.001)draw(trace(init,s),'#a6b9c4',1.5,[5,5]);
 draw(s.path,C.A,3.3);
 const current=xAt(s.path,s.t),r=F(current,s);stroke(c,X(s.t),b.bottom,X(s.t),Y(current),C.state,1.5,[4,4]);circle(c,X(s.t),Y(current),C.state,7);
 if(s.t>.3&&s.t<T-.3)stroke(c,X(s.t-.3),Y(current-r*.3),X(s.t+.3),Y(current+r*.3),C.B,2.7);
 label(c,'Solution curve: x(t)',b.l,26,C.ink,17);label(c,'time t',b.r,b.bottom+38,C.muted,12,'right')}
window.mountInfoDemo=function(week,host){if(week!==2)return;
host.innerHTML=[
'<div class="panel"><h2>From four payoffs to the phase portrait</h2><p>Edit the matrix, then follow a population composition through time. All the diagrams describe the same model: <strong>x′ = x(1−x)[fA(x) − fB(x)]</strong>.</p><div class="toolbar"><label for="w2-preset">Choose a model</label><select id="w2-preset"><option value="coexist">Stable coexistence</option><option value="coordination">Coordination (bistability)</option><option value="Adom">A dominates</option><option value="Bdom">B dominates</option><option value="neutral">Identical fitness</option><option value="custom" disabled>Custom matrix</option></select><button id="w2-play" class="primary">Play</button><button id="w2-restart">Restart time</button></div></div>',
'<div class="panel"><h3>The payoff matrix</h3><p class="small muted">The row strategy receives the payoff; the column is the opponent. For example, b is the payoff to A when it meets B.</p><table class="w2-payoff"><thead><tr><th>Receiving</th><th>Opponent A</th><th>Opponent B</th></tr></thead><tbody><tr><th>Type A</th><td><label for="w2-a">a</label><input type="number" id="w2-a" value="2" step=".1"></td><td><label for="w2-b">b</label><input type="number" id="w2-b" value="4" step=".1"></td></tr><tr><th>Type B</th><td><label for="w2-c">c</label><input type="number" id="w2-c" value="3" step=".1"></td><td><label for="w2-d">d</label><input type="number" id="w2-d" value="1" step=".1"></td></tr></tbody></table>',
'<div class="demo-controls"><div class="control"><label for="w2-a-sweep">Vary a: <strong id="w2-av">2.0</strong></label><input type="range" id="w2-a-sweep" min="-4" max="9" step=".1" value="2"></div><div class="control"><label for="w2-x0">Initial x(0): <strong id="w2-x0v">0.20</strong></label><input type="range" id="w2-x0" min="0" max="1" step=".01" value=".2"></div><div class="control"><label for="w2-time">Time t: <strong id="w2-tv">0.00</strong></label><input type="range" id="w2-time" min="0" max="12" step=".025" value="0"></div></div>',
'<div class="toolbar" style="margin-top:15px"><button id="w2-shift">Add 1 to all payoffs</button><button id="w2-scale">Multiply all payoffs by 2</button><label><input type="checkbox" id="w2-compare"> Compare initial states</label></div><p class="small muted">To explore the bifurcation, choose Stable coexistence and move a across 3 while b=4, c=3, d=1.</p></div>',
'<div class="panel"><div class="w2-status"><h3 id="w2-behavior">Stable coexistence</h3><p id="w2-details"></p><p id="w2-metrics" aria-live="polite"></p><div class="w2-shares"><div id="w2-shareA"></div><div id="w2-shareB"></div></div></div></div>',
'<div class="w2-chart-grid"><div class="panel"><canvas id="w2-payoffs" width="560" height="310" role="img" aria-label="Expected fitness lines for the two strategies" style="width:100%;height:auto"></canvas><p class="small muted">The intersection of the fitness lines marks equal fitness.</p></div><div class="panel"><canvas id="w2-field" width="560" height="310" role="img" aria-label="Vector field against population composition" style="width:100%;height:auto"></canvas><p class="small muted">The sign of x′ determines the arrows on the phase line.</p></div></div>',
'<div class="panel"><canvas id="w2-phase" width="900" height="142" role="img" aria-label="Phase line showing equilibria and motion" style="width:100%;height:auto"></canvas><p class="small muted">Click a point on the interval to choose the initial proportion.</p></div>',
'<div class="panel"><canvas id="w2-solution" width="900" height="345" role="img" aria-label="Solution x against time with highlighted current state and tangent" style="width:100%;height:auto"></canvas><p class="small muted">Click the solution graph to scrub time. The tangent slope here equals the height of the vector-field graph at the same state.</p></div>',
'<style>.w2-payoff{border-collapse:collapse;width:100%;max-width:560px;margin:10px 0 22px}.w2-payoff th,.w2-payoff td{text-align:center;border:1px solid var(--line);padding:8px}.w2-payoff th{background:var(--soft)}.w2-payoff label{margin-right:8px}.w2-payoff input{width:95px;max-width:80%;padding:5px 7px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--ink)}.w2-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.w2-chart-grid .panel{min-width:0;padding:12px}.w2-shares{display:flex;border-radius:10px;overflow:hidden;height:36px}.w2-shares div{display:flex;align-items:center;justify-content:center;white-space:nowrap;font-weight:700;color:white;font-size:13px}.w2-shares #w2-shareA{background:#0e8295}.w2-shares #w2-shareB{background:#d47846}@media(max-width:870px){.w2-chart-grid{grid-template-columns:1fr}}@media(max-width:500px){.w2-payoff input{width:64px}}</style>'
].join('');
const el=id=>document.getElementById('w2-'+id);
const presets={coexist:[2,4,3,1,.2],coordination:[4,1,2,3,.35],Adom:[4,3,2,1,.3],Bdom:[1,0,3,2,.7],neutral:[2,2,2,2,.35]};
const s={a:2,b:4,c:3,d:1,x0:.2,t:0,compare:false,playing:false,path:[],last:0};
function pause(){s.playing=false;el('play').textContent='Play'}
function recount(){s.path=trace(s.x0,s)}
function update(){const x=xAt(s.path,s.t),u=diff(x,s),r=F(x,s),classification=classify(s),l=s.b-s.d,k=s.a-s.c;
 el('behavior').textContent=classification[0];el('details').textContent=classification[1];
 el('metrics').textContent='At t='+s.t.toFixed(2)+': x='+fmt(x)+', fA='+fmt(fA(x,s))+', fB='+fmt(fB(x,s))+', Δ=fA−fB='+fmt(u)+', x′='+fmt(r)+'. At boundaries Δ(0)='+fmt(l)+' and Δ(1)='+fmt(k)+'.';
 const A=el('shareA'),B=el('shareB');A.style.width=(x*100)+'%';B.style.width=((1-x)*100)+'%';A.textContent=x>.16?'A: '+(100*x).toFixed(1)+'%':'';B.textContent=(1-x)>.16?'B: '+(100*(1-x)).toFixed(1)+'%':'';
 el('av').textContent=s.a.toFixed(1);el('x0v').textContent=s.x0.toFixed(2);el('tv').textContent=s.t.toFixed(2);el('time').value=String(s.t);
 drawPayoff(el('payoffs'),s);drawField(el('field'),s);phase(el('phase'),s);drawSolution(el('solution'),s)}
function redraw(){pause();recount();update()}
function inputVals(){for(const id of ['a','b','c','d'])el(id).value=String(s[id]);el('x0').value=String(s.x0);el('a-sweep').min=String(Math.min(-4,s.a-1));el('a-sweep').max=String(Math.max(9,s.a+1));el('a-sweep').value=String(s.a)}
el('preset').addEventListener('change',()=>{const data=presets[el('preset').value];if(!data)return;[s.a,s.b,s.c,s.d,s.x0]=data;s.t=0;inputVals();redraw()});
for(const key of ['a','b','c','d'])el(key).addEventListener('change',()=>{const n=Number(el(key).value);if(!Number.isFinite(n))return;s[key]=clamp(n,-100,100);el('preset').value='custom';inputVals();redraw()});
el('a-sweep').addEventListener('input',()=>{s.a=Number(el('a-sweep').value);el('a').value=String(s.a);el('preset').value='custom';redraw()});
el('x0').addEventListener('input',()=>{s.x0=Number(el('x0').value);s.t=0;redraw()});
el('time').addEventListener('input',()=>{s.t=Number(el('time').value);pause();update()});
el('compare').addEventListener('change',()=>{s.compare=el('compare').checked;update()});
el('restart').addEventListener('click',()=>{s.t=0;pause();update()});
el('shift').addEventListener('click',()=>{for(const k of ['a','b','c','d'])s[k]+=1;el('preset').value='custom';inputVals();redraw()});
el('scale').addEventListener('click',()=>{for(const k of ['a','b','c','d'])s[k]*=2;el('preset').value='custom';inputVals();redraw()});
el('play').addEventListener('click',()=>{s.playing=!s.playing;el('play').textContent=s.playing?'Pause':'Play';if(s.playing&&s.t>=T)s.t=0;s.last=performance.now()});
el('phase').addEventListener('click',event=>{const canvas=el('phase'),bounds=canvas.getBoundingClientRect(),px=(event.clientX-bounds.left)*canvas.width/bounds.width;s.x0=Math.round(clamp((px-65)/(canvas.width-130),0,1)*100)/100;s.t=0;el('x0').value=String(s.x0);redraw()});
el('solution').addEventListener('click',event=>{const canvas=el('solution'),bounds=canvas.getBoundingClientRect(),px=(event.clientX-bounds.left)*canvas.width/bounds.width;s.t=Math.round(clamp((px-60)/(canvas.width-80),0,1)*T/dt)*dt;pause();update()});
function frame(ms){if(!host.isConnected)return;if(s.playing){s.t=Math.min(T,s.t+clamp((ms-s.last)/1000,0,.08)*1.5);if(s.t>=T)pause();update()}s.last=ms;requestAnimationFrame(frame)}
inputVals();recount();update();requestAnimationFrame(frame);
};
})();
