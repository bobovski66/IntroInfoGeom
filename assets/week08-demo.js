(function(){
'use strict';
const C={teal:'#0e8295',orange:'#d07943',purple:'#8359a5',green:'#268a70',ink:'#365160',muted:'#627e8a',axis:'#748f9d',grid:'#dce9ed',pale:'#eaf5f6'};
const RADIUS=2,TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),sum=a=>a.reduce((x,y)=>x+y,0),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const fmt=(x,n=4)=>Number.isFinite(x)?(Math.abs(x)<.5*10**(-n)?0:x).toFixed(n):'∞';
const normalize=a=>{const z=a.map(v=>Math.max(0,v)),s=sum(z);return s>0?z.map(v=>v/s):[1,0,0]};
const roots=p=>p.map(v=>2*Math.sqrt(Math.max(0,v)));
const invRoots=q=>q.map(x=>x*x/4);
const bhatt=(p,r)=>sum(p.map((x,i)=>Math.sqrt(Math.max(0,x*r[i]))));
const angle=(p,r)=>Math.acos(clamp(bhatt(p,r),0,1));
const fisherDist=(p,r)=>2*angle(p,r);
const chord=(p,r)=>Math.sqrt(Math.max(0,8*(1-bhatt(p,r))));
const euclidDist=(p,r)=>Math.hypot(...p.map((x,i)=>x-r[i]));
const mixture=(p,r,t)=>p.map((x,i)=>(1-t)*x+t*r[i]);
function geodesic(p,r,t){
const a=angle(p,r);if(a<1e-8)return p.slice();
const aa=Math.sin((1-t)*a)/Math.sin(a),bb=Math.sin(t*a)/Math.sin(a),q=roots(p).map((x,i)=>aa*x+bb*roots(r)[i]);return normalize(invRoots(q));
}
function mixSpeed(p,r,t){const m=mixture(p,r,t);let v=0;for(let i=0;i<m.length;i++){const d=r[i]-p[i];if(m[i]===0){if(Math.abs(d)>1e-14)return Infinity;continue}v+=d*d/m[i]}return Math.sqrt(v)}
// Change variables t=sin²(pi*u/2) to remove integrable endpoint singularities.
function mixLength(p,r,N=700){if(euclidDist(p,r)<1e-13)return 0;const h=1/N;let length=0;for(let j=0;j<N;j++){const u=(j+.5)*h,t=Math.sin(Math.PI*u/2)**2,weight=(Math.PI/2)*Math.sin(Math.PI*u);length+=mixSpeed(p,r,t)*weight*h}return length}
const arcCoord=p=>2*Math.asin(Math.sqrt(clamp(p,0,1)));
const bernDist=(a,b)=>Math.abs(arcCoord(a)-arcCoord(b));
const bernGeodesic=(a,b,t)=>Math.sin(((1-t)*arcCoord(a)+t*arcCoord(b))/2)**2;
const triangle={A:[370,48],B:[84,501],C:[655,501]};
const tri=p=>[p[0]*triangle.A[0]+p[1]*triangle.B[0]+p[2]*triangle.C[0],p[0]*triangle.A[1]+p[1]*triangle.B[1]+p[2]*triangle.C[1]];
function pick(x,y){const a=clamp((triangle.B[1]-y)/(triangle.B[1]-triangle.A[1]),0,1),rem=1-a,c=clamp((x-triangle.A[0]*a-triangle.B[0]*rem)/(triangle.C[0]-triangle.B[0]),0,rem);return[a,rem-c,c]}
function projection(state){const yaw=(45+state.yaw)*Math.PI/180,elev=state.elev*Math.PI/180,n=[Math.cos(elev)*Math.cos(yaw),Math.cos(elev)*Math.sin(yaw),Math.sin(elev)];
 const right=[-Math.sin(yaw),Math.cos(yaw),0],up=[-Math.sin(elev)*Math.cos(yaw),-Math.sin(elev)*Math.sin(yaw),Math.cos(elev)];
 return {n,right,up,project(q){const u=q.map(z=>z/2),cx=370,cy=278,scale=184;return[cx+scale*dot(u,right),cy-scale*dot(u,up),dot(u,n)]}}}
function canvasStart(canvas){const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.lineJoin='round';c.lineCap='round';return c}
function line(c,x,y,X,Y,color=C.grid,w=1,dash=[]){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=w;c.setLineDash(dash);c.stroke();c.restore()}
function label(c,t,x,y,color=C.ink,size=14,align='left'){c.font=size+'px system-ui,Segoe UI,sans-serif';c.fillStyle=color;c.textAlign=align;c.fillText(t,x,y)}
function dotCircle(c,x,y,color=C.purple,r=6){c.fillStyle='#fff';c.beginPath();c.arc(x,y,r+2,0,TAU);c.fill();c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
function drawPath(c,fn,screen,color,w=3,dash=[],max=1,n=180){c.save();c.beginPath();c.lineWidth=w;c.strokeStyle=color;c.setLineDash(dash);for(let i=0;i<=n;i++){const xy=screen(fn(max*i/n));if(i===0)c.moveTo(xy[0],xy[1]);else c.lineTo(xy[0],xy[1])}c.stroke();c.restore()}
function current(state){if(state.mode==='bern'){const v=state.path==='great'?bernGeodesic(state.ba,state.bb,state.t):state.ba*(1-state.t)+state.bb*state.t;return[v,1-v]}return state.path==='great'?geodesic(state.P,state.Q,state.t):mixture(state.P,state.Q,state.t)}
function simplexCanvas(canvas,state){const c=canvasStart(canvas),v=triangle;c.beginPath();c.moveTo(...v.A);c.lineTo(...v.B);c.lineTo(...v.C);c.closePath();c.fillStyle=C.pale;c.fill();c.strokeStyle=C.teal;c.lineWidth=2.7;c.stroke();
for(let j=1;j<=4;j++){let k=j/5;for(let i=0;i<3;i++){const a=[0,0,0],b=[0,0,0];a[i]=k;b[i]=k;a[(i+1)%3]=1-k;b[(i+2)%3]=1-k;line(c,...tri(a),...tri(b),'#c6dfe4',.9)}}
label(c,'The probability triangle Δ²',32,28,C.ink,20);for(const [k,col] of [['A',C.teal],['B',C.orange],['C',C.green]])label(c,k,v[k][0],v[k][1]+(k==='A'?-12:25),col,17,'center');
drawPath(c,t=>mixture(state.P,state.Q,t),tri,C.orange,2.6,[7,5]);drawPath(c,t=>geodesic(state.P,state.Q,t),tri,C.purple,3.8);
const now=current(state);const A=tri(state.P),B=tri(state.Q),N=tri(now);
dotCircle(c,...A,C.teal,7);dotCircle(c,...B,C.orange,7);dotCircle(c,...N,C.purple,8);
label(c,'P',A[0]+12,A[1]-13,C.teal,14);label(c,'R',B[0]+12,B[1]+18,C.orange,14);label(c,'current',N[0]+11,N[1]-10,C.purple,13);
label(c,'Purple: Fisher geodesic   Orange: linear mixture',22,canvas.height-14,C.muted,13)}
function sphereCanvas(canvas,state){const c=canvasStart(canvas),pr=projection(state),project=q=>pr.project(q),cx=370,cy=278,rad=184;
label(c,'Fisher sphere: positive octant of radius 2',22,29,C.ink,19);
c.fillStyle='#f5fafb';c.beginPath();c.arc(cx,cy,rad,0,TAU);c.fill();c.strokeStyle='#b6cbd3';c.lineWidth=2;c.stroke();
// Build a curved patch using spherical coordinates on the first octant.
const S=22;const unit=(a,b)=>[2*Math.cos(a)*Math.cos(b),2*Math.cos(a)*Math.sin(b),2*Math.sin(a)];
for(let i=0;i<S;i++)for(let j=0;j<S;j++){let aa=i*(Math.PI/2)/S,bb=j*(Math.PI/2)/S,da=(Math.PI/2)/S,db=da;
const coords=[unit(aa,bb),unit(aa+da,bb),unit(aa+da,bb+db),unit(aa,bb+db)].map(q=>project(q));const depth=coords.reduce((m,z)=>m+z[2],0)/4;
c.beginPath();c.moveTo(...coords[0]);for(let k=1;k<4;k++)c.lineTo(...coords[k]);c.closePath();c.fillStyle=depth>.45?'#dfedef':'#edf5f6';c.fill()}
function arc(fn,color,w=1.2,dash=[]){drawPath(c,t=>fn(Math.PI/2*t),q=>project(q),color,w,dash,1,88)}
// Coordinate curves on the octant make the spherical geometry visible.
for(let j=1;j<5;j++){let z=j*Math.PI/10;arc(t=>unit(z,t),'#bedbe0',1.0);arc(t=>unit(t,z),'#bedbe0',1.0)}
arc(t=>unit(0,t),'#4f93a4',2.8);arc(t=>unit(t,0),'#4f93a4',2.8);arc(t=>unit(t,Math.PI/2),'#4f93a4',2.8);
const projectProb=p=>project(roots(p));
drawPath(c,t=>mixture(state.P,state.Q,t),projectProb,C.orange,2.8,[7,5],1,180);
drawPath(c,t=>geodesic(state.P,state.Q,t),projectProb,C.purple,4,[],1,180);
for(const [coord,col,name] of [[state.P,C.teal,'P'],[state.Q,C.orange,'R'],[current(state),C.purple,'current']]){const xy=projectProb(coord);dotCircle(c,xy[0],xy[1],col,name==='current'?8:7);label(c,name,xy[0]+10,xy[1]-13,col,13)}
for(const [axis,col,name] of [[0,C.teal,'A'],[1,C.orange,'B'],[2,C.green,'C']]){const q=[0,0,0];q[axis]=2;const xy=project(q);label(c,name,xy[0]+11,xy[1]+(axis===2?-7:13),col,14)}
label(c,'Rotate with the view sliders or drag the sphere',20,canvas.height-15,C.muted,13);
}
function bernChart(canvas,s){const c=canvasStart(canvas),L=72,R=canvas.width-27,T=60,B=canvas.height-68,X=t=>L+t*(R-L),Y=p=>B-p*(B-T);
for(let k=0;k<=4;k++){const v=k/4;line(c,X(v),T,X(v),B);line(c,L,Y(v),R,Y(v));label(c,fmt(v,2),X(v),B+19,C.muted,12,'center');label(c,fmt(v,2),L-10,Y(v)+4,C.muted,12,'right')}
line(c,L,T,L,B,C.axis,1.8);line(c,L,B,R,B,C.axis,1.8);
label(c,'Bernoulli probability along two paths',L,28,C.ink,18);label(c,'interpolation time t',R,B+42,C.muted,12,'right');
drawPath(c,t=>[t,(1-t)*s.ba+t*s.bb],z=>[X(z[0]),Y(z[1])],C.orange,2.6,[7,5]);
drawPath(c,t=>[t,bernGeodesic(s.ba,s.bb,t)],z=>[X(z[0]),Y(z[1])],C.purple,3.3);
const p=current(s)[0];line(c,X(s.t),T,X(s.t),B,C.purple,1.2,[4,5]);dotCircle(c,X(s.t),Y(p),C.purple,7);
label(c,'P(t) linear mixture',L+11,T+16,C.orange,12);label(c,'P(t) constant Fisher speed',L+172,T+16,C.purple,12);
}
function bernCircle(canvas,s){const c=canvasStart(canvas),cx=340,cy=400,rad=258,ang=p=>arcCoord(p)/2;
label(c,'Bernoulli square-root circle (radius 2)',25,28,C.ink,19);
c.beginPath();c.arc(cx,cy,rad,1.5*Math.PI,2*Math.PI);c.strokeStyle='#b1cbd1';c.lineWidth=3;c.stroke();
// Coordinates (2√p,2√(1-p)); draw upper-right quarter.
function point(p){const th=ang(p);return[cx+rad*Math.sin(th),cy-rad*Math.cos(th)]}
drawPath(c,t=>bernGeodesic(s.ba,s.bb,t),point,C.purple,4,[],1,180);
drawPath(c,t=>s.ba*(1-t)+s.bb*t,point,C.orange,2.7,[6,5],1,180);
const a=point(s.ba),b=point(s.bb),now=point(current(s)[0]);
line(c,cx,cy,...a,'#c3d8dd',1.4);line(c,cx,cy,...b,'#c3d8dd',1.4);
dotCircle(c,...a,C.teal,7);dotCircle(c,...b,C.orange,7);dotCircle(c,...now,C.purple,8);
label(c,'P',a[0]-10,a[1]-12,C.teal,13);label(c,'R',b[0]+10,b[1]+16,C.orange,13);label(c,'current',now[0]+9,now[1]-9,C.purple,13);
for(const p of [0,.25,.5,.75,1]){const xy=point(p);dotCircle(c,...xy,C.axis,3);label(c,fmt(p,2),xy[0]+8,xy[1]+(p===0?-7:18),C.muted,11)}
label(c,'Fisher geodesic has constant angular speed',20,canvas.height-17,C.muted,13);
}
window.mountInfoDemo=function(week,host){if(week!==8)return;
host.innerHTML=[
'<div class="panel"><h2>Simplex → sphere: the Fisher geodesic explorer</h2><p>Every distribution becomes a point on a radius-2 sphere under <strong>qᵢ = 2√pᵢ</strong>. Select two distributions and move between them by either the Fisher shortest path or an ordinary linear mixture. Both views always show the same probability state.</p>',
'<div class="toolbar"><label for="w8-mode">Family</label><select id="w8-mode"><option value="cat">Three categories (triangle and sphere)</option><option value="bern">Bernoulli (interval and circle)</option></select>',
'<label for="w8-path">Follow</label><select id="w8-path"><option value="great">Fisher geodesic</option><option value="mix">Linear mixture</option></select>',
'<button class="primary" id="w8-play">Play</button><button id="w8-reset">Restart</button><button id="w8-swap">Swap endpoints</button></div>',
'<div class="toolbar" style="margin-top:14px"><label for="w8-time">Interpolation t = <strong id="w8-tv">0.00</strong></label><input id="w8-time" type="range" min="0" max="1" step=".005" value="0" style="flex:1;min-width:180px"></div></div>',
'<div class="panel" id="w8-catcontrols"><h3>Choose two categorical distributions</h3><p>Set probabilities using the sliders or drag the selected endpoint in the triangle. The third probability is determined by normalization.</p>',
'<div class="w8-endpoints"><div><strong>P (teal)</strong><div class="control"><label for="w8-pa">pA = <strong id="w8-pav">0.650</strong></label><input type="range" id="w8-pa" min="0" max="1" step=".005" value=".65"></div><div class="control"><label for="w8-pb">pB = <strong id="w8-pbv">0.250</strong></label><input type="range" id="w8-pb" min="0" max="1" step=".005" value=".25"></div><p>pC = <strong id="w8-pcv">0.100</strong></p></div>',
'<div><strong>R (orange)</strong><div class="control"><label for="w8-ra">rA = <strong id="w8-rav">0.150</strong></label><input type="range" id="w8-ra" min="0" max="1" step=".005" value=".15"></div><div class="control"><label for="w8-rb">rB = <strong id="w8-rbv">0.200</strong></label><input type="range" id="w8-rb" min="0" max="1" step=".005" value=".2"></div><p>rC = <strong id="w8-rcv">0.650</strong></p></div></div>',
'<div class="toolbar" style="margin-top:15px"><label for="w8-select">Drag endpoint</label><select id="w8-select"><option value="P">P (teal)</option><option value="Q">R (orange)</option></select><button id="w8-normal">Typical pair</button><button id="w8-near">Nearby pair</button><button id="w8-vertices">Pure A and B</button><button id="w8-nearvertices">Near A and B</button></div>',
'<div class="toolbar" style="margin-top:13px"><label for="w8-yaw">Sphere rotation: <strong id="w8-yawv">0°</strong></label><input id="w8-yaw" type="range" min="-35" max="35" step="1" value="0"><label for="w8-elev">Elevation: <strong id="w8-elevv">35°</strong></label><input id="w8-elev" type="range" min="15" max="70" step="1" value="35"></div></div>',
'<div class="panel" id="w8-berncontrols" hidden><h3>Bernoulli endpoints</h3><p>Compare constant angular speed on the square-root circle with linear interpolation of probabilities.</p><div class="demo-controls"><div class="control"><label for="w8-ba">Start a = <strong id="w8-bav">0.250</strong></label><input id="w8-ba" type="range" min="0" max="1" step=".005" value=".25"></div><div class="control"><label for="w8-bb">End b = <strong id="w8-bbv">0.750</strong></label><input id="w8-bb" type="range" min="0" max="1" step=".005" value=".75"></div></div><div class="toolbar" style="margin-top:13px"><button id="w8-quarter">Quarter-to-three-quarters</button><button id="w8-whole">Pure endpoints 0 and 1</button></div></div>',
'<div class="panel"><h3>Distances and path lengths</h3><div class="w8-metrics"><div><span>Fisher geodesic distance</span><strong id="w8-dist"></strong></div><div><span>Bhattacharyya coefficient</span><strong id="w8-B"></strong></div><div><span>Sphere chord length</span><strong id="w8-chord"></strong></div><div><span>Fisher length of mixture</span><strong id="w8-mixlen"></strong></div></div>',
'<p class="small" id="w8-details" aria-live="polite"></p><p class="small muted" id="w8-note">The shorter spherical arc is the Fisher geodesic. Neither KL divergence nor the chord length is the intrinsic distance.</p></div>',
'<div class="w8-visual-grid"><div class="panel"><canvas id="w8-flat" width="740" height="556" role="img" aria-label="Probability simplex with draggable distributions and compared Fisher and mixture paths" style="width:100%;height:auto;touch-action:none"></canvas><p class="small muted" id="w8-flatcap">Drag inside the simplex to choose an endpoint.</p></div>',
'<div class="panel"><canvas id="w8-sphere" width="740" height="556" role="img" aria-label="Positive octant of the radius-2 sphere with great-circle geodesic and mapped probability mixture" style="width:100%;height:auto;touch-action:none"></canvas><p class="small muted" id="w8-spherecap">Drag to rotate the sphere, or use the rotation sliders.</p></div></div>',
'<style>.w8-endpoints{display:grid;grid-template-columns:1fr 1fr;gap:14px}.w8-endpoints>div{padding:12px;background:var(--soft);border-radius:12px;min-width:0}.w8-endpoints .control{margin-top:8px}.w8-endpoints input{width:100%}.w8-visual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.w8-visual-grid>.panel{min-width:0;padding:11px}.w8-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.w8-metrics>div{background:var(--soft);padding:11px;border-radius:10px;min-width:0}.w8-metrics span{font-size:.8rem;color:var(--muted);display:block}.w8-metrics strong{font-size:1.23rem;font-variant-numeric:tabular-nums}@media(max-width:930px){.w8-visual-grid{grid-template-columns:1fr}}@media(max-width:660px){.w8-endpoints{grid-template-columns:1fr}.w8-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>'
].join('');
const el=id=>host.querySelector('#w8-'+id);
const s={mode:'cat',path:'great',P:[.65,.25,.1],Q:[.15,.2,.65],ba:.25,bb:.75,t:0,select:'P',yaw:0,elev:35,playing:false,last:0,mixtureLen:0};
function pause(){s.playing=false;el('play').textContent='Play'}
function recalc(){s.mixtureLen=s.mode==='cat'?mixLength(s.P,s.Q):bernDist(s.ba,s.bb)}
function update(){
const bern=s.mode==='bern',p=s.P,r=s.Q,cur=current(s);
el('catcontrols').hidden=bern;el('berncontrols').hidden=!bern;el('mode').value=s.mode;el('path').value=s.path;el('time').value=String(s.t);el('tv').textContent=fmt(s.t,2);
if(!bern){
for(const [prefix,vec] of [['p',p],['r',r]]){for(const [i,l] of ['a','b','c'].entries())el(prefix+l+'v').textContent=fmt(vec[i],3);for(const [i,l] of ['a','b'].entries())el(prefix+l).value=String(vec[i])}
el('yawv').textContent=s.yaw+'°';el('elevv').textContent=s.elev+'°';el('yaw').value=String(s.yaw);el('elev').value=String(s.elev);
const alpha=angle(p,r),speed=s.path==='great'?2*alpha:mixSpeed(p,r,s.t);
el('dist').textContent=fmt(2*alpha,6);el('B').textContent=fmt(bhatt(p,r),6);el('chord').textContent=fmt(chord(p,r),6);el('mixlen').textContent=fmt(s.mixtureLen,6);
el('details').textContent='P = ('+p.map(x=>fmt(x,3)).join(', ')+'), R = ('+r.map(x=>fmt(x,3)).join(', ')+'). Central angle α = '+fmt(alpha,5)+' rad. Current distribution = ('+cur.map(x=>fmt(x,4)).join(', ')+'), total = '+fmt(sum(cur),6)+', instantaneous '+(s.path==='great'?'geodesic':'mixture')+' Fisher speed = '+fmt(speed,5)+'.';
simplexCanvas(el('flat'),s);sphereCanvas(el('sphere'),s);
el('flatcap').textContent='Purple great-circle geodesic and dashed orange linear mixture connect the same endpoints. Drag the selected endpoint to relocate it.';
el('spherecap').textContent='Spherical image of the same two paths. Drag here to rotate the view.';
}else{
el('bav').textContent=fmt(s.ba,3);el('bbv').textContent=fmt(s.bb,3);el('ba').value=String(s.ba);el('bb').value=String(s.bb);
const d=bernDist(s.ba,s.bb),B=Math.cos(d/2),now=cur[0],speed=s.path==='great'?d:(now>0&&now<1?Math.abs(s.bb-s.ba)/Math.sqrt(now*(1-now)):(s.ba===s.bb?0:Infinity));
el('dist').textContent=fmt(d,6);el('B').textContent=fmt(B,6);el('chord').textContent=fmt(Math.sqrt(Math.max(0,8*(1-B))),6);el('mixlen').textContent=fmt(d,6);
el('details').textContent='Bernoulli p(t) = '+fmt(now,5)+'. Fisher angular coordinate θ = '+fmt(arcCoord(now),5)+' rad. Current '+(s.path==='great'?'geodesic':'mixture')+' Fisher speed = '+fmt(speed,5)+'. The mixture and geodesic trace the same arc but use different time parameterizations.';
bernChart(el('flat'),s);bernCircle(el('sphere'),s);el('flatcap').textContent='p(t) vs time: Fisher arc-speed and linear probability interpolation.';el('spherecap').textContent='Positive quadrant of a radius-2 circle: intrinsic distance is arc length.';
}}
function applyPair(P,Q){s.P=normalize(P);s.Q=normalize(Q);s.t=0;recalc();pause();update()}
el('mode').addEventListener('change',()=>{pause();s.mode=el('mode').value;s.t=0;recalc();update()});
el('path').addEventListener('change',()=>{pause();s.path=el('path').value;update()});
el('time').addEventListener('input',()=>{pause();s.t=Number(el('time').value);update()});
el('reset').addEventListener('click',()=>{pause();s.t=0;update()});
el('swap').addEventListener('click',()=>{if(s.mode==='bern'){const x=s.ba;s.ba=s.bb;s.bb=x;pause();s.t=0;update()}else applyPair(s.Q,s.P)});
el('play').addEventListener('click',()=>{s.playing=!s.playing;el('play').textContent=s.playing?'Pause':'Play';if(s.playing&&s.t>=1)s.t=0;s.last=performance.now()});
for(const prefix of ['p','r'])for(const l of ['a','b'])el(prefix+l).addEventListener('input',()=>{const key=prefix==='p'?'P':'Q',i=l==='a'?0:1,j=1-i,v=Number(el(prefix+l).value),next=s[key].slice();next[i]=clamp(v,0,1);next[j]=Math.min(next[j],1-next[i]);next[2]=Math.max(0,1-next[0]-next[1]);s[key]=next;s.t=0;recalc();pause();update()});
el('select').addEventListener('change',()=>{s.select=el('select').value});
el('normal').addEventListener('click',()=>applyPair([.65,.25,.1],[.15,.2,.65]));
el('near').addEventListener('click',()=>applyPair([.52,.31,.17],[.48,.29,.23]));
el('vertices').addEventListener('click',()=>applyPair([1,0,0],[0,1,0]));
el('nearvertices').addEventListener('click',()=>applyPair([.98,.01,.01],[.01,.98,.01]));
for(const k of ['yaw','elev'])el(k).addEventListener('input',()=>{s[k]=Number(el(k).value);update()});
for(const k of ['ba','bb'])el(k).addEventListener('input',()=>{s[k]=Number(el(k).value);s.t=0;pause();update()});
el('quarter').addEventListener('click',()=>{s.ba=.25;s.bb=.75;s.t=0;pause();update()});
el('whole').addEventListener('click',()=>{s.ba=0;s.bb=1;s.t=0;pause();update()});
let triangleDrag=false,sphereDrag=false,lastPointer=null;
function selectPoint(event){if(s.mode==='bern')return;const canvas=el('flat'),rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height;s[s.select]=pick(x,y);s.t=0;recalc();pause();update()}
el('flat').addEventListener('pointerdown',e=>{if(s.mode==='bern')return;triangleDrag=true;if(el('flat').setPointerCapture)el('flat').setPointerCapture(e.pointerId);selectPoint(e)});
el('flat').addEventListener('pointermove',e=>{if(triangleDrag)selectPoint(e)});
el('flat').addEventListener('pointerup',()=>{triangleDrag=false});el('flat').addEventListener('pointercancel',()=>{triangleDrag=false});
el('sphere').addEventListener('pointerdown',e=>{if(s.mode==='bern')return;sphereDrag=true;lastPointer=[e.clientX,e.clientY];if(el('sphere').setPointerCapture)el('sphere').setPointerCapture(e.pointerId)});
el('sphere').addEventListener('pointermove',e=>{if(!sphereDrag||!lastPointer)return;const dx=e.clientX-lastPointer[0],dy=e.clientY-lastPointer[1];s.yaw=clamp(Math.round(s.yaw+dx*.3),-35,35);s.elev=clamp(Math.round(s.elev+dy*.3),15,70);lastPointer=[e.clientX,e.clientY];update()});
el('sphere').addEventListener('pointerup',()=>{sphereDrag=false;lastPointer=null});el('sphere').addEventListener('pointercancel',()=>{sphereDrag=false;lastPointer=null});
function animate(now){if(!host.isConnected)return;if(s.playing){s.t=Math.min(1,s.t+clamp((now-s.last)/1000,0,.08)/7);if(s.t>=1)pause();update()}s.last=now;requestAnimationFrame(animate)}
recalc();update();requestAnimationFrame(animate);
};
})();