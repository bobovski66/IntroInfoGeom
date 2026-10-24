(function(){
'use strict';
const course=window.IG_COURSE;
const base=document.body.dataset.base||'';
const week=Number(document.body.dataset.week)||0;
const kind=document.body.dataset.kind||'index';
const store='intro-info-geom-v1';
const path=(p)=>base+p;
const key=(w,k)=>'w'+w+'_'+k;
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lectureTitles = [
  ['Population Proportions and Replicator Dynamics', 'Frequency-Dependent Fitness and Stability'],
  ['Payoff Matrices and Expected Fitness', 'Stability, Parameters, and Inference'],
  ['Three Strategies and the Simplex', 'Cyclic Motion and Invasion'],
  ['Probability Laws, Means, and Variances', 'Curves of Distributions and Sampling'],
  ['Surprisal and Shannon Entropy', 'Log-Odds and Exponential Updating'],
  ['Relative Entropy and Prediction', 'Relative Entropy as a Lyapunov Function'],
  ['Fisher Information and Scores', 'Fisher Length and Replicator Speed'],
  ['Square-Root Coordinates and the Sphere', 'Geodesics and Statistical Midpoints'],
  ['Natural Gradients and Replicator Flows', 'Potentials, Stability, and KL Flows'],
  ['Gaussian Scores and the Hyperbolic Metric', 'Gaussian Geodesics and Statistical Distance']
];
// Add an ID here when its continuous MP4 is published under videos/.
const availableVideos = new Set(['week01_lecture01']);
const lectureId=(w,n)=>'week'+String(w).padStart(2,'0')+'_lecture0'+n;
const lecturePdf=(w,n)=>'lectures/'+lectureId(w,n)+'.pdf';
const videoLink=(w,n)=>availableVideos.has(lectureId(w,n))
  ? '<a href="'+path('watch.html?lecture='+lectureId(w,n))+'">Watch ↗</a>' : '';
// Protect comparison signs inside TeX before inserting into HTML.
const mathHtml=(s)=>String(s).replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g,f=>f.replace(/</g,'&lt;').replace(/>/g,'&gt;'));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(store+':'+k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(store+':'+k,JSON.stringify(v))}catch{}};
function shell(){const n=document.getElementById('root');const sub=week?'Week '+week+' / '+kind.toUpperCase():'10-WEEK COURSE';n.innerHTML='<div class="layout"><aside class="sidebar"><div class="eyebrow">The Calculus of</div><h2>Probability Distributions</h2><p class="small">Introduction to Information Geometry</p><nav><a href="'+path('index.html')+'">Course home</a>'+[1,2,3,4,5,6,7,8,9,10].map(w=>'<a href="'+path(course[w-1].reading)+'">Week '+w+'</a>').join('')+'</nav><p class="small">Differential equations → Probability → Information → Geometry</p></aside><main class="main"><div class="main-inner"><div class="eyebrow">'+sub+'</div><div id="content"></div><footer class="site-footer">Introduction to Information Geometry · Original undergraduate course materials</footer></div></main></div>';return document.getElementById('content')}
function heading(w,kind){return '<h1>'+esc(w.title)+'</h1><p class="lead">'+esc(w.subtitle)+' · '+esc(w.summary)+'</p><div class="toolbar"><button id="theme">Toggle theme</button><a class="btn" href="'+path('index.html')+'">All weeks</a><a class="btn" href="'+path(w.readingPath)+'">Reading</a><a class="btn" href="'+path('pdf/chapter_'+String(w.week).padStart(2,'0')+'.pdf')+'">Chapter PDF</a><a class="btn" href="'+path(w.demoPath)+'">Demo</a><a class="btn" href="'+path(w.labPath)+'">Lab</a><a class="btn" href="'+path(w.quizPath)+'">Quiz</a></div>'}
function pager(){return '<div class="nav-pager"><span>'+(week>1?'<a href="'+path('readings/week'+String(week-1).padStart(2,'0')+'.html')+'">← Previous reading</a>':'')+'</span><span>'+(week<10?'<a href="'+path('readings/week'+String(week+1).padStart(2,'0')+'.html')+'">Next reading →</a>':'')+'</span></div>'}
function renderIndex(target) {
  const chapterPdf = n => 'pdf/chapter_' + String(n).padStart(2, '0') + '.pdf';
  const lectureLinks = w => `<section class="lecture-section" aria-label="Week ${w.week} lecture slides">
    <p class="lecture-label">Lecture presentations</p>
    <div class="lecture-grid">${[1,2].map(n => `<div class="lecture-item">
      <div><span>Lecture ${n}</span><strong>${esc(lectureTitles[w.week-1][n-1])}</strong></div>
      <div class="lecture-files">${videoLink(w.week,n)}<a href="${path(lecturePdf(w.week,n))}">PDF ↗</a></div>
    </div>`).join('')}</div></section>`;
  target.innerHTML = `
    <header class="course-hero">
      <p class="course-kicker">Undergraduate mathematics · Ten-week course</p>
      <h1>Introduction to<br>Information Geometry</h1>
      <p class="hero-deck">How does a probability distribution move, and what geometry describes its motion?</p>
      <p class="lead">We begin with replicator equations and the dynamics of competing strategies. Along the way, probability distributions become states, entropy and relative entropy become ways to compare them, and Fisher information provides a metric for their space. The final weeks connect that geometry to natural-gradient flows and the hyperbolic geometry of Gaussian distributions.</p>
      <div class="hero-actions">
        <a class="btn primary" href="${path('pdf/information_geometry.pdf')}">Download complete textbook (PDF) ↗</a>
        <a class="btn" href="${path('lectures/InformationGeometry_All20Lectures_Beamer_PDF.zip')}">Download all 20 lecture decks (ZIP) ↗</a>
        <a class="btn" href="#weekly-materials">Explore the ten weeks ↓</a>
      </div>
      <p class="hero-note">Each week has two lecture presentations in PDF, an illustrated online reading, a downloadable textbook chapter, an interactive demonstration, a guided lab, and a self-check quiz.</p>
    </header>
    <section class="course-introduction" aria-labelledby="about-course">
      <div>
        <h2 id="about-course">About the course</h2>
        <p>Information geometry studies families of probability distributions as geometric spaces. A distribution can be described by coordinates, varied along a curve, and compared with nearby distributions. The Fisher metric lets us calculate lengths, angles, and paths while respecting the probabilities those coordinates represent.</p>
        <p>The course develops these ideas through concrete models. We start with a one-dimensional differential equation for competing types, extend it to dynamics on a probability simplex, and use relative entropy to understand stability. From the quadratic approximation to relative entropy we derive the Fisher metric and then study its geometry and associated dynamics.</p>
      </div>
      <aside class="course-facts" aria-label="Course details">
        <div><span>Level</span><strong>Undergraduate</strong></div>
        <div><span>Preparation</span><strong>Calculus and introductory differential equations</strong></div>
        <div><span>Length</span><strong>10 weeks / 10 chapters</strong></div>
        <div><span>Materials</span><strong>20 lectures, free web and PDF readings, demos, labs, quizzes</strong></div>
      </aside>
    </section>
    <section class="course-sequence" aria-labelledby="course-arc">
      <h2 id="course-arc">The mathematical progression</h2>
      <ol class="course-arc">
        <li><span>Weeks 1–3</span><h3>Dynamics on the simplex</h3><p>Replicator equations, payoff matrices, equilibrium and stability, and the transition from an interval to a triangular state space.</p></li>
        <li><span>Weeks 4–6</span><h3>Probability and information</h3><p>Distributions and expectations, Shannon entropy, log-odds, relative entropy, and Lyapunov functions for evolutionary dynamics.</p></li>
        <li><span>Weeks 7–10</span><h3>Geometry of statistical models</h3><p>Fisher information, square-root and spherical coordinates, natural gradients, and Gaussian families with hyperbolic geometry.</p></li>
      </ol>
    </section>
    <section id="weekly-materials" aria-labelledby="weekly-heading">
      <div class="weekly-heading"><div><p class="eyebrow">Course materials</p><h2 id="weekly-heading">Week-by-week lectures and activities</h2><p>Each week has two lecture PDFs, a web reading, and a PDF textbook chapter. Demos, labs, and quizzes accompany the mathematical material.</p></div><button id="theme">Toggle theme</button></div>
      <div class="progress-panel"><div class="progress-top"><div><strong>Personal checklist</strong><p class="small muted" id="progress-label"></p></div><button id="clear-progress">Reset checklist</button></div><div class="track" aria-hidden="true"><span id="progress-fill"></span></div><p class="small muted">Checkmarks are saved in this browser only; they are not submitted as grades.</p></div>
      <div id="weeks" class="week-list"></div>
    </section>
    <section class="study-note" aria-labelledby="study-heading">
      <h2 id="study-heading">Working through a week</h2>
      <p>The two lecture presentations introduce each topic and alternate mathematical explanations with calculations suitable for working on a separate whiteboard. The following slide reveals the completed result. The web reading develops the definitions with diagrams and examples; the PDF chapter provides a continuous textbook treatment and exercises. Use the demo to test parameters, then complete the lab and quiz.</p>
    </section>`;
  const list = target.querySelector('#weeks');
  const resources = w => [
    ['Web reading', w.readingPath, 'reading'],
    ['PDF chapter', chapterPdf(w.week), 'pdf'],
    ['Interactive demo', w.demoPath, 'demo'],
    ['Guided lab', w.labPath, 'lab'],
    ['Weekly quiz', w.quizPath, 'quiz']
  ];
  course.forEach(w => {
    const card = document.createElement('article');
    card.className = 'module course-module';
    card.innerHTML = `<div class="module-head">
      <div class="module-no">${w.week}</div>
      <div><h3>Week ${w.week}: ${esc(w.title)}</h3><p class="summary">${esc(w.summary)}</p></div>
    </div>${lectureLinks(w)}<div class="resources">${resources(w).map(([label, file, id]) =>
      `<div class="resource"><a href="${path(file)}">${label} ↗</a>
      <label><input type="checkbox" data-progress="${key(w.week, id)}" aria-label="Mark Week ${w.week} ${label} complete"> Done</label></div>`
    ).join('')}</div>`;
    list.appendChild(card);
  });
  const boxes = [...list.querySelectorAll('[data-progress]')];
  function progress() {
    const count = boxes.filter(b => b.checked).length;
    target.querySelector('#progress-label').textContent = count + ' of ' + boxes.length + ' resources completed';
    target.querySelector('#progress-fill').style.width = (100 * count / boxes.length) + '%';
  }
  boxes.forEach(b => {
    b.checked = read('check:' + b.dataset.progress, false);
    b.addEventListener('change', () => {
      save('check:' + b.dataset.progress, b.checked);
      progress();
    });
  });
  progress();
  target.querySelector('#clear-progress').onclick = () => {
    if (confirm('Clear all 50 checklist entries?')) {
      boxes.forEach(b => { b.checked = false; save('check:' + b.dataset.progress, false); });
      progress();
    }
  };
}
function renderReading(target,w){target.innerHTML=heading(w,'reading')+'<div class="reading">'+w.sections.map(([title,body],i)=>'<section><h2>'+(i+1)+'. '+esc(title)+'</h2><p>'+mathHtml(body)+'</p></section>').join('')+'<div class="formula"><strong>Central formula</strong><div>\\['+mathHtml(w.key)+'\\]</div></div><section><h2>Worked example</h2><p>'+mathHtml(w.example)+'</p></section><div class="lesson-prompt"><strong>Explore next:</strong> Open this week’s demo and then complete the lab. Use the reading for definitions and derivations; the lab deliberately does not repeat the worked example.</div>'+pager()+'</div>'}
function renderLab(target,w){const saved=read('lab:'+week+((week>=1&&week<=10)?':v2':''),Array(w.lab.length).fill(''));target.innerHTML=heading(w,'lab')+'<div class="panel"><h2>Guided investigation</h2><p>Write mathematical reasoning, calculations, and explanations. Use the reading and demo as references. Your responses save automatically in this browser; the Download HTML button creates a copy with your answers.</p><div class="toolbar"><button class="primary" id="download-lab">Download answered HTML</button><button id="print-lab">Print</button><span class="small muted" id="save-status" aria-live="polite">Autosave is on</span></div></div>'+w.lab.map((q,i)=>'<div class="lab-question"><label for="answer'+i+'">Problem '+(i+1)+'</label><p>'+mathHtml(q)+'</p><textarea id="answer'+i+'" data-answer="'+i+'" placeholder="Work and explanation…"></textarea></div>').join('')+pager();const inputs=[...target.querySelectorAll('[data-answer]')];inputs.forEach((el,i)=>{el.value=saved[i]||'';el.addEventListener('input',()=>{save('lab:'+week+((week>=1&&week<=10)?':v2':''),inputs.map(a=>a.value));target.querySelector('#save-status').textContent='Saved locally'})});target.querySelector('#print-lab').onclick=()=>window.print();target.querySelector('#download-lab').onclick=()=>{const css='body{font:16px/1.6 Georgia,serif;max-width:800px;margin:2em auto;padding:1em;color:#222}section{margin:1.6em 0;break-inside:avoid}.answer{white-space:pre-wrap;padding:12px;border:1px solid #aaa;min-height:40px}h1,h2{font-family:system-ui,sans-serif}';const answers=inputs.map((inp,i)=>'<section><h2>Problem '+(i+1)+'</h2><p>'+mathHtml(w.lab[i])+'</p><div class="answer">'+esc(inp.value)+'</div></section>').join('');const out='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Week '+week+' Answered Lab</title><style>'+css+'</style><script>window.MathJax={tex:{inlineMath:[[\"\\\\(\",\"\\\\)\"],[\"$\",\"$\"]]},svg:{fontCache:\"global\"}};<\/script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"><\/script></head><body><h1>Week '+week+': '+esc(w.title)+'</h1><p>Guided Lab · Answered copy</p>'+answers+'</body></html>';const blob=new Blob([out],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='InfoGeom_Week_'+String(week).padStart(2,'0')+'_Lab_Answered.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}
function renderQuiz(target,w){const prev=read('quiz:'+week+((week>=1&&week<=10)?':v2':''),{});target.innerHTML=heading(w,'quiz')+'<div class="panel"><h2>Weekly quiz</h2><p>'+w.quiz.length+' checkable questions. Select one answer per question, then check your response. You may try again; this page is self-assessed and stores your attempts in this browser only.</p><strong id="quiz-score"></strong></div>'+w.quiz.map(([q,choices],i)=>'<div class="question" data-q="'+i+'"><fieldset><legend>Question '+(i+1)+'. '+mathHtml(q)+'</legend>'+choices.map((c,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'"> <span>'+mathHtml(c)+'</span></label>').join('')+'</fieldset><button data-check="'+i+'">Check answer</button><p class="feedback" id="feedback'+i+'" aria-live="polite" hidden></p></div>').join('')+'<div class="toolbar"><button id="reset-quiz">Reset quiz</button></div>'+pager();let result={...prev};function updateScore(){let done=Object.keys(result).filter(k=>result[k]&&result[k].checked);let correct=done.filter(k=>result[k].correct).length;target.querySelector('#quiz-score').textContent='Checked: '+done.length+'/'+w.quiz.length+' · Correct: '+correct+'/'+done.length}w.quiz.forEach(([q,choices,answer,explanation],i)=>{const card=target.querySelector('[data-q="'+i+'"]');const feedback=card.querySelector('.feedback');function show(sel){const good=Number(sel)===answer;feedback.hidden=false;feedback.className='feedback '+(good?'correct':'incorrect');feedback.innerHTML='<strong>'+(good?'Correct.':'Not quite.')+'</strong> '+mathHtml(explanation);result[i]={checked:true,correct:good,choice:Number(sel)};save('quiz:'+week+((week>=1&&week<=10)?':v2':''),result);updateScore()}const old=prev[i];if(old){const c=card.querySelector('input[value="'+old.choice+'"]');if(c)c.checked=true;if(old.checked)show(old.choice)}card.querySelector('button').onclick=()=>{const chosen=card.querySelector('input:checked');if(!chosen){feedback.hidden=false;feedback.className='feedback';feedback.textContent='Select an answer first.';return}show(chosen.value)}});updateScore();target.querySelector('#reset-quiz').onclick=()=>{result={};save('quiz:'+week+((week>=1&&week<=10)?':v2':''),result);target.querySelectorAll('input[type=radio]').forEach(el=>el.checked=false);target.querySelectorAll('.feedback').forEach(el=>el.hidden=true);updateScore()}}
function renderDemo(target,w){target.innerHTML=heading(w,'demo')+'<div class="panel"><h2>Interactive explorer</h2><p>Change parameters and initial conditions to investigate this week’s model. The visualization and numerical readouts update immediately.</p></div><div id="demo-host"></div>'+pager();if(typeof window.mountInfoDemo==='function')window.mountInfoDemo(week,document.getElementById('demo-host'))}
function renderWatch(target) {
  const requested = new URLSearchParams(window.location.search).get('lecture') || '';
  const match = /^week(0[1-9]|10)_lecture0([12])$/.exec(requested);
  if (!match || !availableVideos.has(requested)) {
    target.innerHTML = '<h1>Lecture video unavailable</h1><p class="lead">This lecture has not been published as a video yet.</p><p><a class="btn" href="'+path('index.html#weekly-materials')+'">Return to lecture listings</a></p>';
    return;
  }
  const w = Number(match[1]);
  const n = Number(match[2]);
  const title = lectureTitles[w-1][n-1];
  const video = path('videos/'+requested+'_continuous.mp4');
  const pdf = path(lecturePdf(w,n));
  document.title = title+' | Introduction to Information Geometry';
  target.innerHTML = `<section class="watch-page" aria-label="Narrated lecture">
    <p class="eyebrow">Week ${w} · Lecture ${n}</p>
    <h1>${esc(title)}</h1>
    <p class="lead">Narrated slide presentation</p>
    <div class="lecture-player">
      <video controls preload="metadata" playsinline aria-label="${esc(title)}">
        <source src="${video}" type="video/mp4">
        Your browser cannot play this video. <a href="${video}">Open the MP4 directly.</a>
      </video>
    </div>
    <p class="watch-hint">Use the playback controls to pause, rewind, adjust speed, or enter fullscreen.</p>
    <div class="toolbar watch-actions">
      <a class="btn" href="${pdf}">Lecture PDF ↗</a>
      <a class="btn" href="${video}" download>Download MP4</a>
      <a class="btn" href="${path('index.html#weekly-materials')}">All lectures</a>
    </div>
  </section>`;
}
const el=shell();if(kind==='index')renderIndex(el);else if(kind==='watch')renderWatch(el);else {const w=course[week-1];if(!w){el.textContent='No such week.';return}if(kind==='reading')renderReading(el,w);if(kind==='lab')renderLab(el,w);if(kind==='quiz')renderQuiz(el,w);if(kind==='demo')renderDemo(el,w)}
const theme=read('theme','light');document.documentElement.dataset.theme=theme;const btn=document.getElementById('theme');if(btn)btn.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;save('theme',next)};
})();
