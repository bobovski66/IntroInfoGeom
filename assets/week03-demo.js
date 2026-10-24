(function(){
'use strict';
const MAX_T=60, H=.025, STEPS=Math.round(MAX_T/H);
const COLORS={A:'#0e8295',B:'#cf7b43',C:'#258767',orbit:'#8059a7',ink:'#334f5d',muted:'#607988',grid:'#dce8ed',axis:'#829aa5',light:'#eaf5f6',grey:'#b3c3cb'};
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x)),sum=v=>v.reduce((a,b)=>a+b,0);
const fmt=(v,n=3)=>Math.abs(v)<Math.pow(10,-n)/2?(0).toFixed(n):Number(v).toFixed(n);
const clamp01=x=>clamp(x,0,1);
const dot=(a,b)=>a.reduce((acc,z,i)=>acc+z*b[i],0);
function fitness(p,s){return [p[1]-s*p[2],p[2]-s*p[0],p[0]-s*p[1]]}
function f(p,s){const fit=fitness(p,s),bar=dot(p,fit);return p.map((x,i)=>x*(fit[i]-bar))}
function meanFitness(p,s){return dot(p,fitness(p,s))}
function product(p){return p[0]*p[1]*p[2]}
function qPair(p){return p[0]*p[1]+p[1]*p[2]+p[2]*p[0]}
function logProductRate(p,s){if(p.some(v=>v<=0))return null;return (1-s)*(1-3*qPair(p))}
function step(p,s,dt=H){const a=f(p,s),b=f(p.map((x,i)=>x+dt*a[i]/2),s),c=f(p.map((x,i)=>x+dt*b[i]/2),s),d=f(p.map((x,i)=>x+dt*c[i]),s);const raw=p.map((x,i)=>Math.max(0,x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6)),tot=sum(raw);return raw.map(x=>x/tot)}
function integrate(p,s){const path=[p.slice()];let x=p.slice();for(let k=0;k<STEPS;k++){x=step(x,s);path.push(x)}return path}
function atTime(path,t){const z=clamp(t/H,0,path.length-1),i=Math.floor(z),a=z-i,p=path[i],q=path[Math.min(i+1,path.length-1)];return p.map((v,j)=>v+(q[j]-v)*a)}
function centerType(s){return Math.abs(s-1)<1e-9?'Neutral center · closed interior orbits':s<1?'Stable spiral · coexistence':'Unstable spiral · outward cycling'}
function simplexCoordinates(){return{A:[470,48],B:[215,490],C:[725,490]}}
function cartesianCoordinates(){return{A:[684,489],B:[254,59],C:[254,489]}}
function triangleCoords(view){return view==='barycentric'?simplexCoordinates():cartesianCoordinates()}
function point(p,view='barycentric'){const v=triangleCoords(view);return[p[0]*v.A[0]+p[1]*v.B[0]+p[2]*v.C[0],p[0]*v.A[1]+p[1]*v.B[1]+p[2]*v.C[1]]}
function toBarycentric(x,y,view){let p;if(view==='barycentric'){const A=triangleCoords(view).A,B=triangleCoords(view).B,C=triangleCoords(view).C;const pA=clamp01((B[1]-y)/(B[1]-A[1]));const rest=1-pA;const pC=clamp((x-A[0]*pA-B[0]*rest)/(C[0]-B[0]),0,rest);p=[pA,rest-pC,pC]}else{const xA=clamp01((x-254)/(684-254)),xB=clamp01((489-y)/(489-59)),alpha=Math.min(xA,1),beta=Math.min(xB,1-alpha);p=[alpha,beta,1-alpha-beta]}return p.map(x=>x<1e-10?0:x)}
function begin(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.lineJoin='round';c.lineCap='round';return c}
function pathLine(c,a,b,color=COLORS.grid,width=1,dash=[]){c.save();c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.moveTo(...a);c.lineTo(...b);c.stroke();c.restore()}
function write(c,t,x,y,color=COLORS.ink,size=14,align='left'){c.fillStyle=color;c.textAlign=align;c.font=size+'px system-ui,Segoe UI,sans-serif';c.fillText(t,x,y)}
function dotCircle(c,x,y,color=COLORS.orbit,r=7){c.beginPath();c.arc(x,y,r+2,0,2*Math.PI);c.fillStyle='#fff';c.fill();c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill()}
function drawArrow(c,from,delta,color=COLORS.muted,len=17){let norm=Math.hypot(delta[0],delta[1]);if(norm<1e-9)return;const dx=delta[0]/norm,dy=delta[1]/norm;let tail=[from[0]-dx*len*.48,from[1]-dy*len*.48],head=[from[0]+dx*len*.48,from[1]+dy*len*.48];pathLine(c,tail,head,color,1.3);pathLine(c,head,[head[0]-dx*6+dy*4,head[1]-dy*6-dx*4],color,1.3);pathLine(c,head,[head[0]-dx*6-dy*4,head[1]-dy*6+dx*4],color,1.3)}
function drawTriangle(c,view){const {A,B,C}=triangleCoords(view);c.fillStyle=COLORS.light;c.beginPath();c.moveTo(...A);c.lineTo(...B);c.lineTo(...C);c.closePath();c.fill();c.strokeStyle=COLORS.A;c.lineWidth=2.5;c.stroke();
 const title=view==='barycentric'?'Barycentric simplex · each point is a composition':'Cartesian phase plane · x = pA, y = pB';
 write(c,title,26,27,COLORS.ink,19);
 if(view==='barycentric'){write(c,'A = (1, 0, 0)',A[0],A[1]-13,COLORS.A,17,'center');write(c,'B = (0, 1, 0)',B[0]-10,B[1]+27,COLORS.B,16,'center');write(c,'C = (0, 0, 1)',C[0]+13,C[1]+27,COLORS.C,16,'center')}
 else{write(c,'B: (0, 1)',B[0]-6,B[1]-14,COLORS.B,16,'center');write(c,'C: (0, 0)',C[0]-4,C[1]+26,COLORS.C,16,'center');write(c,'A: (1, 0)',A[0]+12,A[1]+26,COLORS.A,16,'center');write(c,'pA',A[0]-10,A[1]+51,COLORS.muted,13,'right');write(c,'pB',B[0]-30,B[1]+7,COLORS.muted,13)}
}
function grid(c,view){for(let k=1;k<=4;k++){const n=k/5;for(let j=0;j<3;j++){const a=[0,0,0],b=[0,0,0];a[j]=n;b[j]=n;a[(j+1)%3]=1-n;b[(j+2)%3]=1-n;pathLine(c,point(a,view),point(b,view),'#c6dfe3',.95)}}}
function plotPath(c,pts,view,col,width=2,dash=[],limit=pts.length-1,stride=3){c.save();c.beginPath();c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=width;const max=Math.min(limit,pts.length-1);for(let k=0;k<=max;k+=stride){const xy=point(pts[k],view);if(k===0)c.moveTo(...xy);else c.lineTo(...xy)}if(max%stride!==0)c.lineTo(...point(pts[max],view));c.stroke();c.restore()}
function vectorField(c,s,view){for(let ia=1;ia<=9;ia++)for(let ib=1;ib<=9-ia;ib++){const p=[ia/10,ib/10,1-(ia+ib)/10],v=f(p,s),loc=point(p,view),d=point(p.map((x,k)=>x+v[k]),view);drawArrow(c,loc,[d[0]-loc[0],d[1]-loc[1]],'#8baeb8',15)}}
function trajectoryCanvas(canvas,state){const c=begin(canvas),view=state.view;drawTriangle(c,view);if(state.showGrid)grid(c,view);
 if(state.showField)vectorField(c,state.s,view);
 const center=[1/3,1/3,1/3],ce=point(center,view);dotCircle(c,...ce,'#7957a2',4);write(c,'equal proportions',ce[0]+12,ce[1]-11,'#7957a2',13);
 if(state.compare)for(const curve of (state.comparisonPaths||[]))plotPath(c,curve,view,'#b6c6ce',1.1,[],STEPS,8);
 plotPath(c,state.path,view,'#bdced5',1.7,[],STEPS,4);
 const index=Math.min(STEPS,Math.max(0,Math.floor(state.time/H)));plotPath(c,state.path,view,COLORS.orbit,3.2,[],index,2);
 const p=atTime(state.path,state.time),loc=point(p,view);dotCircle(c,...loc,COLORS.orbit,8);
 const vel=f(p,state.s),end=point(p.map((z,k)=>z+vel[k]*.75),view);if(Math.hypot(end[0]-loc[0],end[1]-loc[1])>.12)drawArrow(c,[loc[0]+(end[0]-loc[0])*.6,loc[1]+(end[1]-loc[1])*.6],[end[0]-loc[0],end[1]-loc[1]],COLORS.orbit,23);
 const start=point(state.initial,view);dotCircle(c,...start,COLORS.A,4);
 write(c,'Green = initial state  ·  Purple = current state',22,canvas.height-11,COLORS.muted,12);
}
function chartCoords(canvas){return{l:80,r:canvas.width-30,top:46,bottom:canvas.height-51}}
function chartFrame(c,box){const x=box,y=x.bottom;pathLine(c,[x.l,x.top],[x.l,y],COLORS.axis,1.5);pathLine(c,[x.l,y],[x.r,y],COLORS.axis,1.5);
 for(let k=0;k<=5;k++){const t=k*MAX_T/5,p= k/5;const X=x.l+p*(x.r-x.l);pathLine(c,[X,x.top],[X,y],COLORS.grid,.8);write(c,String(t),X,y+18,COLORS.muted,11,'center')}
 write(c,'time t',x.r,y+39,COLORS.muted,12,'right')}
