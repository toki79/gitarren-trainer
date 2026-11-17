const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.alert=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s),$=s=>[...d.querySelectorAll(s)];
try{
 // 1) Zuordnung Pentatonik-Lage ↔ CAGED-Form stimmt mit den CAGED-Bereichen des Akkord-Labors überein (alle Tonarten)
 for(const scale of ['minor','major'])for(let key=0;key<12;key++)for(let pos=1;pos<=5;pos++){
  const fr=ev(`boxNotes(${key},'${scale}',${pos}).map(n=>n.fret)`),hitsOf={};
  for(const f of 'CAGED'){const r=ev(`(({lo,hi})=>[lo,hi])(chordLabArpeggio(${key},'${scale}','${f}'))`);hitsOf[f]=Math.max(...[-12,0,12].map(sh=>fr.filter(x=>x>=r[0]+sh&&x<=r[1]+sh).length));}
  const form=ev(`formOfPos(${pos},'${scale}')`),best=Math.max(...Object.values(hitsOf));
  assert.ok(hitsOf[form]>=best-1,`${scale} Tonart ${key} Lage ${pos} → ${form}: ${JSON.stringify(hitsOf)}`);
 }
 assert.deepEqual(['minor','major'].map(sc=>[1,2,3,4,5].map(p=>ev(`formOfPos(${p},'${sc}')`)).join('')),['EDCAG','GEDCA']);
 assert.equal(ev("posOfForm('E','minor')"),1);assert.equal(ev("posOfForm('E','major')"),2);assert.equal(ev("posOfForm('X','minor')"),0);
 // 2) Bibliothek: jeder Lick hat eine CAGED-Form, kein Lick hat noch box
 const lib=ev('BUILTIN_LICKS.map(l=>({id:l.id,name:l.name,form:l.form,box:l.box,scale:l.scale}))');
 assert.ok(lib.length>10);lib.forEach(l=>{assert.ok('CAGED'.includes(l.form)&&l.form.length===1,l.id);assert.equal(l.box,undefined);});
 assert.equal(lib.find(l=>l.id==='m-b1-call').form,'E');assert.equal(lib.find(l=>l.id==='m-b2-run')?.form||lib.find(l=>l.id==='m-b2-blue').form,'D');
 assert.equal(lib.find(l=>l.id==='d-b1-country').form,'G','Dur: Lage 1 = G-Form');
 lib.forEach(l=>assert.ok(!/\bBox\b/.test(l.name.replace(/BB-Box/g,'')),'Name ohne Box: '+l.name));
 // erkannte Form liegt höchstens eine Lage neben der hinterlegten (Blue-Note-Licks reichen über den Rand)
 const bad=ev("BUILTIN_LICKS.filter(l=>{const f=detectForm(l);return f&&Math.abs(posOfForm(f,l.scale)-posOfForm(l.form,l.scale))>1}).map(l=>l.id+':'+l.form+'≠'+detectForm(l))");
 assert.equal(JSON.stringify(bad),'[]');
 // 3) Migration: Alt-Lick mit box → form, ohne box → erkannt; Import alter Exporte
 localStorage=w.localStorage;
 const n=(s,f,d_=1)=>({s,fret:f,d:d_});
 w.localStorage.setItem('gitarrenTraining.licks',JSON.stringify([
  {id:'old1',name:'alt mit Box',key:9,scale:'minor',box:3,notes:[n(5,5),n(5,8)]},
  {id:'old2',name:'alt ohne Box',key:9,scale:'minor',notes:[n(5,5),n(5,8),n(4,5),n(4,7)]},
  {id:'new1',name:'neu',key:9,scale:'minor',form:'A',notes:[n(5,5)]}]));
 ev('loadLicks()');
 const byId=Object.fromEntries(ev('S.licks').map(l=>[l.id,l]));
 assert.equal(byId.old1.form,'C');assert.equal(byId.old1.box,undefined);
 assert.equal(byId.old2.form,'E');assert.equal(byId.new1.form,'A');
 // Dur-Alt-Lick: Box 2 → E-Form
 w.localStorage.setItem('gitarrenTraining.licks',JSON.stringify([{id:'old3',name:'dur',key:9,scale:'major',box:2,notes:[n(5,5)]}]));
 ev('loadLicks()');assert.equal(ev('S.licks[0].form'),'E');
 // 4) Oberfläche: Toolbar-Buttons, Moll/Dur, Form bleibt beim Wechsel erhalten
 const labels=()=>$('#posBtns button').map(b=>b.textContent).join(',');
 w.setScale('minor');assert.equal(labels(),'Alle,E-Form,D-Form,C-Form,A-Form,G-Form');
 w.setPos(1);assert.equal(ev('formOfPos(S.pos)'),'E');
 w.setScale('major');assert.equal(labels(),'Alle,G-Form,E-Form,D-Form,C-Form,A-Form');
 assert.equal(ev('formOfPos(S.pos)'),'E','E-Form bleibt gewählt');assert.equal(d.querySelector('#posBtns .active').textContent,'E-Form');
 w.setPos(0);w.setScale('minor');assert.equal(ev('S.pos'),0);
 assert.match(d.getElementById('info').textContent,/Alle CAGED-Formen/);
 w.setPos(2);assert.match(d.getElementById('info').textContent,/D-Form/);
 // 5) Lick-Tabelle: Filter und Spalte
 assert.equal(d.getElementById('lfBox'),null);assert.equal(d.getElementById('editBox'),null);
 w.setLickFilter('form','D');const rows=$('#lickTable tbody tr,#lickBody tr');
 assert.ok(d.body.textContent.includes('D-Form'));
 assert.ok(ev("lickRows().length")>0);assert.ok(ev("lickRows().every(r=>r.l.form==='D')"));
 w.setLickFilter('form','');assert.ok(ev("lickRows().some(r=>r.l.form==='E')"));
 // 6) Editor speichert die Form
 ev("S.editForm='G'");assert.equal(d.getElementById('editForm').options.length,6);
 // 7) Begriffe: kein „Box“ mehr im sichtbaren Text und in Tooltips (außer „BB-Box“ als Eigenname)
 const clone=d.body.cloneNode(true);clone.querySelectorAll('script,style').forEach(e=>e.remove());
 const texts=[clone.textContent,...$('[title],[aria-label],option,[placeholder]').map(e=>(e.getAttribute('title')||'')+' '+(e.getAttribute('aria-label')||'')+' '+(e.getAttribute('placeholder')||'')+' '+(e.tagName==='OPTION'?e.textContent:''))].join('\n');
 const hits=texts.split('\n').flatMap(l=>[...l.replace(/BB-Box/g,'').matchAll(/.{0,30}\b[Bb]ox(en)?\b.{0,30}/g)].map(m=>m[0]));
 assert.equal(hits.join(' | '),'','verbleibendes „Box“');
 assert.deepEqual(errors,[]);
 console.log('PASS: CAGED-Formen (Zuordnung Lage↔Form in 24 Tonarten/Skalen, Lick-Formen, Migration, Filter/Editor, Moll/Dur, Begriffe).');
}catch(e){console.error(e);process.exitCode=1}finally{dom.window.close();}
