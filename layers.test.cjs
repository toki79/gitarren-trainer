const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s);
try{
 assert.equal(d.getElementById('clDisplay'),null);
 assert.ok(d.getElementById('fbLayers').compareDocumentPosition(d.getElementById('fb'))&4);
 d.getElementById('layerPenta').click();
 assert.equal(d.getElementById('layerPenta').checked,true);assert.equal(d.getElementById('layerCaged').checked,false);assert.equal(d.getElementById('layerTriads').checked,false);
 ev('S.key=9;S.scale="minor"');w.setChordLab('root',5);w.setChordLab('quality','major');
 const selectors={caged:'.overview-grip',penta:'.pentatonic-note',triads:'.overview-current',arp:'.arp-rings',scale:'.scale-note,.scale-shared'};
 const scalePositions=()=>Array.from(d.querySelectorAll('.scale-note,.scale-shared'),g=>g.dataset.string+':'+g.dataset.fret);
 function expectedScale(root,intervals){
   const positions=[];
   [4,11,7,2,9,4].forEach((open,s)=>{
     for(let f=0;f<=22;f++) if(intervals.includes((open+f-root+12)%12))positions.push(s+':'+f);
   });
   return positions;
 }
 const minor=[0,2,3,5,7,8,10],major=[0,2,4,5,7,9,11];
 for(let mask=0;mask<32;mask++){
  Object.keys(selectors).forEach((key,i)=>w.setFretboardLayer(key,!!(mask&(1<<i))));
  for(const [i,key] of Object.keys(selectors).entries())assert.equal(!!d.querySelector(selectors[key]),!!(mask&(1<<i)),key+' mask '+mask);
  assert.deepEqual(scalePositions(), mask & 16 ? expectedScale(9,minor) : []);
  const occupied=new Set([...d.querySelectorAll('.cl-note,.overview-grip-note,.overview-tone,.arp-note,.overview-current,.overview-next')].map(g=>{const c=g.querySelector('circle');return c.getAttribute('cx')+':'+c.getAttribute('cy')}));
  d.querySelectorAll('.pentatonic-note').forEach(g=>{const c=g.querySelector('circle');assert.ok(!occupied.has(c.getAttribute('cx')+':'+c.getAttribute('cy')));assert.ok([9,0,2,4,7].includes(([4,11,7,2,9,4][+g.dataset.string]+Number(g.dataset.fret))%12));});
 }
 w.setFretboardLayer('arp',false);w.setFretboardLayer('caged',false);w.setFretboardLayer('triads',false);
 const points=()=>[...d.querySelectorAll('.pentatonic-note')].map(g=>g.dataset.string+':'+g.dataset.fret).join(',');const before=points();
 ev("S.prog=[{rootPc:9,third:3,fifth:7,name:'Am',rn:'i'},{rootPc:4,third:4,fifth:7,name:'E',rn:'V'}];S.progIdx=0;strumActive=()=>{}");w.setChordLabFollow(true);w.selectChord(1);assert.equal(points(),before);assert.deepEqual(scalePositions(),expectedScale(9,minor));
 ev('S.scale="major"');w.render();assert.notEqual(points(),before);assert.deepEqual(scalePositions(),expectedScale(9,major));
 ev('S.key=1');w.render();assert.deepEqual(scalePositions(),expectedScale(1,major));ev('S.key=9');w.render();
 const marker=d.querySelector('.pentatonic-note');let played;w.capture=m=>played=m;ev('pluck=m=>window.capture(m)');const key=new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});marker.dispatchEvent(key);assert.ok(key.defaultPrevented);assert.equal(played,[64,59,55,50,45,40][+marker.dataset.string]+Number(marker.dataset.fret));
 const scaleNote=d.querySelector('.scale-note');scaleNote.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.equal(played,[64,59,55,50,45,40][+scaleNote.dataset.string]+Number(scaleNote.dataset.fret));
 d.getElementById('layerArp').click();
 const arpNotes=()=>Array.from(d.querySelectorAll('.arp-note'),g=>{
   const [string,fret]=g.dataset.position.split(':').map(Number);
   return ([4,11,7,2,9,4][string]+fret)%12;
 });
 assert.deepEqual([...new Set(arpNotes())].sort(),[4,8,11].sort());
 w.selectChord(0);
 assert.deepEqual([...new Set(arpNotes())].sort(),[9,0,4].sort());
 assert.equal(arpNotes().length,ev('currentArpeggio().notes.length'));
 assert.equal(d.querySelectorAll('.arp-rings circle').length,arpNotes().length);
 w.saveSettings();const saved=JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
 const restored=new JSDOM(html,{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(x){x.scrollTo=()=>{};x.localStorage.setItem('gitarrenTraining.settings',JSON.stringify(saved));}});restored.window.toggleChordLab();assert.equal(restored.window.document.getElementById('layerPenta').checked,true);assert.equal(restored.window.document.getElementById('layerCaged').checked,false);assert.equal(restored.window.document.getElementById('layerArp').checked,true);assert.equal(restored.window.document.getElementById('layerScale').checked,true);restored.window.close();
 w.toggleChordLabReveal();assert.equal(d.querySelectorAll('.pentatonic-note').length,0);w.toggleChordLabReveal();assert.ok(d.querySelector('.pentatonic-note'));
 assert.deepEqual(errors,[]);console.log('PASS: all 32 layer combinations, checkbox entry, no duplicate pentatonic markers, stable key across progression, major/minor switch, keyboard, reveal and persistence.');
}finally{dom.window.close();}
