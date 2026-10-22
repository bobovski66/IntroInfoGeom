(function(){
'use strict';
const C={A:'#0e8295',B:'#d17a43',C:'#328b6c',purple:'#865baa',ink:'#365160',muted:'#5f7888',grid:'#dfe9ed',axis:'#77909e',bg:'#fff',dim:'#b6c9d2'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sum=a=>a.reduce((x,y)=>x+y,0);
const fmt=(x,n=3)=>(Math.abs(x)<.5*10**(-n)?0:x).toFixed(n);
const values=(mode)=>mode==='bernoulli'?[0,1]:[0,1,3];
const names=(mode)=>mode==='bernoulli'?['0','1']:['A','B','C'];
const mean=(p,z)=>p.reduce((s,q,i)=>s+q*z[i],0);
const variance=(p,z)=>Math.max(0,p.reduce((s,q,i)=>s+q*z[i]**2,0)-mean(p,z)**2);
const interp=(P,Q,t)=>P.map((x,i)=>(1-t)*x+t*Q[i]);
const simplexVertices=()=>[[430,46],[130,472],[730,472]];
const triXY=p=>{const v=simplexVertices();return [p.reduce((x,w,i)=>x+w*v[i][0],0),p.reduce((y,w,i)=>y+w*v[i][1],0)]};
function pickSimplex(x,y){const v=simplexVertices(),a=clamp((v[1][1]-y)/(v[1][1]-v[0][1]),0,1),rest=1-a,c=clamp((x-v[0][0]*a-v[1][0]*rest)/(v[2][0]-v[1][0]),0,rest);return [a,rest-c,c]}
function clean(v){const p=v.map(x=>Math.max(0,x)),total=sum(p);return total>0?p.map(x=>x/total):[1,0,0]}
function startCanvas(canvas){const c=canvas.getContext('2d');c.fillStyle=C.bg;c.fillRect(0,0,canvas.width,canvas.height);c.lineJoin='round';c.lineCap='round';return c}
function line(c,x1,y1,x2,y2,col=C.grid,width=1,dash=[]){c.save();c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.restore()}
function txt(c,s,x,y,col=C.ink,size=14,align='left'){c.font=size+'px system-ui,Segoe UI,sans-serif';c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y)}
function circle(c,x,y,color=C.purple,r=7){c.beginPath();c.arc(x,y,r+2,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill()}
function drawSimplex(canvas,state){const c=startCanvas(canvas),v=simplexVertices();
txt(c,'Probability simplex',35,25,C.ink,19);c.beginPath();c.moveTo(...v[0]);c.lineTo(...v[1]);c.lineTo(...v[2]);c.closePath();c.fillStyle='#eaf5f6';c.fill();c.strokeStyle=C.A;c.lineWidth=2.5;c.stroke();
for(let j=1;j<5;j++){const t=j/5;for(let i=0;i<3;i++){let p=[0,0,0],q=[0,0,0];p[i]=t;q[i]=t;p[(i+1)%3]=1-t;q[(i+2)%3]=1-t;let a=triXY(p),b=triXY(q);line(c,...a,...b,'#c6dfe4',.95)}}
txt(c,'A',v[0][0],v[0][1]-17,C.A,18,'center');txt(c,'B',v[1][0]-12,v[1][1]+25,C.B,18,'center');txt(c,'C',v[2][0]+12,v[2][1]+25,C.C,18,'center');
const p=state.p,xy=triXY(p);
if(state.pathMode){const start=triXY(state.P0),end=triXY(state.P1);line(c,...start,...end,C.purple,3.5);circle(c,...start,C.A,6);circle(c,...end,C.B,6);txt(c,'P₀',start[0]-12,start[1]-15,C.A,14);txt(c,'P₁',end[0]+10,end[1]+18,C.B,14)}
circle(c,...xy,C.purple,9);txt(c,'current p',xy[0]+13,xy[1]-14,C.purple,14);
if(state.n){let empirical=state.counts.map(x=>x/state.n);let spot=triXY(empirical);line(c,...xy,...spot,C.B,1.5,[5,5]);circle(c,...spot,C.B,6);txt(c,'sample',spot[0]+9,spot[1]+19,C.B,13)}
txt(c,'Click or drag to change a categorical state',35,canvas.height-12,C.muted,13);
}
function drawBernoulli(canvas,state){const c=startCanvas(canvas),p=state.p[1],box={L:75,R:724,T:62,B:316},X=x=>box.L+x*(box.R-box.L),Y=v=>box.B-v/.25*(box.B-box.T);
txt(c,'Bernoulli family and its variance',box.L,29,C.ink,19);
for(let j=0;j<=4;j++){const x=j/4;line(c,X(x),box.T,X(x),box.B,C.grid);line(c,box.L,Y(.25*x),box.R,Y(.25*x),C.grid);txt(c,x.toFixed(2),X(x),box.B+20,C.muted,12,'center');txt(c,(.25*x).toFixed(3),box.L-10,Y(.25*x)+4,C.muted,11,'right')}
line(c,box.L,box.T,box.L,box.B,C.axis,1.5);line(c,box.L,box.B,box.R,box.B,C.axis,1.5);
c.beginPath();for(let j=0;j<=250;j++){const x=j/250;if(j===0)c.moveTo(X(x),Y(x*(1-x)));else c.lineTo(X(x),Y(x*(1-x)))}c.strokeStyle=C.A;c.lineWidth=3;c.stroke();
line(c,X(p),box.B,X(p),Y(p*(1-p)),C.purple,1.6,[6,5]);circle(c,X(p),Y(p*(1-p)),C.purple,8);
txt(c,'Variance p(1−p)',box.L,49,C.A,15);txt(c,'Bernoulli parameter p',box.R,box.B+41,C.muted,13,'right');
if(state.n){const obs=state.counts[1]/state.n;circle(c,X(obs),Y(obs*(1-obs)),C.B,5);txt(c,'orange = sample frequency',box.L,canvas.height-23,C.B,13)}
}
function drawBars(canvas,state){const c=startCanvas(canvas),p=state.p,z=values(state.mode),labels=names(state.mode),n=p.length,w=canvas.width,h=canvas.height;
const modelX=80,sampleX=Math.floor(w/2)+35,totalW=(w/2)-120;
txt(c,'Exact model probabilities',modelX,28,C.ink,18);txt(c,'Observed sample frequencies',sampleX,28,C.ink,18);
const origin=255,top=55,scale=195;
for(const base of [modelX,sampleX]){for(let j=0;j<=4;j++){const v=j/4,y=origin-scale*v;line(c,base-5,y,base+totalW+10,y,C.grid,.8);txt(c,v.toFixed(2),base-11,y+4,C.muted,11,'right')}line(c,base-5,origin,base+totalW+10,origin,C.axis,1.5)}
const colors=[C.A,C.B,C.C],width=Math.min(78,(totalW-20)/n*.63),space=totalW/n;
for(let i=0;i<n;i++){let x=modelX+(i+.5)*space-width/2,m=p[i],freq=state.n?state.counts[i]/state.n:0;
c.fillStyle=colors[i];c.fillRect(x,origin-m*scale,width,m*scale);
txt(c,fmt(m),x+width/2,origin-m*scale-10,colors[i],13,'center');
txt(c,state.mode==='bernoulli'?labels[i]:labels[i]+' ('+z[i]+')',x+width/2,origin+21,C.ink,13,'center');
x=sampleX+(i+.5)*space-width/2;
if(state.n){c.fillStyle=colors[i];c.globalAlpha=.75;c.fillRect(x,origin-freq*scale,width,freq*scale);c.globalAlpha=1;txt(c,fmt(freq),x+width/2,origin-freq*scale-10,colors[i],13,'center')}
else{c.strokeStyle=C.dim;c.lineWidth=1.8;c.strokeRect(x,origin-3,width,3)}
txt(c,labels[i],x+width/2,origin+21,C.ink,13,'center');
}
txt(c,'State probabilities',modelX,canvas.height-12,C.muted,13);txt(c,state.n?'n = '+state.n+' observations':'No observations yet',sampleX,canvas.height-12,C.muted,13);
}
window.mountInfoDemo=function(week,host){if(week!==4)return;
host.innerHTML=[
'<div class="panel"><h2>A distribution is a state; a sample is an observation</h2><p>Choose an exact probability law, then draw random outcomes from it. You can also move a probability state along the simplex and study the change in its mean and variance.</p>',
'<div class="toolbar"><label for="w4-mode">Model</label><select id="w4-mode"><option value="categorical">Three-category distribution</option><option value="bernoulli">Bernoulli (0 or 1)</option></select>',
'<button id="w4-reset">Reset samples</button><span id="w4-note" class="small muted">Changing the distribution resets the sample counts.</span></div></div>',
'<div class="panel"><h3>Set the probability distribution</h3><div id="w4-cat-controls"><div class="demo-controls"><div class="control"><label for="w4-a">pA <strong id="w4-av">0.500</strong></label><input type="range" id="w4-a" min="0" max="1" step=".005" value=".5"></div>',
'<div class="control"><label for="w4-b">pB <strong id="w4-bv">0.333</strong></label><input type="range" id="w4-b" min="0" max="1" step=".005" value=".333"></div>',
'<div class="control"><label>pC = 1 − pA − pB</label><strong id="w4-cv">0.167</strong></div></div>',
'<div class="toolbar" style="margin-top:14px"><button id="w4-example">Textbook example (1/2, 1/3, 1/6)</button><button id="w4-uniform">Equal probabilities</button><button id="w4-path">Interpolate P₀ to P₁</button><button id="w4-leavepath">Exit interpolation</button></div>',
'<div id="w4-path-controls" hidden><label for="w4-interpolation">Interpolation parameter t: <strong id="w4-tv">0.00</strong></label><input type="range" id="w4-interpolation" min="0" max="1" step=".005" value="0" style="width:100%"><div class="toolbar"><button id="w4-play">Animate path</button><button id="w4-start">Restart path</button></div><p class="small muted">P₀=(0.6,0.3,0.1), P₁=(0.2,0.3,0.5); the velocity is constant: P′=(-0.4,0,0.4). This is a chosen curve, not a replicator trajectory.</p></div></div>',
'<div id="w4-bern-controls" hidden><label for="w4-p">Probability of outcome 1, p = <strong id="w4-pv">0.50</strong></label><input id="w4-p" type="range" min="0" max="1" step=".005" value=".5" style="width:100%"><p class="small muted">The distribution is P(X=0)=1−p and P(X=1)=p.</p></div></div>',
'<div class="panel"><h3>State and statistics</h3><p id="w4-distribution"></p><div class="w4-stats"><div><span>Exact mean</span><strong id="w4-mean"></strong></div><div><span>Exact variance</span><strong id="w4-variance"></strong></div><div><span>Empirical mean</span><strong id="w4-empirical">—</strong></div><div><span>Sample size</span><strong id="w4-n">0</strong></div></div><p id="w4-deriv" class="small muted"></p></div>',
'<div class="w4-plot-grid"><div class="panel"><canvas id="w4-stateCanvas" width="850" height="520" role="img" aria-label="Interactive categorical simplex or Bernoulli variance graph" style="width:100%;height:auto;touch-action:none"></canvas><p class="small muted" id="w4-state-caption">Drag on the triangle to change the model distribution; orange shows the empirical state after sampling.</p></div></div>',
'<div class="panel"><h3>Draw samples from the current distribution</h3><p>The model bars are exact; the sample bars show random observed frequencies. Each draw produces a realized category. Repeating an experiment gives different results.</p><div class="toolbar"><button id="w4-one" class="primary">Draw 1</button><button id="w4-ten">Draw 10</button><button id="w4-hundred">Draw 100</button><button id="w4-thousand">Draw 1,000</button><button id="w4-reset2">Clear sample</button></div><canvas id="w4-bars" width="900" height="325" role="img" aria-label="Side by side bars of theoretical probabilities and observed sample frequencies" style="width:100%;height:auto;margin-top:15px"></canvas><p class="small" id="w4-samples" aria-live="polite"></p></div>',
'<style>.w4-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.w4-stats div{background:var(--soft);border-radius:10px;padding:10px;min-width:0}.w4-stats span{display:block;font-size:.8rem;color:var(--muted)}.w4-stats strong{font-variant-numeric:tabular-nums;font-size:1.25rem}.w4-plot-grid{display:grid;grid-template-columns:minmax(0,1fr)}.w4-plot-grid .panel{min-width:0;padding:13px}@media(max-width:670px){.w4-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>'
].join('');
const el=id=>host.querySelector('#w4-'+id);
const P0=[.6,.3,.1],P1=[.2,.3,.5];
const st={mode:'categorical',p:[.5,1/3,1/6],P0,P1,pathMode:false,t:0,playing:false,n:0,counts:[0,0,0],recent:[],last:0};
function resetSamples(){st.n=0;st.counts=Array(st.p.length).fill(0);st.recent=[]}
function pause(){st.playing=false;el('play').textContent='Animate path'}
function update(){
const p=st.p,z=values(st.mode),mu=mean(p,z),v=variance(p,z);
el('cat-controls').hidden=st.mode!=='categorical';el('bern-controls').hidden=st.mode!=='bernoulli';el('path-controls').hidden=!st.pathMode;
el('a').disabled=st.pathMode;el('b').disabled=st.pathMode;el('a').value=String(p[0]);el('b').value=String(p[1]);
el('av').textContent=fmt(p[0]);el('bv').textContent=fmt(p[1]);el('cv').textContent=fmt(p[2]??0);
el('p').value=String(p[1]||0);el('pv').textContent=fmt(p[1]||0);el('tv').textContent=st.t.toFixed(2);el('interpolation').value=String(st.t);
el('distribution').textContent='Probability vector: ('+p.map(x=>fmt(x)).join(', ')+')   ·   sum = '+fmt(sum(p))+'   ·   numerical outcomes = ('+z.join(', ')+')';
el('mean').textContent=fmt(mu,4);el('variance').textContent=fmt(v,4);
el('empirical').textContent=st.n?fmt(mean(st.counts.map(x=>x/st.n),z),4):'—';el('n').textContent=st.n.toLocaleString('en-US');
el('deriv').textContent=st.pathMode?'P′(t) = (-0.4, 0, 0.4), and dE[Z]/dt = 1.2. The variance changes nonlinearly along this segment.':'In categorical mode, Z takes values 0, 1, 3; in Bernoulli mode, X takes values 0, 1.';
el('state-caption').textContent=st.mode==='bernoulli'?'The purple point shows variance p(1−p); move p with its slider.':st.pathMode?'The purple state traces the straight line segment from P₀ to P₁.': 'Drag inside the triangle to choose a probability distribution.';
if(st.mode==='bernoulli')drawBernoulli(el('stateCanvas'),st);else drawSimplex(el('stateCanvas'),st);
drawBars(el('bars'),st);
el('samples').textContent=st.n?'Observed counts: '+st.counts.map((x,i)=>names(st.mode)[i]+'='+x).join(' · ')+'. Last draws (newest first): '+st.recent.slice(0,12).map(i=>names(st.mode)[i]).join(', ')+'.':'No observations yet. The right bars will fill as you sample.';
}
function changed(){pause();resetSamples();update()}
function setCat(p){st.mode='categorical';el('mode').value='categorical';st.pathMode=false;st.p=clean(p);st.t=0;changed()}
function setBern(p){st.mode='bernoulli';st.pathMode=false;st.p=[1-p,p];st.t=0;changed()}
function sample(n){pause();for(let j=0;j<n;j++){const r=Math.random();let acc=0,index=st.p.length-1;for(let k=0;k<st.p.length;k++){acc+=st.p[k];if(r<acc){index=k;break}}st.counts[index]++;st.n++;st.recent.unshift(index);if(st.recent.length>12)st.recent.pop()}update()}
el('mode').addEventListener('change',()=>{el('mode').value==='bernoulli'?setBern(.5):setCat([.5,1/3,1/6])});
el('p').addEventListener('input',()=>{st.p=[1-Number(el('p').value),Number(el('p').value)];changed()});
for(const key of ['a','b'])el(key).addEventListener('input',()=>{if(st.pathMode)return;const index=key==='a'?0:1,other=1-index,v=Number(el(key).value),p=st.p.slice();p[index]=clamp(v,0,1);p[other]=Math.min(p[other],1-p[index]);p[2]=Math.max(0,1-p[0]-p[1]);st.p=p;changed()});
el('example').addEventListener('click',()=>setCat([.5,1/3,1/6]));
el('uniform').addEventListener('click',()=>setCat([1/3,1/3,1/3]));
el('path').addEventListener('click',()=>{st.pathMode=true;st.mode='categorical';el('mode').value='categorical';st.t=0;st.p=P0.slice();changed();st.pathMode=true;update()});
el('leavepath').addEventListener('click',()=>{st.pathMode=false;changed()});
el('interpolation').addEventListener('input',()=>{st.t=Number(el('interpolation').value);st.p=interp(P0,P1,st.t);changed();st.pathMode=true;update()});
el('start').addEventListener('click',()=>{st.t=0;st.p=P0.slice();changed();st.pathMode=true;update()});
el('play').addEventListener('click',()=>{st.playing=!st.playing;el('play').textContent=st.playing?'Pause path':'Animate path';if(st.playing&&st.t>=1){st.t=0;st.p=P0.slice();resetSamples()}st.last=performance.now()});
for(const [id,num] of [['one',1],['ten',10],['hundred',100],['thousand',1000]])el(id).addEventListener('click',()=>sample(num));
for(const id of ['reset','reset2'])el(id).addEventListener('click',()=>{resetSamples();update()});
let dragging=false;
function drag(event){if(st.mode!=='categorical'||st.pathMode)return;const cn=el('stateCanvas'),rect=cn.getBoundingClientRect();const x=(event.clientX-rect.left)*cn.width/rect.width,y=(event.clientY-rect.top)*cn.height/rect.height;st.p=pickSimplex(x,y);changed()}
el('stateCanvas').addEventListener('pointerdown',event=>{if(st.mode==='bernoulli'||st.pathMode)return;dragging=true;if(el('stateCanvas').setPointerCapture)el('stateCanvas').setPointerCapture(event.pointerId);drag(event)});
el('stateCanvas').addEventListener('pointermove',event=>{if(dragging)drag(event)});
el('stateCanvas').addEventListener('pointerup',()=>{dragging=false});
el('stateCanvas').addEventListener('pointercancel',()=>{dragging=false});
function animate(now){if(!host.isConnected)return;if(st.playing){const delta=clamp((now-st.last)/1000,0,.07);st.t=Math.min(1,st.t+delta/7);st.p=interp(P0,P1,st.t);resetSamples();if(st.t>=1)pause();update()}st.last=now;requestAnimationFrame(animate)}
update();requestAnimationFrame(animate);
};
})();