function seriesPath(c,state,getter,box,topValue,col,width=2.4,fill=false){const X=t=>box.l+t/MAX_T*(box.r-box.l),Y=v=>box.bottom-clamp(v/topValue,0,1)*(box.bottom-box.top);
 c.save();c.beginPath();for(let i=0;i<state.path.length;i+=3){const v=getter(state.path[i]),xy=[X(i*H),Y(v)];if(i===0)c.moveTo(...xy);else c.lineTo(...xy)}c.strokeStyle=col;c.lineWidth=width;c.stroke();c.restore();return{X,Y}}
function seriesCanvas(canvas,s){const c=begin(canvas),box=chartCoords(canvas);
 chartFrame(c,box);for(let k=0;k<=4;k++){const val=k/4,y=box.bottom-val*(box.bottom-box.top);pathLine(c,[box.l,y],[box.r,y],COLORS.grid,.8);write(c,val.toFixed(2),box.l-9,y+4,COLORS.muted,12,'right')}
 write(c,'Population composition over time',box.l,27,COLORS.ink,18);
 [['A',0,COLORS.A],['B',1,COLORS.B],['C',2,COLORS.C]].forEach(([name,j,col],i)=>{const p=seriesPath(c,s,q=>q[j],box,1,col);write(c,'p'+name,box.r-135+i*48,27,col,14);const cur=atTime(s.path,s.time);dotCircle(c,p.X(s.time),p.Y(cur[j]),col,5)});
 const X=box.l+s.time/MAX_T*(box.r-box.l);pathLine(c,[X,box.top],[X,box.bottom],COLORS.orbit,1.2,[5,5]);
}
function productCanvas(canvas,s){const c=begin(canvas),box=chartCoords(canvas);
 chartFrame(c,box);for(let k=0;k<=4;k++){const val=k/4,y=box.bottom-val*(box.bottom-box.top);pathLine(c,[box.l,y],[box.r,y],COLORS.grid,.9);write(c,val.toFixed(2),box.l-9,y+4,COLORS.muted,12,'right')}
 write(c,'Normalized product 27 × pA pB pC',box.l,27,COLORS.ink,18);write(c,'1 = equal composition',box.r-6,27,COLORS.muted,12,'right');
 const coords=seriesPath(c,s,p=>27*product(p),box,1,COLORS.orbit,2.9);
 const p=atTime(s.path,s.time);dotCircle(c,coords.X(s.time),coords.Y(27*product(p)),COLORS.orbit,6);
 const X=box.l+s.time/MAX_T*(box.r-box.l);pathLine(c,[X,box.top],[X,box.bottom],COLORS.orbit,1.2,[5,5]);
}
window.mountInfoDemo=function(week,host){if(week!==3)return;
host.innerHTML=[
'<div class="panel"><h2>Simplex and cyclic replicator explorer</h2><p>The state is a probability vector <strong>p = (pA, pB, pC)</strong> with components summing to one. Change the relative cost of losing, select an initial state, and watch the flow in the triangle and through time.</p>',
'<div class="toolbar"><label for="w3-preset">Model</label><select id="w3-preset"><option value="balanced">Balanced cycling (s = 1)</option><option value="inward">Inward spiral (s = 0.7)</option><option value="outward">Outward spiral (s = 1.3)</option><option value="custom" disabled>Custom loss magnitude</option></select>',
'<button id="w3-play" class="primary">Play</button><button id="w3-reset">Restart time</button><label for="w3-speed">Speed</label><select id="w3-speed"><option value="1">1×</option><option value="3" selected>3×</option><option value="6">6×</option></select></div>',
'<div class="demo-controls" style="margin-top:18px"><div class="control"><label for="w3-s">Loss magnitude s: <strong id="w3-sv">1.00</strong></label><input id="w3-s" type="range" min=".50" max="1.50" step=".01" value="1"></div>',
'<div class="control"><label for="w3-pA">Initial pA</label><input id="w3-pA" type="number" min="0" max="1" step=".001" value=".55"></div>',
'<div class="control"><label for="w3-pB">Initial pB</label><input id="w3-pB" type="number" min="0" max="1" step=".001" value=".25"></div></div>',
'<p class="small muted" id="w3-pCvalue">Initial pC = 0.200</p>',
'<div class="toolbar"><button id="w3-default">Default interior point</button><button id="w3-center">Equal proportions</button><button id="w3-edge">Exactly on AB edge</button><button id="w3-near">Just inside AB edge</button></div>',
'<div class="toolbar" style="margin-top:12px"><label for="w3-time">Time t = <strong id="w3-tv">0.00</strong></label><input type="range" id="w3-time" min="0" max="60" step=".025" value="0" style="flex:1;min-width:170px"></div>',
'<div class="toolbar" style="margin-top:13px"><label for="w3-view">Coordinate view</label><select id="w3-view"><option value="barycentric">Barycentric triangle</option><option value="cartesian">Planar coordinates (pA, pB)</option></select><label><input id="w3-grid" type="checkbox" checked> Grid</label><label><input id="w3-field" type="checkbox" checked> Direction field</label><label><input id="w3-compare" type="checkbox"> Additional trajectories</label></div>',
'<p class="small muted">Click or drag inside the phase diagram to select a new initial state. The edge buttons let you compare a missing strategy with one present at very low abundance.</p></div>',
'<div class="panel"><h3 id="w3-classification">Neutral center · closed interior orbits</h3><p id="w3-interp"></p><div class="w3-sharebar"><div id="w3-shareA"></div><div id="w3-shareB"></div><div id="w3-shareC"></div></div>',
'<p class="small" id="w3-state" aria-live="polite"></p><p class="small" id="w3-rates"></p><p class="small" id="w3-product"></p></div>',
'<div class="panel" style="padding:12px"><canvas id="w3-triangle" width="940" height="540" role="img" aria-label="Interactive probability simplex with cyclic replicator trajectories and direction field" style="width:100%;height:auto;touch-action:none"></canvas><p class="small muted">The purple point is the current population; the small teal point marks its initial composition. The pale trajectory shows its future evolution, while the purple segment shows the path traveled so far.</p></div>',
'<div class="panel" style="padding:12px"><canvas id="w3-series" width="940" height="305" role="img" aria-label="Time series for the three strategy proportions" style="width:100%;height:auto"></canvas><p class="small muted">A, B, and C share a common vertical scale, so increases in one proportion must be balanced by decreases in the others.</p></div>',
'<div class="panel" style="padding:12px"><canvas id="w3-productGraph" width="940" height="245" role="img" aria-label="Time series of the product of the three population proportions" style="width:100%;height:auto"></canvas><p class="small muted">At s=1, the product is constant. At s&lt;1 it increases toward 1/27; at s&gt;1 it decreases toward zero.</p></div>',
'<style>.w3-sharebar{display:flex;overflow:hidden;border-radius:10px;width:100%;height:36px}.w3-sharebar div{display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;white-space:nowrap}.w3-sharebar #w3-shareA{background:#0e8295}.w3-sharebar #w3-shareB{background:#cf7b43}.w3-sharebar #w3-shareC{background:#258767}.demo-controls input[type=number]{background:var(--panel);color:var(--ink);padding:6px 8px;border:1px solid var(--line);border-radius:8px;max-width:100%}@media(max-width:640px){#w3-triangle{min-height:235px}}</style>'
].join('');
const el=id=>document.getElementById('w3-'+id);
const s={s:1,initial:[.55,.25,.2],time:0,view:'barycentric',showGrid:true,showField:true,compare:false,running:false,speed:3,path:[],comparisonPaths:null,comparisonS:null,frameTime:0};
function pause(){s.running=false;el('play').textContent='Play'}
function recompute(){s.path=integrate(s.initial,s.s);if(s.compare&&s.comparisonS!==s.s){s.comparisonPaths=[[.63,.22,.15],[.2,.6,.2],[.18,.2,.62]].map(p=>integrate(p,s.s));s.comparisonS=s.s}}
function update(){const p=atTime(s.path,s.time),fit=fitness(p,s.s),v=f(p,s.s),bar=meanFitness(p,s.s),P=product(p),rate=logProductRate(p,s.s);
 el('sv').textContent=s.s.toFixed(2);el('tv').textContent=s.time.toFixed(2);el('time').value=String(s.time);el('pA').value=fmt(s.initial[0]);el('pB').value=fmt(s.initial[1]);el('pCvalue').textContent='Initial pC = '+fmt(s.initial[2]);
 el('classification').textContent=centerType(s.s);
 el('interp').textContent=s.s<1-1e-8?'The equal-composition state attracts interior trajectories. Product P grows, showing motion inward.':s.s>1+1e-8?'The center repels nearby interior trajectories. Product P decreases as cycles move toward the boundary.':'The balanced cyclic model has conserved product P. Noncentral interior solutions trace closed orbits.';
 for(let j=0;j<3;j++){const node=el('share'+['A','B','C'][j]);node.style.width=(p[j]*100)+'%';node.textContent=p[j]>.13?['A','B','C'][j]+': '+(p[j]*100).toFixed(1)+'%':''}
 el('state').textContent='t = '+s.time.toFixed(2)+'   ·   p = ('+p.map(z=>fmt(z)).join(', ')+')   ·   total = '+fmt(sum(p));
 el('rates').textContent='Fitness = ('+fit.map(z=>fmt(z)).join(', ')+')   ·   mean fitness = '+fmt(bar)+'   ·   p′ = ('+v.map(z=>fmt(z)).join(', ')+')';
 el('product').textContent='P = pA·pB·pC = '+fmt(P,6)+'   ·   27P = '+fmt(27*P,4)+'   ·   d(ln P)/dt = '+(rate===null?'undefined on the boundary':fmt(rate,6));
 trajectoryCanvas(el('triangle'),s);seriesCanvas(el('series'),s);productCanvas(el('productGraph'),s)}
function changed(){pause();recompute();update()}
function selectInitial(p){const norm=sum(p);s.initial=p.map(x=>Math.max(0,x/norm));s.time=0;changed()}
el('preset').addEventListener('change',()=>{const modes={balanced:1,inward:.7,outward:1.3};if(!Object.prototype.hasOwnProperty.call(modes,el('preset').value))return;s.s=modes[el('preset').value];s.time=0;el('s').value=String(s.s);changed()});
el('s').addEventListener('input',()=>{s.s=Number(el('s').value);el('preset').value='custom';s.time=0;changed()});
for(const key of ['pA','pB'])el(key).addEventListener('change',()=>{const i=key==='pA'?0:1,j=1-i;const val=Number(el(key).value);if(!Number.isFinite(val)){update();return}const p=s.initial.slice();p[i]=clamp01(val);p[j]=Math.min(p[j],1-p[i]);p[2]=Math.max(0,1-p[0]-p[1]);selectInitial(p)});
el('default').addEventListener('click',()=>selectInitial([.55,.25,.2]));
el('center').addEventListener('click',()=>selectInitial([1/3,1/3,1/3]));
el('edge').addEventListener('click',()=>selectInitial([.6,.4,0]));
el('near').addEventListener('click',()=>selectInitial([.6,.399,.001]));
el('time').addEventListener('input',()=>{pause();s.time=Number(el('time').value);update()});
el('reset').addEventListener('click',()=>{pause();s.time=0;update()});
el('play').addEventListener('click',()=>{s.running=!s.running;el('play').textContent=s.running?'Pause':'Play';if(s.running&&s.time>=MAX_T)s.time=0;s.frameTime=performance.now()});
el('speed').addEventListener('change',()=>{s.speed=Number(el('speed').value)});
el('view').addEventListener('change',()=>{s.view=el('view').value;update()});
el('grid').addEventListener('change',()=>{s.showGrid=el('grid').checked;update()});
el('field').addEventListener('change',()=>{s.showField=el('field').checked;update()});
el('compare').addEventListener('change',()=>{s.compare=el('compare').checked;if(s.compare&&s.comparisonS!==s.s){s.comparisonPaths=[[.63,.22,.15],[.2,.6,.2],[.18,.2,.62]].map(p=>integrate(p,s.s));s.comparisonS=s.s}update()});
let dragging=false;
function pick(event){const canvas=el('triangle'),rect=canvas.getBoundingClientRect();const x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height;selectInitial(toBarycentric(x,y,s.view))}
el('triangle').addEventListener('pointerdown',ev=>{dragging=true;if(el('triangle').setPointerCapture)el('triangle').setPointerCapture(ev.pointerId);pick(ev)});
el('triangle').addEventListener('pointermove',ev=>{if(dragging)pick(ev)});
el('triangle').addEventListener('pointerup',()=>{dragging=false});
el('triangle').addEventListener('pointercancel',()=>{dragging=false});
el('series').addEventListener('click',event=>{const canvas=el('series'),rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.width/rect.width;s.time=Math.round(clamp((x-80)/(canvas.width-110),0,1)*MAX_T/H)*H;pause();update()});
function animate(now){if(!host.isConnected)return;if(s.running){s.time=Math.min(MAX_T,s.time+clamp((now-s.frameTime)/1000,0,.08)*s.speed);if(s.time>=MAX_T)pause();update()}s.frameTime=now;requestAnimationFrame(animate)}
recompute();update();requestAnimationFrame(animate);
};
})();
