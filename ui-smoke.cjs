// Run: npm install --no-save jsdom && node ui-smoke.cjs
// DOM/state regression tests; audio hardware and browser layout require manual QA.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'gitarren-training.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(e.message));
function boot(settings) {
  return new JSDOM(source, {
    url: 'https://test.invalid/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      // Web Audio stub tests transport wiring, not audible output.
      const param = () => ({value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){}});
      const node = () => ({gain:param(), frequency:param(), detune:param(), Q:param(), connect(){}, disconnect(){}, start(){}, stop(){}});
      w.AudioContext = class {
        constructor() { this.currentTime = 0; this.sampleRate = 44100; this.destination = node(); }
        createGain() { return node(); }
        createWaveShaper() { return node(); }
        createBiquadFilter() { return node(); }
        createOscillator() { return node(); }
        createBufferSource() { return node(); }
        createBuffer(ch, n) { return {getChannelData: () => new Float32Array(n)}; }
      };
      w.scrollTo = () => {};
      w.alert = msg => { throw new Error(msg); };
      w.confirm = () => true;
      if (settings) w.localStorage.setItem('gitarrenTraining.settings', JSON.stringify(settings));
    }
  });
}
async function main() {
  const dom = boot(); const w = dom.window; const d = w.document;
  const state = expr => w.eval(expr);
  const click = id => d.getElementById(id).click();
  const tick = () => new Promise(r => setTimeout(r, 20));
  await tick();
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(d.querySelectorAll('#keySelect option').length, 12);
  assert.ok(d.querySelector('#fb circle'));
  assert.equal(d.getElementById('card-path').open, true);
  assert.equal(d.getElementById('card-prog').open, false);
  assert.equal(d.body.classList.contains('licks-side'), false);
  const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
  click('btn-major'); assert.equal(state('S.scale'), 'major');
  w.setKey(2); w.setPos(3); assert.equal(state('S.key'), 2); assert.equal(state('S.pos'), 3);
  click('btn-blue'); click('btn-degrees');
  assert.equal(state('S.blue'), true); assert.equal(state('S.label'), 'degrees');
  w.setBpm(500); assert.equal(state('S.bpm'), 240);
  w.setBpm(100); w.setTimeSig('3'); assert.equal(d.querySelectorAll('.beat-dot').length, 3);
  w.showPracticeCard('prog');
  d.getElementById('progInput').value = 'I IV V'; w.applyProg();
  assert.equal(state('S.prog.length'), 3);
  w.progStep(1); assert.equal(state('S.progIdx'), 1);
  click('metroBtnTop'); assert.equal(state('S.metroOn'), true);
  assert.equal(d.getElementById('metroBtn').textContent, '◼ Stop');
  click('metroBtn'); assert.equal(state('S.metroOn'), false);
  const space = (target = d.body, options = {}) => {
    const event = new w.KeyboardEvent('keydown', {key:' ', code:'Space', bubbles:true, cancelable:true, ...options});
    target.dispatchEvent(event); return event;
  };
  assert.equal(d.querySelectorAll('#fbProg button').length, 3);
  d.querySelectorAll('#fbProg button')[2].click();
  assert.equal(state('S.progIdx'), 2);
  assert.equal(d.querySelectorAll('#fbProg [aria-current="true"]').length, 1);
  assert.equal(d.querySelector('#fbProg .cur').textContent, state('S.prog[2].name'));
  assert.equal(w.getComputedStyle(d.querySelector('#fbProg .cur')).fontSize, '2rem');
  assert.equal(space().defaultPrevented, true);
  assert.equal(state('S.metroOn'), true);
  assert.equal(space(d.body, {repeat:true}).defaultPrevented, true);
  assert.equal(state('S.metroOn'), true, 'Held space must not repeatedly toggle');
  space(); assert.equal(state('S.metroOn'), false);
  for (const target of [d.getElementById('progInput'), d.getElementById('bpm'), d.getElementById('keySelect'), d.getElementById('metroBtnTop'), d.querySelector('summary')]) {
    assert.equal(space(target).defaultPrevented, false);
    assert.equal(state('S.metroOn'), false, 'Do not intercept native controls');
  }
  const editable = d.createElement('div'); editable.contentEditable = 'true';
  editable.setAttribute('contenteditable', 'true'); d.body.append(editable);
  assert.equal(space(editable).defaultPrevented, false); editable.remove();
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'isComposing']) {
    assert.equal(space(d.body, {[modifier]:true}).defaultPrevented, false);
    assert.equal(state('S.metroOn'), false);
  }
  for (const k of ['path', 'triad', 'prog', 'licks', 'trainer', 'ton']) {
    w.togglePanel(k); w.showPracticeCard(k);
    assert.equal(d.getElementById('card-' + k).style.display, '');
    assert.equal(d.getElementById('card-' + k).open, true);
    assert.equal(d.querySelector('[data-panel="' + k + '"]').getAttribute('aria-pressed'), 'true');
  }
  await tick(); assert.equal(d.body.classList.contains('licks-side'), true);
  d.getElementById('card-licks').open = false;
  await tick(); assert.equal(d.body.classList.contains('licks-side'), false);
  w.toggleSettings(); assert.equal(d.getElementById('topBar').style.display, 'none');
  w.togglePlayMode(); assert.equal(d.getElementById('topBar').style.display, '');
  assert.equal(d.body.classList.contains('play-mode'), true);
  w.togglePlayMode(); assert.equal(d.getElementById('topBar').style.display, 'none');
  w.toggleSettings();
  w.enterScenario('trainer'); assert.equal(state('S.panels.trainer'), true);
  assert.equal(state('S.panels.prog'), false);
  w.enterScenario('free'); assert.equal(state('Object.values(S.panels).every(Boolean)'), true);
  const before = d.querySelectorAll('#lickTbody tr').length;
  assert.ok(before > 0);
  w.setLickFilter('text', 'zz-no-matching-lick-zz');
  assert.ok(d.querySelectorAll('#lickTbody tr').length < before);
  w.setLickFilter('text', '');
  w.beginNewLick(); assert.equal(state('S.editing'), '_new');
  space(); assert.equal(state('S.metroOn'), false, 'Preserve editor space shortcut');
  assert.equal(d.getElementById('editorRow').style.display, 'block');
  w.closeEdit(); assert.equal(state('S.editing'), null);
  click('backupBtn'); assert.equal(d.getElementById('backupDrawer').style.display, 'flex');
  click('backupBtn'); assert.equal(d.getElementById('backupDrawer').style.display, 'none');
  // Chord coach: durations follow actual chord boundaries, including split bars.
  w.setTimeSig('4'); w.setMeasPerChord(2);
  d.getElementById('progInput').value = 'I IV V'; w.applyProg();
  assert.equal(d.getElementById('nextChordName').textContent, state('S.prog[1].name'));
  let schedule = w.buildBeatSchedule();
  assert.equal(schedule.total, 24);
  state('S.metroOn = true');
  w.updateCoachBeat(0, 0, schedule);
  assert.match(d.getElementById('chordCountdown').textContent, /8 Schlägen/);
  w.updateCoachBeat(7, 7, schedule);
  assert.match(d.getElementById('chordCountdown').textContent, /1 Schlag$/);
  w.stopMetro();
  w.setTimeSig('3');
  d.getElementById('progInput').value = 'I IV | V'; w.applyProg();
  schedule = w.buildBeatSchedule();
  assert.equal(w.chordBeats(state('S.prog[0]')), 2);
  assert.equal(w.chordBeats(state('S.prog[1]')), 1);
  state('S.metroOn = true'); w.updateCoachBeat(1, 1, schedule);
  assert.match(d.getElementById('chordCountdown').textContent, /1 Schlag$/);
  w.stopMetro(); w.selectChord(2);
  assert.equal(d.getElementById('nextChordName').textContent, state('S.prog[0].name'), 'Wrap to first chord');
  click('btn-targetNotes');
  assert.equal(d.querySelectorAll('.next-target').length, 2);
  const expected = state('[mod12(upcomingChord().rootPc), mod12(upcomingChord().rootPc + upcomingChord().third)]');
  assert.deepEqual([...d.querySelectorAll('.next-target')].map(n => +n.dataset.pc), Array.from(expected));
  const positions = w.targetPositions(state('upcomingChord()'));
  assert.ok(positions.every(n => n.fret >= 0 && n.fret <= 22 && n.s >= 0 && n.s < 6));
  w.setScale('minor');
  d.getElementById('progInput').value = 'i iv V'; w.applyProg();
  assert.ok(d.querySelector('.next-target[data-role="♭3"]'));
  assert.equal(+d.querySelector('.next-target[data-role="♭3"]').dataset.pc, state('mod12(S.prog[1].rootPc + 3)'));
  w.toggleIntervalMode(); assert.equal(d.querySelectorAll('.next-target').length, 0);
  w.toggleIntervalMode(); assert.equal(d.querySelectorAll('.next-target').length, 2);
  click('btn-targetNotes'); assert.equal(d.querySelectorAll('.next-target').length, 0);
  click('btn-targetNotes'); assert.equal(d.querySelectorAll('.next-target').length, 2);
  w.beginNewLick(); assert.equal(d.querySelectorAll('.next-target').length, 0);
  w.closeEdit(); assert.equal(d.querySelectorAll('.next-target').length, 2);
  state('S.countIn = true'); w.startMetro();
  assert.equal(d.getElementById('nextChordName').textContent, state('S.prog[0].name'));
  assert.match(d.getElementById('chordCountdown').textContent, /Einzähler.*3 Schlägen/);
  w.updateCoachBeat(-1, -1, state('metro.sched'));
  assert.match(d.getElementById('chordCountdown').textContent, /Start in 1 Schlag$/);
  w.stopMetro(); assert.match(d.getElementById('chordCountdown').textContent, /Bereit/);
  // Exercise the real scheduler callbacks and ensure stopped/old runs cannot repaint.
  state('S.countIn=false; S.click=false; S.drums=false; S.bass=false; S.sound=false');
  w.startMetro(); state('metro.nextNote=audio().currentTime + 0.01'); w.metroScheduler();
  await tick(); assert.match(d.getElementById('chordCountdown').textContent, /6 Schlägen/);
  state('metro.beat=6; metro.nextNote=audio().currentTime + 0.01'); w.metroScheduler();
  await tick(); assert.equal(state('S.progIdx'), 1);
  assert.equal(d.getElementById('nextChordName').textContent, state('S.prog[2].name'));
  assert.equal(+d.querySelector('.next-target[data-role="R"]').dataset.pc, state('mod12(S.prog[2].rootPc)'));
  w.stopMetro();
  w.startMetro(); state('metro.nextNote=audio().currentTime + 0.01'); w.metroScheduler();
  w.stopMetro(); w.selectChord(2);
  await tick(); assert.equal(state('S.progIdx'), 2); assert.match(d.getElementById('chordCountdown').textContent, /Bereit/);
  w.setTimeSig('12-8'); w.setMeasPerChord(1);
  d.getElementById('progInput').value = 'i'; w.applyProg();
  state('S.metroOn=true'); w.updateCoachBeat(3, 3, w.buildBeatSchedule());
  assert.match(d.getElementById('chordCountdown').textContent, /Neue Runde in 1 Schlag$/);
  w.stopMetro();
  w.clearProg(); assert.equal(d.getElementById('chordCoach').style.display, 'none');
  assert.equal(d.querySelectorAll('.next-target').length, 0);
  w.saveSettings();
  const saved = JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
  assert.equal(saved.key, 2); assert.equal(saved.bpm, 100);
  assert.equal(saved.targetNotes, true);
  dom.window.close();
  const restored = boot({...saved, settingsShow:false, playMode:true, cards:{path:false, triad:true, prog:true, licks:true}});
  await tick();
  assert.equal(restored.window.document.getElementById('card-triad').open, true);
  assert.equal(restored.window.document.getElementById('card-path').open, false);
  assert.equal(restored.window.document.getElementById('topBar').style.display, '');
  assert.equal(restored.window.eval('S.key'), 2);
  assert.equal(restored.window.eval('S.targetNotes'), true);
  restored.window.close();
  assert.deepEqual(errors, []);
  console.log('PASS: existing UI regression suite; next-chord countdown, split bars, multiple bars/chord, 12/8, loop wrap, root/minor-third targets, toggle and editor/interval guards, count-in, real scheduler callbacks, stopped callback protection, persistence.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
