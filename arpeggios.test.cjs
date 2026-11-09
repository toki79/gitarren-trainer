// node arpeggios.test.cjs (requires jsdom for the DOM/playback half)
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'gitarren-training.html'),'utf8');
const code=html.slice(html.indexOf('const CL_ROOTS ='),html.lastIndexOf('// ─── Init'));
const core=vm.createContext({S:{},FRETS:22,mod12:n=>(n%12+12)%12,OPEN_PC:[4,11,7,2,9,4],OPEN_MIDI:[64,59,55,50,45,40]});
vm.runInContext(code,core);
let checked=0;
for(let root=0;root<12;root++)for(const quality of vm.runInContext('Object.keys(CL_QUALITIES)',core))for(const form of ['C','A','G','E','D']) {
  const a=core.chordLabArpeggio(root,quality,form), tones=vm.runInContext(`CL_QUALITIES[${JSON.stringify(quality)}].tones`,core);
  assert.ok(a.sequence.length>0);
  assert.equal(new Set(a.sequence.map(n=>n.midi)).size,a.sequence.length);
  for(const n of a.notes){
    assert.ok(tones.includes((n.pc-root+12)%12));
    assert.ok(n.fret>=a.lo&&n.fret<=a.hi&&n.fret<=22);
    assert.equal(n.midi,[64,59,55,50,45,40][n.s]+n.fret);
    assert.ok(['0','1','2','3','4','4+'].includes(n.finger));
    if(n.inGrip)assert.equal(a.grip.frets[5-n.s],n.fret);
  }
  for(const tone of tones)assert.ok(a.notes.some(n=>n.pc===(root+tone)%12),`${root} ${quality} ${form}: missing ${tone}`);
  for(let i=1;i<a.sequence.length;i++)assert.ok(a.sequence[i].midi>a.sequence[i-1].midi);
  checked++;
}
console.log(`PASS: ${checked} regions: all chord tones, no foreign tones, MIDI/fret bounds, unique ascending pitches, grip anchors and finger hints.`);
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE || 'jsdom');
const errors=[], played=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://test.invalid/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s);
try{
  assert.deepEqual(errors,[]);
  w.capture=(...args)=>played.push(args);ev('pluck=(...args)=>window.capture(...args)');
  let nextTimer=1;const timers=new Map();
  w.setTimeout=(cb,delay)=>{const id=nextTimer++;timers.set(id,{cb,delay});return id};
  w.clearTimeout=id=>timers.delete(id);
  const flush=()=>{const pending=[...timers.values()].sort((a,b)=>a.delay-b.delay);timers.clear();pending.forEach(t=>t.cb());};
  w.toggleChordLab();w.setChordLab('root',9);w.setChordLab('quality','7');
  w.setChordLabPosition('E');w.setChordLab('display','arp');
  assert.equal(ev('S.chordLab.quality'),'7','Entering arpeggios must not switch to major');
  assert.equal(d.getElementById('clPosition').value,'E');
  assert.equal(d.getElementById('clGripControls').hidden,true);
  assert.ok(d.getElementById('fb').textContent.includes('♭7'));
  assert.ok(!d.getElementById('fb').outerHTML.includes('NaN'));
  assert.equal(d.querySelectorAll('#fb .arp-note').length,ev('currentArpeggio().notes.length'));
  assert.ok(d.querySelectorAll('#clArpSequence button').length>0);
  const expected=Array.from(ev('currentArpeggio().sequence'),n=>n.midi);
  w.playArpeggio('up');flush();
  assert.deepEqual(played.map(a=>a[0]),expected);
  assert.equal(d.getElementById('clTransport').getAttribute('aria-pressed'),'false');
  played.length=0;w.playArpeggio('down');flush();
  assert.deepEqual(played.map(a=>a[0]),[...expected].reverse());
  played.length=0;w.playArpeggio('both');flush();
  assert.deepEqual(played.map(a=>a[0]),[...expected,...expected.slice(0,-1).reverse()]);
  played.length=0;ev('arpCursor=-1');
  d.getElementById('clArpStep').click();d.getElementById('clArpStep').click();
  assert.deepEqual(played.map(a=>a[0]),expected.slice(0,2));
  assert.equal(d.querySelectorAll('#fb .arp-current').length,1);
  w.render();assert.equal(d.querySelectorAll('#fb .arp-current').length,1,'Redraw preserves current note');
  assert.match(d.getElementById('clArpStatus').textContent,/Finger|leere Saite/);
  const marker=d.querySelector('#fb .arp-note');
  const key=new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});
  marker.dispatchEvent(key);assert.equal(key.defaultPrevented,true);assert.equal(ev('S.metroOn'),false);
  played.length=0;w.playArpeggio('up');
  const stale=[...timers.values()];w.stopArpeggio();
  stale.forEach(t=>t.cb());assert.equal(played.length,1);assert.equal(timers.size,0);
  played.length=0;w.playArpeggio('up');
  const staleContext=[...timers.values()];w.setChordLab('quality','minor');
  staleContext.forEach(t=>t.cb());assert.equal(played.length,1);
  assert.equal(ev('S.chordLab.mode'),'arp');
  assert.ok(d.getElementById('fb').textContent.includes('♭3'));
  assert.ok(!ev('currentArpeggio().notes.some(n=>n.role==="3")'));
  w.setChordLab('form','E');
  const oldNotes=new Set(Array.from(ev('currentArpeggio().notes'),n=>`${n.s}:${n.fret}`));
  d.getElementById('clArpNextForm').click();
  const shared=Array.from(ev('currentArpeggio().notes')).filter(n=>oldNotes.has(`${n.s}:${n.fret}`));
  assert.equal(d.querySelectorAll('#fb .arp-shared').length,shared.length);
  assert.ok(shared.length>0);
  w.setChordLab('root',0);assert.equal(d.querySelectorAll('#fb .arp-shared').length,0);
  w.setChordLab('arpBpm',999);assert.equal(ev('S.chordLab.arpBpm'),160);
  w.setChordLab('arpBpm',0);assert.equal(ev('S.chordLab.arpBpm'),40);
  w.setChordLab('quality','13');
  assert.ok(ev('currentArpeggio().notes.some(n=>n.role==="13")'));
  w.setChordLab('quality','major');w.setChordLab('form','C');
  assert.ok(ev('currentArpeggio().grip'));
  played.length=0;w.playArpeggioGrip();
  assert.equal(played.length,ev('currentArpeggio().grip.frets.filter(f=>f!=null).length'));
  // Single transport starts/stops both runs and individual chord strings.
  for(const display of ['arp','both','grip'])for(const direction of ['up','down','both','chord']){
    w.setChordLab('display',display);w.setChordLab('playback',direction);played.length=0;
    d.getElementById('clTransport').click();
    assert.equal(d.getElementById('clTransport').getAttribute('aria-pressed'),'true');
    const pending=[...timers.values()];d.getElementById('clTransport').click();
    pending.forEach(t=>t.cb());assert.equal(played.length,1,'Stop cancels future strings/notes');
    assert.equal(timers.size,0);assert.equal(d.getElementById('clTransport').getAttribute('aria-pressed'),'false');
    played.length=0;d.getElementById('clTransport').click();flush();
    const source=display==='grip'||direction==='chord'
      ? Array.from(ev('currentArpeggio().grip.frets')).flatMap((f,i)=>f==null?[]:[[40,45,50,55,59,64][i]+f])
      : Array.from(ev('currentArpeggio().sequence'),n=>n.midi);
    const wanted=direction==='down'?[...source].reverse():direction==='both'?[...source,...source.slice(0,-1).reverse()]:source;
    assert.deepEqual(played.map(n=>n[0]),wanted);
    assert.equal(d.getElementById('clTransport').getAttribute('aria-pressed'),'false');
  }
  w.setChordLabPosition('free');d.getElementById('clTransport').click();
  const oldGripTimers=[...timers.values()];played.length=0;w.stepChordLab(1);
  oldGripTimers.forEach(t=>t.cb());assert.equal(played.length,0);
  w.setChordLabPosition('C');w.setChordLab('display','arp');
  // Progression changes use the same render path as scheduled beat callbacks.
  ev("S.prog=[{rootPc:9,third:3,fifth:7,name:'Am',rn:'i'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'iv'},{rootPc:4,third:4,fifth:7,name:'E',rn:'V'},{rootPc:11,third:3,fifth:6,name:'Bdim',rn:'ii°'}];S.progIdx=0;strumActive=()=>{}");
  w.setChordLabFollow(true);w.setChordLabPosition('E');
  assert.equal(d.getElementById('clTitle').textContent,'Am');
  assert.equal(ev('S.chordLab.quality'),'minor');
  w.playArpeggio('up');const staleProgression=[...timers.values()];played.length=0;
  w.selectChord(1);staleProgression.forEach(t=>t.cb());assert.equal(played.length,0);
  assert.equal(d.getElementById('clTitle').textContent,'Dm');
  assert.equal(ev('S.chordLab.form'),'E');assert.equal(ev('S.chordLab.display'),'arp');
  assert.ok(Array.from(ev('currentArpeggio().notes')).every(n=>[2,5,9].includes(n.pc)));
  ev('S.progIdx=2');w.render();assert.equal(d.getElementById('clTitle').textContent,'E');
  assert.equal(ev('S.chordLab.quality'),'major');
  w.selectChord(3);assert.equal(d.querySelectorAll('#fb .arp-note,#fb .cl-note').length,0);
  assert.match(d.getElementById('clNotice').textContent,/noch keine CAGED/);
  assert.equal(d.getElementById('clTransport').disabled,true);
  w.selectChord(0);assert.equal(d.getElementById('clTransport').disabled,false);
  assert.ok(d.querySelector('#fb .arp-note'));
  w.setChordLab('root',0);assert.equal(d.getElementById('clFollow').checked,false);
  w.selectChord(1);assert.equal(ev('S.chordLab.root'),0,'Manual selection stays independent');
  w.setChordLabFollow(true);assert.equal(ev('S.chordLab.root'),2);
  ev('S.prog=[];S.progIdx=-1');w.render();assert.equal(d.getElementById('clTransport').disabled,false);
  w.setChordLabPosition('C');
  w.playArpeggio('up');w.toggleChordLab();assert.equal(timers.size,0);
  w.saveSettings();const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
  assert.equal(saved.chordLab.mode,'arp');assert.equal(saved.chordLab.form,'C');assert.equal(saved.chordLab.arpBpm,40);
  const restored=new JSDOM(html,{url:'https://test.invalid/',runScripts:'dangerously',virtualConsole:vc,beforeParse(window){window.scrollTo=()=>{};window.localStorage.setItem('gitarrenTraining.settings',JSON.stringify(saved));}});
  restored.window.toggleChordLab();assert.equal(restored.window.document.getElementById('clPosition').value,'C');restored.window.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: arpeggio mode/quality, SVG/keyboard interaction, up/down/return/step playback, tempo bounds, stop/context cancellation, shared positions, grip audio and persistence.');
}finally{dom.window.close();}
