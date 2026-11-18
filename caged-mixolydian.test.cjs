const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s),$=s=>d.querySelectorAll(s);
const pcAt=g=>ev(`(OPEN_PC[${g.dataset.string}]+${g.dataset.fret})%12`);
try{
 // H/B-Dur-Blues: B (11), E (4), F# (6)
 ev("S.key=11;S.scale='major';S.prog=[{rootPc:11,third:4,fifth:7,name:'B',rn:'I'},{rootPc:4,third:4,fifth:7,name:'E',rn:'IV'},{rootPc:6,third:4,fifth:7,name:'F#',rn:'V'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'x'}];S.progIdx=0;strumActive=()=>{};window.__p=[];pluck=m=>window.__p.push(m)");
 w.setFretboardLayer('caged',true);
 // Anker wie im Video: A-Form 2/4, G-Form 4/7, E-Form 7/9 (B-Dur)
 const anchors={A:[2,4],G:[4,7],E:[7,9]};
 for(const [f,exp] of Object.entries(anchors)){
  w.setCagedForm(f);
  assert.equal(JSON.stringify(ev('cagedAnchors(currentArpeggio())')),JSON.stringify(exp),'Anker '+f+'-Form');
  assert.deepEqual([...$('.cg-anchor')].map(g=>+g.dataset.fret),exp,'Anker-Marker am Griffbrett '+f);
  assert.equal(d.getElementById('cagedGripBox').hidden,false);
  assert.ok($('#cagedGrip .cg-grip-dot,#cagedGrip .cg-grip-barre').length>0,'Griffkästchen gezeichnet');
  assert.match(d.getElementById('cagedGrip').getAttribute('aria-label'),new RegExp(f+'-Form'));
 }
 // Griffkästchen G-Form: Barré im 4. Bund, Startbund 4 beschriftet, tiefe Saiten Bund 7/6
 w.setCagedForm('G');assert.ok($('#cagedGrip .cg-grip-barre').length===1);
 assert.match(d.getElementById('cagedGripInfo').textContent,/Anker-Bünde 4 und 7/);
 // Standard: Tonart-Skala (B-Dur hat kein A)
 assert.equal(ev('S.chordLab.scaleMode'),'key');
 w.setCagedForm('E');w.setCagedLevel(2);
 $('.cg-extra').forEach(g=>assert.ok([11,1,3,4,6,8,10].includes(pcAt(g)),'Tonart B-Dur'));
 // Mixolydisch über B: A statt A#, ♭7 orange markiert
 w.setCagedScaleMode('mixo');
 assert.equal(d.querySelector('#cagedScaleMode .active').dataset.smode,'mixo');
 assert.equal(ev('S.chordLab.scaleMode'),'mixo');
 const mix=[...$('.cg-extra')];assert.ok(mix.length>0);
 mix.forEach(g=>assert.ok([11,1,3,4,6,8,9].includes(pcAt(g)),'B-Mixolydisch'));
 const b7=mix.filter(g=>pcAt(g)===9);assert.ok(b7.length>0,'♭7 sichtbar');
 b7.forEach(g=>assert.ok(g.classList.contains('cg-b7')));
 assert.equal(mix.filter(g=>pcAt(g)!==9&&g.classList.contains('cg-b7')).length,0);
 assert.match(d.getElementById('cagedLegend').textContent,/Mixolydisch/);
 // Pentatonik der Stufe 1: Dur-Pentatonik vom Akkord-Grundton
 w.setCagedLevel(1);$('.cg-extra').forEach(g=>assert.ok([11,1,3,6,8].includes(pcAt(g)),'Dur-Pentatonik B'));
 // Akkord wandert: über E (IV) E-Mixolydisch = E F# G# A B C# D
 w.setCagedLevel(2);w.selectChord(1);
 $('.cg-extra').forEach(g=>assert.ok([4,6,8,9,11,1,2].includes(pcAt(g)),'E-Mixolydisch'));
 // Moll-Akkord: Mixolydisch gilt nicht, Hinweis und Rückfall auf Tonart
 w.selectChord(3);assert.equal(ev('cagedMixo(S.chordLab)'),false);
 assert.match(d.getElementById('cagedLegend').textContent,/nur für Dur- und Dominantakkorde/);
 // Dominantakkord zählt mit
 ev("S.chordLab.quality='7'");assert.equal(ev('cagedMixo(S.chordLab)'),true);
 // Quiz nutzt die Mixolydisch-Töne und eigene Signatur
 w.selectChord(0);w.setCagedLevel(2);
 assert.ok(ev('cagedTones(S.chordLab).extra').includes(9));
 const sig1=ev('cagedQuizSig(S.chordLab,currentArpeggio())');w.setCagedScaleMode('key');
 assert.notEqual(sig1,ev('cagedQuizSig(S.chordLab,currentArpeggio())'));
 assert.ok(!ev('cagedTones(S.chordLab).extra').includes(9));
 // Quiz: ♭7 wird gefragt und ist anklickbar
 w.setCagedScaleMode('mixo');w.toggleCagedQuiz();
 const seen=new Set();for(let i=0;i<60&&!seen.has('♭7');i++){seen.add(ev('cagedQuiz.q.role'));w.skipCagedQuiz();}
 assert.ok(seen.has('♭7'),'♭7 kommt im Quiz vor');w.toggleCagedQuiz();
 // Skalenfenster wie im Video: 5 Bünde ab einem Bund unter dem tiefsten Anker (H-Dur: A 1–5, G 3–7, E 6–10)
 w.selectChord(0);w.setCagedLevel(2);w.setCagedScaleMode('mixo');
 for(const [f,win] of Object.entries({A:[1,5],G:[3,7],E:[6,10]})){
  w.setCagedForm(f);
  assert.equal(JSON.stringify(ev('cagedWindow(S.chordLab,currentArpeggio())')),JSON.stringify(win),'Fenster '+f);
  const fr=[...$('.cg-extra')].map(g=>+g.dataset.fret);
  fr.forEach(x=>assert.ok(x>=win[0]&&x<=win[1],f+': Extra im Fenster'));
  const rect=[...$('.cl-region')].find(r=>r.getAttribute('stroke')==='#8ab5ff'),x1=+rect.getAttribute('x');
  assert.ok(x1<=ev(`fx(${win[0]})`)-20+0.01,'Rahmen enthält das Fenster');
 }
 // A-Form: Bund 1 zeigt D# (D-Saite) und G# (G-Saite), wie im Video
 w.setCagedForm('A');
 const at1=[...$('.cg-extra,.arp-note,.cl-note,.overview-tone')].filter(g=>g.dataset.fret==='1').map(g=>g.dataset.string+':'+pcAt(g)).sort();
 assert.equal(at1.join(','),'2:8,3:3','Bund 1: G-Saite G#, D-Saite D#');
 // ohne Stufe bleibt der Akkordbereich
 w.setCagedLevel(0);assert.equal(JSON.stringify(ev('cagedWindow(S.chordLab,currentArpeggio())')),JSON.stringify(ev('(({lo,hi})=>[lo,hi])(currentArpeggio())')));
 // Persistenz (normalizeChordLab behält den Modus)
 assert.equal(ev('normalizeChordLab().scaleMode'),'mixo');
 // freie Griffauswahl: Kästchen verschwindet
 ev("S.chordLab.mode='grips'");w.renderChordLab();assert.equal(d.getElementById('cagedGripBox').hidden,true);
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log('PASS: CAGED-Mixolydisch (Griffkästchen, Anker 2/4·4/7·7/9 für H-Dur, Tonart vs. Akkord-Mixolydisch, ♭7-Markierung, Moll-Rückfall, Quiz, Persistenz).');
}catch(e){console.error(e);process.exit(1)}
