const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE || 'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=x=>w.eval(x);
try{
 w.toggleChordLab();w.setChordLab('display','overview');w.setChordLabPosition('E');
 ev("S.prog=[{rootPc:9,third:3,fifth:7,name:'Am',rn:'i'},{rootPc:2,third:3,fifth:7,name:'Dm',rn:'iv'},{rootPc:4,third:4,fifth:7,name:'E',rn:'V'}];S.progIdx=0;strumActive=()=>{}");w.setChordLabFollow(true);
 for(let i=0;i<3;i++){
  w.selectChord(i);
  const result=ev('overviewTriads(normalizeChordLab(),currentArpeggio())');
  assert.equal(d.querySelectorAll('#fb .overview-current').length,3);
  const motion=Array.from(result.current.voice.frets).reduce((sum,f,j)=>sum+Math.abs(f-result.next.voice.frets[j]),0);
  assert.ok(motion<=12,'Suggested movement remains local for Am–Dm–E');
  const voice=Array.from(result.current.voice.frets);
  assert.ok(Math.max(...voice)-Math.min(...voice)<=5);
  voice.forEach((f,j)=>assert.ok([0,result.current.third,result.current.fifth].includes(([55,59,64][j]+f-result.current.rootPc+120)%12)));
  const predicted=Array.from(result.next.voice.frets);
  w.selectChord((i+1)%3);
  assert.deepEqual(Array.from(ev('overviewTriads(normalizeChordLab(),currentArpeggio()).current.voice.frets')),predicted);
 }
 // Full-neck dots never introduce foreign pitches, in any quality or root.
 let checked=0;
 for(let root=0;root<12;root++)for(const quality of ev('Object.keys(CL_QUALITIES)')){
  w.setChordLab('root',root);w.setChordLab('quality',quality);
  const tones=Array.from(ev('CL_QUALITIES[S.chordLab.quality].tones'));
  const dots=[...d.querySelectorAll('.overview-tone')];assert.ok(dots.length>20);
  dots.forEach(n=>assert.ok(tones.includes(([4,11,7,2,9,4][+n.dataset.string]+Number(n.dataset.fret)-root+120)%12)));
  assert.ok(!d.getElementById('fb').outerHTML.includes('NaN'));
  assert.ok(d.querySelectorAll('.cl-region').length>=5);checked++;
 }
 w.setChordLab('quality','7');assert.ok(d.querySelector('.overview-target'));assert.match(d.getElementById('clRecommendation').textContent,/Septime/);
 w.setChordLab('quality','sus4');assert.equal(d.querySelectorAll('.overview-current').length,0);assert.match(d.getElementById('clRecommendation').textContent,/keine Dur/);
 w.setChordLab('quality','minor');
 let sounded=null;w.capture=m=>{sounded=m};ev('pluck=(m)=>window.capture(m)');
 const marker=d.querySelector('.overview-current');const event=new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});marker.dispatchEvent(event);
 assert.equal(event.defaultPrevented,true);assert.equal(sounded,[64,59,55,50,45,40][+marker.dataset.string]+Number(marker.dataset.fret));
 w.toggleChordLabReveal();assert.equal(d.querySelectorAll('.overview-tone,.overview-current,.overview-next').length,0);assert.equal(d.getElementById('clRecommendation').hidden,true);
 w.toggleChordLabReveal();w.setChordLab('display','arp');assert.equal(d.querySelectorAll('.overview-current,.overview-tone').length,0);
 w.setChordLab('display','overview');w.saveSettings();assert.equal(JSON.parse(w.localStorage.getItem('gitarrenTraining.settings')).chordLab.display,'overview');
 w.toggleChordLab();assert.equal(d.getElementById('clRecommendation').hidden,true);
 assert.deepEqual(errors,[]);console.log(`PASS: ${checked} overview root/quality combinations; valid pitches, bounded triads, next-grip continuity including loop, guide tones, unsupported triads, reveal/mode exit and persistence.`);
}finally{dom.window.close();}
