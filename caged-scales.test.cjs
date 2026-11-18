const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s),$=s=>d.querySelectorAll(s);
const pcAt=g=>ev(`(OPEN_PC[${g.dataset.string}]+${g.dataset.fret})%12`);
const J=JSON.stringify;
try{
 // B-Dur-Blues: B (11), E (4), F# (6), Dm (2)
 ev("S.key=11;S.scale='major';S.prog=[{rootPc:11,third:4,fifth:7,name:'B',rn:'I'},{rootPc:4,third:4,fifth:7,name:'E',rn:'IV'},{rootPc:6,third:4,fifth:7,name:'F#',rn:'V'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'x'}];S.progIdx=0;strumActive=()=>{};window.__p=[];pluck=m=>window.__p.push(m)");
 w.setFretboardLayer('caged',true);
 // Anker wie im Video: A-Form 2/4, G-Form 4/7, E-Form 7/9 (B-Dur)
 for(const [f,exp] of Object.entries({A:[2,4],G:[4,7],E:[7,9]})){
  w.setCagedForm(f);
  assert.equal(J(ev('cagedAnchors(currentArpeggio())')),J(exp),'Anker '+f);
  assert.equal(J([...$('.cg-anchor')].map(g=>+g.dataset.fret)),J(exp));
  assert.equal(d.getElementById('cagedGripBox').hidden,false);
  assert.ok($('#cagedGrip .cg-grip-dot,#cagedGrip .cg-grip-barre').length>0);
  assert.match(d.getElementById('cagedGrip').getAttribute('aria-label'),new RegExp(f+'-Form'));
 }
 w.setCagedForm('G');assert.equal($('#cagedGrip .cg-grip-barre').length,1);
 assert.match(d.getElementById('cagedGripInfo').textContent,/Anker-Bünde 4 und 7/);
 // Auswahl: alle Skalen als Option, Standard folgt dem Tonart-Modus
 assert.equal(J([...$('#cagedScale option')].map(o=>o.value)),J(Object.keys(ev('CG_SCALES'))));
 assert.equal(ev('S.chordLab.scale'),'auto');assert.equal(d.getElementById('cagedScale').value,'majpent');
 w.setCagedForm('E');w.setCagedLevel(1);
 $('.cg-extra').forEach(g=>assert.ok([11,1,3,6,8].includes(pcAt(g)),'Standard: Dur-Pentatonik der Tonart'));
 // Jede Skala, beide Grundtöne: nur Skalen- und Akkordtöne; Info-Kärtchen vollständig
 for(const id of Object.keys(ev('CG_SCALES'))){
  const iv=ev(`CG_SCALES['${id}'].iv`),ch=ev(`CG_SCALES['${id}'].ch`);
  for(const r of ['key','chord']){
   w.setCagedScale(id);w.setCagedScaleRoot(r);
   assert.equal(d.getElementById('cagedScale').value,id);
   const rootPc=r==='key'?11:4;if(r==='chord')w.selectChord(1);else w.selectChord(0);
   const rp=r==='key'?11:ev('S.chordLab.root'),set=iv.map(i=>(rp+i)%12),chord=ev('cagedTones(S.chordLab).chord');
   const ex=[...$('.cg-extra')];assert.ok(ex.length>0,id);
   ex.forEach(g=>assert.ok(set.includes(pcAt(g))||chord.includes(pcAt(g)),`${id}/${r}: Ton gehört zur Skala oder zum Akkord`));
   const chips=[...$('#cagedScaleInfo .cg-chip')];
   assert.equal(chips.length,iv.length,id+' Kärtchen');
   assert.equal($('#cagedScaleInfo .cg-chip.root').length,1);
   assert.equal($('#cagedScaleInfo .cg-chip.char').length,ch.length);
   ex.filter(g=>g.classList.contains('cg-char')).forEach(g=>assert.ok(ch.map(i=>(rp+i)%12).includes(pcAt(g))));
   assert.match(d.getElementById('cagedScaleInfo').textContent,new RegExp(ev(`CG_SCALES['${id}'].name`).replace(/[()]/g,'.')));
  }
 }
 w.selectChord(0);
 // Mixolydisch vom Akkord: B7 → A ist die ♭7, orange markiert (nur bei Nicht-Akkordtönen)
 w.setCagedScale('mixo');w.setCagedScaleRoot('chord');w.setCagedLevel(1);
 const mix=[...$('.cg-extra')];mix.forEach(g=>assert.ok([11,1,3,4,6,8,9].includes(pcAt(g))));
 const b7=mix.filter(g=>pcAt(g)===9);assert.ok(b7.length>0);b7.forEach(g=>assert.ok(g.classList.contains('cg-char')));
 w.selectChord(3);w.setCagedScale('major');w.setCagedScaleRoot('key');assert.ok($('.cg-sroot').length>0,'Skalengrundton (B über Dm) hat weißen Ring');
 w.selectChord(0);w.setCagedScale('mixo');w.setCagedScaleRoot('chord');
 // wandert mit: über E (IV) E-Mixolydisch
 w.selectChord(1);$('.cg-extra').forEach(g=>assert.ok([4,6,8,9,11,1,2].includes(pcAt(g)),'E-Mixolydisch'));
 // fest an der Tonart: Moll-Blues B über dem E-Akkord
 w.setCagedScale('minblues');w.setCagedScaleRoot('key');
 $('.cg-extra').forEach(g=>assert.ok([11,2,4,5,6,9,8,1,3].includes(pcAt(g))));
 [...$('.cg-extra.cg-scale')].forEach(g=>assert.ok([11,2,4,5,6,9].includes(pcAt(g))));
 assert.ok([...$('.cg-extra.cg-char')].every(g=>pcAt(g)===5),'Blue Note ♭5 von B ist F');
 // Beschriftung: Intervalle oder Tonnamen
 w.setCagedLabels('name');const t1=[...$('.cg-extra.cg-scale text')].map(t=>t.textContent);
 assert.ok(t1.length>0&&t1.every(x=>/^[A-G][#b♭♯]?$/.test(x)),'Tonnamen: '+t1.slice(0,4));
 w.setCagedLabels('int');const t2=[...$('.cg-extra.cg-scale text')].map(t=>t.textContent);assert.ok(t2.some(x=>/^[R2-7♭]/.test(x)));
 // Lesbarkeit: Skalentöne größer als Chromatik und kräftig gefüllt
 w.setCagedLevel(2);
 const rad=cls=>Math.max(...[...$('.cg-extra.'+cls+' circle')].map(c=>+c.getAttribute('r')));
 assert.ok(rad('cg-scale')>=11&&rad('cg-scale')>rad('cg-chrom'));
 const fs=cls=>Math.min(...[...$('.cg-extra.'+cls+' text')].map(c=>+c.getAttribute('font-size')));
 assert.ok(fs('cg-scale')>=10,'Beschriftung der Skala mindestens 10');
 w.setCagedLevel(1);
 // Skalenfenster wie im Video: 5 Bünde ab einem Bund unter dem tiefsten Anker (H-Dur: A 1–5, G 3–7, E 6–10)
 w.selectChord(0);w.setCagedScale('mixo');w.setCagedScaleRoot('chord');
 for(const [f,win] of Object.entries({A:[1,5],G:[3,7],E:[6,10]})){
  w.setCagedForm(f);
  assert.equal(J(ev('cagedWindow(S.chordLab,currentArpeggio())')),J(win),'Fenster '+f);
  [...$('.cg-extra')].forEach(g=>assert.ok(+g.dataset.fret>=win[0]&&+g.dataset.fret<=win[1]));
  const rect=[...$('.cl-region')].find(r=>r.getAttribute('stroke')==='#8ab5ff');
  assert.ok(+rect.getAttribute('x')<=ev(`fx(${win[0]})`)-20+0.01);
 }
 w.setCagedForm('A');
 const at1=[...$('.cg-extra,.arp-note,.cl-note,.overview-tone')].filter(g=>g.dataset.fret==='1').map(g=>g.dataset.string+':'+pcAt(g)).sort();
 assert.equal(at1.join(','),'2:8,3:3','Bund 1: G-Saite G#, D-Saite D#');
 w.setCagedLevel(0);assert.equal(J(ev('cagedWindow(S.chordLab,currentArpeggio())')),J(ev('(({lo,hi})=>[lo,hi])(currentArpeggio())')));
 // Quiz: Signatur ändert sich mit Skala/Grundton; ♭7 wird gefragt
 w.setCagedLevel(1);w.setCagedScale('mixo');
 const sig1=ev('cagedQuizSig(S.chordLab,currentArpeggio())');w.setCagedScale('majpent');
 assert.notEqual(sig1,ev('cagedQuizSig(S.chordLab,currentArpeggio())'));
 w.setCagedScale('mixo');w.setCagedScaleRoot('chord');w.toggleCagedQuiz();
 const seen=new Set();for(let i=0;i<80&&!seen.has('♭7');i++){seen.add(ev('cagedQuiz.q.role'));w.skipCagedQuiz();}
 assert.ok(seen.has('♭7'));w.toggleCagedQuiz();
 // Migration alter Einstellungen: scaleMode 'mixo' → Mixolydisch vom Akkord; Level 2 (Skala) → 1, Level 3 (Chromatik) → 2
 ev("S.chordLab={root:11,quality:'7',scaleMode:'mixo',level:2}");assert.equal(ev('normalizeChordLab().scale'),'mixo');assert.equal(ev('S.chordLab.scaleRoot'),'chord');assert.equal(ev('S.chordLab.level'),1);
 ev("S.chordLab={root:11,quality:'7',level:3}");assert.equal(ev('normalizeChordLab().level'),2);assert.equal(ev('S.chordLab.scale'),'auto');
 ev("S.chordLab={root:11,quality:'7',level:2,lvl:2}");assert.equal(ev('normalizeChordLab().level'),2,'neues Format bleibt');
 // Persistenz
 w.setCagedScale('dorian');w.setCagedScaleRoot('chord');w.setCagedLabels('name');w.saveSettings();
 const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings')).chordLab;
 assert.equal(saved.scale,'dorian');assert.equal(saved.scaleRoot,'chord');assert.equal(saved.labels,'name');
 // freie Griffauswahl: Kästchen verschwindet
 ev("S.chordLab.mode='grips'");w.renderChordLab();assert.equal(d.getElementById('cagedGripBox').hidden,true);
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log('PASS: CAGED-Skalen (9 Skalen × Tonart/Akkord, Kärtchen, Charakterstöne, Beschriftung, Lesbarkeit, Fenster 1–5/3–7/6–10, Anker, Griffkästchen, Quiz, Migration, Persistenz).');
}catch(e){console.error(e);process.exit(1)}
