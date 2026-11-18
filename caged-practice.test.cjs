const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s);
const bar=()=>d.getElementById('cagedBar'),$=s=>d.querySelectorAll(s);
const region=()=>ev('(({lo,hi})=>[lo,hi])(currentArpeggio())');
(async()=>{try{
 assert.equal(bar().hidden,true);
 assert.ok(d.getElementById('fb').compareDocumentPosition(bar())&4);
 ev("S.key=9;S.scale='minor';S.prog=[{rootPc:9,third:3,fifth:7,name:'Am',rn:'i'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'iv'},{rootPc:4,third:4,fifth:7,name:'E',rn:'V'}];S.progIdx=0;strumActive=()=>{};window.__p=[];pluck=m=>window.__p.push(m)");
 w.setFretboardLayer('caged',true);
 assert.equal(bar().hidden,false);
 assert.equal(d.getElementById('cagedLickList'),null,'Lick-Liste entfernt');
 assert.deepEqual([...$('#cagedForms [data-form]')].map(b=>b.dataset.form),['E','A','C','D','G']);
 for(const f of ['E','A','C','D','G']){w.setCagedForm(f);assert.equal(ev('S.chordLab.form'),f);assert.equal(d.querySelector('#cagedForms .active').dataset.form,f);}
 // wandert vs. fest
 w.setCagedForm('E');const regionAm=region();w.selectChord(1);assert.notDeepEqual(region(),regionAm);
 w.setCagedFormMode('fixed');const keyRegion=ev('(({lo,hi})=>[lo,hi])(chordLabArpeggio(S.key,"minor","E",S.key))');
 assert.deepEqual(region(),keyRegion);w.selectChord(2);assert.deepEqual(region(),keyRegion);
 w.setCagedFormMode('follow');w.selectChord(0);
 // Stufen: nur zusätzliche Töne innerhalb der Form, nie auf belegten Positionen
 const pcAt=g=>ev(`(OPEN_PC[${g.dataset.string}]+${g.dataset.fret})%12`);
 const counts=[];
 for(const lvl of [0,1,2,3]){
  w.setCagedLevel(lvl);assert.equal(d.querySelector('#cagedLevel .active').dataset.level,String(lvl));assert.equal(ev('S.chordLab.level'),lvl);
  const [lo,hi]=ev('cagedWindow(S.chordLab,currentArpeggio())'),extras=[...$('.cg-extra')];counts.push(extras.length);
  const seen=new Set();extras.forEach(g=>{assert.ok(+g.dataset.fret>=lo&&+g.dataset.fret<=hi);const k=g.dataset.string+':'+g.dataset.fret;assert.ok(!seen.has(k));seen.add(k);});
  const allowed={0:['chord'],1:['chord','pent'],2:['chord','pent','scale'],3:['chord','pent','scale','chrom']}[lvl];
  extras.forEach(g=>assert.ok(allowed.some(k=>g.classList.contains('cg-'+k)),'Klasse passt zur Stufe'));
  const occupied=new Set([...$('.cl-note,.arp-note,.overview-grip-note')].map(g=>{const c=g.querySelector('circle');return c.getAttribute('cx')+':'+c.getAttribute('cy')}));
  extras.forEach(g=>{const c=g.querySelector('circle');assert.ok(!occupied.has(c.getAttribute('cx')+':'+c.getAttribute('cy')))});
 }
 assert.ok(counts[3]>counts[2]&&counts[2]>=counts[1]&&counts[1]>=counts[0],'Stufen blenden mehr ein: '+counts);
 // Skala: Am natürlich Moll (A H C D E F G), Pentatonik ohne H und F
 w.setCagedLevel(2);$('.cg-extra').forEach(g=>assert.ok([9,11,0,2,4,5,7].includes(pcAt(g))));
 w.setCagedLevel(1);$('.cg-extra').forEach(g=>assert.ok([9,0,2,4,7].includes(pcAt(g))));
 // Zielton-Hinweis
 assert.match(d.getElementById('cagedNext').textContent,/Nächster Akkord Dm: Zielton Terz = F/);
 w.setCagedFormMode('fixed');assert.ok(d.querySelector('.cg-target'));
 w.setCagedFormMode('follow');
 // Quiz
 w.setCagedLevel(1);w.toggleCagedQuiz();
 assert.equal(d.getElementById('cagedQuizBtn').textContent,'Quiz beenden');
 const q=()=>ev('cagedQuiz.q');assert.ok(q()&&/Wo liegt/.test(d.getElementById('cagedQuizQ').textContent));
 assert.equal($('.cg-extra,.arp-note,.cl-note').length,0,'im Quiz keine beschrifteten Lösungen');
 const targets=[...$('.cg-quiz-target')];assert.ok(targets.length>0);
 targets.forEach(g=>assert.equal(g.querySelector('text'),null,'keine Beschriftung'));
 const pcsOf=g=>pcAt(g);
 // falsch zuerst
 const wrong=targets.find(g=>pcsOf(g)!==q().pc),right=()=>[...$('.cg-quiz-target')].find(g=>pcsOf(g)===q().pc);
 if(wrong){wrong.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.match(d.getElementById('cagedQuizScore').textContent,/✗/);assert.ok(d.querySelector('.cg-quiz-target.wrong'));}
 const firstQ=q().pc;
 right().dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 assert.match(d.getElementById('cagedQuizScore').textContent,/✓ Richtig/);assert.ok(d.querySelector('.cg-quiz-target.right'));
 assert.equal(ev('cagedQuiz.total'),1);assert.equal(ev('cagedQuiz.ok'),wrong?0:1);
 assert.ok(ev('window.__p').length>=1);
 // nächste Frage kommt automatisch
 await new Promise(r=>setTimeout(r,1100));assert.equal(ev('cagedQuiz.reveal'),null);assert.ok(q());
 // Akkordwechsel erzeugt neue Frage für den neuen Akkord
 w.selectChord(1);assert.match(d.getElementById('cagedQuizQ').textContent,/Dm\?/);
 // Überspringen, Beenden
 w.skipCagedQuiz();assert.ok(q());
 w.toggleCagedQuiz();assert.equal(ev('cagedQuiz.active'),false);assert.ok($('.cg-extra').length>0);
 // Quiz endet, wenn CAGED ausgeschaltet wird
 w.toggleCagedQuiz();w.setFretboardLayer('caged',false);assert.equal(ev('cagedQuiz.active'),false);assert.equal(bar().hidden,true);
 // Kopplung Symbolleiste ↔ CAGED-Feld
 w.setFretboardLayer('caged',true);w.setScale('minor');w.setPos(2);
 assert.equal(ev('S.chordLab.form'),'D');assert.equal(d.querySelector('#cagedForms .active').dataset.form,'D');
 w.setCagedForm('C');assert.equal(ev('S.pos'),3);assert.equal(d.querySelector('#posBtns .active').textContent,'C-Form');
 w.setScale('major');assert.equal(ev('formOfPos(S.pos)'),'C');assert.equal(ev('S.chordLab.form'),'C');
 w.setCagedForm('G');assert.equal(ev('S.pos'),1);assert.equal(d.querySelector('#posBtns .active').textContent,'G-Form');
 w.setPos(0);assert.equal(ev('S.chordLab.form'),'G','Alle lässt die Form im CAGED-Feld stehen');
 w.setPos(3);assert.equal(ev('S.chordLab.form'),'D');w.setScale('minor');
 // Persistenz
 w.setFretboardLayer('caged',true);w.setCagedLevel(3);w.setCagedFormMode('fixed');w.saveSettings();
 const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));assert.equal(saved.chordLab.level,3);assert.equal(saved.chordLab.formMode,'fixed');
 assert.deepEqual(errors,[]);
 console.log('PASS: CAGED practice (forms, follow/fixed, levels 0-3 incl. scale sets, next-chord hint, quiz flow, persistence).');
}catch(e){console.error(e);process.exitCode=1}finally{dom.window.close();}})();
