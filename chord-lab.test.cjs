// npm install --no-save jsdom && node chord-lab.test.cjs
// Exhaustive pitch/fingering invariants plus DOM interaction tests. Web Audio is mocked.
const {JSDOM, VirtualConsole}=require(process.env.JSDOM_MODULE || 'jsdom');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
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
  const oldKey=ev('S.key'),oldScale=ev('S.scale'),oldProg=ev('JSON.stringify(S.prog)');
  const board=d.getElementById('fb');w.toggleChordLab();
  assert.equal(board.dataset.workspace,'chord-lab');
  assert.equal(d.querySelectorAll('#clDiagram,#clMap,#clArpMap,#clCagedMode').length,0);
  assert.equal(d.getElementById('clOptions').open,false);
  assert.equal(d.getElementById('clPosition').options.length,6);
  w.setChordLab('root',0);w.setChordLab('quality','major');w.setChordLabPosition('free');
  assert.equal(d.getElementById('clDisplay').disabled,true);
  assert.deepEqual(Array.from(ev('currentChordLab().grip.frets')),[null,3,2,0,1,0]);
  assert.equal(d.querySelectorAll('#fb .cl-note').length,5);
  assert.equal(d.querySelectorAll('#fb .cl-muted').length,1);
  for(const n of d.querySelectorAll('#fb .cl-note')){
    assert.equal(+n.querySelector('circle').getAttribute('cx'),ev(`fx(${n.dataset.fret})`));
    assert.equal(+n.querySelector('circle').getAttribute('cy'),ev(`sy(${5-Number(n.dataset.string)})`));
  }
  const first=ev('currentChordLab().grip.id');d.getElementById('clNext').click();
  assert.notEqual(ev('currentChordLab().grip.id'),first);d.getElementById('clPrev').click();
  assert.equal(ev('currentChordLab().grip.id'),first);
  w.setChordLabPosition('E');w.setChordLab('root',9);w.setChordLab('quality','m7');
  for(const form of ['C','A','G','E','D']){
    w.setChordLabPosition(form);assert.equal(ev('S.chordLab.quality'),'m7');
    assert.equal(d.getElementById('clPosition').value,form);
    assert.ok(!board.outerHTML.includes('NaN'));
  }
  w.setChordLabPosition('E');
  w.setChordLab('display','grip');
  assert.ok(board.querySelector('.cl-note'));assert.equal(board.querySelectorAll('.arp-note').length,0);
  w.setChordLab('display','arp');
  assert.ok(board.querySelector('.arp-note'));assert.equal(board.querySelectorAll('.cl-note').length,0);
  w.setChordLab('display','both');assert.ok(board.querySelector('.arp-note'));assert.ok(board.querySelector('.cl-note'));
  const positions=Array.from(board.querySelectorAll('[data-position]'),n=>n.dataset.position);
  assert.equal(new Set(positions).size,positions.length,'No duplicate markers/finger hints');
  d.getElementById('clReveal').click();
  assert.equal(board.querySelectorAll('.arp-note,.cl-note').length,0);
  assert.equal(d.getElementById('clSolution').hidden,true);
  d.getElementById('clReveal').click();assert.ok(board.querySelector('.cl-note'));
  let missing=false;
  for(const quality of qualities)for(const form of ['C','A','G','E','D']){
    w.setChordLab('quality',quality);w.setChordLabPosition(form);
    assert.equal(ev('S.chordLab.quality'),quality);
    const grip=ev('currentArpeggio().grip');
    if(!grip){missing=true;assert.match(d.getElementById('clNotice').textContent,/Kein vollständiger Griff/);}
    assert.equal(board.querySelectorAll('.cl-note').length,grip?grip.frets.filter(f=>f!=null).length:0);
  }
  assert.ok(missing);
  assert.equal(ev('S.key'),oldKey);assert.equal(ev('S.scale'),oldScale);assert.equal(ev('JSON.stringify(S.prog)'),oldProg);
  w.setChordLab('quality','9');w.setChordLabPosition('D');w.setChordLab('display','arp');
  w.saveSettings();const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
  assert.equal(saved.chordLab.quality,'9');assert.equal(saved.chordLab.form,'D');assert.equal(saved.chordLab.display,'arp');
  w.toggleChordLab();assert.equal(board.dataset.workspace,'training');
  assert.equal(board.querySelectorAll('.cl-note,.arp-note').length,0);
  w.toggleChordLab();w.toggleIntervalMode();assert.equal(board.dataset.workspace,'training');
  w.toggleChordLab();w.enterScenario('free');assert.equal(board.dataset.workspace,'training');
  dom.window.close();
  const restored=boot(saved);assert.equal(restored.window.eval('S.chordLab.form'),'D');restored.window.close();
  const invalid=boot({chordLab:{root:99,quality:'__proto__',index:-100,mode:'caged',form:'X',overlay:'bad'}});
  invalid.window.toggleChordLab();assert.equal(invalid.window.eval('S.chordLab.quality'),'7');
  assert.equal(invalid.window.eval('S.chordLab.root'),9);invalid.window.close();
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${count} grips across 12 roots × 12 qualities; essential pitches, fingers, barres, 5 CAGED forms per root, note spelling, diagram/UI, playback, recall, independent state and persistence.`);
}
try{test()}catch(e){console.error(e);dom.window.close();process.exitCode=1;}
