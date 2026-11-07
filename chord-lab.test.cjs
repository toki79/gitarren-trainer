// npm install --no-save jsdom && node chord-lab.test.cjs
// Exhaustive pitch/fingering invariants plus DOM interaction tests. Web Audio is mocked.
const {JSDOM, VirtualConsole}=require('jsdom');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'gitarren-training.html'),'utf8');
const errors=[], audioNotes=[];
const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message));
function boot(settings) {
  return new JSDOM(html,{url:'https://test.invalid/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.scrollTo=()=>{};
    w.alert=msg=>{throw Error(msg)};
    if(settings)w.localStorage.setItem('gitarrenTraining.settings',JSON.stringify(settings));
  }});
}
const dom=boot(), w=dom.window, d=w.document, ev=code=>w.eval(code);
function test() {
  assert.deepEqual(errors,[]);
  const qualities=ev('Object.keys(CL_QUALITIES)');
  assert.equal(qualities.length,12);
  let count=0;
  for(let root=0;root<12;root++)for(const quality of qualities){
    const variants=w.chordLabVariants(root,quality), q=ev(`CL_QUALITIES[${JSON.stringify(quality)}]`);
    assert.ok(variants.length>=2,root+' '+quality+' must have alternatives');
    const ids=new Set();
    for(const v of variants){
      count++; assert.ok(!ids.has(v.id)); ids.add(v.id);
      assert.equal(v.frets.length,6); assert.equal(v.fingers.length,6);
      assert.ok(v.frets.filter(f=>f!=null).length>=4,'Full grips use 4–6 strings');
      const played=new Set();
      v.frets.forEach((f,i)=>{
        if(f==null){assert.equal(v.fingers[i],0);return}
        assert.ok(Number.isInteger(f)&&f>=0&&f<=22,`${v.id}: fret bounds`);
        assert.ok(f===0?v.fingers[i]===0:v.fingers[i]>=1&&v.fingers[i]<=4,`${v.id}: finger`);
        const pc=([4,9,2,7,11,4][i]+f-root+24)%12;
        assert.ok(q.tones.includes(pc),`${root} ${quality} ${v.id}: non-chord pitch ${pc}`); played.add(pc);
        assert.ok(w.chordLabRole(root,quality,(pc+root)%12));
      });
      for(const tone of q.essential)assert.ok(played.has(tone),`${root} ${quality} ${v.id}: missing defining tone ${tone}`);
      // A finger cannot occupy two different frets at once. Repeated fingers need a barre.
      for(let finger=1;finger<=4;finger++){
        const strings=Array.from(v.fingers,(f,i)=>f===finger?i:null).filter(i=>i!=null);
        assert.ok(new Set(strings.map(i=>v.frets[i])).size<=1,`${v.id}: finger stretched across frets`);
        if(strings.length>1)assert.ok(v.barres.some(b=>b.finger===finger&&b.from<=Math.min(...strings)&&b.to>=Math.max(...strings)),`${v.id}: missing barre`);
      }
      for(const b of v.barres){
        assert.ok(b.fret>0&&b.from<b.to&&b.finger>=1&&b.finger<=4);
        assert.equal(v.frets[b.from],b.fret); assert.equal(v.frets[b.to],b.fret);
        for(let i=b.from;i<=b.to;i++)if(v.frets[i]!=null)assert.ok(v.frets[i]>=b.fret,`${v.id}: barre would block a lower note`);
      }
    }
    if(quality==='major'){
      const caged=w.chordLabCaged(root);
      assert.deepEqual(Array.from(caged,v=>v.form),['C','A','G','E','D']);
      assert.ok(caged.every(v=>v.frets.filter(f=>f!=null).length>=4));
    }
  }
  assert.equal(w.chordLabNote(6,'7'),'E♯');
  assert.equal(w.chordLabNote(0,'♯9'),'D♯');
  assert.equal(w.chordLabNote(0,'♭3'),'E♭');
  assert.equal(w.chordLabNote(10,'3'),'D');
  const oldKey=ev('S.key'),oldScale=ev('S.scale'), oldProg=ev('JSON.stringify(S.prog)');
  const board=d.getElementById('fb');
  d.getElementById('btn-chordLab').click();
  assert.equal(board.dataset.workspace,'chord-lab');
  assert.equal(d.querySelectorAll('#clDiagram,#clMap,#clArpMap').length,0);
  assert.equal(d.getElementById('chordLab').hidden,false);
  assert.equal(d.getElementById('clRoot').options.length,12);
  assert.equal(d.getElementById('clQuality').options.length,12);
  w.setChordLab('root','0'); w.setChordLab('quality','major');
  assert.equal(d.getElementById('clTitle').textContent,'C');
  assert.deepEqual(Array.from(ev('currentChordLab().grip.frets')),[null,3,2,0,1,0]);
  assert.equal(d.querySelectorAll('#clStrings tr').length,6);
  assert.ok(d.querySelector('#fb .cl-finger'));
  assert.equal(d.querySelectorAll('#fb .cl-note').length,5);
  assert.equal(d.querySelectorAll('#fb .cl-muted').length,1);
  for(const n of d.querySelectorAll('#fb .cl-note')) {
    assert.equal(+n.querySelector('circle').getAttribute('cx'),ev(`fx(${n.dataset.fret})`));
    assert.equal(+n.querySelector('circle').getAttribute('cy'),ev(`sy(${5-Number(n.dataset.string)})`));
  }
  const first=ev('currentChordLab().grip.id');
  d.getElementById('clNext').click(); assert.notEqual(ev('currentChordLab().grip.id'),first);
  d.getElementById('clPrev').click(); assert.equal(ev('currentChordLab().grip.id'),first);
  d.getElementById('clPrev').click(); assert.equal(ev('currentChordLab().index'),ev('currentChordLab().variants.length-1'));
  w.setChordLab('quality','9');
  assert.match(d.getElementById('clTheory').textContent,/kleine Septime/);
  assert.ok(ev('CL_QUALITIES["9"].essential.includes(10)'));
  assert.ok(!ev('CL_QUALITIES.add9.tones.includes(10)'));
  // Check both actual playback entry points send only the strings shown in the diagram.
  w.captureNote=(...args)=>audioNotes.push(args);
  ev('pluck = (...args) => window.captureNote(...args)');
  const frets=Array.from(ev('currentChordLab().grip.frets'));
  const expected=frets.flatMap((f,i)=>f==null?[]:[[40,45,50,55,59,64][i]+f]);
  d.getElementById('clPlay').click(); assert.deepEqual(audioNotes.map(a=>a[0]),expected);
  assert.deepEqual(audioNotes.map(a=>a[1]),expected.map((_,i)=>i*0.055));
  audioNotes.length=0; d.getElementById('clArpeggio').click();
  assert.deepEqual(audioNotes.map(a=>a[0]),expected);
  assert.deepEqual(audioNotes.map(a=>a[1]),expected.map((_,i)=>i*0.32));
  d.getElementById('clReveal').click(); assert.equal(d.getElementById('clSolution').hidden,true);
  d.getElementById('clCagedMode').click();
  assert.equal(ev('S.chordLab.quality'),'major'); assert.equal(d.getElementById('clCaged').hidden,false);
  assert.equal(d.querySelectorAll('#fb .cl-note').length,0);
  d.getElementById('clReveal').click();
  d.querySelector('#clForms [data-form="E"]').click();
  assert.equal(ev('currentChordLab().grip.form'),'E');
  assert.ok(d.querySelector('#fb .cl-barre'));
  assert.ok(d.querySelector('#fb [data-role="R"]'));
  w.setChordLab('overlay','penta'); assert.ok(d.querySelectorAll('#fb .cl-overlay').length>20);
  w.setChordLab('overlay','triad'); assert.ok(d.querySelectorAll('#fb .cl-overlay').length>10);
  w.setChordLab('overlay','none'); assert.equal(d.querySelectorAll('#fb .cl-overlay').length,0);
  w.setChordLab('quality','m7'); assert.equal(ev('S.chordLab.mode'),'grips');
  assert.equal(d.getElementById('clCaged').hidden,true);
  assert.equal(ev('S.key'),oldKey);assert.equal(ev('S.scale'),oldScale);assert.equal(ev('JSON.stringify(S.prog)'),oldProg);
  w.useCurrentChordLab(); assert.equal(ev('S.chordLab.root'),oldKey);
  ev('S.prog=[{rootPc:0,third:3,fifth:6}]; S.progIdx=0');
  const beforeUnsupported=ev('JSON.stringify(S.chordLab)');
  w.useCurrentChordLab();
  assert.equal(ev('JSON.stringify(S.chordLab)'),beforeUnsupported);
  assert.match(d.getElementById('clNotice').textContent,/Triaden-Übung/);
  ev('S.prog=[{rootPc:2,third:3,fifth:7}]; S.progIdx=0');
  w.useCurrentChordLab();assert.equal(ev('S.chordLab.root'),2);assert.equal(ev('S.chordLab.quality'),'minor');
  assert.equal(ev('S.prog[0].rootPc'),2);
  ev('S.prog='+oldProg);
  // Render every supported quality and CAGED form; verify no invalid diagram coordinates.
  for(const quality of qualities){
    w.setChordLab('quality',quality);
    assert.ok(!d.getElementById('fb').outerHTML.includes('NaN'));
    assert.ok(d.getElementById('clTitle').textContent);
  }
  w.setChordLab('mode','caged');
  for(const form of ['C','A','G','E','D']){
    w.setChordLab('form',form);assert.ok(!d.getElementById('fb').outerHTML.includes('NaN'));
  }
  w.saveSettings(); const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
  assert.equal(saved.chordLab.mode,'caged');assert.equal(saved.chordLab.form,'D');
  d.getElementById('btn-chordLab').click(); assert.equal(d.getElementById('chordLab').hidden,true);
  assert.equal(d.getElementById('fb'),board);
  assert.equal(board.dataset.workspace,'training');
  assert.equal(board.querySelectorAll('.cl-note,.cl-region,.arp-note').length,0);
  assert.equal(d.body.classList.contains('chord-lab-open'),false);
  w.toggleChordLab();w.toggleIntervalMode();
  assert.equal(board.dataset.workspace,'training');
  assert.equal(d.getElementById('chordLab').hidden,true);
  w.toggleChordLab();w.enterScenario('free');
  assert.equal(board.dataset.workspace,'training');
  assert.equal(d.body.classList.contains('chord-lab-open'),false);
  dom.window.close();
  const restored=boot(saved);assert.equal(restored.window.eval('S.chordLab.form'),'D');restored.window.close();
  const invalid=boot({chordLab:{root:99,quality:'__proto__',index:-100,mode:'caged',form:'X',overlay:'bad'}});
  invalid.window.toggleChordLab();assert.equal(invalid.window.eval('S.chordLab.quality'),'7');
  assert.equal(invalid.window.eval('S.chordLab.root'),9);invalid.window.close();
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${count} grips across 12 roots × 12 qualities; essential pitches, fingers, barres, 5 CAGED forms per root, note spelling, diagram/UI, playback, recall, independent state and persistence.`);
}
try{test()}catch(e){console.error(e);dom.window.close();process.exitCode=1;}
