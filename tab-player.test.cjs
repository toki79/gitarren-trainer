const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const errors=[],played=[],dead=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://test.invalid',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,d=w.document,ev=s=>w.eval(s);
try{
 let timerId=0;const timers=new Map();w.setTimeout=(cb,delay)=>{timers.set(++timerId,{cb,delay});return timerId};w.clearTimeout=id=>timers.delete(id);
 const tick=()=>{const id=ev('tabPlayer.timer'),t=timers.get(id);assert.ok(t);timers.delete(id);t.cb();return t.delay;};
 w.capture=(...a)=>played.push(a);w.captureDead=(...a)=>dead.push(a);ev('pluck=(...a)=>window.capture(...a);pluckDead=(...a)=>window.captureDead(...a)');
 ev(`S.bpm=120;S.groove='straight';S.tripletFeel=false;S.key=9;S.licks.push({id:'tab-test',name:'TAB test',key:9,scale:'minor',notes:[{s:0,fret:5,d:1},{s:0,fret:5,d:1,tie:1},{rest:1,d:0.5},{s:1,fret:5,d:2,add:[{s:2,fret:5}],bend:1,vib:1}]})`);
 w.selectLick('tab-test');assert.equal(d.getElementById('tabPlayerMain').hidden,false);assert.equal(d.querySelectorAll('#tabScore [data-note-index]').length,4);
 w.startTabPlayer();assert.equal(played.length,1);assert.equal(played[0][0],69);assert.equal(played[0][2],0.5,'Tie extends initial note');
 assert.equal(tick(),250);assert.equal(played.length,1,'No new attack for tie');
 tick();assert.equal(d.querySelectorAll('#fb .tab-playing-note').length,0,'Rest has no fretboard highlight');
 assert.equal(tick(),125);assert.equal(played.length,3,'Double stop sounds simultaneously');assert.equal(played[1][4],1);assert.equal(played[1][5],true);
 tick();assert.equal(ev('tabPlayer.playing'),false);assert.equal(ev('tabPlayer.cursor'),0);
 // Click seeking and keyboard do not trigger global transport.
 d.querySelector('#tabScore [data-note-index="1"]').dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));assert.equal(ev('tabPlayer.cursor'),1);assert.equal(ev('S.metroOn'),false);
 d.querySelector('#tabScore [data-note-index="3"]').dispatchEvent(new w.MouseEvent('click',{shiftKey:true,bubbles:true}));assert.equal(ev('tabPlayer.a'),1);assert.equal(ev('tabPlayer.b'),3);assert.equal(ev('tabPlayer.loop'),true);
 played.length=0;w.setTabSpeed(50);w.startTabPlayer();assert.equal(played.length,1,'Range beginning on a tie reattacks');assert.equal(tick(),500);tick();tick();assert.equal(ev('tabPlayer.cursor'),1,'Inclusive loop wraps to A');
 const stale=timers.get(ev('tabPlayer.timer')).cb;w.stopTabPlayer();const count=played.length;stale();assert.equal(played.length,count);assert.equal(ev('tabPlayer.playing'),false);
 w.tabSeek(3);w.setTabBoundary('a');assert.equal(ev('tabPlayer.a'),3);w.tabSeek(0);w.setTabBoundary('b');assert.equal(ev('tabPlayer.a'),0);assert.equal(ev('tabPlayer.b'),0);
 w.resetTabRange();assert.equal(ev('tabPlayer.b'),3);w.setTabLoop(false);w.setTabSpeed(100);
 // Shuffle timing keeps long/short eighths at the scaled tempo.
 ev('S.tripletFeel=true');w.render();w.startTabPlayer();assert.ok(Math.abs(tick()-1000/3)<1e-6);assert.ok(Math.abs(tick()-500/3)<1e-6);w.stopTabPlayer();ev('S.tripletFeel=false');w.render();
 // Source edits and key changes cancel queued notes rather than playing stale pitches.
 w.startTabPlayer();const staleChange=timers.get(ev('tabPlayer.timer')).cb;w.setKey(0);const n=played.length;staleChange();assert.equal(played.length,n);assert.equal(ev('tabPlayer.playing'),false);
 w.beginNewLick();ev('S.lickRec=[{s:0,fret:3,d:1},{rest:1,d:1},{s:1,fret:3,d:1,mute:1}]');w.renderEditor();w.render();
 assert.equal(d.getElementById('editTabPlayer').hidden,false);assert.equal(d.getElementById('tabPlayerMain').hidden,true);assert.equal(d.querySelectorAll('#editStaff [data-note-index]').length,3);
 w.startTabPlayer();tick();tick();assert.equal(dead.length,1);w.stopTabPlayer();
 ev('S.lickRec.pop()');w.renderEditor();assert.equal(ev('tabPlayer.b'),1);assert.equal(ev('tabPlayer.cursor'),0);
 w.closeEdit();w.selectLick('tab-test');w.startTabPlayer();w.toggleChordLab();assert.equal(ev('tabPlayer.playing'),false);assert.equal(d.getElementById('tabPlayerMain').hidden,true);
 w.toggleChordLab();w.startTabPlayer();w.setFretboardLayer('penta',true);assert.equal(ev('tabPlayer.playing'),false);
 assert.deepEqual(errors,[]);console.log('PASS: source-to-TAB, ties/rests/double stops/articulations, cursor/fretboard sync, keyboard/seek, inclusive A–B loops, half-speed timing, stale timer cancellation, editor updates and context changes.');
}finally{dom.window.close();}
