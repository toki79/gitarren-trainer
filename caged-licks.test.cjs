const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s);
const bar=()=>d.getElementById('cagedBar');
try{
 // Leiste nur bei aktivem CAGED sichtbar, direkt unter dem Griffbrett
 assert.equal(bar().hidden,true);
 assert.ok(d.getElementById('fb').compareDocumentPosition(bar())&4);
 ev("S.key=9;S.scale='minor';S.prog=[{rootPc:9,third:3,fifth:7,name:'Am',rn:'i'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'iv'},{rootPc:4,third:4,fifth:7,name:'E',rn:'V'}];S.progIdx=0;strumActive=()=>{}");
 w.setFretboardLayer('caged',true);
 assert.equal(bar().hidden,false);
 assert.deepEqual([...d.querySelectorAll('#cagedForms [data-form]')].map(b=>b.dataset.form),['E','A','C','D','G']);
 // Formwahl setzt die aktive Form und markiert den Button
 for(const f of ['E','A','C','D','G']){w.setCagedForm(f);assert.equal(ev('S.chordLab.form'),f);assert.equal(d.querySelector('#cagedForms .active').dataset.form,f);}
 // Modus wandert: Region folgt dem Akkord
 w.setCagedForm('E');assert.equal(ev('S.chordLab.formMode'),'follow');
 const regionAm=ev('(({lo,hi})=>[lo,hi])(currentArpeggio())');
 w.selectChord(1);assert.equal(ev('S.chordLab.root'),2);
 const regionDm=ev('(({lo,hi})=>[lo,hi])(currentArpeggio())');
 assert.notDeepEqual(regionAm,regionDm,'Form wandert mit dem Akkord');
 // Modus fest: Region bleibt am Key-Akkord, Töne sind die des aktiven Akkords
 w.setCagedFormMode('fixed');
 assert.equal(d.querySelector('#cagedFormMode .active').dataset.mode,'fixed');
 const keyRegion=ev('(({lo,hi})=>[lo,hi])(chordLabArpeggio(S.key,"minor","E",S.key))');
 assert.deepEqual(ev('(({lo,hi})=>[lo,hi])(currentArpeggio())'),keyRegion);
 w.selectChord(2);assert.deepEqual(ev('(({lo,hi})=>[lo,hi])(currentArpeggio())'),keyRegion);
 assert.equal(ev('S.chordLab.root'),4);
 const d1=ev('currentArpeggio()');assert.ok(d1.notes.length>0);
 d1.notes.forEach(n=>{assert.ok(n.fret>=keyRegion[0]&&n.fret<=keyRegion[1]);assert.ok(ev(`chordLabRole(4,"major",${n.pc})`));});
 // Lick-Liste: nur Moll-Licks, Anteil in der Form ≥ 50 %, passende zuerst
 w.setCagedFormMode('follow');w.selectChord(0);
 const rows=ev('cagedLickRows(normalizeChordLab(),currentArpeggio())');
 assert.ok(rows.length>0,'es gibt passende Licks');
 rows.forEach(r=>{assert.equal(r.l.scale,'minor');assert.ok(r.placed.share>=0.5);assert.equal(r.fit,r.placed.share>=0.7);});
 const firstEdge=rows.findIndex(r=>!r.fit);if(firstEdge>=0)assert.ok(rows.slice(firstEdge).every(r=>!r.fit),'Ausbrüche stehen hinter den passenden');
 assert.equal(d.querySelectorAll('#cagedLickList .cg-lick').length,rows.length);
 // Passende Licks liegen tatsächlich im Halsbereich
 const reg=ev('currentArpeggio()');
 rows.filter(r=>r.fit).forEach(r=>{const p=r.placed.notes.filter(n=>!n.rest&&!n.tie);assert.ok(p.filter(n=>n.fret>=reg.lo-1&&n.fret<=reg.hi+1).length/p.length>=0.7);});
 // Auswahl zeigt das Lick im CAGED-Bild, ohne die CAGED-Ansicht zu schließen
 const id=rows[0].l.id;d.querySelector('#cagedLickList .cg-pick').click();
 assert.equal(ev('S.selectedLick'),id);assert.equal(ev('chordLabOpen'),true);
 assert.ok(d.querySelectorAll('#fb .cg-lick-note').length>0);
 assert.match(d.getElementById('fbWorkspaceStatus').textContent,/Lick:/);
 assert.ok(d.querySelector('#cagedLickList .cg-pick.active'));
 // Akkordwechsel: Liste und Lick folgen
 const before=d.getElementById('cagedInfo').textContent;w.selectChord(1);assert.notEqual(d.getElementById('cagedInfo').textContent,before);
 // Spielen nutzt die gezeigten Töne
 let played=[];ev('window.__p=[];pluck=(m)=>window.__p.push(m)');w.playCagedLick(id);assert.ok(ev('window.__p').length>0);
 // Erneuter Klick hebt die Auswahl auf
 d.querySelector('#cagedLickList .cg-pick.active')&&d.querySelector('#cagedLickList .cg-pick.active').click();
 assert.equal(ev('S.selectedLick'),null);assert.equal(d.querySelectorAll('#fb .cg-lick-note').length,0);
 // Freie Griffauswahl: keine Liste
 w.setChordLab('mode','grips');assert.equal(d.getElementById('cagedLickList').children.length,0);
 // CAGED aus → Leiste weg
 w.setCagedForm('A');w.setFretboardLayer('caged',false);assert.equal(bar().hidden,true);
 // Persistenz des Modus
 w.setFretboardLayer('caged',true);w.setCagedFormMode('fixed');w.saveSettings();
 const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));assert.equal(saved.chordLab.formMode,'fixed');
 assert.deepEqual(errors,[]);
 console.log('PASS: CAGED bar (forms E/A/C/D/G, follow/fixed region, lick matching by form, selection overlay, playback, persistence).');
}finally{dom.window.close();}
