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
  w.saveSettings();
  const saved = JSON.parse(w.localStorage.getItem('gitarrenTraining.settings'));
  assert.equal(saved.key, 2); assert.equal(saved.bpm, 100);
  dom.window.close();
  const restored = boot({...saved, settingsShow:false, playMode:true, cards:{path:false, triad:true, prog:true, licks:true}});
  await tick();
  assert.equal(restored.window.document.getElementById('card-triad').open, true);
  assert.equal(restored.window.document.getElementById('card-path').open, false);
  assert.equal(restored.window.document.getElementById('topBar').style.display, '');
  assert.equal(restored.window.eval('S.key'), 2);
  restored.window.close();
  assert.deepEqual(errors, []);
  console.log('PASS: init, unique IDs, scale/key/box, overlays, tempo/time signature, progression/current chord, space transport and input/repeat/editor guards, navigation, docking, play-mode escape, scenarios, filtering, editor, backup drawer, persistence.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
