'use strict';

var BR = null;
var el = {};
var pts = new Map();
var G = null;
var hintTimer = 0;

function $(id){ return document.getElementById(id); }

function stackH(){
  var _t0 = perfNow();
  var panes = document.querySelectorAll ? document.querySelectorAll('.panel.open') : [],
      h = 0, i, p;
  for (i = 0; i < panes.length; i++){
    p = panes[i];
    if (p && !p.classList.contains('vhide'))
      h = Math.max(h, p.offsetHeight || 0);
  }
  if (!h && el.bot && !el.bot.classList.contains('hide')) h = el.bot.offsetHeight || 0;

  if (el.cmd && !el.cmd.classList.contains('hide')) h += cmdStack();
  perfAdd(PERF.stack, perfNow() - _t0);
  return h;
}

var CSSN = {};
function cssNum(name, def){
  if (CSSN[name] !== undefined) return CSSN[name];
  var v = def;
  if (typeof document !== 'undefined' && typeof getComputedStyle === 'function'){
    var got = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    if (got === got && got) v = got;
  }
  CSSN[name] = v;
  return v;
}

function cmdStack(){
  var gap = cssNum('--cmdGap', 12);
  var h = 0;
  if (el.cmd && el.cmd.offsetHeight) h = el.cmd.offsetHeight;
  if (!h) h = cssNum('--btnH', 52) + cssNum('--barPad', 5) * 2 + gap;
  return h + gap;
}

function hintPlace(){
  if (!el.hint || !el.hint.style) return;

  if (typeof railOn === 'function' && railOn()){ el.hint.style.bottom = '16px'; return; }
  el.hint.style.bottom = (stackH() + 14) + 'px';
}

var SAID = {};

function say(key, ms, tail){

  if (typeof iconsOnly === 'function' && iconsOnly() && key !== 'hSaved') return;
  var kind = (typeof VOICE !== 'undefined' && VOICE[key]) || 'no';
  if (kind === 'done' && cfg.hv !== 'always') return;
  if (kind === 'once' && cfg.hv !== 'always'){
    if (SAID[key]) return;
    SAID[key] = 1;
  }

  msg(T(key) + (tail === undefined ? '' : tail), ms);
}

function msg(t, ms){
  if (!el.hint) return;
  el.hint.textContent = t || '';
  hintPlace();
  clearTimeout(hintTimer);
  hintAt = t ? Date.now() : 0;
  if (t) hintTimer = setTimeout(function(){ el.hint.textContent = ''; }, ms || 3600);
}

var hintAt = 0;
function hintWire(){
  if (!document.addEventListener) return;
  document.addEventListener('pointerdown', function(){
    if (!el.hint || !el.hint.textContent) return;
    if (Date.now() - hintAt < 250) return;
    clearTimeout(hintTimer);
    el.hint.textContent = '';
  }, true);
}

function docState(){
  return JSON.stringify({o:S.objs, k:S.ink, c:S.crop, g:S.pad, x:S.cut, m:S.mask,
                         b:S.bg, ba:S.bgA, cf:S.cutFill, u:S.out, t:S.turn, a:S.adj,

                         mx:S.mix,
                         gl:S.glass, gk:S.glassK, ga:S.glassAll});
}

var CLEAN = '';
function docClean(){ CLEAN = S.img ? docState() : ''; }

function docTouched(){ return !noSheet() && CLEAN !== '' && docState() !== CLEAN; }

function snapState(){
  return JSON.stringify({o:S.objs, c:S.crop, m:S.mask, b:S.bg, ba:S.bgA, cf:S.cutFill, sx:S.shellTxt, k:S.ink, sq:S.seq, ak:S.autoK, fv:S.fixV, zv:S.zoomV, an:S.ang, fo:S.focus, ti:S.tilt, th:S.tiltH, cr:S.cropRaw,
                              u:S.out, g:S.pad, gf:1, x:S.cut, p:S.pop, bc:S.byc,
                              a:S.adj, mx:S.mix, mi:S.mixI, mw:S.mixW,
                              gl:S.glass, gk:S.glassK, ga:S.glassAll,
                              t:{r:(S.turn ? S.turn.r : 0), m:(S.turn ? S.turn.m : 0)},
                              v:{s:V.s, ox:V.ox, oy:V.oy}});
}

function snap(){

  var s = snapState();
  if (S.undo.length && S.undo[S.undo.length - 1] === s) return;

  if (typeof logNote === 'function')
    logNote(logT('edit', (typeof dbgLine === 'function'
      ? dbgLine()
      : ((typeof probeWhere === 'function' ? probeWhere() : '?') + ', ' + S.tool)) +
      (S.tool === 'brush' && S.mark ? logT('markerTail') : '')));

  S.undo.push(s);
  if (S.undo.length > 80) S.undo.shift();
}

function visit(){ S.took = false; }
function touch(){
  if (S.took) return;

  if (S.histAt !== null && S.histAt !== undefined){
    var at = S.histAt;
    S.histAt = null;
    S.histHead = null;
    if (at < S.undo.length) S.undo.length = at;
  }
  S.took = true;
  snap();
}

function easySync(){
  if (typeof setSval !== 'function' || !el) return;
  if (el.fixSlide)  setSval(el.fixSlide,  S.fixV   || 0);
  if (el.zoomSlide) setSval(el.zoomSlide, S.zoomV  || 0);
  if (el.gFoc)      setSval(el.gFoc,      S.focus  || 0);
  if (el.gAng)      setSval(el.gAng,      S.ang    || 0);
  if (el.tilt)      setSval(el.tilt,      (S.tiltAxis === 'h' ? S.tiltH : S.tilt) || 0);
}

function undo(){
  if (typeof logNote === 'function') logNote(logT('undoStep', S.undo.length));
  var s = S.undo.pop();

  if (!s){
    if (noSheet()){ say('hNoImg'); return; }

    if (undoNext() === 'reveal'){ pickTool('brush'); draw(); say('hRevGone', 2500); return; }
    say(docTouched() ? 'hUndoGone' : 'hUndo');
    return;
  }

  visit();

  applyState(s);
}

function applyState(s){
  var d = JSON.parse(s);  var d = JSON.parse(s);

  var same = function(a, b){ return JSON.stringify(a) === JSON.stringify(b); };
  var moved = !same(S.crop, d.c) ||
              !same(S.pad, d.g || S.pad) ||
              !same(S.out === undefined ? null : S.out, d.u === undefined ? null : d.u);

  if (d.t && typeof turnBack === 'function') turnBack(d.t);

  S.objs = d.o; S.crop = d.c; S.cropRaw = d.cr || d.c; S.sel = -1;
  if (d.m !== undefined) S.mask = d.m;
  if (d.b !== undefined) S.bg = d.b;
  if (d.ba !== undefined) S.bgA = d.ba;
  if (d.cf !== undefined) S.cutFill = d.cf;
  if (d.sx !== undefined) S.shellTxt = d.sx;
  if (d.k !== undefined) S.ink = d.k;
  if (d.sq !== undefined) S.seq = d.sq;
  if (d.ak !== undefined) S.autoK = d.ak;
  if (d.fv !== undefined) S.fixV = d.fv;
  if (d.zv !== undefined) S.zoomV = d.zv;
  if (d.an !== undefined) S.ang = d.an;
  if (d.fo !== undefined) S.focus = d.fo;
  if (d.ti !== undefined) S.tilt = d.ti;
  if (d.th !== undefined) S.tiltH = d.th;
  if (d.x !== undefined) S.cut = d.x;

  easySync();

  if (d.p !== undefined){ S.pop = d.p; if (typeof colorForget === 'function') colorForget(); }
  S.out = (d.u === undefined) ? null : d.u;
  if (d.g) S.pad = d.gf ? d.g : padFrac(d.g, S.crop, S.iw, S.ih);
  if (d.a) S.adj = d.a;

  if (d.mx) S.mix = d.mx;
  if (d.mi !== undefined) S.mixI = d.mi;
  if (d.mw) S.mixW = d.mw;
  if (d.gl !== undefined){ S.glass = glassKnown(d.gl); S.glassK = d.gk; setGlassFilter(); }
  if (d.ga !== undefined) S.glassAll = d.ga;

  if (d.bc !== undefined) S.byc = d.bc;
  inkDirty(); cutDirty();
  closeSheet();

  if (typeof panelSync === 'function') panelSync();
  if (moved && d.v){
    V.s = d.v.s; V.ox = d.v.ox; V.oy = d.v.oy;
    if (typeof clampView === 'function') clampView();
  }
  reflow(); draw();
}

function histShow(i){
  var n = S.undo.length;
  i = Math.max(0, Math.min(n, i));
  S.histAt = i;
  applyState(i >= n ? (S.histHead || snapState()) : S.undo[i]);
  if (typeof fit === 'function') fit();
  draw();
}

var NEW_DOWN = 0.12, NEW_LEFT = 0.10;

function centerOfView(){
  var top = 0, bot = cv.clientHeight;
  if (typeof panelBottom === 'function') bot = Math.max(top + 40, bot - panelBottom());

  var sh = sheet();
  var y0 = V.oy, y1 = V.oy + sh.h*V.s;
  var x0 = V.ox, x1 = V.ox + sh.w*V.s;
  var vy0 = Math.max(y0, top), vy1 = Math.min(y1, bot);
  var vx0 = Math.max(x0, 0),   vx1 = Math.min(x1, cv.clientWidth);
  if (vy1 <= vy0){ vy0 = y0; vy1 = y1; }
  if (vx1 <= vx0){ vx0 = x0; vx1 = x1; }
  var cx = (vx0 + vx1)/2 - (vx1 - vx0)*NEW_LEFT;
  var cy = (vy0 + vy1)/2 + (vy1 - vy0)*NEW_DOWN;
  var p = toImage(cx, cy);
  return [clamp(p[0]/S.iw, 0.05, 0.95), clamp(p[1]/S.ih, 0.05, 0.95)];
}

function addObj(kind){
  if (noSheet()){ say('hNoImg'); return; }
  if (S.mode !== 'edit') return;
  snap();
  var c = centerOfView();
  var o = {
    kind: kind, text: '',
    x: c[0], y: c[1],
    tx: clamp(c[0] + 0.16, 0.02, 0.98),
    ty: clamp(c[1] + 0.20, 0.02, 0.98),
    size: 0.045,
    p: kind === 'arrow' ? 2 : 0
  };
  if (kind === 'arrow'){ o.x = clamp(c[0] - 0.10, 0.02, 0.98); o.y = clamp(c[1] - 0.12, 0.02, 0.98); }
  o.a = 1; o.r = 0.35;
  o.z = ++S.seq;
  S.objs.push(o);
  S.sel = S.objs.length - 1;
  fitObjToFrame(o);
  draw();
  openSheet();
}

function fitObjToFrame(o){
  if (o.kind === 'arrow') return;
  var B = bodyOf(measurer(), o);
  var hw = (o.kind === 'bubble' ? B.rx : (B.w ? B.w/2 : B.L.w/2)) / S.iw;
  var hh = (o.kind === 'bubble' ? B.ry : (B.h ? B.h/2 : B.L.h/2)) / S.ih;
  o.x = clamp(o.x, hw, 1-hw);
  o.y = clamp(o.y, hh, 1-hh);
}

function delObj(){
  if (S.sel < 0) return;
  snap();
  S.objs.splice(S.sel, 1);
  S.sel = -1;
  closeSheet();
  draw();
}

function bars(show){

  if (el.cmd) el.cmd.classList.toggle('hide', !show);

  if (el.menuBtn) el.menuBtn.classList.remove('hide');
  if (!show) el.bot.classList.add('hide');
  else showProps(S.sel >= 0);
}

function screen(name){
  S.screen = name || 'root';
  showProps(S.sel >= 0);
}

var PANES = ['crop', 'picker', 'turn', 'draw', 'adj', 'mix',
             'sheet', 'stk', 'ref', 'saver', 'menu', 'glass', 'cut', 'probe',
             'rndPane', 'camPane', 'framePane'];

var SOLO = ['crop', 'turn', 'draw', 'adj', 'mix', 'sheet', 'glass', 'cut',
            'rndPane', 'camPane', 'framePane'];

var SCREEN = null;

function dbgLine(){
  var i = SCREEN ? PANES.indexOf(SCREEN) : -1;
  var name = (i < 0) ? 'canvas' : PANES[i];
  var num  = (i < 0) ? 0 : (i + 1);
  var st = (S.mode && S.mode !== 'edit') ? S.mode : (S.tool || '-');

  if (typeof S.fixOn !== 'undefined' && S.fixOn) return '0 · fix · ' + Math.round(S.fixV || 0);
  if (typeof S.zoomOn !== 'undefined' && S.zoomOn) return '0 · zoom · ' + Math.round(S.zoomV || 0);
  if (typeof S.geoOn !== 'undefined' && S.geoOn) return '0 · geo · ' + Math.round(S.focus || 0) + '/' + Math.round(S.ang || 0);

  if (typeof S.histOn !== 'undefined' && S.histOn)
    return '0 · hist · ' + (S.histAt === null || S.histAt === undefined ? '-' : S.histAt) +
           '/' + S.undo.length;

  var v = [];
  if (Math.round(S.focus || 0)) v.push('focus ' + Math.round(S.focus));
  if (Math.round(S.ang || 0)) v.push('angle ' + Math.round(S.ang));
  if (Math.round(S.tilt || 0)) v.push('tilt ' + Math.round(S.tilt));
  return num + ' · ' + name + ' · ' + st + (v.length ? ' · ' + v.join(' ') : '');
}

function dbgPaint(){
  var b = el.dbg || (el.dbg = $('dbg'));
  if (!b) return;
  var on = !!cfg.dbg;
  b.classList.toggle('on', on);
  if (on) b.textContent = dbgLine();

  var t = $('dbgOn');
  if (t) t.textContent = 'debug badge: ' + (on ? 'on' : 'off');
}

function betaOn(){ return cfg.beta ? 1 : 0; }

function betaPaint(){
  var t = $('bBeta');
  if (t) t.textContent = 'BETA: ' + (betaOn() ? 'on' : 'off');

  var q = document.querySelectorAll ? document.querySelectorAll('#maint [data-beta]') : [];
  for (var i = 0; i < q.length; i++) q[i].classList.toggle('off', !betaOn());
}

function rideIn(p){
  if (!p || !p.classList || !p.classList.contains('sub')) return;
  p.classList.add('riding');
  var off = function(){ p.classList.remove('riding'); };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(function(){ requestAnimationFrame(off); });
  else off();
}

function soloPane(keep){

  if (typeof logNote === 'function') logNote(logT('screen', keep || logT('canvasWord')));
  SCREEN = keep || null;
  if (typeof dbgPaint === 'function') dbgPaint();

  if (keep !== 'crop' && S.mode === 'crop' && typeof cropEnd === 'function') cropEnd(true);

  if (keep !== 'turn' && S.tiltWin){ S.tiltWin = null; S.warpHold = false; }
  for (var i = 0; i < SOLO.length; i++){
    if (SOLO[i] === keep) continue;
    var p = el[SOLO[i]];
    if (p && p.classList.contains('open')) p.classList.remove('open');
  }
}

function eachPane(f){
  for (var i = 0; i < PANES.length; i++){
    var p = el[PANES[i]];
    if (p) f(p);
  }
}

function anyPane(){
  for (var i = 0; i < PANES.length; i++){
    var p = el[PANES[i]];
    if (p && p.classList.contains('open')) return true;
  }
  return false;
}

function depthNow(){
  if (S.mode !== 'edit') return 1;
  if (anyPane()) return 1;
  return (S.sel >= 0) ? 1 : 0;
}

function syncDepth(){
  try { if (BR && BR.depth) BR.depth(depthNow()); }
  catch(e){  }
}

function panelSync(){
  if (el.adj && el.adj.classList.contains('open')) adjPaint();
  if (el.draw && el.draw.classList.contains('open')) drawPaint();
  if (el.cut && el.cut.classList.contains('open')) cutPaint();
  if (el.crop && el.crop.classList.contains('open')){
    if (el.mask) el.mask.value = String(Math.round(S.mask*100));
    markOrient();
    paintRatio();
    szPaint();
  }
  if (el.glass && el.glass.classList.contains('open') &&
      typeof glassMark === 'function'){ glassMark(); }
  if (el.cut && el.cut.classList.contains('open')) objPaint();
  if (el.turn && el.turn.classList.contains('open')) szPaint();
}

function undoNext(){
  if (noSheet()) return '';
  if (S.undo.length) return 'pop';
  if (S.tool === 'reveal') return 'reveal';
  return '';
}

function paintUndo(){
  if (!el.bUndo) return;
  el.bUndo.classList.toggle('dim', !undoNext());
}

function goBack(){

  if (S.eye){ eyeOff(); syncDepth(); return; }
  if (S.mode === 'view') viewEnd();
  else if (S.mode === 'crop') cropEnd(true);
  else if (el.cut.classList.contains('open')) cutEnd();
  else if (el.adj.classList.contains('open')) adjEnd();
  else if (el.mix.classList.contains('open')) mixEnd();
  else if (el.glass.classList.contains('open')) glassEnd();
  else if (el.picker.classList.contains('open')) closePicker(false);
  else if (el.turn.classList.contains('open')) turnEnd();
  else if (el.stk.classList.contains('open')) stkEnd();
  else if (el.sheet.classList.contains('open')) closeSheet();
  else if (el.draw.classList.contains('open')) drawEnd();
  else if (el.saver.classList.contains('open')) closeSaver();
  else if (el.ref.classList.contains('open')) closeRef();
  else if (el.menu.classList.contains('open')) closeMenu();

  else if (subBack()) {  }
  else if (S.sel >= 0){ S.sel = -1; showProps(false); draw(); }
  else screen('root');
  syncDepth();
}

var SUBDOOR = [
  ['framePane', function(){ frameEnd(true); }],
  ['rndPane',   function(){ rndEnd(true); }],
  ['camPane',   function(){ if (typeof shotEnd === 'function') shotEnd(); }],
  ['probe',     function(){ if (typeof probeHide === 'function') probeHide(); }]
];

function subBack(){
  for (var i = 0; i < SUBDOOR.length; i++){
    var n = $(SUBDOOR[i][0]);
    if (n && n.classList.contains('open')){ SUBDOOR[i][1](); return true; }
  }
  return false;
}

function goHome(){
  for (var i = 0; i < 12 && depthNow() > 0; i++) goBack();
  msg('');
}

function showProps(on){
  var hideAll = function(){ el.bot.classList.add('hide'); };
  if (S.mode === 'edit' && el.picker && !el.picker.classList.contains('open')){

    eachPane(function(p){ p.classList.remove('vhide'); });
    S.hidden = null;
  }
  if (S.mode !== 'edit'){ hideAll(); return; }
  if (anyPane()){ hideAll(); return; }

  el.bot.classList.toggle('hide', noSheet());
  syncDepth();
}

function sizeRange(o){
  return isImg(o) ? {min:2, max:300, val:Math.round((o.w === undefined ? 0.4 : o.w)*100)}
                  : {min:16, max:130, val:Math.round(o.size*1000)};
}

function paintSize(o){
  if (!el.oSize) return;
  var r = sizeRange(o);
  el.oSize.min = String(r.min);
  el.oSize.max = String(r.max);
  el.oSize.value = String(r.val);
}

var KINDS = ['text', 'plate', 'bubble'];

function kindNext(k){
  var at = KINDS.indexOf(k);
  return KINDS[(at + 1) % KINDS.length];
}

function paintKind(k){
  if (!el.bKind) return;
  var v = (KINDS.indexOf(k) >= 0) ? k : 'text';
  dressIcon(el.bKind, v, v);
}

function openSheet(){
  if (S.sel < 0) return;
  var o = S.objs[S.sel];
  var pic = isImg(o), mute = pic || isShape(o) || o.kind === 'arrow';

  if (el.txt) el.txt.classList.toggle('hide', mute);
  if (el.bKind) el.bKind.classList.toggle('hide', mute);
  if (el.pal) el.pal.classList.toggle('hide', pic);
  if (el.rRound) el.rRound.classList.toggle('hide', mute);
  if (el.rSize) el.rSize.classList.toggle('hide', !pic && mute);
  el.txt.value = o.text || '';
  paintSize(o);
  paintKind(o.kind);
  markSwatches(el.pal, o.c, o.p);

  soloPane('sheet');
  el.sheet.classList.add('open'); applyFold('sheet');

  syncDepth();
  el.bot.classList.add('hide');
  if (el.alpha) el.alpha.value = Math.round((o.a === undefined ? 1 : o.a)*100);
  if (el.round) el.round.value = Math.round((o.r === undefined ? 0.35 : o.r)*100);
  if (el.orot) setSval(el.orot, o.rot || 0);
}

function dropEmpty(){

  var kept = -1, n = 0;
  for (var i = 0; i < S.objs.length; i++){
    var o = S.objs[i];
    var empty = !isImg(o) && !isShape(o) && o.kind !== 'arrow' &&
                !(o.text && o.text.length);
    if (empty) continue;
    if (i === S.sel) kept = n;
    S.objs[n++] = o;
  }
  if (n !== S.objs.length){
    S.objs.length = n;
    S.sel = kept;
  }
}

function closeSheet(){
  el.sheet.classList.remove('open');
  if (el.txt) el.txt.blur();
  dropEmpty();
  showProps(S.sel >= 0);
  reflow(); clampView(); draw();
}

function edited(f){
  if (S.sel < 0) return;
  f(S.objs[S.sel]);
  draw();
}

function editStep(f){
  if (S.sel < 0) return;
  snap();
  f(S.objs[S.sel]);
  draw();
}

function mark(box, key, val){
  var b = box.children;
  for (var i = 0; i < b.length; i++)
    if (b[i].dataset) b[i].classList.toggle('on', b[i].dataset[key] === val);
}

function openMenu(){
  if (S.mode === 'view') viewEnd();
  closeSheet(); closeSaver();
  el.menu.classList.add('open');
  syncDepth();
  el.bot.classList.add('hide');
  markAll('[data-lang]', 'lang', cfg.lang);
  markAll('[data-th]', 'th', cfg.theme);
  paintSwitches();
}

function closeMenu(){
  el.menu.classList.remove('open');
  showProps(S.sel >= 0);
}

function openSaver(){
  if (noSheet()){ say('hNoImg'); return; }

  soloPane(null);
  closeSheet(); closeMenu();
  S.sel = -1; draw();
  el.fname.value = stamp(srcBase());
  mark(el.fmts, 'fmt', cfg.fmt);
  el.saver.classList.add('open');
  syncDepth();
  el.bot.classList.add('hide');
}

function closeSaver(){
  el.saver.classList.remove('open');
  showProps(S.sel >= 0);
}

function dressIcon(b, icon, key, word){
  if (!b || !b.dataset) return;
  if (icon) b.dataset.i = icon;
  if (key) b.dataset.t = key;

  var w = (word !== undefined && word !== null) ? word : T(b.dataset.t);
  b.innerHTML = '<svg viewBox="0 0 24 24">' + (ICON[b.dataset.i] || '') +
                '</svg><span>' + w + '</span>';

  b.setAttribute('aria-label', w);
  b.title = w;
}

function paintLabels(){
  if (document.querySelectorAll){
    var n = document.querySelectorAll('[data-t]');
    for (var i = 0; i < n.length; i++){
      if (n[i].dataset.i) continue;
      n[i].textContent = T(n[i].dataset.t);
    }
    var k = document.querySelectorAll('[data-i]');
    for (var j = 0; j < k.length; j++) dressIcon(k[j]);

    var g2 = document.querySelectorAll('[data-img]');
    for (var y3 = 0; y3 < g2.length; y3++){
      var lb = T(g2[y3].dataset.t);
      g2[y3].innerHTML = '<img src="' + g2[y3].dataset.img + '" alt=""><span>' + lb + '</span>';
      g2[y3].setAttribute('aria-label', lb);
    }

    var w3 = document.querySelectorAll('[data-swi]');
    for (var y4 = 0; y4 < w3.length; y4++){
      var lb2 = T(w3[y4].dataset.t);
      w3[y4].innerHTML = '<i><svg viewBox="0 0 24 24">' +
        (ICON[w3[y4].dataset.swi] || '') + '</svg></i><span>' + lb2 + '</span>';
      w3[y4].setAttribute('aria-label', lb2);
    }

    var wAll = document.querySelectorAll('button.swb'), w2 = [];
    for (var y5 = 0; y5 < wAll.length; y5++)
      if (!wAll[y5].dataset || !wAll[y5].dataset.swi) w2.push(wAll[y5]);
    for (var y2 = 0; y2 < w2.length; y2++){
      var lab = T(w2[y2].dataset.t);
      w2[y2].innerHTML = '<i></i><span>' + lab + '</span>';
      w2[y2].setAttribute('aria-label', lab);
    }
  }
  paintSaveDir();

  if (typeof dbgPaint === 'function') dbgPaint();
  if (typeof betaPaint === 'function') betaPaint();
  if (el.txt) el.txt.placeholder = T('caption');
  var keys = ['aTitle', 'aBody', 'aFmt', 'aGest', 'aTiff', 'aPriv', 'aMade'];
  for (var k = 0; k < keys.length; k++){
    var e = $(keys[k]);
    if (e) e.textContent = TA(keys[k]);
  }
}

var LEG = [
  ['~','Top row'],
  ['home','home'], ['undo','undo'], ['open','open'],
  ['save','save'], ['share','share'], ['help','help'],
  ['~','On the picture'],
  ['whole','whole'], ['view','view'],

  ['~','Easy row'],
  ['fix','fix'], ['ezoom','ezoom'], ['etext','etext'], ['egeo','egeo'],
  ['~','Home row'],
  ['caps','caps'], ['draw','draw'], ['crop','crop'],
  ['adjust','adjust'], ['sheet','turn'],

  ['glass','glass'],
  ['~','Place'],

  ['tiltV','tiltVert'], ['tiltH','tiltHorz'],

  ['dice','gRnd'], ['fwd','rndNext'],

  ['hist','hist'], ['cam','cam'],

  ['frames','gFrames'], ['fnLine','gFLine'], ['fnTwin','gFTwin'],
  ['fnDash','gFDash'], ['fnBevel','gFBevel'], ['fnMat','gFMat'],
  ['fnShade','gFShade'], ['fnCorn','gFCorn'], ['fnNeg','gFNeg'], ['fnShell','gFShell'],

  ['patch','cutTool'],

  ['pads','pads'], ['addpic','fromFile'], ['pack','stickers'], ['place','put'],
  ['~','Sheet'],

  ['size','gWhole'], ['fitBox','gFrameOnly'], ['lock','keepProp'], ['tick','done'],
  ['colorflip','duoFlip'],
  ['~','Everywhere'],
  ['more','more'], ['xmark','close'], ['back','undo'], ['back2','legBack'], ['reset','reset'],

  ['~','Probe'],
  ['probe','probe'], ['find','find'],
  ['~','Turn'],

  ['turnR','turnSpin'], ['turnL','turnLeft'], ['flipH','turnMir'], ['flipV','turnFlip'],
  ['~','Caption'],
  ['text','text'], ['plate','plate'], ['bubble','bubble'],
  ['brush','brush'], ['eraser','eraser'], ['reveal','reveal'],
  ['line','line'], ['rect','rect'],
  ['sel','sel'], ['eye','eye'], ['del','del'],

  ['circle','shOval'], ['tri','tri'], ['arc','arc'], ['arrow','arrow'],
  ['copy','copy'],

  ['mark','mark'], ['blurIn','blurIn'], ['guide','uGrid'],
  ['fillIn','fillIn'], ['above','above'],
  ['~','Cutting out'],
  ['free','legFree'], ['keep','cutKeep'], ['poly','legPoly'], ['bycolor','legColor'],
  ['folderIn','saveAs'],
  ['~','Crop'],
  ['vert','vert'], ['horz','horz'], ['ratioFree','legFree'],
  ['gNone','uNone'], ['gThirds','uThirds'], ['gPhi','uPhi'],
  ['gDiag','uDiag'], ['gCenter','uCenter'], ['gSafe','uSafe'],
  ['shRect','shRect'], ['shRound','shRound'],
  ['~','Size'],
  ['lock','keepProp'], ['rotate','rotate'],
  ['aBr','aBr'], ['aCo','aCo'], ['aSa','aSa'], ['aTe','aTe'], ['aGa','aGa'],
  ['aSh','aSh'], ['aBl','aBl'], ['aGr','aGr'], ['aVi','aVi'], ['aMix','aMix'], ['mHue','mHue'],
  ['peek','peek'],
  ['~','Settings'],
  ['fbSnd','fbSnd'], ['fbOff','fbOff'], ['icons','icons']
];

function TE(k){ return (L.en[k] !== undefined) ? L.en[k] : k; }

function buildLegend(){

  var rc = $('refClose');
  if (rc){
    rc.innerHTML = '<svg viewBox="0 0 24 24">' + ICON.back + '</svg><span>' + TE('back') + '</span>';
    rc.setAttribute('aria-label', TE('back'));
    rc.title = TE('back');
  }
  var box = $('legend');
  if (!box) return;
  var h = '';
  for (var i = 0; i < LEG.length; i++){

    if (LEG[i][0] === '~'){
      h += '<div class="lhead">' + LEG[i][1] + '</div>';
      continue;
    }
    var g = ICON[LEG[i][0]];
    if (!g) continue;
    h += '<div><svg viewBox="0 0 24 24">' + g + '</svg><span>' + TE(LEG[i][1]) + '</span></div>';
  }
  box.innerHTML = h;
}

function esc(t){
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var REFQ = '', REFN = 0, REFHITS = 0;

function refMark(t){
  var e = esc(t);
  if (!REFQ) return e;
  var q = esc(REFQ), out = '', low = e.toLowerCase(), lq = q.toLowerCase(), i = 0;
  for (;;){
    var k = low.indexOf(lq, i);
    if (k < 0){ out += e.slice(i); break; }
    out += e.slice(i, k) + '<mark data-n="' + REFHITS + '">' + e.slice(k, k + q.length) + '</mark>';
    REFHITS++;
    i = k + q.length;
  }
  return out;
}

function buildRef(){
  var box = $('refBody');
  if (!box) return;
  REFHITS = 0;
  var h = '<div>' + refMark(REF.intro) + '</div>', i;
  for (i = 0; i < REF.screens.length; i++)
    h += '<b>' + refMark(REF.screens[i][0]) + '</b><div>' + refMark(REF.screens[i][1]) + '</div>';
  h += '<b>Limits</b><table>';
  for (i = 0; i < REF.limits.length; i++)
    h += '<tr><td>' + refMark(REF.limits[i][0]) + '</td><td>' + refMark(REF.limits[i][1]) + '</td></tr>';
  h += '</table><div>' + refMark(REF.note) + '</div>';
  box.innerHTML = h;
  if ($('refTitle')) $('refTitle').textContent = REF.title;
  if ($('refSigns')) $('refSigns').textContent = REF.signs;
  buildLegend();
  refGoTo();
}

function refGoTo(){
  var box = $('refBody');
  if (!box) return;
  var ms = box.querySelectorAll('mark');
  if (!ms.length){ REFN = 0; return; }
  if (REFN >= ms.length) REFN = 0;
  for (var i = 0; i < ms.length; i++) ms[i].classList.toggle('at', i === REFN);
  if (ms[REFN].scrollIntoView) ms[REFN].scrollIntoView({block:'center'});
}

function refSeek(next){
  var f = $('refQ');
  var q = f ? String(f.value || '').trim() : '';
  if (q !== REFQ){ REFQ = q; REFN = 0; buildRef(); return; }
  if (!REFQ) return;
  REFN++;
  refGoTo();
}

var OVERBACK = null;

function overOpen(pane, fn){
  OVERBACK = el.menu.classList.contains('open') ? 'menu' : null;
  closeMenu();
  if (fn) fn();
  el[pane].classList.add('open');
  syncDepth();
}

function overClose(pane){
  el[pane].classList.remove('open');
  if (OVERBACK === 'menu') openMenu();

  else showProps(S.sel >= 0);
  OVERBACK = null;
  syncDepth();
}

function overNow(){
  if (el.probe && el.probe.classList.contains('open')) return 'probe';
  if (el.ref && el.ref.classList.contains('open')) return 'ref';
  return null;
}

function openRef(){
  REFQ = ''; REFN = 0;
  if ($('refQ')) $('refQ').value = '';
  overOpen('ref', buildRef);
}

function closeRef(){ overClose('ref'); }

var PROBET = '';

function probeLine(name, f){
  var v;
  try { v = f(); }
  catch(e){
    var m = (e && e.message ? e.message : String(e));
    errOnce('probe:' + name, logT('probeField', name, m));
    v = 'unavailable: ' + m;
  }
  return name + ': ' + v;
}

function probeCanvas(){
  var t = document.createElement('canvas');
  t.width = 32; t.height = 32;
  var q = t.getContext('2d');
  if (!q) return 'dead: no context';
  q.fillStyle = '#ff8000';
  q.fillRect(0, 0, 32, 32);
  var d = q.getImageData(30, 30, 1, 1).data;
  return (d[0] === 255 && d[3] === 255) ? 'alive' : 'silent: corner ' + d[0] + ',' + d[1] + ',' + d[2] + ',' + d[3];
}

function probeWhere(){
  for (var i = 0; i < PANES.length; i++){
    var q = el[PANES[i]];
    if (q && q.classList.contains('open')) return PANES[i];
  }
  return 'canvas';
}

function probeReport(){
  var v = '?';
  try { var m = document.querySelector('.made'); if (m) v = m.textContent.replace(/[^0-9.]/g, ''); }
  catch(e){  }

  var L = [];
  L.push('JOT · probe  ' + v + '   ' + errClock());
  L.push(probeLine('device', function(){ return navigator.userAgent.slice(0, 120); }));
  L.push(probeLine('screen', function(){
    return window.innerWidth + '×' + window.innerHeight + ' @' + (window.devicePixelRatio || 1); }));
  L.push('');

  L.push(probeLine('where', function(){ return probeWhere() + '   mode: ' + S.mode; }));
  L.push(probeLine('tool', function(){

    return S.tool + '   cut: ' + (S.cutTool || 'none') +
           '   tolerance: ' + S.cutTol; }));
  L.push('');

  L.push(probeLine('photo', function(){
    return S.img ? (S.iw + '×' + S.ih + '   alpha: ' + (S.alpha ? 'yes' : 'no')) : 'none'; }));

  L.push(probeLine('eyedropper', function(){
    if (!EYELOG) return S.eye ? 'on, nothing tried yet' : 'off';
    return EYELOG;
  }));
  L.push(probeLine('page', function(){ return S.pages ? (S.page + 1) + ' of ' + S.pages : 'not a document'; }));
  L.push(probeLine('frame', function(){
    var c = S.crop;
    return c.x.toFixed(3) + ' ' + c.y.toFixed(3) + ' ' + c.w.toFixed(3) + ' ' + c.h.toFixed(3) +
           '   ratio: ' + S.ratio + ' ' + S.orient; }));

  L.push(probeLine('hand frame', function(){
    var c = S.cropRaw || {x:0,y:0,w:0,h:0};
    return c.x.toFixed(3) + ' ' + c.y.toFixed(3) + ' ' + c.w.toFixed(3) + ' ' + c.h.toFixed(3) +
           (S.cropRect ? '   box: ' + S.cropRect.x.toFixed(3) + ' ' + S.cropRect.y.toFixed(3) +
                         ' ' + S.cropRect.w.toFixed(3) + ' ' + S.cropRect.h.toFixed(3) : ''); }));

  L.push(probeLine('turn', function(){ return 'quarters ' + S.turn.r + '   mirror: ' + (S.turn.m ? 'yes' : 'no') +
                                              '   angle: ' + (S.ang || 0); }));

  L.push(probeLine('lens', function(){ return 'focus ' + (S.focus || 0) + '   tilt ' + (S.tilt || 0); }));
  L.push(probeLine('sheet', function(){
    return 'rounding ' + S.mask + '   backdrop ' + S.bg + ' at ' + S.bgA; }));

  L.push(probeLine('size', function(){
    if (!SIZE) return 'off in this build';
    if (!S.out) return 'none';
    return S.out.w + '×' + S.out.h + (S.prop ? '   locked' : '   free');
  }));
  L.push(probeLine('margins', function(){
    if (!PADS) return 'off in this build';
    var p = S.pad || {t:0, r:0, b:0, l:0}, q = padPx();
    if (!(p.t || p.r || p.b || p.l)) return 'none';

    return 'l ' + p.l + ' r ' + p.r + ' t ' + p.t + ' b ' + p.b +
           '   px: l ' + Math.round(q.l) + ' r ' + Math.round(q.r) +
           ' t ' + Math.round(q.t) + ' b ' + Math.round(q.b);
  }));
  L.push(probeLine('built with', function(){
    return (PADS ? 'margins' : 'no margins') + ', ' + (SIZE ? 'size' : 'no size'); }));
  L.push('');

  L.push(probeLine('cut', function(){ return S.cut.length + ' pieces'; }));
  L.push(probeLine('one colour', function(){
    return S.pop ? (S.pop.x.toFixed(3) + ' ' + S.pop.y.toFixed(3) + '   tolerance ' + S.pop.tol) : 'none'; }));

  L.push(probeLine('by colour', function(){
    return S.byc ? (S.byc.x.toFixed(3) + ' ' + S.byc.y.toFixed(3) +
                    '   tolerance ' + S.byc.tol) : 'none'; }));
  L.push(probeLine('markup', function(){
    return 'objects ' + S.objs.length + '   strokes ' + S.ink.length + '   selected ' + S.sel; }));
  L.push(probeLine('filter', function(){ return S.glass + ' at ' + S.glassK; }));
  L.push(probeLine('undo steps', function(){ return S.undo.length; }));
  L.push('');

  L.push(probeLine('settings', function(){
    return 'export ' + cfg.fmt + '   lighter ' + (cfg.lite ? 'yes' : 'no') +
           '   language ' + langNow() + '   theme ' + cfg.theme + '/' + cfg.accent; }));
  L.push(probeLine('canvas', probeCanvas));

  L.push(probeLine('response', function(){ return perfLine(); }));
  L.push('');

  L.push('--- log · newest at the bottom · ' + ERRS.length + ' ---');
  if (!ERRS.length) L.push('empty. That is good news.');
  else for (var i = 0; i < ERRS.length; i++) L.push(ERRS[i]);
  return L.join('\n');
}

function probePaint(){
  var t = $('probeT'), f = $('probeF');
  if (!t) return;
  var q = (f && f.classList.contains('on') && f.value ? f.value : '').toLowerCase();
  if (!q){ t.textContent = PROBET; return; }
  var out = [], all = PROBET.split('\n');
  for (var i = 0; i < all.length; i++){
    if (all[i].toLowerCase().indexOf(q) >= 0) out.push(all[i]);
  }
  t.textContent = out.length ? out.join('\n') : 'nothing matched';
}

function probeShow(){
  overOpen('probe', function(){
    PROBET = probeReport();
    var f = $('probeF');
    if (f){ f.classList.remove('on'); f.value = ''; }
    probePaint();
  });
}

function probeHide(){ overClose('probe'); }

function probeCopyOld(txt, done){
  try {
    var a = document.createElement('textarea');
    a.value = txt;
    a.style.position = 'fixed';
    a.style.opacity = '0';
    document.body.appendChild(a);
    a.select();
    var okc = document.execCommand('copy');
    document.body.removeChild(a);
    if (okc){ done(); return; }
  } catch(e){ errNote(logT('clipFallback', e), 0); }
  say('hFail', 3000);
}

function accentNow(){
  var t = THEMES[cfg.theme] || THEMES.black;
  return (cfg.accent === 'none') ? t.ink : (ACCENTS[cfg.accent] || ACCENTS.red);
}

function contrast(a, b){
  var la = lum(a) + 0.05, lb = lum(b) + 0.05;
  return (la > lb) ? la/lb : lb/la;
}

function accentInk(){
  var t = THEMES[cfg.theme] || THEMES.black;
  var ac = accentNow();

  if (lum(t.bg) <= 0.5) return ac;
  return (contrast(ac, t.bg) >= 2.2) ? ac : t.ink;
}

function furnitureCol(){
  return accentNow();
}

function opaque(c){
  var m = String(c).match(/rgba?\(([^)]+)\)/);
  if (!m) return c;
  var p = m[1].split(',');
  return 'rgb(' + p[0].trim() + ',' + p[1].trim() + ',' + p[2].trim() + ')';
}

function applyTheme(){
  var t = THEMES[cfg.theme] || THEMES.black;
  var ac = accentNow();
  var r = document.documentElement;
  if (r && r.style && r.style.setProperty){
    r.style.setProperty('--bg', t.bg);
    r.style.setProperty('--bar', t.bar);

    r.style.setProperty('--solid', opaque(t.bar));
    r.style.setProperty('--btn', t.btn);
    r.style.setProperty('--btn2', t.btn2);
    r.style.setProperty('--ink', t.ink);
    r.style.setProperty('--dim', t.dim);
    r.style.setProperty('--hot', ac);
    r.style.setProperty('--hotInk', accentInk());

    r.style.setProperty('--signPad',
      contrast(accentInk(), '#000000') >= 3 ? 'rgba(0,0,0,.38)' : 'rgba(255,255,255,.34)');
    r.style.setProperty('--hot2', lum(ac) < 0.55 ? '#ffffff' : '#141416');
  }

  if (el.acNone && el.acNone.style) el.acNone.style.background = t.ink;
  BG = t.bg;

  INK = t.ink;
  if (el.themes) mark(el.themes.parentNode ? el.themes : el.themes, 'th', cfg.theme);
  markAll('[data-th]', 'th', cfg.theme);

  markAll('[data-ac]', 'ac', cfg.accent);
  draw();
}

function cfPick(e){
  eyeGiveUp(e);

  if (S.cutFill){ touch(); S.cutFill = null; markCF(); draw(); return; }
  openPicker('cutFill');
}

function isOwnCF(){
  return !!S.cutFill && S.cutFill !== '#ffffff' && S.cutFill !== '#000000';
}

function markCF(){
  var b = $('cfColor');
  if (!b) return;
  var on = !!S.cutFill;
  var w = on ? (T('cutFill') + ': ' + T('cutTake')) : T('cutFill');
  b.innerHTML = '<i></i><span>' + w + '</span>';
  b.setAttribute('aria-label', w);
  b.title = w;
  b.classList.toggle('on', on);
  b.style.setProperty('--own', on ? S.cutFill : 'rgba(0,0,0,0)');
}

function markPick(attr, cur, own){
  if (!document.querySelectorAll) return;
  var n = document.querySelectorAll('[data-' + attr + ']');
  for (var i = 0; i < n.length; i++){
    var d = n[i].dataset;
    if (!d) continue;
    if (d[attr] === 'own'){
      n[i].classList.toggle('on', own);
      n[i].style.setProperty('--own', own ? cur : 'rgba(0,0,0,0)');
    } else {
      n[i].classList.toggle('on', d[attr] === cur);
    }
  }
}

function markAll(sel, key, val){
  if (!document.querySelectorAll) return;
  var n = document.querySelectorAll(sel);
  for (var i = 0; i < n.length; i++)
    if (n[i].dataset) n[i].classList.toggle('on', n[i].dataset[key] === val);
}

function setTheme(t){
  if (!THEMES[t]) return;

  var wasDefault = (cfg.desk === deskOf(cfg.theme));

  var accWasDefault = (cfg.accent === accOf(cfg.theme));
  cfg.theme = t;
  if (wasDefault) cfg.desk = deskOf(t);
  if (accWasDefault) cfg.accent = accOf(t);
  saveCfg(); applyTheme(); paintDesk();
}

function paintDesk(){
  if (el.desk) el.desk.value = String(deskTone());
}

function setDesk(v){
  var n = parseInt(v, 10);
  if (isNaN(n)) return;
  cfg.desk = clamp(n, 0, 100);
  saveCfg();
  draw();
}

function setAccent(a){

  if (a !== 'none' && !ACCENTS[a]) return;
  cfg.accent = a; saveCfg(); applyTheme();
}

function paintSwitches(){

  var b1 = $('bFb');
  if (b1){
    var nm = T('fb');
    b1.innerHTML = '<i><svg viewBox="0 0 24 24">' +
      (ICON[cfg.fb === 'snd' ? 'fbSnd' : 'fbOff'] || '') + '</svg></i><span>' + nm + '</span>';
    b1.setAttribute('aria-label', nm);

    b1.classList.remove('on');
  }

  var b2 = $('bHv');
  if (b2) b2.textContent = T('hVoice') + ': ' + T(cfg.hv === 'always' ? 'hvOn' : 'hvOff');
  var b3 = $('bLite');
  if (b3) b3.textContent = T('lite') + ': ' + T(cfg.lite ? 'ltOn' : 'ltOff');
}

function setFb(v){
  if (v !== 'off' && v !== 'snd') return;
  cfg.fb = v; saveCfg();
  paintSwitches();

  feel('open');
}

function buildFlags(){
  if (!el.flags) return;
  for (var i = 0; i < FLAGS.length; i++){
    var b = document.createElement('button');

    if (ICON[FLAGS[i][1]])
      b.innerHTML = '<svg viewBox="0 0 24 24">' + ICON[FLAGS[i][1]] + '</svg>';
    else b.textContent = FLAGS[i][1];
    b.dataset.lang = FLAGS[i][0];
    el.flags.appendChild(b);
  }

  var tail = (4 - FLAGS.length % 4) % 4;
  for (var z = 0; z < tail; z++){
    var d = document.createElement('button');
    d.className = 'off';
    d.textContent = '·';
    el.flags.appendChild(d);
  }
  el.flags.onclick = function(e){

    var t = e.target;
    while (t && t !== el.flags && !(t.dataset && t.dataset.lang)) t = t.parentNode;
    var l = (t && t.dataset) ? t.dataset.lang : null;
    if (l) setLang(l);
  };
}

function setLang(l){
  if (l !== 'auto' && l !== 'icons' && !L[l]) return;
  cfg.lang = l; saveCfg();
  markAll('[data-lang]', 'lang', l);

  if (document.documentElement)
    document.documentElement.classList.toggle('icons', l === 'icons');
  var r = document.documentElement;
  if (r) r.dir = RTL[langNow()] ? 'rtl' : 'ltr';
  paintLabels();
}

function setFmt(f){
  cfg.fmt = f; saveCfg();
  mark(el.fmts, 'fmt', f);
  paintSaveDir();
  if (f === 'png') say('hBig', 5000);
}

function saveDir(){ return cfg.fmt === 'pdf' ? 'Download/Jot' : 'Pictures/Jot'; }

function saveDirShort(){ return 'Jot'; }

function paintSaveDir(){
  var b = $('saveHere');
  if (!b) return;

  dressIcon(b, 'save', 'saveHere', T('saveHere').replace('{dir}', saveDirShort()));
}

function viewStart(){
  if (noSheet()){ say('hNoImg'); return; }
  if (S.mode === 'view') return;

  if (el.txt) el.txt.blur();

  loupeHide();
  closeMenu(); closeSaver();
  S.sel = -1;
  S.prev = S.mode;
  S.was = {s:V.s, ox:V.ox, oy:V.oy, ah:V.ah};

  S.cropSaved = null;
  if (S.mode === 'crop' && S.cropRect &&
      S.cropRect.w > 0.02 && S.cropRect.h > 0.02){
    S.cropSaved = S.crop;
    S.crop = warpFit(S.cropRect);
  }
  S.mode = 'view';

  S.hidden = [];
  eachPane(function(p){
    if (p.classList.contains('open')){ p.classList.add('vhide'); S.hidden.push(p); }
  });
  bars(false);
  fit(); draw();

  syncDepth();
  say('hView', 3000);
}

function viewEnd(){
  S.mode = S.prev || 'edit';
  S.prev = 'edit';
  if (S.hidden){
    for (var i = 0; i < S.hidden.length; i++) S.hidden[i].classList.remove('vhide');
    S.hidden = null;
  }
  if (S.cropSaved){ S.crop = S.cropSaved; S.cropSaved = null; }
  bars(true);

  if (S.was){ V.s = S.was.s; V.ox = S.was.ox; V.oy = S.was.oy; V.ah = S.was.ah; S.was = null; }
  reflow(); draw();

  syncDepth();
}

var ADJ = [['aBr','br'], ['aCo','co'], ['aSa','sa'], ['aTe','te'], ['aGa','ga'],
           ['aSh','sh'], ['aBl','bl'], ['aGr','gr'], ['aVi','vi']];

function adjPaint(){
  var k = S.pick2;

  if (k === 'auto') k = S.pick2 = 'br';
  var a = S.adj[k] || 0;
  var one = (k === 'sh' || k === 'bl' || k === 'gr' || k === 'vi');
  if (el.slide){

    dentRelimit(el.slide, one ? 0 : -100, 100);
    setSval(el.slide, a);
  }
  if (el.aval) el.aval.textContent = (a > 0 ? '+' : '') + Math.round(a);
  if (el.aname){
    for (var i = 0; i < ADJ.length; i++)
      if (ADJ[i][1] === k) el.aname.textContent = T(ADJ[i][0]);
  }
  markAll('[data-a]', 'a', k);
}

function adjTake(k){
  S.pick2 = k;
  adjPaint();
}

var MIXH = [0, 30, 60, 120, 180, 240, 285, 320];
var MIXW = [['h','mHue'], ['s','mSat'], ['l','mLum']];

function mixPaint(){
  if (!el.mixPick) return;
  var i, b, bs = el.mixPick.querySelectorAll('button');
  for (i = 0; i < bs.length; i++){
    b = bs[i];
    b.classList.toggle('on', +b.dataset.m === S.mixI);
  }

  for (i = 0; i < MIXW.length; i++){
    b = $('mixW' + MIXW[i][0].toUpperCase());
    if (b) b.classList.toggle('on', S.mixW === MIXW[i][0]);
  }
  var w = 'hsl'.indexOf(S.mixW); if (w < 0) w = 0;
  var v = (S.mix[S.mixI] || [0,0,0])[w] || 0;
  if (el.mixName) el.mixName.textContent = T(MIXW[w][1]);
  if (el.mixVal) el.mixVal.textContent = (v > 0 ? '+' : '') + Math.round(v);
  if (el.mixSlide && typeof setSval === 'function') setSval(el.mixSlide, v);
}

function mixStart(){
  visit();
  if (noSheet()){ say('hNoImg'); return; }
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;
  mixPaint();
  soloPane('mix');
  el.mix.classList.add('open'); applyFold('mix');
  syncDepth();
  showProps(false);
  reflow(); draw();
}

function mixEnd(){
  S.peek = false;
  el.mix.classList.remove('open');
  showProps(S.sel >= 0);
  reflow(); draw();
}

function mixTake(k){
  S.mixW = k;
  mixPaint();
}

function mixSet(v){
  var w = 'hsl'.indexOf(S.mixW); if (w < 0) w = 0;
  if (!S.mix[S.mixI]) S.mix[S.mixI] = [0,0,0];

  var was = S.mix[S.mixI][w] || 0;
  S.mix[S.mixI][w] = clamp(v, -100, 100);
  if (el.mixSlide && typeof dentClick === 'function') dentClick(el.mixSlide, was);

  if (typeof mixDrop === 'function') mixDrop();
  mixPaint();
  draw();
}

function adjStart(){
  visit();
  if (noSheet()){ say('hNoImg'); return; }
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;
  adjPaint();
  soloPane('adj');
  el.adj.classList.add('open'); applyFold('adj');
  syncDepth();
  showProps(false);
  reflow(); draw();
}

function adjEnd(){

  S.peek = false;
  el.adj.classList.remove('open');
  showProps(S.sel >= 0);
  reflow(); draw();
}

function autoStats(tr){
  var d = colorSource();
  if (!d) return null;
  var w = CSRCW, h = CSRCH;
  var x0 = Math.max(0, Math.floor(S.crop.x*w)), y0 = Math.max(0, Math.floor(S.crop.y*h));
  var x1 = Math.min(w, Math.ceil((S.crop.x + S.crop.w)*w));
  var y1 = Math.min(h, Math.ceil((S.crop.y + S.crop.h)*h));
  if (x1 <= x0 || y1 <= y0) return null;
  var hist = new Array(256), i;
  for (i = 0; i < 256; i++) hist[i] = 0;
  var n = 0;
  for (var y = y0; y < y1; y++){
    var row = y*w;
    for (var x = x0; x < x1; x++){
      var p = (row + x)*4;
      var l = (d.data[p]*0.2126 + d.data[p+1]*0.7152 + d.data[p+2]*0.0722)|0;
      hist[l > 255 ? 255 : l]++;
      n++;
    }
  }
  if (!n) return null;
  var trim = n*tr, acc = 0, lo = 0, hi = 255, med = 128;
  for (i = 0; i < 256; i++){ acc += hist[i]; if (acc > trim){ lo = i; break; } }
  acc = 0;
  for (i = 255; i >= 0; i--){ acc += hist[i]; if (acc > trim){ hi = i; break; } }
  acc = 0;
  for (i = 0; i < 256; i++){ acc += hist[i]; if (acc >= n/2){ med = i; break; } }
  return {lo: lo/255, hi: hi/255, med: med/255};
}

function paperWhite(tr){
  var d = colorSource();
  if (!d) return null;
  var w = CSRCW, h = CSRCH;
  var x0 = Math.max(0, Math.floor(S.crop.x*w)), y0 = Math.max(0, Math.floor(S.crop.y*h));
  var x1 = Math.min(w, Math.ceil((S.crop.x + S.crop.w)*w));
  var y1 = Math.min(h, Math.ceil((S.crop.y + S.crop.h)*h));
  if (x1 <= x0 || y1 <= y0) return null;
  var hR = new Array(256), hB = new Array(256), i;
  for (i = 0; i < 256; i++){ hR[i] = 0; hB[i] = 0; }
  var n = 0;
  for (var y = y0; y < y1; y++){
    var row = y*w;
    for (var x = x0; x < x1; x++){
      var p = (row + x)*4;
      hR[d.data[p]]++; hB[d.data[p+2]]++; n++;
    }
  }
  if (!n) return null;
  var trim = n*(tr === undefined ? 0.01 : tr), acc, wr = 255, wb = 255;
  acc = 0; for (i = 255; i >= 0; i--){ acc += hR[i]; if (acc > trim){ wr = i; break; } }
  acc = 0; for (i = 255; i >= 0; i--){ acc += hB[i]; if (acc > trim){ wb = i; break; } }
  return {wr: wr, wb: wb};
}

function fixApply(quiet){
  if (noSheet()){ if (!quiet) say('hNoImg'); return; }
  var t = clamp(S.fixV || 0, 0, 100);
  var au = null, pt = 0, soft = false;
  if (t > 0){
    var pth = fixPath(t);

    var KS = [pth.k, 0.65, 0.50, 0.35, 0.20, 0.05], ki, nm = null, st = null;
    for (ki = 0; ki < KS.length; ki++){
      if (KS[ki] > pth.k) continue;
      nm = autoNums(KS[ki]);
      st = autoStats(nm.trim);
      if (!st) break;
      au = autoFit(autoFrom(st.lo, st.hi, st.med, nm));
      if (au) break;
      soft = true;
    }
    if (typeof errNote === 'function'){
      if (!st) errNote(logT('easyfixHist'), 0);
      else if (!au) errNote(logT('easyfixLow', st.lo), 0);
      else if (soft) errNote(logT('easyfixSoft'), 0);
    }
    if (pth.paper > 0){
      var pw = paperWhite();
      if (pw) pt = paperTe(pw.wr, pw.wb);
    }
  }
  var v = fixNums(t, au, pt);
  if (!quiet) touch();

  S.adj.br = v.br; S.adj.co = v.co; S.adj.ga = v.ga; S.adj.te = v.te;
  if (typeof adjPaint === 'function') adjPaint();
  if (typeof dbgPaint === 'function') dbgPaint();
  draw();
  if ((v.capped || soft) && !quiet) say('hFixCap', 3000);
}

function fixPits(){
  var b = el.fixSlide;
  if (!b) return;
  var img = [], pos = [];
  for (var i = 0; i < FIXN.length; i++){
    img.push('linear-gradient(var(--dim), var(--dim))');
    pos.push(FIXN[i] + '% center');
  }
  b.classList.add('pits');
  b.style.backgroundImage = img.join(',');
  b.style.backgroundPosition = pos.join(',');
}

function easyToggle(which){
  var row = el.easyRow;
  if (!row) return;
  if (which && noSheet()){ say('hNoImg'); return; }
  S.fixOn = (which === 'fix');
  S.zoomOn = (which === 'zoom');
  S.geoOn = (which === 'geo');
  S.histOn = (which === 'hist');
  row.classList.toggle('fixon', S.fixOn);
  row.classList.toggle('zoomon', S.zoomOn);
  row.classList.toggle('geoon', S.geoOn);
  row.classList.toggle('histon', S.histOn);
  row.classList.remove('ready');

  if (which && typeof fit === 'function') fit();

  if (S.histOn){
    S.histHead = snapState();

    S.histBy = null;
    var n0 = S.undo.length;
    var hs = $('histSlide');
    if (hs) hs.max = String(n0);

    histShow(n0 > 0 ? n0 - 1 : n0);
    if (hs) hs.value = String(S.histAt);
  } else if (S.histHead){

    if (!S.histBy) histShow(S.undo.length);
    S.histHead = null;
    S.histBy = null;
  }
  if (S.fixOn) fixPits();
  if (S.zoomOn){

    S.zoomBase = {x:S.crop.x, y:S.crop.y, w:S.crop.w, h:S.crop.h};
    var sh0 = sheet();
    S.zoomWin = {x:V.ox, y:V.oy, w:sh0.w*V.s, h:sh0.h*V.s};
  } else { S.zoomBase = null; S.zoomWin = null; }
  if (S.geoOn){

    S.angBase = {x:S.crop.x, y:S.crop.y, w:S.crop.w, h:S.crop.h};
    var shG = sheet();
    S.angWin = {x:V.ox, y:V.oy, w:shG.w*V.s, h:shG.h*V.s};

  } else if (!S.zoomOn) { S.angBase = null; S.angWin = null; }

  if (row.querySelectorAll){
    var bs = row.querySelectorAll('button[data-i]');
    var cls = which ? ('away' + which.charAt(0).toUpperCase() + which.slice(1)) : null;
    for (var bi = 0; bi < bs.length; bi++){
      var bb = bs[bi];
      if (!bb.dataset.own) bb.dataset.own = bb.dataset.i + '|' + bb.dataset.t;
      var own = bb.dataset.own.split('|');
      var taken = !!cls && !bb.classList.contains(cls);
      dressIcon(bb, taken ? 'more' : own[0], taken ? 'more' : own[1]);
    }
  }

  if (which) visit();
  easySync();

  S.warpHold = false;
  S.easySeq = (S.easySeq || 0) + 1;
  var seq = S.easySeq;
  if (which) setTimeout(function(){ if (S.easySeq === seq) row.classList.add('ready'); }, 200);
  if (typeof dbgPaint === 'function') dbgPaint();
  draw();
}

function geoApply(){
  if (noSheet()) return;
  S.crop = warpFit(S.cropRaw);
  if (!S.angBase) return;
  var w0 = S.angWin, sh2 = sheet();
  if (w0 && sh2.w > 0){
    V.s = w0.w/sh2.w;
    V.ox = w0.x;
    V.oy = w0.y;
  }
  if (typeof dbgPaint === 'function') dbgPaint();
  draw();
}

function zoomApply(quiet){
  if (noSheet() || !S.zoomBase) return;
  var v = clamp(S.zoomV || 0, 0, 100);
  if (!quiet) touch();

  S.cropRaw = zoomClamp(zoomCrop(S.zoomBase, v));
  S.crop = warpFit(S.cropRaw);

  var w0 = S.zoomWin, sh2 = sheet();
  if (w0 && sh2.w > 0 && sh2.h > 0){
    V.s = w0.w/sh2.w;
    V.ox = w0.x;
    V.oy = w0.y;
  }
  draw();
}

function zoomPanning(){
  return !!(S.zoomOn && S.zoomBase && S.crop.w < S.zoomBase.w - 1e-6);
}

function zoomPan(dxi, dyi){
  if (!zoomPanning()) return;

  var was = S.cropRaw || S.crop;
  S.cropRaw = zoomClamp({x: was.x - dxi, y: was.y - dyi, w: was.w, h: was.h});
  S.crop = warpFit(S.cropRaw);

  if (S.zoomBase){
    S.zoomBase.x += (S.cropRaw.x - was.x);
    S.zoomBase.y += (S.cropRaw.y - was.y);
  }
  draw();
}

function adjReset(){

  touch();
  for (var i = 0; i < ADJ.length; i++) S.adj[ADJ[i][1]] = 0;
  adjPaint();
  draw();
}

function pkColor(){
  return hsv2hex(+el.pkH.value, (+el.pkS.value)/100, (+el.pkV.value)/100);
}

function pkPaint(){
  var h = +el.pkH.value, s = (+el.pkS.value)/100, v = (+el.pkV.value)/100;
  var col = pkColor();
  el.pkDot.style.background = col;
  el.pkH.style.background = 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';
  el.pkS.style.background = 'linear-gradient(90deg,' + hsv2hex(h, 0, v) + ',' + hsv2hex(h, 1, v) + ')';
  el.pkV.style.background = 'linear-gradient(90deg,#000,' + hsv2hex(h, s, 1) + ')';
}

function putColor(who, col){

  if (who === 'duoDark' || who === 'duoLite'){
    cfg[who === 'duoDark' ? 'duoDark' : 'duoLite'] = col;
    saveCfg(); duoPaint();
    if (typeof setGlassFilter === 'function') setGlassFilter();
    glassBuild(); draw();
    return;
  }
  if (who === 'ink'){
    var os = (typeof selShape === 'function') ? selShape() : null;
    if (os){ os.c = col; drawPaint(); }
    else { S.c = col; paintDot(); markOwn(); }
  }

  else if (who === 'cutFill'){ S.cutFill = col; S.cfOwn = col; markCF(); }

  else if (who === 'frameCol'){ S.frameCol = col; S.frOwn = col; frameMark(); }
  else { edited(function(o){ o.c = col; }); capPaint(); }
}

function pkApply(){ putColor(S.pkFor, pkColor()); }

function eyeStart(from){
  if (noSheet()) return;
  S.eye = true;
  S.eyeFrom = EYETO[from] ? from : 'picker';
  S.eyeAt = null;
  S.eyeCol = null;

  if (S.eyeFrom === 'picker' && el.picker) el.picker.classList.add('vhide');
  markEyes(!!EYETO[S.eyeFrom]);
  say('hEye', 20000);
}

var EYELOG = '';

var EYETIP = '';

function eyeBase(x, y){
  EYELOG = ''; EYETIP = '';
  if (noSheet()) return null;
  var q = toImage(x, y);
  var b = maskBox();
  var say2 = function(why, col){
    EYETIP = Math.round(q[0]) + ',' + Math.round(q[1]) + '  ' + why +
             (col ? ('  ' + col) : '');
    EYELOG = 'image ' + Math.round(q[0]) + ',' + Math.round(q[1]) +
             ' of ' + Math.round(b.w) + '×' + Math.round(b.h) +
             '   box ' + Math.round(b.x0) + ',' + Math.round(b.y0) +
             '   copy ' + (EYEPX ? (EYEPX.width + '×' + EYEPX.height) : 'none') +
             '   ' + why + (col ? (' ' + col) : '');
    return col || null;
  };

  if (q[0] < b.x0 || q[0] >= b.x0 + b.w || q[1] < b.y0 || q[1] >= b.y0 + b.h) return say2('outside sheet');
  if (cutAway(q[0], q[1])) return say2('in a hole');

  var bg = (bgAlpha() > 0) ? bgHex() : null;

  var fx = S.crop.x*S.iw, fy = S.crop.y*S.ih;
  var fw = S.crop.w*S.iw, fh = S.crop.h*S.ih;
  var inFrame = (q[0] >= fx && q[0] < fx + fw && q[1] >= fy && q[1] < fy + fh);
  if (inFrame){
    var sp = imgSample(q[0], q[1]);
    if (sp){

      if (!bg) return say2('from photo', rgb2hex(Math.round(sp.r), Math.round(sp.g), Math.round(sp.b)));
      return say2('from photo over paper', overBg(sp, bg));
    }
  }

  var sp2 = eyeSheet(q[0], q[1]);
  if (sp2) return say2('from copy', bg ? overBg(sp2, bg) : rgb2hex(Math.round(sp2.r), Math.round(sp2.g), Math.round(sp2.b)));
  if (inFrame) return say2('photo empty here', bg);
  return say2('in the margin', bg);
}

function cutAway(ix, iy){
  var m = (typeof cutMask === 'function') ? cutMask() : null;
  if (!m) return false;
  var b = maskBox();
  var mx = Math.round((ix - b.x0)*b.kx), my = Math.round((iy - b.y0)*b.ky);
  if (mx < 0 || my < 0 || mx >= m.width || my >= m.height) return false;
  try {
    var d = m.getContext('2d').getImageData(mx, my, 1, 1).data;
    return d[3] < 128;
  } catch(_){

    errOnce('maskRead', logT('maskRead'));
    return false;
  }
}

function eyeSheet(ix, iy){
  if (!EYEPX) return null;
  var b = maskBox();
  var w = EYEPX.width, h = EYEPX.height, d = EYEPX.data;
  var cx = Math.round((ix - b.x0)/b.w * w), cy = Math.round((iy - b.y0)/b.h * h);
  var r = 0, g = 0, bl = 0, aw = 0, cnt = 0;
  for (var dy = -2; dy <= 2; dy++){
    for (var dx = -2; dx <= 2; dx++){
      var px = cx + dx, py = cy + dy;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      var i = (py*w + px)*4, a = d[i+3]/255;
      r += d[i]*a; g += d[i+1]*a; bl += d[i+2]*a;
      aw += a; cnt++;
    }
  }
  if (!cnt || aw <= 0) return null;
  return {r: r/aw, g: g/aw, b: bl/aw, a: aw/cnt};
}

function imgSample(ix, iy){
  var px = Math.round(clamp(ix, 0, S.iw - 1)), py = Math.round(clamp(iy, 0, S.ih - 1));
  var n = 5, h = (n - 1)/2;
  var cn = document.createElement('canvas');
  cn.width = n; cn.height = n;
  var c = cn.getContext('2d');
  try { c.filter = filterOf(n); }
  catch(_){  }
  c.drawImage(S.img, px - h, py - h, n, n, 0, 0, n, n);
  var d;
  try { d = c.getImageData(0, 0, n, n).data; }
  catch(_){

    errOnce('eyeRead', logT('eyeRead'));
    return null;
  }
  var r = 0, g = 0, b = 0, aw = 0, cnt = 0;
  for (var i = 0; i + 3 < d.length; i += 4){
    var a = d[i+3]/255;
    r += d[i]*a; g += d[i+1]*a; b += d[i+2]*a;
    aw += a; cnt++;
  }
  if (!cnt || aw <= 0) return null;
  return {r: r/aw, g: g/aw, b: b/aw, a: aw/cnt};
}

function overBg(sp, hex){
  var t = String(hex).replace('#', '');
  if (t.length === 3) t = t[0]+t[0]+t[1]+t[1]+t[2]+t[2];

  var br = parseInt(t.slice(0,2), 16) || 0, bg2 = parseInt(t.slice(2,4), 16) || 0,
      bb = parseInt(t.slice(4,6), 16) || 0;
  var a = clamp(sp.a, 0, 1);
  return rgb2hex(Math.round(sp.r*a + br*(1-a)),
                 Math.round(sp.g*a + bg2*(1-a)),
                 Math.round(sp.b*a + bb*(1-a)));
}

function eyeSample(x, y){
  S.eyeAt = [x, y];

  var lp = (typeof loupePoint === 'function') ? loupePoint(x, y) : [x, y];
  var hex = eyeBase(lp[0], lp[1]);
  S.eyeCol = hex;

  if (!hex){ draw(); return; }
  if (EYETO[S.eyeFrom]){ draw(); return; }
  var v = hex2hsv(hex);
  el.pkH.value = String(Math.round(v.h));
  el.pkS.value = String(Math.round(v.s*100));
  el.pkV.value = String(Math.round(v.v*100));
  pkPaint(); pkApply(); draw();
}

var EYETO = {ink:1, cap:1, bg:1, duoDark:1, duoLite:1, cutFill:1, frameCol:1};

function markEyes(on){
  if (!document.querySelectorAll) return;
  var q = document.querySelectorAll('.sw.eye, [data-swi="eye"]');
  for (var i = 0; i < q.length; i++) q[i].classList.toggle('on', !!on);
}

function eyeOff(){
  var col = S.eyeCol, from = S.eyeFrom;
  S.eye = false;
  S.eyeAt = null;
  S.eyeCol = null;
  S.eyeFrom = null;
  markEyes(false);
  if (EYETO[from]){
    if (col){ feel('eye'); putColor(from, col); }
  } else if (el.picker) el.picker.classList.remove('vhide');
  msg('');
  draw();
}

function eyeGiveUp(e){
  if (!S.eye) return;

  var t = e && e.target;
  if (t && t.closest && t.closest('.sw.eye, [data-swi="eye"]')) return;
  eyeOff();
}

function eyeEnd(){

  if (EYETO[S.eyeFrom] && !S.eyeCol){
    S.eyeAt = null;
    S.eyeCol = null;
    draw();
    return;
  }
  eyeOff();
}

function openPicker(who){
  eyeGiveUp();
  S.pkFor = who;
  var cur, was;
  if (who === 'ink'){
    var oi = (typeof selShape === 'function') ? selShape() : null;
    cur = (oi ? oi.c : S.c) || (PAL[(oi ? oi.p : S.p)] || PAL[0]).fill;
    was = oi ? oi.c : S.c;
  } else if (who === 'cutFill'){
    cur = isOwnCF() ? S.cutFill : (S.cfOwn || PAL[2].fill);
    was = S.cutFill;
  } else if (who === 'frameCol'){
    cur = S.frameCol || S.frOwn || PAL[2].fill;
    was = S.frameCol;
  } else if (who === 'duoDark' || who === 'duoLite'){
    var pr = duoPair();
    cur = (who === 'duoDark') ? pr[0] : pr[1];
    was = cur;
  } else {
    cur = (S.sel >= 0 && S.objs[S.sel] && S.objs[S.sel].c) || PAL[2].fill;
    was = (S.sel >= 0 && S.objs[S.sel]) ? S.objs[S.sel].c : null;
  }
  S.pkWas = was;
  var q = hex2hsv(cur);
  el.pkH.value = String(Math.round(q.h));
  el.pkS.value = String(Math.round(q.s*100));
  el.pkV.value = String(Math.round(q.v*100));
  pkPaint();

  if (who === 'cutFill' || who === 'frameCol'){ pkApply(); draw(); }
  S.pkHidden = [];
  eachPane(function(p){
    if (p !== el.picker && p.classList.contains('open')){
      p.classList.add('vhide'); S.pkHidden.push(p);
    }
  });
  el.picker.classList.add('open'); applyFold('picker');
  syncDepth();
}

function closePicker(keep){
  if (!keep){
    if (S.pkFor === 'ink'){
      var ob2 = (typeof selShape === 'function') ? selShape() : null;
      if (ob2){ ob2.c = S.pkWas; drawPaint(); }
      else { S.c = S.pkWas; paintDot(); markOwn(); }
    }
    else if (S.pkFor === 'cutFill'){ S.cutFill = S.pkWas; markCF(); }
    else edited(function(o){ o.c = S.pkWas; });
  }
  el.picker.classList.remove('open');
  if (S.pkHidden){
    for (var i = 0; i < S.pkHidden.length; i++) S.pkHidden[i].classList.remove('vhide');
    S.pkHidden = null;
  }
  showProps(S.sel >= 0);
  reflow(); draw();
}

function paintDot(){
  if (!el.dot) return;
  var d = Math.max(6, Math.min(44, (S.w || 0.01) * 900));
  el.dot.style.width = d + 'px';
  el.dot.style.height = d + 'px';
  el.dot.style.background = S.c || (PAL[S.p] || PAL[0]).fill;
  el.dot.style.opacity = String(S.a === undefined ? 1 : S.a);

  var t = toolNow(), k = FREE[t] ? (S.soft || 0) : 0;
  el.dot.style.mixBlendMode = (S.mark && t === 'brush') ? 'multiply' : 'normal';
  el.dot.style.filter = k > 0 ? ('blur(' + (Math.round(d*k*0.34*10)/10) + 'px)') : 'none';
}

function markSwatches(box, col, idx){
  var q = box ? box.children : [];
  for (var i = 0; i < q.length; i++){
    if (!q[i].dataset) continue;
    if (q[i].dataset.own){
      q[i].classList.toggle('on', !!col);
      q[i].style.setProperty('--own', col || 'rgba(0,0,0,0)');
    } else {

      var own = q[i].dataset.ip || q[i].dataset.p || q[i].dataset.dp;
      q[i].classList.toggle('on', !col && own !== undefined && parseInt(own, 10) === idx);
    }
  }
}

function markOwn(){ markSwatches(el.inkPal, S.c, S.p); }

function capPaint(){
  var o = (S.sel >= 0 && S.sel < S.objs.length) ? S.objs[S.sel] : null;
  if (o) markSwatches(el.pal, o.c, o.p);
}

function imgScreen(){
  return !padsOn() && onCutScreen() && !S.cutTool;
}

function selImg(){
  if (!imgScreen() || S.sel < 0 || S.sel >= S.objs.length) return null;
  var o = S.objs[S.sel];
  return isImg(o) ? o : null;
}

function padSet(){
  var p2 = padPx();
  return !!(p2.t || p2.r || p2.b || p2.l);
}

function objPaint(){

  cutDelPaint();

  var o = selImg();
  if (o){

    var put = function(a, b, v){
      if (a) a.value = String(v);
      if (b) b.value = String(v);
    };

    put($('pSize2'), null, Math.round((o.w === undefined ? 0.4 : o.w)*100));
    put($('pAlpha2'), null, Math.round((o.a === undefined ? 1 : o.a)*100));
    if ($('pRot2')) setSval($('pRot2'), o.rot || 0);
  }
  bayPaint();
}

function bayPaint(){
  var bay = $('cutBay');
  if (!bay) return;
  var cs = $('cutSl'), os = $('objSl');
  if (!cs || !os) return;
  var on = !!selImg();
  cs.classList.toggle('away', on);
  cs.classList.toggle('left', on);
  os.classList.toggle('away', !on);
  var live = on ? os : cs;

  var h = live.scrollHeight;
  if (h) bay.style.maxHeight = h + 'px';
}

function padsOn(){ return !!S.padOn && el.turn &&
                          el.turn.classList.contains('open') &&
                          !el.turn.classList.contains('vhide'); }

function szLine(){
  if (noSheet()) return '';

  var R = (S.mode === 'crop' && S.cropRect) ? warpFit(S.cropRect) : S.crop;

  var s = (S.mode === 'crop' && S.cropRect) ? sheetAfter(R) : sheetOf(R);
  var nw = Math.round(Math.max(1, R.w*S.iw)),
      nh = Math.round(Math.max(1, R.h*S.ih));

  return outNow()
    ? (nw + ' × ' + nh + '  →  ' + Math.round(s.w) + ' × ' + Math.round(s.h))
    : (nw + ' × ' + nh);
}

function szPaint(){
  var s = sheet();

  var fw = S.out ? S.out.w : Math.round(s.fw),
      fh = S.out ? S.out.h : Math.round(s.fh);
  var act = (typeof document !== 'undefined') ? document.activeElement : null;
  if (el.szW && act !== el.szW) el.szW.value = String(fw);
  if (el.szH && act !== el.szH) el.szH.value = String(fh);
  if (el.szProp) el.szProp.classList.toggle('on', !!S.prop);

  if (el.szNow || el.cropNow){
    var line = szLine();
    if (el.szNow) el.szNow.textContent = line;
    if (el.cropNow) el.cropNow.textContent = line;
  }
}

function stkPaint(){
  if (!el.stkGrid) return;
  stkAll(function(list){
    var h = '', i, has = false;
    for (i = 0; i < list.length; i++){
      var on = (list[i].id === S.stkSel);
      if (on) has = true;
      h += '<div class="cell' + (on ? ' on' : '') + '" data-stk="' + list[i].id + '">' +
           '<img src="' + list[i].url + '" alt=""></div>';
    }
    el.stkGrid.innerHTML = h;
    if (el.stkNone) el.stkNone.classList.toggle('hide', list.length > 0);
    el.stkGrid.classList.toggle('hide', list.length === 0);

    if (el.stkPut) el.stkPut.classList.toggle('off', !has);
    if (el.stkDel) el.stkDel.classList.toggle('off', !has);
    if (el.stkHint) el.stkHint.textContent = T(has ? 'nStkPut' : 'nStkUse');
    if (!has) S.stkSel = null;
  });
}

function stkStart(){
  closeSheet(); closeMenu(); closeSaver();
  S.padOn = false;
  S.stkSel = null;
  objPaint();
  el.stk.classList.add('open');
  stkPaint();
  syncDepth();
  showProps(false);
  draw();
}

function stkEnd(){
  el.stk.classList.remove('open');
  showProps(S.sel >= 0);
  reflow(); draw();
}

function turnStart(){
  if (noSheet()){ say('hNoImg'); return; }

  visit();
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;

  S.tiltWin = null;
  szPaint();
  easySync();
  soloPane('turn');
  el.turn.classList.add('open'); applyFold('turn');
  syncDepth();
  showProps(false);
  reflow(); draw();
}

function turnEnd(){
  el.turn.classList.remove('open');

  S.tiltWin = null;
  S.warpHold = false;
  S.crop = warpFit(S.cropRaw);
  showProps(false);
  reflow(); draw();
}

var MAXSIDE = 12000, MAXAREA = 40e6;

function szApply(quiet){
  var w0 = parseInt(el.szW.value, 10) || 0, h0 = parseInt(el.szH.value, 10) || 0;
  var k = 1;
  if (w0 > MAXSIDE) k = Math.min(k, MAXSIDE/w0);
  if (h0 > MAXSIDE) k = Math.min(k, MAXSIDE/h0);

  if (w0*h0*k*k > MAXAREA) k = Math.min(k, Math.sqrt(MAXAREA/(w0*h0)));

  var w = Math.max(16, Math.floor(w0*k)), h = Math.max(16, Math.floor(h0*k));
  var cut = (w !== w0) || (h !== h0);
  if (!quiet) snap();
  S.out = {w:w, h:h};

  szPaint();
  fit(); draw();
  if (cut) say('hLimit', 5000, w + '×' + h);
}

function szClear(){
  snap();
  S.out = null;
  szPaint();
  fit(); draw();
}

function selShape(){
  if (!onDrawScreen() || S.sel < 0 || S.sel >= S.objs.length) return null;
  var o = S.objs[S.sel];
  return isDrawn(o) ? o : null;
}

function popPaint(){
  var b = $('bPop');
  if (b) b.classList.toggle('on', !!S.pop || !!S.popPick);
  var r = $('popRow');
  if (r) r.classList.toggle('hide', !S.pop);
  if (S.pop && $('popT')) $('popT').value = Math.round((S.pop.tol || 0.15) * 100);
}

function popStart(){
  if (noSheet()){ say('hNoImg'); return; }

  if (S.pop){
    snap();
    S.pop = null;
    if (typeof colorForget === 'function') colorForget();
    S.popPick = false;
    popPaint(); draw();
    say('hPopGone', 2500);
    return;
  }

  if (S.popPick){ S.popPick = false; S.popAt = null; msg(''); popPaint(); draw(); return; }
  S.popPick = true;
  popPaint();
  say('hPopPick', 20000);
}

function bycTake(x, y, first){
  if (!S.byc) return;
  var sh2 = sheet();
  var sx = (x - V.ox)/V.s, sy = (y - V.oy)/V.s;
  if (first) snap();
  S.byc = {x: clamp(sx/Math.max(1, sh2.w), 0, 1),
           y: clamp(sy/Math.max(1, sh2.h), 0, 1),
           tol: S.byc.tol};
  S.popAt = [x, y];
  loupeShow(x, y);
  draw();
}

function popTake(x, y, first){
  var q = toImage(x, y);

  S.popAt = [x, y];

  if (first){ msg(''); snap(); }
  S.pop = {x: q[0]/S.iw, y: q[1]/S.ih, tol: (parseInt($('popT') ? $('popT').value : 15, 10))/100};

  if (typeof colorForget === 'function') colorForget();
  popPaint(); draw();
}

function setSel(on){
  if (on){
    if (S.tool !== 'sel'){ S.toolWas = S.tool; S.tool = 'sel'; }
    say('hSel', 6000);
  } else {
    if (S.tool === 'sel') S.tool = S.toolWas || 'brush';
    S.sel = -1;
    showProps(false);
  }

  paintTools();
  drawPaint();
  draw();
}

var NUMS = {

  gAng:   function(v){ return v ? ((v > 0 ? '+' : '') + v + '\u00b0') : T('uNone'); },

  gFoc:   function(v){ return v ? ((v > 0 ? '+' : '') + v + '%') : T('uNone'); },

  tilt:   function(v){ return v ? ((v > 0 ? '+' : '') + v + '%') : T('uNone'); },
  inkW:   function(v){ return S.img ? (Math.round(v/1000 * Math.min(S.iw, S.ih)) + ' px') : String(v); },
  inkA:   function(v){ return v + '%'; },
  inkS:   function(v){ return v + '%'; },

  inkD:   function(v){ return v ? ('\u00d7' + (Math.round(v)/10)) : T('uNone'); },

  inkR:   function(v){ return v ? (v + '%') : T('uNone'); },
  drot:   function(v){ return v + '\u00b0'; },

  pRot2:  function(v){ return v + '\u00b0'; },
  pSize2: function(v){ return v + '%'; },
  pAlpha2:function(v){ return v + '%'; },
  pkH:    function(v){ return v + '\u00b0'; },
  pkS:    function(v){ return v + '%'; },
  pkV:    function(v){ return v + '%'; },
  oSize:  function(v){ return v + '%'; },
  alpha:  function(v){ return v + '%'; },
  round:  function(v){ return v + '%'; },
  orot:   function(v){ return v + '\u00b0'; },
  mask:   function(v){ return v + '%'; },
  bgA:    function(v){ return v + '%'; },
  popT:   function(v){ return v + '%'; },
  bycT:   function(v){ return v + '%'; },

  glassK: function(v){ return v + '%'; },

  rndK: function(v){ return v + '%'; },

  frameK: function(v){ return v + '%'; },

  cutW:   function(v){ return S.img ? (Math.round(v/1000 * Math.min(S.iw, S.ih)) + ' px') : String(v); },
  cutS:   function(v){ return v + '%'; },
  cutZ:   function(v){ return '\u00d7' + v; },
  cutT:   function(v){ return v + '%'; },
  desk:   function(v){ return v + '%'; }

};

function numsWire(){
  var q = document.querySelectorAll ? document.querySelectorAll('input[type=range]') : [];
  for (var i = 0; i < q.length; i++){

    dentWire(q[i]);
    (function(inp){
      var fn = NUMS[inp.id];
      if (!fn || !inp.parentNode) return;
      var lab = inp.parentNode.querySelector('.lab');
      if (!lab) return;
      var was = null;
      var show = function(){
        if (was === null) was = lab.textContent;

        lab.textContent = fn(sval(inp));
        lab.classList.add('numy');
      };
      var hide = function(){
        if (was === null) return;
        lab.textContent = was;
        lab.classList.remove('numy');
        was = null;
      };
      inp.addEventListener('input', show);
      inp.addEventListener('pointerdown', show);
      inp.addEventListener('pointerup', hide);
      inp.addEventListener('pointercancel', hide);
      inp.addEventListener('blur', hide);
    })(q[i]);
  }
}

var AC = null, NOISE = null;

function noiseBuf(){
  if (NOISE) return NOISE;
  var n = Math.floor(AC.sampleRate * 0.06);
  NOISE = AC.createBuffer(1, n, AC.sampleRate);
  var d = NOISE.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
  return NOISE;
}

function sval(inp){
  if (!inp) return 0;
  var v = parseInt(inp.value, 10) || 0;
  return dentOut(v, inp._dent || 0);
}

function setSval(inp, v){
  if (!inp) return;
  inp.value = String(dentRaw(Math.round(v) || 0, inp._dent || 0));
}

function dentWire(inp){
  if (!inp) return;
  var lo = parseFloat(inp.getAttribute('data-lo'));
  var hi = parseFloat(inp.getAttribute('data-hi'));
  if (!(lo === lo)){
    lo = parseFloat(inp.min); hi = parseFloat(inp.max);
    inp.setAttribute('data-lo', String(lo));
    inp.setAttribute('data-hi', String(hi));
  }
  var was = sval(inp);
  var d = dentSize(lo, hi);
  inp._dent = d;
  inp.min = String(lo - d);
  inp.max = String(hi + d);
  inp.classList.toggle('dent', d > 0);

  if (d > 0){
    var a0 = lo - d, b0 = hi + d;
    inp.style.setProperty('--dentPos', (100*(0 - a0)/(b0 - a0)).toFixed(3) + '%');
  } else inp.style.removeProperty('--dentPos');
  setSval(inp, was);
}

function dentRelimit(inp, lo, hi){
  if (!inp) return;
  inp.setAttribute('data-lo', String(lo));
  inp.setAttribute('data-hi', String(hi));
  dentWire(inp);
}

function dentClick(inp, before){
  if (!inp || !inp._dent) return;
  if (sval(inp) === 0 && before !== 0) feel('dent');
}

function peekWire(id){
  var b = $(id || 'bPeek');
  if (!b) return;
  var off = function(){
    if (!S.peek) return;
    S.peek = false;
    b.classList.remove('hold');
    draw();
  };
  b.onclick = null;
  b.addEventListener('pointerdown', function(){
    if (noSheet()) return;
    S.peek = true;
    b.classList.add('hold');
    draw();
  });
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
  b.addEventListener('pointercancel', off);
}

function holdWire(sl, kind){
  if (!sl) return;

  sl.addEventListener('pointerdown', function(){ S.warpHold = kind || 'grid'; });
}

var BUSY_OFF = null;
function busyOn(){
  if (BUSY_OFF){ clearTimeout(BUSY_OFF); BUSY_OFF = null; }
  if (S.busy) return;
  S.busy = true;
}
function busyOff(){
  if (!S.busy) return;
  if (BUSY_OFF) clearTimeout(BUSY_OFF);
  BUSY_OFF = setTimeout(function(){
    BUSY_OFF = null;
    if (!S.busy) return;
    S.busy = false;

    if (typeof draw === 'function') draw();
  }, 300);
}

function holdWatch(){
  var off = function(){
    busyOff();
    if (!S.warpHold) return;
    S.warpHold = false;

    if (typeof logNote === 'function' && typeof dbgLine === 'function')
      logNote(logT('gesture', dbgLine()));
    draw();
  };
  window.addEventListener('pointerup', off);
  window.addEventListener('pointercancel', off);
}

function feel(kind){
  if (cfg.fb !== 'snd') return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    var t = AC.currentTime;

    var tap = function(f, at, len, vol, q){
      var src = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain();
      src.buffer = noiseBuf();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(f, t + at);
      bp.Q.setValueAtTime(q || 6, t + at);

      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(vol, t + at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + len);
      src.connect(bp); bp.connect(g); g.connect(AC.destination);
      src.start(t + at); src.stop(t + at + len + 0.02);
    };

    if (kind === 'fold' || kind === 'open') tap(1500, 0, 0.045, 0.32, 4);
    else if (kind === 'eye')                tap(2600, 0, 0.030, 0.22, 9);

    else if (kind === 'dent')               tap(1500, 0, 0.018, 0.16, 8);

    else if (kind === 'save'){ tap(1200, 0, 0.045, 0.28, 5); tap(1900, 0.07, 0.06, 0.26, 5); }

    else if (kind === 'ring'){ tap(1700, 0, 0.022, 0.14, 7); tap(2300, 0.035, 0.026, 0.12, 7); }

    else if (kind === 'duo'){ tap(3200, 0, 0.11, 0.15, 30); tap(4700, 0.012, 0.08, 0.07, 30); }
  } catch(_){  }
}

function cutStart(){
  if (noSheet()){ say('hNoImg'); return; }
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;
  soloPane('cut');

  markAll('[data-ct]', 'ct', (S.cutTool === 'back') ? 'brush' : (S.cutTool || ''));
  markCF();
  cutPaint();
  if ($('cutT')) $('cutT').value = String(Math.round(S.cutTol*100));
  if ($('cutW')) $('cutW').value = String(Math.round(S.cutW*1000));
  if ($('cutS')) $('cutS').value = String(Math.round(S.cutSoft*100));
  if ($('cutZ')) $('cutZ').value = String(S.zoom);
  el.cut.classList.add('open'); applyFold('cut');
  syncDepth();
  showProps(false);
  say('hCut', 5000);
  draw();
}

function cutEnd(){
  el.cut.classList.remove('open');
  loupeHide();
  showProps(S.sel >= 0);
  reflow(); draw();
}

function cutDelPaint(){
  var b = $('cutDel');
  if (!b) return;
  b.classList.toggle('dim', !selImg());
}

function cutPaint(){
  cutDelPaint();
  bayPaint();
  var t = S.cutTool;
  var tol = $('cutTolRow');
  if (tol) tol.classList.toggle('hide', t !== 'color');
  var w = $('cutW');
  if (w && w.parentNode)
    w.parentNode.classList.toggle('hide', t === 'color' || t === 'free' || t === 'keep');

  var b = $('bCutLine');
  if (b) dressIcon(b, (S.cutTool === 'back') ? 'back2' : 'draw', null,
                   T('cutLine') + ': ' + T(S.cutTool === 'back' ? 'cutGive' : 'cutTake'));
  if (b) b.classList.toggle('on', S.cutTool === 'brush' || S.cutTool === 'back');
}

function onCutScreen(){
  return !!(el && el.cut && el.cut.classList.contains('open') &&
            !el.cut.classList.contains('vhide'));
}

function dropCutTool(){
  if (typeof onCutScreen === 'function' && !onCutScreen()) return;
  S.cutTool = null;
  if (typeof cutPaint === 'function') cutPaint();
}

function loupeShow(x, y){
  var box = $('loupe'), cn = $('loupeC');
  if (!box || !cn || noSheet()) return;

  if (S.mode === 'view') return;
  box.classList.add('on');
  var w = box.offsetWidth || 1;
  var h = box.offsetHeight || 1;
  if (cn.width !== w || cn.height !== h){ cn.width = w; cn.height = h; }
  var q = cn.getContext('2d');
  if (!q) return;
  var k = Math.max(2, S.zoom || 3);
  var p = toImage(x, y);

  var sh2 = sheet();
  var per = 1/Math.max(1e-6, V.s * Math.min(sh2.kx || 1, sh2.ky || 1));
  var sw = (w/k)*per, shh = (h/k)*per;
  q.setTransform(1, 0, 0, 1, 0, 0);
  q.clearRect(0, 0, w, h);
  try {
    q.imageSmoothingEnabled = false;
    q.drawImage(S.img, p[0] - sw/2, p[1] - shh/2, sw, shh, 0, 0, w, h);

    var mk = cutMask();
    if (mk){

      var mb = maskBox();
      q.globalCompositeOperation = 'destination-in';
      q.drawImage(mk, (p[0] - sw/2 - mb.x0)*mb.kx, (p[1] - shh/2 - mb.y0)*mb.ky,
                      sw*mb.kx, shh*mb.ky, 0, 0, w, h);
      q.globalCompositeOperation = 'source-over';
    }

    if (typeof paperGrid === 'function'){
      q.save();
      q.globalCompositeOperation = 'destination-over';
      q.fillStyle = paperGrid(q);
      q.fillRect(0, 0, w, h);
      q.restore();
    }
  } catch(_){

    errOnce('loupe', logT('loupeCut'));
  }

  q.strokeStyle = '#ffffffcc';
  q.lineWidth = 1;
  var cx = w/2, cy = h/2;
  q.beginPath();
  q.moveTo(cx-16, cy); q.lineTo(cx-4, cy);
  q.moveTo(cx+4, cy);  q.lineTo(cx+16, cy);
  q.moveTo(cx, cy-16); q.lineTo(cx, cy-4);
  q.moveTo(cx, cy+4);  q.lineTo(cx, cy+16);
  q.stroke();

  if (S.cutTool === 'brush' || S.cutTool === 'back'){
    var r = (S.cutW * Math.min(S.iw, S.ih)) / per * k / 2;
    if (r > 2 && r < Math.max(w, h)){
      q.strokeStyle = '#ffffff88';
      q.beginPath(); q.arc(cx, cy, r, 0, Math.PI*2); q.stroke();
    }
  }
}

function loupeHide(){
  var box = $('loupe');
  if (box) box.classList.remove('on');
}

function setGuide(v){
  S.guideCrop = v;
  markAll('[data-g]', 'g', v);
  draw();
}

function setGuideDraw(v){
  S.guideDraw = v;
  paintGuideBtn();
  draw();
}

var GLASS_THUMB = null;

function glassThumb(){
  if (GLASS_THUMB || noSheet()) return GLASS_THUMB;
  var n = 96;
  var t = document.createElement('canvas');
  t.width = n; t.height = n;
  var q = t.getContext('2d');
  if (!q) return null;

  var side = Math.min(S.iw, S.ih);
  var sx = (S.iw - side)/2, sy = (S.ih - side)/2;
  try { q.drawImage(S.img, sx, sy, side, side, 0, 0, n, n); }
  catch(_){ errOnce('glassGridImg', logT('glassGridImg')); }
  GLASS_THUMB = t;
  return t;
}

var DUO_ON = 'duoDark';

function duoPaint(){
  var p = (typeof duoPair === 'function') ? duoPair() : ['#000', '#fff'];
  var on = (S.glass === 'duo');

  var set = function(id, col){
    var b = $(id);
    if (!b) return;
    var w = b.querySelector ? b.querySelector('i') : null;
    (w || b).style.setProperty('--c', col);

    b.classList.toggle('on', on && DUO_ON === id);
  };
  set('duoDark', p[0]);
  set('duoLite', p[1]);

  markSwatches(el.duoPal, on ? p[DUO_ON === 'duoDark' ? 0 : 1] : null, -1);

  if (el.duoPal) el.duoPal.classList.toggle('hide', !on);

  var dr = $('duoRow');
  if (dr) dr.classList.toggle('hide', !on);

  var lum = function(hex){
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 0;
    return 0.2126*((n>>16)&255) + 0.7152*((n>>8)&255) + 0.0722*(n&255);
  };
  var dr = $('duoDark'), lr = $('duoLite'), r = $('duoReset'), fp = $('duoFlip');
  if (fp) fp.classList.toggle('rev', on && lum(p[0]) > lum(p[1]));
  if (dr) dr.classList.toggle('hide', !on);
  if (lr) lr.classList.toggle('hide', !on);
  if (r) r.classList.toggle('hide', !on);
  if (fp) fp.classList.toggle('hide', !on);

  if (r) r.classList.toggle('off', on && !cfg.duoDark && !cfg.duoLite);
}

function glassBuild(){
  var box = $('glassGrid');
  if (!box) return;
  var base = glassThumb();
  box.innerHTML = '';
  for (var i = 0; i < GLASS_ORDER.length; i++){
    (function(name){
      var b = document.createElement('button');
      b.className = 'gc' + (S.glass === name ? ' on' : '');
      b.dataset.glass = name;
      var cn = document.createElement('canvas');
      cn.width = 96; cn.height = 96;
      var q = cn.getContext('2d');
      if (q && base && name === 'byc'){

        try {
          q.drawImage(base, 0, 0);
          q.save();
          q.beginPath();
          q.rect(0, cn.height/2, cn.width, cn.height/2);
          q.clip();
          q.filter = 'grayscale(1)';
          q.drawImage(base, 0, 0);
          q.filter = 'none';
          q.restore();
        } catch(_){ errOnce('glassGridByc', logT('glassGridByc')); }
      } else if (q && base){
        if (name !== 'none' && fxWorks()){
          var was = S.glass, wasK = S.glassK;
          S.glass = name; S.glassK = 1;
          setGlassFilter();
          S.glass = was; S.glassK = wasK;
          try { q.filter = convOn(name) ? 'url(#jotConv)' : 'url(#jotGlass)'; }
  catch(_){  }
        }
        try { q.drawImage(base, 0, 0); }
  catch(_){ errOnce('glassGridBase', logT('glassGridBase')); }
        q.filter = 'none';
      }
      b.appendChild(cn);
      var s2 = document.createElement('span');

      s2.textContent = T(name === 'none' ? 'gNone' : ('g' + name.charAt(0).toUpperCase() + name.slice(1)));
      b.appendChild(s2);

      if (name === 'rnd'){
        b.classList.add('dice');
        cn.parentNode.replaceChild(diceCell(), cn);
        b.onclick = rndStart;
      } else if (name === 'frames'){

        b.classList.add('frames');
        cn.parentNode.replaceChild(iconCell('frames'), cn);

        b.classList.toggle('on', !!FRAME[S.glass]);
        b.onclick = frameStart;
      } else if (name === 'abbr'){

        try {
          q.drawImage(base, 0, 0);
          var wasK2 = S.glassK;
          S.glassK = 1;
          abbrOver(q, cn, 0, 0, cn.width, cn.height);
          S.glassK = wasK2;
        } catch(_){ errOnce('glassGridAbbr', logT('glassGridAbbr')); }
        b.onclick = function(){ setGlass(name); };
      } else {
        b.onclick = function(){ setGlass(name); };
      }
      box.appendChild(b);
    })(GLASS_ORDER[i]);
  }

  for (var hI = 0; hI < GLASS_HOLES; hI++){
    var hb = document.createElement('button');
    hb.className = 'gc hole';
    hb.onclick = function(){ say('hSoon', 3000); };
    var hc = document.createElement('canvas');
    hc.width = 96; hc.height = 96;
    hb.appendChild(hc);
    var hs = document.createElement('span');
    hs.textContent = '';
    hb.appendChild(hs);
    box.appendChild(hb);
  }

  setGlassFilter();
}

function glassMark(){
  var box = $('glassGrid');
  if (!box) return;
  var q = box.children;
  for (var i = 0; i < q.length; i++)
    q[i].classList.toggle('on', q[i].dataset && q[i].dataset.glass === S.glass);
  var k = $('glassK');
  if (k) k.value = String(Math.round((S.glassK === undefined ? 1 : S.glassK)*100));

  var br = $('bycRow');
  if (br) br.classList.toggle('hide', S.glass !== 'byc');
  if (S.glass === 'byc' && S.byc && $('bycT'))
    $('bycT').value = String(Math.round((S.byc.tol === undefined ? 1 : S.byc.tol)*100));
  duoPaint();
}

function setGlass(name){

  touch();
  S.glass = name;
  if (name !== 'none' && !(S.glassK > 0)) S.glassK = 1;

  if (name === 'byc' && !S.byc) S.byc = {x: 0.5, y: 0.5, tol: BYCTOL};
  glassMark();
  setGlassFilter();
  draw();
}

var RND_LO = 0.25, RND_HI = 0.8;

function diceCell(){ return iconCell('dice'); }

function iconCell(name){
  var w = document.createElement('span');
  w.className = 'dicebox';
  w.innerHTML = '<svg viewBox="0 0 24 24">' + (ICON[name] || '') + '</svg>';
  return w;
}

function rndDeck(){
  var d = [];
  for (var i = 0; i < GLASS_ORDER.length; i++){
    var n = GLASS_ORDER[i];

    if (!glassKnownReal(n)) continue;
    d.push(n);
  }

  for (var j = d.length - 1; j > 0; j--){
    var k = Math.floor(Math.random()*(j + 1));
    var t = d[j]; d[j] = d[k]; d[k] = t;
  }
  return d;
}

function rndRoll(step){
  if (!S.rndSeq || !S.rndSeq.length) S.rndSeq = rndDeck();
  var n = S.rndSeq.length;
  S.rndAt = ((S.rndAt || 0) + (step || 0) + n) % n;

  S.glassK = RND_LO + Math.random()*(RND_HI - RND_LO);
  setGlass(S.rndSeq[S.rndAt]);
  if (el.rndK) setSval(el.rndK, Math.round(S.glassK*100));
}

function camGo(what){
  S.shotTo = what;
  if (BR && BR.cam) BR.cam();
  else { S.shotTo = null; say('hNoShell', 4000); }
}

function shotStart(n){
  var to = S.shotTo;
  S.shotTo = null;

  if (BR && BR.keepShot){ BR.keepShot(); say('camKept', 4000); }

  shotEnd();

  if (to === 'stk'){
    S.stkPick = true;
    if (typeof stkStart === 'function') stkStart();
    if (typeof addImg === 'function') addImg(n);
    return;
  }
  if (to === 'put'){
    if (typeof cutStart === 'function') cutStart();
    if (typeof addImg === 'function') addImg(n);
    return;
  }

  if (BR && BR.useShot) BR.useShot();
}

function camStart(){
  soloPane('camPane');
  el.camPane.classList.add('open'); applyFold('camPane');
  rideIn(el.camPane);
  showProps(false);
  bars(true);
  reflow(); draw();
}

function shotEnd(){
  if (el.camPane){ el.camPane.classList.remove('open');
                   el.camPane.classList.remove('riding'); }
  S.shotTo = null;
  showProps(false);
  reflow(); draw();
}

function frameBuild(){
  var box = $('frameGrid');
  if (!box) return;
  box.innerHTML = '';
  for (var i = 0; i < FRAME_ORDER.length; i++){
    (function(name){
      var b = document.createElement('button');
      b.className = 'gc' + (S.glass === name ? ' on' : '');
      b.dataset.frame = name;

      b.appendChild(iconCell('fn' + name.charAt(1).toUpperCase() + name.slice(2)));
      var s2 = document.createElement('span');
      s2.textContent = T('g' + name.charAt(0).toUpperCase() + name.slice(1));
      b.appendChild(s2);
      b.onclick = function(){ setGlass(name); frameMark(); };
      box.appendChild(b);
    })(FRAME_ORDER[i]);
  }
}

function shellMark(){
  var on = (S.glass === 'fShell');
  var row = $('shellRow');
  if (row) row.classList.toggle('on', on);
  var b = $('frameShell');
  if (b) b.classList.toggle('on', on);
  var lab = el.framePane ? el.framePane.querySelector('.row.stay .lab') : null;
  if (lab) lab.setAttribute('data-t', on ? 'fHeight' : 'fEdge');
  if (lab) lab.textContent = T(on ? 'fHeight' : 'fEdge');
  if (on && el.shellTxt && el.shellTxt.value !== (S.shellTxt || ''))
    el.shellTxt.value = S.shellTxt || '';
}

function frameMark(){
  shellMark();

  var pal = $('frameCols');
  if (pal){
    var q2 = pal.children;
    for (var j = 0; j < q2.length; j++){
      var d2 = q2[j].dataset ? q2[j].dataset.fc : null;
      var lit = !!S.frameCol && (d2 === S.frameCol ||
        (d2 === 'own' && S.frameCol !== '#ffffff' && S.frameCol !== '#000000'));
      q2[j].classList.toggle('on', lit);
      if (d2 === 'own' && S.frameCol) q2[j].style.setProperty('--c', S.frameCol);
    }
  }
  var box = $('frameGrid');
  if (box){
    var q = box.children;
    for (var i = 0; i < q.length; i++)
      q[i].classList.toggle('on', q[i].dataset && q[i].dataset.frame === S.glass);
  }
  var k = $('frameK');
  if (k) k.value = String(Math.round((S.glassK === undefined ? 1 : S.glassK)*100));
}

function frameStart(){
  if (noSheet()){ say('hNoImg'); return; }
  visit();

  soloPane('framePane');
  el.framePane.classList.add('open'); applyFold('framePane');
  rideIn(el.framePane);
  frameBuild();
  frameMark();
  showProps(false);
  reflow(); draw();
}

function frameEnd(toGlass){
  if (el.framePane){ el.framePane.classList.remove('open');
                     el.framePane.classList.remove('riding'); }
  showProps(false);
  reflow(); draw();
  if (toGlass) glassStart();
}

function rndStart(){
  if (noSheet()){ say('hNoImg'); return; }

  visit();
  S.rndSeq = rndDeck();
  S.rndAt = 0;
  soloPane('rndPane');
  el.rndPane.classList.add('open'); applyFold('rndPane');
  rideIn(el.rndPane);
  showProps(false);
  bars(true);
  rndRoll(0);
  reflow(); draw();
}

function rndEnd(toGlass){
  if (el.rndPane){ el.rndPane.classList.remove('open');
                   el.rndPane.classList.remove('riding'); }

  S.rndSeq = null; S.rndAt = 0;
  showProps(false);
  reflow(); draw();
  if (toGlass) glassStart();
}

function glassStart(){
  if (noSheet()){ say('hNoImg'); return; }
  visit();
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;
  soloPane('glass');
  glassBuild();
  glassMark();
  el.glass.classList.add('open'); applyFold('glass');
  syncDepth();
  showProps(false);
  draw();
}

function glassEnd(){
  el.glass.classList.remove('open');
  showProps(S.sel >= 0);
  reflow(); draw();
}

function foldable(){
  var out = [];
  if (typeof document === 'undefined') return out;
  var n = document.querySelectorAll('.panel.foldable');
  for (var i = 0; i < n.length; i++) if (n[i].id) out.push(n[i].id);
  return out;
}

function foldOf(id){ return !!(S.folds && S.folds[id]); }

function typingOff(e){
  var a = document.activeElement;
  if (!a || (a !== el.txt && a !== el.fname)) return;
  if (e && e.target === a) return;
  a.blur();
}

function chevSync(box){
  if (!box) return;
  var ch = box.querySelector ? box.querySelector('.chips') : null;
  if (!ch) return;
  var room = ch.scrollWidth - ch.clientWidth;

  if (room <= 1){ box.classList.add('atL'); box.classList.add('atR'); return; }
  box.classList.toggle('atL', ch.scrollLeft <= 1);
  box.classList.toggle('atR', ch.scrollLeft >= room - 1);
}

function chevAll(){
  var ws = document.querySelectorAll ? document.querySelectorAll('.chipwrap') : [];
  for (var i = 0; i < ws.length; i++) chevSync(ws[i]);
}

function chevWire(){
  var ws = document.querySelectorAll ? document.querySelectorAll('.chipwrap') : [];
  for (var i = 0; i < ws.length; i++){
    (function(box){
      var ch = box.querySelector('.chips');
      if (!ch) return;
      ch.addEventListener('scroll', function(){ chevSync(box); }, {passive:true});
      chevSync(box);
    })(ws[i]);
  }
}

function eatClick(){
  if (!document.addEventListener) return;
  var t = null;
  var off = function(){
    document.removeEventListener('click', kill, true);
    if (t) clearTimeout(t);
  };
  var kill = function(e){
    e.stopPropagation();
    e.preventDefault();
    off();
  };
  document.addEventListener('click', kill, true);
  t = setTimeout(off, 400);
}

function setFold(id, v){
  if (!S.folds) S.folds = {};
  if (S.folds[id] !== !!v) feel(v ? 'fold' : 'open');
  S.folds[id] = !!v;
  var n = $(id);
  if (n) n.classList.toggle('folded', !!v);
  eatClick();

  draw();
}

function initFolds(){
  var list = foldable();
  for (var i = 0; i < list.length; i++){
    (function(id){
      var n = $(id);
      if (!n || n.querySelector('.grip')) return;

      var body = document.createElement('div');
      body.className = 'fbody';
      var kids = [], k;
      for (k = 0; k < n.children.length; k++){
        var c = n.children[k];

        if (c.classList.contains('foot') || c.classList.contains('grip') ||
            c.classList.contains('stay')) continue;
        kids.push(c);
      }
      if (kids.length){
        n.insertBefore(body, kids[0]);
        for (k = 0; k < kids.length; k++) body.appendChild(kids[k]);
      }

      var g = document.createElement('button');
      g.className = 'grip';
      g.setAttribute('aria-label', T('fold'));
      g.title = T('fold');
      g.innerHTML = '<i></i>';
      grip(g, id);
      n.insertBefore(g, n.firstChild);
    })(list[i]);
  }
}

var RING = ['adj', 'caps', 'draw', 'home'];

function ringNow(){
  if (el.adj && el.adj.classList.contains('open') &&
      !el.adj.classList.contains('vhide')) return 0;
  if (onCaps()) return 1;
  if (onDrawScreen()) return 2;

  var open = document.querySelectorAll ? document.querySelectorAll('.panel.open') : [];
  return open.length ? -1 : 3;
}

function ringHome(){
  if (el.adj && el.adj.classList.contains('open')) adjEnd();
  else if (onDrawScreen()) drawEnd();
  else if (onCaps()) closeSheet();
}

function ringGo(step){
  var i = ringNow();
  if (i < 0){

    feel('ring');
    for (var g = 0; g < 8 && ringNow() < 0; g++) goBack();
    return true;
  }
  var j = (i + step + RING.length) % RING.length;
  if (j === i) return false;
  feel('ring');
  if (j === 0) adjStart();
  else if (j === 1) openCaps();
  else if (j === 2) drawStart();
  else ringHome();
  return true;
}

function ringHands(b, tapOk, need){
  if (!b) return;
  var x0 = null, y0 = null, done = false, at = 0;
  b.addEventListener('pointerdown', function(e){
    x0 = e.clientX; y0 = e.clientY; done = false; at = Date.now();
    try { b.setPointerCapture(e.pointerId); } catch(_){  }
    e.preventDefault();
  });
  b.addEventListener('pointermove', function(e){
    if (x0 === null || done) return;
    var dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) < need || Math.abs(dx) <= Math.abs(dy)) return;
    done = true;
    ringGo(dx < 0 ? 1 : -1);
  });
  b.addEventListener('pointerup', function(e){
    if (x0 !== null && !done && tapOk){
      var dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
      if (dx < 12 && dy < 12 && Date.now() - at < 700) ringGo(1);
    }
    x0 = null;
  });
  b.addEventListener('pointercancel', function(){ x0 = null; });
}

function ringWire(){

  ringHands($('ringdot'), true, 24);
}

function grip(g, id){
  var y0 = null, moved = false;
  g.onpointerdown = function(e){
    y0 = e.clientY; moved = false;
    try { g.setPointerCapture(e.pointerId); }
  catch(_){  }
    e.preventDefault();
  };
  g.onpointermove = function(e){
    if (y0 === null) return;
    var d = e.clientY - y0;

    if (Math.abs(d) < 24) return;
    moved = true;
    setFold(id, d > 0);
    y0 = null;
  };
  g.onpointerup = function(){
    if (y0 !== null && !moved) setFold(id, !foldOf(id));
    y0 = null;
  };
  g.onpointercancel = function(){ y0 = null; };
}

function applyFold(id){
  var n = $(id);
  if (n) n.classList.toggle('folded', foldOf(id));
}

var FREE = {brush:1, eraser:1, reveal:1};

function toolNow(){
  return (S.tool === 'sel') ? (S.toolWas || 'brush') : S.tool;
}

var GROUPS = {
  shape: ['arrow', 'circle', 'rect', 'tri', 'line', 'arc']
};

var TOOLW = {
  line:['line','line'], arc:['arc','arc'], arrow:['arrow','arrow'],
  rect:['rect','rect'], circle:['circle','shOval'], tri:['tri','tri']
};

function grpOf(t){
  for (var g in GROUPS)
    if (GROUPS[g].join(' ').split(' ').indexOf(t) >= 0) return g;
  return null;
}

function grpTool(g){
  var t = S.grp && S.grp[g];
  return (t && TOOLW[t]) ? t : GROUPS[g][0];
}

function grpNext(g){
  var list = GROUPS[g];
  if (!list) return null;
  var at = list.indexOf(grpTool(g));
  return list[(at + 1) % list.length];
}

function grpTap(g){
  pickTool(grpOf(toolNow()) === g ? grpNext(g) : grpTool(g));
}

function pickTool(t){
  if (typeof logNote === 'function') logNote(logT('tool', t));

  if (S.popPick){ S.popPick = false; S.popAt = null; msg(''); popPaint(); }
  if (t === 'marker'){ S.tool = 'brush'; S.mark = true; }
  else if (t === 'brush'){ S.tool = 'brush'; S.mark = false; }
  else {
    S.tool = t;
    var g = grpOf(t);
    if (g){ if (!S.grp) S.grp = {}; S.grp[g] = t; }
  }
  setSel(false);
  paintTools();
}

function paintTools(){
  if (!document.querySelectorAll) return;
  var t = toolNow(), marker = (t === 'brush' && !!S.mark);
  var here = grpOf(t);

  var held = (S.tool !== 'sel');
  var n = document.querySelectorAll('#tools [data-tool]'), i;
  for (i = 0; i < n.length; i++){
    var k = n[i].dataset.tool;
    n[i].classList.toggle('on', held && (
      (k === 'eraser' && t === 'eraser') ||
      (k === 'brush'  && t === 'brush' && !marker) ||
      (k === 'marker' && marker)));

  }
  var q = document.querySelectorAll('#tools [data-grp]');
  for (i = 0; i < q.length; i++){
    var g2 = q[i].dataset.grp, cur = grpTool(g2);

    if (q[i].dataset.i !== TOOLW[cur][0]) dressIcon(q[i], TOOLW[cur][0], TOOLW[cur][1]);
    q[i].classList.toggle('on', held && g2 === here);
  }
  if (el.bSel) el.bSel.classList.toggle('on', S.tool === 'sel');

  if (el.bRev) el.bRev.classList.toggle('on', S.tool === 'reveal');

  if (typeof paintUndo === 'function') paintUndo();
}

function paintSoft(){
  var t = toolNow(), mine = !!FREE[t];
  if (el.softRow) el.softRow.classList.toggle('hide', !mine);
  if (el.inkS) el.inkS.value = String(Math.round((S.soft || 0)*100));
}

function paintDash(){
  var o = selShape(), t = toolNow();
  var mine = o ? true : (t !== 'eraser' && !(t === 'brush' && S.mark));
  if (el.dashRow) el.dashRow.classList.toggle('hide', !mine);
  if (el.inkD) el.inkD.value = String(Math.round((dashOf(o || S) || 0)*10));
  paintRound();
}

function paintRound(){
  var o = selShape();

  var t = toolNow();
  var mine = o ? (o.kind === 'rect') : (t === 'rect' || t === 'circle');
  if (el.rndRow) el.rndRow.classList.toggle('hide', !mine);
  if (el.inkR) el.inkR.value = String(Math.round(((o ? o.rnd : S.rnd) || 0)*100));
}

function paintGuideBtn(){
  var on = (S.guideDraw === 'grid');
  if (el.bGrid) el.bGrid.classList.toggle('on', on);

  if (el.bGrid3) el.bGrid3.classList.toggle('on', on);
}

function paintBlurable(){
  if (!el.bBlur) return;
  var o = selShape(), t = toolNow();
  var live = o ? canBlur(o)
               : (SHAPES[t] === 1 && t !== 'line' && !(t === 'arc' && !S.fill));

  el.bBlur.classList.toggle('dim', !live);
  el.bBlur.classList.toggle('on', live && !!(o ? o.blur : S.blur));
}

function wNow(){
  return (S.tool === 'reveal')
    ? (S.wRev === undefined ? WREV : S.wRev)
    : (S.w === undefined ? 0.01 : S.w);
}
function wSet(v){ if (S.tool === 'reveal') S.wRev = v; else S.w = v; }
function wTop(){ return (S.tool === 'reveal') ? 180 : 60; }

function wSync(o){
  if (!el.inkW) return;
  var f = (typeof wFloor === 'function') ? wFloor(o) : 0.002;
  el.inkW.min = String(Math.round(f*1000));
  if (o && o.w !== undefined && o.w < f){ o.w = f; }
  el.inkW.max = String(o ? 60 : wTop());
  var v = o ? o.w : wNow();
  el.inkW.value = String(Math.round((v === undefined ? 0.01 : v)*1000));
}

function drawPaint(){
  var o = selShape();
  paintSoft();
  paintDash();
  paintTools();
  if (el.drawSel) el.drawSel.classList.toggle('hide', !o);

  if (el.drawDel) el.drawDel.classList.toggle('off', !o);
  if (o && el.drot) setSval(el.drot, o.rot || 0);
  wSync(o);
  if (el.inkA) el.inkA.value = String(Math.round(((o ? o.a : S.a) === undefined ? 1 : (o ? o.a : S.a))*100));
  if (el.bFill) el.bFill.classList.toggle('on', !!(o ? o.fill : S.fill));
  if (el.bTop) el.bTop.classList.toggle('on', !!S.inkTop);
  paintBlurable();
  markSwatches(el.inkPal, o ? o.c : S.c, o ? o.p : S.p);
  paintDot();

  popPaint();
}

function drawStart(){
  if (noSheet()){ say('hNoImg'); return; }
  closeSheet(); closeMenu(); closeSaver();
  S.sel = -1;

  if (S.tool !== 'sel'){ S.toolWas = S.tool; S.tool = 'sel'; }
  paintTools();
  markAll('[data-w]', 'w', null);
  wSync(null);
  markOwn();
  paintDot();
  if (el.bFill) el.bFill.classList.toggle('on', !!S.fill);
  if (el.bTop) el.bTop.classList.toggle('on', !!S.inkTop);
  paintBlurable();
  paintGuideBtn();
  if (el.inkA) el.inkA.value = String(Math.round((S.a === undefined ? 1 : S.a)*100));
  paintSoft();
  paintDash();

  soloPane('draw');
  el.draw.classList.add('open'); applyFold('draw');
  drawPaint();
  syncDepth();
  showProps(false);
  reflow(); draw();
}

function drawEnd(){

  if (S.popPick){ S.popPick = false; S.popAt = null; msg(''); }
  el.draw.classList.remove('open');
  showProps(S.sel >= 0);
  if (S.sel >= 0) say('hMore', 5000);
  reflow(); draw();
}

function drawing(){
  return S.mode === 'edit' && S.tool !== 'sel' && el.draw &&
         el.draw.classList.contains('open') &&
         !el.draw.classList.contains('vhide');
}

function tiltAim(){
  if (noSheet()) return;
  var sh2 = sheet();
  if (!(sh2.w > 0) || !(sh2.h > 0)) return;
  if (!S.tiltWin){
    S.tiltWin = {x:V.ox, y:V.oy, w:sh2.w*V.s, h:sh2.h*V.s};
    return;
  }
  var w0 = S.tiltWin;
  V.s = w0.w/sh2.w;
  V.ox = w0.x + (w0.w - sh2.w*V.s)/2;
  V.oy = w0.y + (w0.h - sh2.h*V.s)/2;
}

function cropStart(){
  if (noSheet()) return;

  visit();
  closeSheet(); closeMenu();
  S.mode = 'crop';
  S.cropRect = {x:S.cropRaw.x, y:S.cropRaw.y, w:S.cropRaw.w, h:S.cropRaw.h};

  S.sel = -1;
  S.ratio = 'free';
  paintRatio();
  if (el.mask) el.mask.value = Math.round(S.mask*100);
  markOrient();
  markAll('[data-g]', 'g', S.guideCrop || 'none');
  szPaint();
  soloPane('crop');
  el.crop.classList.add('open'); applyFold('crop');
  syncDepth();
  el.bot.classList.add('hide');

  fitWhole();

  if (S.blank && el.crop){
    var bgr = el.crop.querySelector ? el.crop.querySelector('.bgrow') : null;
    if (bgr && bgr.offsetTop !== undefined)
      el.crop.scrollTop = Math.max(0, bgr.offsetTop - 8);
  }
  say('hCrop', 5000);
}

function fitWhole(){
  var keep = S.crop;
  S.crop = {x:0, y:0, w:1, h:1};
  S.cropRaw = {x:0, y:0, w:1, h:1};
  fit();
  S.crop = keep;
  draw();
}

function fitSheet(){
  fit();
  draw();
}

function cropEnd(apply){
  if (apply && S.cropRect && S.cropRect.w > 0.02 && S.cropRect.h > 0.02){
    touch();

    S.cropRaw = S.cropRect;
  }

  S.crop = warpFit(S.cropRaw);
  S.mode = 'edit';
  S.cropRect = null;
  el.crop.classList.remove('open');
  showProps(false);

  fit(); draw();
}

var RATIOS = ['orig', '1:1', '4:5', '3:4', '2:3', '5:7', '9:16', '16:10', '21:9'];

function ratioNext(k){
  var at = RATIOS.indexOf(k);
  return RATIOS[(at + 1) % RATIOS.length];
}

function ratioTake(k){
  S.rr = k;
  if (k === 'orig'){

    S.orient = (S.iw >= S.ih) ? 'h' : 'v';
    markOrient();
    S.ratio = String(S.iw/S.ih);
    S.cropRect = {x:0, y:0, w:1, h:1};
  } else {
    var wh = k.split(':');
    S.ratio = String(ratioOf(+wh[0], +wh[1]));
    S.pick = k;
  }
  paintRatio();
  applyRatio(parseFloat(S.ratio));
}

function ratioTap(){
  ratioTake((S.ratio === 'free') ? ratioNow() : ratioNext(ratioNow()));
}

function ratioNow(){
  return (RATIOS.indexOf(S.rr) >= 0) ? S.rr : 'orig';
}

function paintRatio(){
  var k = ratioNow(), live = (S.ratio !== 'free');
  if (el.bRatio){
    var w = (k === 'orig')
      ? (S.img ? ratioText(S.iw, S.ih) : '\u2014')
      : (function(){ var p2 = k.split(':');
                     return fitOrient(Math.max(+p2[0], +p2[1]), Math.min(+p2[0], +p2[1])); })();

    el.bRatio.textContent = w;
    el.bRatio.setAttribute('aria-label', w);
    el.bRatio.title = w;
    el.bRatio.classList.toggle('on', live);
  }
  if (el.bFree) el.bFree.classList.toggle('on', !live);
}

function ratioText(w, h){
  if (!(w > 0) || !(h > 0)) return '\u2014';
  var a = Math.max(w, h), b = Math.min(w, h);
  var x = Math.round(a), y = Math.round(b);
  var g = function(m, n){ while (n){ var t = m % n; m = n; n = t; } return m || 1; };
  var d = g(x, y), ax = x/d, ay = y/d;
  if (!(ax > 99 || ay > 99)) return fitOrient(ax, ay);
  var r = a/b, best = null;
  for (var q = 1; q <= 20; q++){
    var p = Math.round(r*q);
    var err = Math.abs(p/q - r)/r;
    if (p >= 1 && (!best || err < best.err)) best = {p:p, q:q, err:err};
  }
  if (best && best.err < 0.01) return fitOrient(best.p, best.q);
  return fitOrient(Math.round(r*100)/100, 1);
}

function fitOrient(a, b){
  return (S.orient === 'h') ? (a + ':' + b) : (b + ':' + a);
}

function ratioOf(w, h){
  var a = Math.max(w, h), b = Math.min(w, h);
  return (S.orient === 'h') ? (a/b) : (b/a);
}

function cropShaped(){
  if (!S.cropRect) return;
  var w = S.cropRect.w*S.iw, h = S.cropRect.h*S.ih;
  if (!(w > 0) || !(h > 0)) return;

  szPaint();
}

function applyRatio(r){
  var R = S.cropRect;
  if (!R) return;
  var cx = R.x + R.w/2, cy = R.y + R.h/2;
  var wpx = R.w*S.iw, hpx = R.h*S.ih;
  if (wpx/hpx > r) wpx = hpx*r; else hpx = wpx/r;
  var w = wpx/S.iw, h = hpx/S.ih;

  var cb1 = sheetBox();
  var k = Math.min(1, (cb1.x1 - cb1.x0)/w, (cb1.y1 - cb1.y0)/h);
  w *= k; h *= k;
  R.w = w; R.h = h;
  R.x = clamp(cx - w/2, cb1.x0, cb1.x1 - w);
  R.y = clamp(cy - h/2, cb1.y0, cb1.y1 - h);

  cropShaped();
  draw();
}

function clampView(){
  if (noSheet() || !cv) return;
  var w = cv.clientWidth, h = cv.clientHeight, keep = 60;
  var a = toScreen(0, 0), b = toScreen(S.iw, S.ih);
  if (b[0] < keep) V.ox += keep - b[0];
  if (a[0] > w - keep) V.ox -= a[0] - (w - keep);
  if (b[1] < keep) V.oy += keep - b[1];
  if (a[1] > h - keep) V.oy -= a[1] - (h - keep);
}

function buildPal(box, key){
  if (!box) return;

  for (var i = 0; i < PALROW.length; i++){
    var n = PALROW[i];
    var b = document.createElement('button');
    b.className = 'sw';
    b.style.background = PAL[n].fill;
    b.dataset[key] = String(n);
    box.appendChild(b);
  }
  var own = document.createElement('button');
  own.className = 'sw own';
  own.dataset.own = key;
  box.appendChild(own);

  var TO = {ip:'ink', p:'cap', dp:null};
  if (TO[key] !== undefined){
    var eye = document.createElement('button');
    eye.className = 'sw eye';
    eye.id = (key === 'ip') ? 'palEye' : ((key === 'p') ? 'capEye' : 'duoEye');
    eye.dataset.eye = key;
    eye.innerHTML = '<svg viewBox="0 0 24 24">' + ICON.eye + '</svg>';
    eye.setAttribute('aria-label', T('eye'));
    eye.title = T('eye');
    if (TO[key]) eye.onclick = (function(who){ return function(){ eyeStart(who); }; })(TO[key]);
    box.appendChild(eye);
  }
}

function busyPane(){

  var p = [el.adj, el.picker, el.turn], i;
  for (i = 0; i < p.length; i++)
    if (p[i] && p[i].classList.contains('open') && !p[i].classList.contains('vhide'))
      return true;
  return false;
}

function onDrawScreen(){
  return !!(el.draw && el.draw.classList.contains('open') &&
            !el.draw.classList.contains('vhide'));
}

function onCaps(){
  return !!(el.sheet && el.sheet.classList.contains('open') &&
            !el.sheet.classList.contains('vhide'));
}

function openCaps(){
  if (noSheet()){ say('hNoImg'); return; }
  var last = lastCap();
  if (last >= 0){ S.sel = last; openSheet(); }
  else addObj('text');
}

function lastCap(){
  for (var i = S.objs.length - 1; i >= 0; i--)
    if (!isDrawn(S.objs[i]) && !isImg(S.objs[i])) return i;
  return -1;
}

function openOwn(o){
  if (!o) return;
  if (isDrawn(o)) drawStart();
  else if (isImg(o)) cutStart();
  else openSheet();
}

function ownScreen(o){
  if (!o) return false;
  if (isDrawn(o)) return onDrawScreen();

  if (isImg(o)) return imgScreen();
  return onCaps();
}

function near(ax, ay, bx, by, r){ return Math.hypot(ax-bx, ay-by) <= r; }

function plateEdge(o, x, y, sp){
  if (!o || o.kind !== 'plate') return null;
  if (sp && near(x, y, sp[0], sp[1], 34)) return null;
  var B = bodyOf(measurer(), o);
  var q = toImage(x, y), p = unrot(o, q[0], q[1]);
  var s = Math.max(V.s, 1e-6);
  var x1 = B.cx - B.w/2, x2 = B.cx + B.w/2, y1 = B.cy - B.h/2, y2 = B.cy + B.h/2;
  var bandY = Math.max(14, Math.min(22, B.w*s/3)) / s;
  var bandX = Math.max(14, Math.min(22, B.h*s/3)) / s;
  var inset = 26 / s;
  var e = null;
  if (Math.abs(p[1]-y1) <= bandY && p[0] > x1+inset && p[0] < x2-inset) e = 'top';
  else if (Math.abs(p[0]-x1) <= bandX && p[1] > y1+inset && p[1] < y2-inset) e = 'left';
  else if (Math.abs(p[0]-x2) <= bandX && p[1] > y1+inset && p[1] < y2-inset) e = 'right';
  if (!e) return null;
  return {t:'edge', e:e, x1:x1, x2:x2, y1:y1, y2:y2, wOK:B.w, hOK:B.h};
}

function markOrient(){
  var b = $('bOrient');
  if (b) dressIcon(b, (S.orient === 'v') ? 'vert' : 'horz',
                      (S.orient === 'v') ? 'vert' : 'horz');
}

function cropCorners(){
  var R = S.cropRect;
  var a = toScreen(R.x*S.iw, R.y*S.ih);
  var b = toScreen((R.x+R.w)*S.iw, (R.y+R.h)*S.ih);
  return [[a[0],a[1]],[b[0],a[1]],[a[0],b[1]],[b[0],b[1]]];
}

function decide(x, y){

  if (typeof zoomPanning === 'function' && zoomPanning()){
    S.zoomHold = true;
    draw();
    return {t:'zoompan', x:x, y:y};
  }

  if (onCutScreen() && S.cutTool){
    var qc = toImage(x, y);

    snap();
    if (S.cutTool === 'free' || S.cutTool === 'keep'){

      var fr = {kind:'free', keep:(S.cutTool === 'keep'), soft:S.cutSoft,
                z:++S.seq, live:true, pts:[[qc[0]/S.iw, qc[1]/S.ih]]};
      S.cut.push(fr);
      cutDirty(); loupeShow(x, y); draw();
      return {t:'cutFree', o:fr};
    }
    if (S.cutTool === 'color'){

      snap();
      S.cut.push({kind:'color', z:++S.seq, x:qc[0]/S.iw, y:qc[1]/S.ih, tol:S.cutTol});
      cutDirty(); draw();
      return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false, exit:true};
    }
    if (S.cutTool === 'brush' || S.cutTool === 'back'){
      var st = {kind:'brush', w:S.cutW, soft:S.cutSoft, z:++S.seq,
                back:(S.cutTool === 'back'),
                pts:[[qc[0]/S.iw, qc[1]/S.ih]]};
      S.cut.push(st);
      cutDirty(); loupeShow(x, y); draw();
      return {t:'cut', st:st};
    }
    var sh3 = {kind:S.cutTool, z:++S.seq, x:qc[0]/S.iw, y:qc[1]/S.ih,
               tx:qc[0]/S.iw, ty:qc[1]/S.ih, fill:true};
    S.cut.push(sh3);
    cutDirty(); loupeShow(x, y); draw();
    return {t:'cutShape', o:sh3};
  }

  if (S.mode === 'edit' && padsOn()){
    var g = padGrips();
    var keys = ['l', 'r', 't', 'b'];
    for (var i = 0; i < keys.length; i++){
      var p = g[keys[i]];
      if (near(x, y, p[0], p[1], 34)){
        snap();
        var sh = sheet();
        return {t:'pad', side:keys[i], x:x, y:y,
                kx: V.s*sh.kx, ky: V.s*sh.ky,
                p0: S.pad[keys[i]]};
      }
    }

    return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false};
  }

  if (S.mode === 'view') return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false,
                                 exit:true, still:viewStill()};

  if (S.sel >= 0 && S.sel < S.objs.length && ownScreen(S.objs[S.sel])){
    var o = S.objs[S.sel];

    var grabR = function(base){
      var a0 = toScreen(markX(o.x), markY(o.y)), b0 = toScreen(markX(o.tx), markY(o.ty));
      var span = Math.hypot(a0[0]-b0[0], a0[1]-b0[1]);
      return Math.max(14, Math.min(base, span/3));
    };

    if (isShape(o)){

      var p1 = cornerPt(o, false), p2 = cornerPt(o, true), pm = movePt(o);
      var best = null, bd = 1e9;
      var take = function(p, r, t){
        var d = Math.hypot(x-p[0], y-p[1]);
        if (d <= r && d < bd){ bd = d; best = t; }
      };
      take(p2, grabR(34), 'tail');
      take(p1, grabR(34), 'head');
      take(pm, 32, 'shift');
      if (best === 'shift'){
        var qm = toImage(x, y);

        return {t:'move', was:true, grip:true, dx:qm[0]/S.iw - o.x, dy:qm[1]/S.ih - o.y,
                x:x, y:y, moved:false};
      }
      if (best) return {t:best};
    } else {
      if (hasTail(o)){
        var tp = toScreen(markX(o.tx), markY(o.ty));
        if (near(x, y, tp[0], tp[1], grabR(34))) return {t:'tail'};
      }
      var sp = sizeHandleScreen(measurer(), o);
      if (near(x, y, sp[0], sp[1], grabR(28))){
        var c0 = toScreen(markX(o.x), markY(o.y));
        return {t:'size', d0:Math.max(8, Math.hypot(x-c0[0], y-c0[1])),
                s0:o.size, w0:(o.w === undefined ? 0.4 : o.w)};
      }
      var eg = plateEdge(o, x, y, sp);
      if (eg) return eg;
    }

    var qs = toImage(x, y);
    if (hitGrab(measurer(), o, qs[0], qs[1]))
      return {t:'move', was:true, dx:qs[0]/S.iw - o.x, dy:qs[1]/S.ih - o.y,
              x:x, y:y, moved:false};
  }

  if (drawing()){
    var q = toImage(x, y);
    var fx = q[0]/S.iw, fy = q[1]/S.ih;
    if (FREE[S.tool]){
      snap();

      var st = {pts:[[fx, fy]], w:wNow(), p:S.p, c:S.c, a:S.a, soft:S.soft, mark:(S.mark && S.tool === 'brush'),
                rev:(S.tool === 'reveal') ? 1 : 0,
                dash:S.dash, erase:(S.tool === 'eraser')};
      st.z = ++S.seq;
      S.ink.push(st);
      inkDirty();
      return {t:'ink', st:st};
    }
    snap();
    var lock = (S.tool === 'circle');

    var o = {kind: lock ? 'rect' : S.tool, lock:lock,
             rnd: lock ? 1 : S.rnd,
             x:fx, y:fy, tx:fx, ty:fy, w:S.w, p:S.p, c:S.c,
             dash:S.dash, fill:S.fill, blur:S.blur, size:0.045, a:S.a};
    o.z = ++S.seq;
    S.objs.push(o);

    S.sel = S.objs.length - 1;
    drawPaint();
    return {t:'shape', o:o};
  }

  if (S.mode === 'edit' && busyPane())
    return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false};

  if (S.mode === 'crop'){
    var cs = cropCorners();
    for (var i = 0; i < 4; i++) if (near(x, y, cs[i][0], cs[i][1], 34)){

      var R0 = S.cropRect;
      var ax = (i === 0 || i === 2) ? (R0.x + R0.w) : R0.x;
      var ay = (i === 0 || i === 1) ? (R0.y + R0.h) : R0.y;
      return {t:'corner', i:i, ax:ax, ay:ay};
    }
    var p = toImage(x, y), R = S.cropRect;
    var u = p[0]/S.iw, v = p[1]/S.ih;
    if (u > R.x && u < R.x+R.w && v > R.y && v < R.y+R.h)
      return {t:'cropmove', du:u-R.x, dv:v-R.y};
    return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false};
  }

  var q = toImage(x, y);
  var idx = pick(measurer(), q[0], q[1], ownScreen);
  if (idx >= 0){
    var was = (idx === S.sel);
    S.sel = idx;

    if (cfg.hv === 'always' || !cfg.saidCopy){
      if (cfg.hv !== 'always'){ cfg.saidCopy = 1; saveCfg(); }
      say('hCopyHint', 7000);
    }
    var ob = S.objs[idx];
    showProps(true);
    drawPaint();
    objPaint();
    draw();
    return {t:'move', was:was, dx:q[0]/S.iw - ob.x, dy:q[1]/S.ih - ob.y, x:x, y:y, moved:false};
  }

  return {t:'view', ox:V.ox, oy:V.oy, x:x, y:y, moved:false};
}

var holdTimer = 0;

function holdCancel(){
  if (holdTimer){ clearTimeout(holdTimer); holdTimer = 0; }
}

function holdStart(){
  holdCancel();

  if ((S.mode !== 'edit' && S.mode !== 'crop') || S.eye) return;
  if (drawing()) return;
  if (el.picker && el.picker.classList.contains('open')) return;
  holdTimer = setTimeout(function(){
    holdTimer = 0;
    if (S.mode === 'edit' || S.mode === 'crop'){ G = null; viewStart(); }
  }, 480);
}

var CLIP = null;

var PASTE_N = 0;

function pasteBox(){
  var p = S.pad || {t:0, r:0, b:0, l:0};
  var iw = Math.max(1, S.iw), ih = Math.max(1, S.ih);
  return {x0: S.crop.x - p.l/iw, x1: S.crop.x + S.crop.w + p.r/iw,
          y0: S.crop.y - p.t/ih, y1: S.crop.y + S.crop.h + p.b/ih};
}

function pasteAim(){
  var b = pasteBox();
  var w = (cv && cv.clientWidth) || 360, h = (cv && cv.clientHeight) || 640;
  var a = toImage(0, 0), d = toImage(w, h);
  var iw = Math.max(1, S.iw), ih = Math.max(1, S.ih);
  var x0 = Math.max(b.x0, Math.min(a[0], d[0])/iw);
  var x1 = Math.min(b.x1, Math.max(a[0], d[0])/iw);
  var y0 = Math.max(b.y0, Math.min(a[1], d[1])/ih);
  var y1 = Math.min(b.y1, Math.max(a[1], d[1])/ih);
  if (!(x1 > x0) || !(y1 > y0)) return b;
  return {x0:x0, x1:x1, y0:y0, y1:y1};
}

function pasteStep(){
  var a = toImage(0, 0), b = toImage(22, 22);
  var iw = Math.max(1, S.iw), ih = Math.max(1, S.ih);
  return [Math.abs(b[0]-a[0])/iw, Math.abs(b[1]-a[1])/ih];
}

function wrapIn(v, lo, len){ return len > 0 ? lo + (((v - lo) % len) + len) % len : lo; }

function clipPaste(){
  if (noSheet()) return;
  if (!clipHand()){ say('hClipTool'); return; }
  var src = (S.sel >= 0 && S.sel < S.objs.length) ? S.objs[S.sel] : null;

  if (!src){ say('hSel'); return; }
  var sig = JSON.stringify(src);
  CLIP = JSON.parse(sig);
  var o = JSON.parse(JSON.stringify(CLIP));

  var w = (o.tx !== undefined ? o.tx - o.x : 0), h = (o.ty !== undefined ? o.ty - o.y : 0);

  var A = pasteAim(), st = pasteStep();
  var cx0 = A.x0 + Math.abs(w)/2, cx1 = A.x1 - Math.abs(w)/2;
  var cy0 = A.y0 + Math.abs(h)/2, cy1 = A.y1 - Math.abs(h)/2;
  var mx = (A.x0 + A.x1)/2, my = (A.y0 + A.y1)/2;
  var sx = src.x + Math.abs(w)/2, sy = src.y + Math.abs(h)/2;
  var cx = (cx1 > cx0) ? wrapIn(sx + st[0], cx0, cx1-cx0) : mx;
  var cy = (cy1 > cy0) ? wrapIn(sy + st[1], cy0, cy1-cy0) : my;
  o.x = cx - w/2; o.y = cy - h/2;
  if (o.tx !== undefined){ o.tx = o.x + w; o.ty = o.y + h; }
  snap();
  o.z = ++S.seq;
  S.objs.push(o);
  S.sel = S.objs.length - 1;
  PASTE_N++;
  inkDirty();
  draw();
}

function clipLive(){
  if (noSheet() || !el) return false;

  return (el.draw && el.draw.classList.contains('open')) ||
         (el.cut && el.cut.classList.contains('open')) ||
         (el.sheet && el.sheet.classList.contains('open'));
}

function clipHand(){
  if (el && el.draw && el.draw.classList.contains('open')) return S.tool === 'sel';
  return true;
}

function pastePaint(){

  pocketPaint();
}

function pocketIcon(){
  var o = (S.sel >= 0 && S.sel < S.objs.length) ? S.objs[S.sel] : null;
  if (!o) return ICON.copy || ICON.sel;
  if (o.kind === 'rect' && o.lock) return ICON.circle || ICON.oval;
  return ICON[o.kind] || ICON.text || ICON.sel;
}

function pocketPaint(){
  var b = $('bClipF');
  if (!b) return;

  b.classList.toggle('on', clipLive());

  b.classList.toggle('dim', !clipHand() || S.sel < 0);
  var lb = T('copy');
  b.innerHTML = '<svg viewBox="0 0 24 24">' + pocketIcon() + '</svg>';
  b.setAttribute('aria-label', lb);
  b.title = lb;
}

function copyOne(b, lbl){
  if (!b) return;
  b.classList.remove('on');
  b.classList.toggle('dim', !(S.img && S.sel >= 0 && clipHand()));

  var lb = T('copy');
  b.innerHTML = '<svg viewBox="0 0 24 24">' + (ICON.copy || ICON.sel) + '</svg>' +
                (lbl ? ('<span>' + lb + '</span>') : '');
  b.setAttribute('aria-label', lb);
  b.title = lb;
}

function onDown(e){
  if (noSheet()) return;
  e.preventDefault();
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

  if (S.eye){ G = {t:'eye'}; eyeSample(e.clientX, e.clientY); return; }

  if (S.popPick){ G = {t:'pop'}; popTake(e.clientX, e.clientY, true); return; }

  if (S.glass === 'byc' && el.glass && el.glass.classList.contains('open')){
    G = {t:'byc'}; bycTake(e.clientX, e.clientY, true); return;
  }
  if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); }
  catch(_){  }
  if (pts.size === 1){
    G = decide(e.clientX, e.clientY);
  } else if (pts.size === 2){
    var a = [], it = pts.values(), v;
    while (!(v = it.next()).done) a.push(v.value);
    var mx = (a[0].x + a[1].x)/2, my = (a[0].y + a[1].y)/2;
    G = {t:'pinch', d0:Math.max(1, Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y)),
         s0:V.s, px:(mx - V.ox)/V.s, py:(my - V.oy)/V.s};
  }

  var onObj = G && (G.t === 'move' || G.t === 'tail' || G.t === 'head' ||
                    G.t === 'size' || G.t === 'edge' || G.t === 'corner' || G.t === 'pad');

  if (pts.size !== 1) holdCancel();

  else if (!onObj) holdStart();
  else holdCancel();
}

function onMove(e){
  if (!pts.has(e.pointerId) || !G) return;
  e.preventDefault();
  var was = pts.get(e.pointerId);
  if (holdTimer && Math.hypot(e.clientX - was.x, e.clientY - was.y) > 3) holdCancel();
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

  if (G.t === 'cut'){
    var qc2 = toImage(e.clientX, e.clientY);
    G.st.pts.push([qc2[0]/S.iw, qc2[1]/S.ih]);
    cutDirty(); loupeShow(e.clientX, e.clientY); draw();
    return;
  }
  if (G.t === 'cutFree'){
    var qf = toImage(e.clientX, e.clientY);
    G.o.pts.push([qf[0]/S.iw, qf[1]/S.ih]);
    cutDirty(); loupeShow(e.clientX, e.clientY); draw();
    return;
  }
  if (G.t === 'cutShape'){
    var qc3 = toImage(e.clientX, e.clientY);
    G.o.tx = qc3[0]/S.iw; G.o.ty = qc3[1]/S.ih;
    cutDirty(); loupeShow(e.clientX, e.clientY); draw();
    return;
  }
  if (G.t === 'eye'){ eyeSample(e.clientX, e.clientY); return; }

  if (G.t === 'pop'){ popTake(e.clientX, e.clientY, false); return; }
  if (G.t === 'byc'){ bycTake(e.clientX, e.clientY, false); return; }

  if (G.t === 'pinch'){
    if (pts.size < 2) return;
    var a = [], it = pts.values(), v;
    while (!(v = it.next()).done) a.push(v.value);
    var d = Math.max(1, Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y));
    var mx = (a[0].x + a[1].x)/2, my = (a[0].y + a[1].y)/2;
    var base = Math.min(cv.clientWidth/(S.iw||1), cv.clientHeight/(S.ih||1));
    V.s = clamp(G.s0 * d/G.d0, base*0.4, base*24);
    V.ox = mx - G.px*V.s;
    V.oy = my - G.py*V.s;
    draw();
    return;
  }

  var x = e.clientX, y = e.clientY;
  var q = toImage(x, y);

  if (G.t === 'ink'){
    var pt = [q[0]/S.iw, q[1]/S.ih];
    var last = G.st.pts[G.st.pts.length-1];
    if (Math.abs(pt[0]-last[0]) + Math.abs(pt[1]-last[1]) > 0.0015){
      G.st.pts.push(pt);
      inkDirty();
      draw();
    }
    return;
  }
  if (G.t === 'shape'){
    var RS = roam();

    var ps = dragPt(G.o, G.o.x, G.o.y, q[0]/S.iw, q[1]/S.ih, RS);
    G.o.tx = ps[0]; G.o.ty = ps[1];
    draw();
    return;
  }
  if (G.t === 'pad'){
    var dxp = (x - G.x)/Math.max(1e-6, G.kx);
    var dyp = (y - G.y)/Math.max(1e-6, G.ky);

    var cwp = Math.max(1, S.crop.w*S.iw), chp = Math.max(1, S.crop.h*S.ih);
    var v2 = G.p0;
    if (G.side === 'l') v2 = G.p0 - dxp/cwp;
    if (G.side === 'r') v2 = G.p0 + dxp/cwp;
    if (G.side === 't') v2 = G.p0 - dyp/chp;
    if (G.side === 'b') v2 = G.p0 + dyp/chp;
    S.pad[G.side] = Math.max(0, Math.min(2, v2));
    szPaint();
    objPaint();
    draw();
    return;
  }
  if (G.t === 'zoompan'){

    var a0 = toImage(G.x, G.y), b0 = toImage(x, y);
    if (!G.snapped){ G.snapped = true; snap(); }
    zoomPan((b0[0] - a0[0])/S.iw, (b0[1] - a0[1])/S.ih);
    G.x = x; G.y = y;
    return;
  }
  if (G.t === 'view'){

    if (G.still) return;
    V.ox = G.ox + (x - G.x);
    V.oy = G.oy + (y - G.y);
    if (Math.hypot(x-G.x, y-G.y) > 8) G.moved = true;
    draw(); return;
  }
  if (G.t === 'move'){
    var o = S.objs[S.sel];
    if (!o) return;
    if (!G.snapped){ G.snapped = true; snap(); }
    var ndx = q[0]/S.iw - G.dx, ndy = q[1]/S.ih - G.dy;

    if (hasTail(o)){ o.tx += ndx - o.x; o.ty += ndy - o.y; }
    var RM = roam();
    o.x = clamp(ndx, RM.x0, RM.x1);
    o.y = clamp(ndy, RM.y0, RM.y1);
    if (Math.hypot(x-G.x, y-G.y) > 8) G.moved = true;
    draw(); return;
  }
  if (G.t === 'tail'){
    var t = S.objs[S.sel];
    if (!t) return;
    if (!G.snapped){ G.snapped = true; snap(); }
    var RT = roam();

    var pt2 = dragPt(t, t.x, t.y, q[0]/S.iw, q[1]/S.ih, RT);
    t.tx = pt2[0]; t.ty = pt2[1];
    draw(); return;
  }
  if (G.t === 'head'){
    var hd = S.objs[S.sel];
    if (!hd) return;
    if (!G.snapped){ G.snapped = true; snap(); }
    var RH = roam();

    var pt1 = dragPt(hd, hd.tx, hd.ty, q[0]/S.iw, q[1]/S.ih, RH);
    hd.x = pt1[0]; hd.y = pt1[1];
    draw(); return;
  }
  if (G.t === 'size'){
    var s = S.objs[S.sel];
    if (!s) return;
    if (!G.snapped){ G.snapped = true; snap(); }
    var c0 = toScreen(s.x*S.iw, s.y*S.ih);
    var d1 = Math.max(6, Math.hypot(x-c0[0], y-c0[1]));
    var f2 = d1/G.d0;
    if (isImg(s)) s.w = clamp(G.w0 * f2, 0.02, 3);
    else if (isShape(s)) s.w = clamp(G.w0 * f2, 0.001, 0.08);
    else s.size = clamp(G.s0 * f2, 0.008, 0.35);
    paintSize(s);
    draw(); return;
  }
  if (G.t === 'edge'){
    var pe = S.objs[S.sel];
    if (!pe) return;
    if (!G.snapped){ G.snapped = true; snap(); }
    var qe = toImage(x, y), pp = unrot(pe, qe[0], qe[1]);
    var ex1 = G.x1, ex2 = G.x2, ey1 = G.y1, ey2 = G.y2;
    if (G.e === 'top') ey1 = pp[1];
    else if (G.e === 'left') ex1 = pp[0];
    else ex2 = pp[0];
    var W = ex2 - ex1, H = ey2 - ey1;

    if (W <= 0 || H <= 0 || !plateFits(measurer(), pe, W, H)){ W = G.wOK; H = G.hOK; }
    else { G.wOK = W; G.hOK = H; }
    if (G.e === 'left') ex1 = ex2 - W; else if (G.e === 'right') ex2 = ex1 + W;
    ey1 = ey2 - H;
    var dcx = (ex1+ex2)/2 - pe.x*S.iw, dcy = (ey1+ey2)/2 - pe.y*S.ih;
    if (pe.rot){ var dz = rotPt(dcx, dcy, 0, 0, pe.rot); dcx = dz[0]; dcy = dz[1]; }
    pe.x += dcx/S.iw; pe.y += dcy/S.ih;
    pe.bw = W/unit(); pe.bh = H/unit();
    fitObjToFrame(pe);
    draw(); return;
  }
  if (G.t === 'corner'){
    var R = S.cropRect;

    var cb0 = sheetBox();
    var u = clamp(q[0]/S.iw, cb0.x0, cb0.x1), vv = clamp(q[1]/S.ih, cb0.y0, cb0.y1);

    if (S.ratio !== 'free'){
      var nr = ratioDrag([G.ax, G.ay], [u, vv], parseFloat(S.ratio), S.iw, S.ih);
      if (nr && nr.w > 0.03 && nr.h > 0.03){
        R.x = nr.x; R.y = nr.y; R.w = nr.w; R.h = nr.h;
        cropShaped();
      }
      draw(); return;
    }
    var x0 = R.x, y0 = R.y, x1 = R.x+R.w, y1 = R.y+R.h;
    if (G.i === 0){ x0 = u; y0 = vv; }
    if (G.i === 1){ x1 = u; y0 = vv; }
    if (G.i === 2){ x0 = u; y1 = vv; }
    if (G.i === 3){ x1 = u; y1 = vv; }
    if (x1 - x0 > 0.03 && y1 - y0 > 0.03){ R.x = x0; R.y = y0; R.w = x1-x0; R.h = y1-y0; }
    cropShaped();
    draw(); return;
  }
  if (G.t === 'cropmove'){
    var r2 = S.cropRect;

    var cb2 = sheetBox();
    r2.x = clamp(q[0]/S.iw - G.du, cb2.x0, cb2.x1 - r2.w);
    r2.y = clamp(q[1]/S.ih - G.dv, cb2.y0, cb2.y1 - r2.h);
    draw(); return;
  }
}

function onUp(e){
  holdCancel();
  if (G && (G.t === 'cut' || G.t === 'cutShape' || G.t === 'cutFree')) loupeHide();

  if (G && G.t === 'byc'){ loupeHide(); S.popAt = null; draw(); }

  if (G && G.t === 'cutFree'){

    G.o.live = false;
    var at = S.cut.indexOf(G.o);
    if (G.o.pts.length < 3 && at >= 0) S.cut.splice(at, 1);
    cutDirty(); draw();
  }
  pts.delete(e.pointerId);
  if (!G) return;
  if (G.t === 'pinch'){ if (pts.size === 0) G = null; return; }
  if (pts.size > 0) return;

  if (G.t === 'zoompan'){ S.zoomHold = false; G = null; draw(); return; }

  if (G.t === 'eye'){ eyeEnd(); G = null; return; }

  if (G.t === 'view' && !G.moved){
    if (G.exit) viewEnd();
    else if (S.mode === 'edit'){ S.sel = -1; closeSheet(); showProps(false); draw(); }
  }
  if (G.t === 'pad'){ reflow(); draw(); }
  if (G.t === 'move' && !G.moved && G.was){

    if (G.grip) say('hCopyHint', 4000);
    else if (!ownScreen(S.objs[S.sel])) openOwn(S.objs[S.sel]);
  }
  if (G.t === 'shape'){

    if (Math.abs(G.o.tx - G.o.x) < 0.01 && Math.abs(G.o.ty - G.o.y) < 0.01){
      S.objs.pop();
      S.undo.pop();
      draw();
    }
  }
  G = null;
}

function wire(){
  el.bot = $('bot'); el.crop = $('crop'); el.menu = $('menu');
  el.sheet = $('sheet'); el.txt = $('txt'); el.oSize = $('oSize');
  el.bKind = $('bKind'); el.pal = $('pal'); el.hint = $('hint');
  el.wait = $('wait'); el.file = $('file');
  el.fmts = $('fmts');
  el.saver = $('saver');
  el.fname = $('fname'); el.alpha = $('alpha'); el.round = $('round');
  el.pager = $('pager'); el.pnum = $('pnum');
  el.framePane = $('framePane'); el.frameK = $('frameK'); el.shellTxt = $('shellTxt'); el.camPane = $('camPane'); el.rndPane = $('rndPane'); el.rndK = $('rndK'); el.tiltV = $('tiltV'); el.bRatio = $('bRatio'); el.bFree = $('bFree'); el.mask = $('mask'); el.tilt = $('tilt'); el.menuBtn = $('bMenu');
  el.orot = $('orot');
  el.rRound = $('rRound'); el.rSize = $('rSize'); el.ref = $('ref');
  el.probe = $('probe');
  el.turn = $('turn');
  el.acNone = $('acNone');
  el.stk = $('stk'); el.stkGrid = $('stkGrid'); el.stkNone = $('stkNone');
  el.stkDel = $('stkDel'); el.stkHint = $('stkHint'); el.stkPut = $('stkPut');
  el.szW = $('szW'); el.szH = $('szH'); el.szNow = $('szNow');
  el.cropNow = $('cropNow');
  el.szProp = $('szProp');

  el.draw = $('draw'); el.tools = $('tools'); el.inkPal = $('inkPal');
  el.duoPal = $('duoPal');
  el.inkW = $('inkW'); el.bFill = $('bFill'); el.bTop = $('bTop');
  el.bBlur = $('bBlur'); el.bRev = $('bRev');
  el.dashRow = $('dashRow'); el.inkD = $('inkD');
  el.rndRow = $('rndRow'); el.inkR = $('inkR');
  el.bGrid = $('bGrid'); el.bGrid3 = $('bGrid3');
  el.inkA = $('inkA'); el.dot = $('inkDot'); el.picker = $('picker');
  el.inkS = $('inkS'); el.softRow = $('softRow');
  el.drawSel = $('drawSel'); el.drot = $('drot'); el.bSel = $('bSel');
  el.drawDel = $('drawDel');
  el.pkH = $('pkH'); el.pkS = $('pkS'); el.pkV = $('pkV'); el.pkDot = $('pkDot'); el.empty = $('empty');
  el.adj = $('adj'); el.adjPick = $('adjPick'); el.slide = $('adjSlide');
  el.mix = $('mix'); el.mixPick = $('mixPick'); el.mixSlide = $('mixSlide');
  el.mixName = $('mixName'); el.mixVal = $('mixVal');
  el.easyRow = $('easyRow'); el.fixSlide = $('fixSlide'); el.zoomSlide = $('zoomSlide');
  el.gFoc = $('gFoc'); el.gAng = $('gAng'); el.geoWrap = $('geoWrap');
  el.glass = $('glass'); el.cut = $('cut');
  el.aval = $('adjVal'); el.aname = $('adjName');
  el.cmd = $('cmd'); el.floats = $('floats');
  el.flags = $('flags'); el.themes = $('themes'); el.desk = $('desk');
  el.bFit = $('bFit'); el.bPeek = $('bPeek');
  el.orients = $('orients');
  buildFlags();

  if ($('bReboot')) $('bReboot').onclick = function(){ closeMenu(); shred(); };
  $('saveHere').onclick = function(){ save(0); };
  $('saveAs').onclick = function(){ save(2); };
  if ($('bToPack')) $('bToPack').onclick = function(){ toPack(); };
  $('saveNo').onclick = closeSaver;
  $('pPrev').onclick = function(){ gotoPage(S.page - 1); };
  $('pNext').onclick = function(){ gotoPage(S.page + 1); };

  buildPal(el.pal, 'p');
  buildPal(el.inkPal, 'ip');
  buildPal(el.duoPal, 'dp');

  cv.addEventListener('pointerdown', function(e){ busyOn(); onDown(e); }, {passive:false});
  cv.addEventListener('pointermove', onMove, {passive:false});
  cv.addEventListener('pointerup', function(e){ onUp(e); busyOff(); });
  cv.addEventListener('pointercancel', function(e){ onUp(e); busyOff(); });

  var chv = document.querySelectorAll ? document.querySelectorAll('.chv') : [];
  for (var z3 = 0; z3 < chv.length; z3++){
    chv[z3].onclick = function(){
      var box = $(this.dataset.scroll);
      if (box && box.scrollBy) box.scrollBy({left: 140*(+this.dataset.dir), behavior:'smooth'});
      else if (box) box.scrollLeft += 140*(+this.dataset.dir);
    };
  }
  $('bCrop').onclick   = cropStart;

  $('bTurn').onclick   = turnStart;
  $('turnDone').onclick = turnEnd;

  $('turnQ').onclick = function(e){
    var d = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d) return;
    if (d.turn) rotate(d.turn === '-1' ? -1 : 1);
    else if (d.flip) flip(d.flip === 'v');
  };
  $('stkClose').onclick = stkEnd;
  $('stkAdd').onclick = function(){
    S.stkPick = true;
    if (BR && BR.pickImg) BR.pickImg();
    else if (el.file) el.file.click();
  };
  el.stkGrid.onclick = function(e){
    var cell = (e.target && e.target.dataset && e.target.dataset.stk)
      ? e.target : (e.target ? e.target.parentNode : null);
    var id = (cell && cell.dataset) ? cell.dataset.stk : null;
    if (!id) return;
    if (id !== S.stkSel){ S.stkSel = id; stkPaint(); return; }
    stkAll(function(list){
      for (var i = 0; i < list.length; i++) if (list[i].id === id){ stkUse(list[i]); return; }
    });
  };
  el.stkPut.onclick = function(){
    if (!S.stkSel) return;
    stkAll(function(list){
      for (var i = 0; i < list.length; i++)
        if (list[i].id === S.stkSel){ stkUse(list[i]); return; }
    });
  };
  el.stkDel.onclick = function(){
    if (!S.stkSel) return;
    var id = S.stkSel;
    S.stkSel = null;
    stkDrop(id, stkPaint);
  };

  var objPair = function(a, b, fn){
    var run = function(src){
      var o = selImg();
      if (!o) return;
      fn(o, src);
      var v = src.value;
      if (a !== src) a.value = v;
      if (b && b !== src) b.value = v;
      draw();
    };
    a.oninput = function(){ run(a); };
    if (b) b.oninput = function(){ run(b); };
  };
  objPair($('pSize2'), null, function(o, src){
    o.w = clamp(parseInt(src.value, 10)/100, 0.02, 3);
  });
  objPair($('pAlpha2'), null, function(o, src){
    o.a = parseInt(src.value, 10)/100;
  });
  objPair($('pRot2'), null, function(o, src){
    var was = o.rot || 0;
    o.rot = sval(src);
    dentClick(src, was);
  });

  var delObj = function(){
    var o = selImg();
    if (!o) return;
    snap();
    S.objs.splice(S.sel, 1);
    S.sel = -1;
    objPaint();
    draw();
  };
  if ($('cutDel')) $('cutDel').onclick = function(){

    if (!selImg()){ say('hPickOne', 3000); return; }
    delObj();
  };

  var addPic = function(){
    S.padOn = false;
    objPaint();
    draw();
    if (BR && BR.pickImg) BR.pickImg();
    else if (el.file) el.file.click();
  };
  if ($('bSticker2')) $('bSticker2').onclick = addPic;
  if ($('bPack2')) $('bPack2').onclick = stkStart;

  el.orot.oninput = function(){
    var was = (S.sel >= 0 && S.objs[S.sel]) ? (S.objs[S.sel].rot || 0) : 0;
    edited(function(o){ o.rot = sval(el.orot); });
    dentClick(el.orot, was);
  };
  $('szProp').onclick  = function(){
    S.prop = !S.prop;
    el.szProp.classList.toggle('on', S.prop);
  };

  var szPick = function(e){
    var d2 = e.target && e.target.dataset ? e.target.dataset : null;
  };

  var linkW = function(){
    if (!S.prop) return;
    var v = parseInt(el.szW.value, 10), s = sheet();
    if (v > 0) el.szH.value = String(Math.max(16, Math.round(v*(s.fh/s.fw))));
  };
  var linkH = function(){
    if (!S.prop) return;
    var v = parseInt(el.szH.value, 10), s = sheet();
    if (v > 0) el.szW.value = String(Math.max(16, Math.round(v*(s.fw/s.fh))));
  };

  var applyTyped = function(){ szApply(); };
  el.szW.oninput = linkW;
  el.szH.oninput = linkH;
  $('szDo').onclick = applyTyped;
  $('bDraw').onclick   = drawStart;
  $('drawDone').onclick = drawEnd;
  el.drot.oninput = function(){
    var o = selShape();
    if (!o) return;
    var was = o.rot || 0;
    o.rot = sval(el.drot);
    dentClick(el.drot, was);
    draw();
  };
  $('drawDel').onclick = function(){
    if (!selShape()) return;
    snap();
    S.objs.splice(S.sel, 1);
    S.sel = -1;
    drawPaint();
    draw();
  };

  el.tools.onclick = function(e){
    var d3 = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d3) return;
    if (d3.grp){ grpTap(d3.grp); return; }
    if (!d3.tool) return;
    pickTool(d3.tool);
  };

  el.bSel.onclick = function(){ setSel(S.tool !== 'sel'); };

  if ($('bPop')){
    $('bPop').onclick = popStart;
    $('bPop').classList.toggle('hide', !POPONE);
  }

  if ($('bRev')) $('bRev').onclick = function(){
    if (noSheet()){ say('hNoImg'); return; }

    if (S.tool === 'reveal') return;
    pickTool('reveal');
    say('hRevOn', 2500);
  };
  if ($('popT')) $('popT').oninput = function(){
    if (!S.pop) return;
    S.pop = {x:S.pop.x, y:S.pop.y, tol: parseInt(this.value, 10)/100};
    if (typeof colorForget === 'function') colorForget();
    draw();
  };
  el.inkW.oninput = function(){
    var v = parseInt(el.inkW.value, 10)/1000, o = selShape();
    if (o){ o.w = v; draw(); } else wSet(v);
    paintDot();
  };

  el.inkD.oninput = function(){
    var v3 = parseInt(el.inkD.value, 10)/10, o3 = selShape();
    if (o3){ o3.dash = v3; draw(); } else S.dash = v3;
  };
  el.bFill.onclick = function(){
    var o = selShape();
    if (o){ o.fill = !o.fill; wSync(o); draw(); } else S.fill = !S.fill;
    el.bFill.classList.toggle('on', !!(o ? o.fill : S.fill));
  };
  el.bBlur.onclick = function(){
    var o = selShape();
    if (o){

      if (!canBlur(o)){ say('hBlurOnly'); return; }
      o.blur = !o.blur; wSync(o); draw();
    } else S.blur = !S.blur;
    el.bBlur.classList.toggle('on', !!(o ? o.blur : S.blur));
  };
  el.bTop.onclick = function(){

    var up = selShape();
    if (!up){ say('hPickOne'); return; }
    snap();
    up.z = ++S.seq;
    inkDirty();
    draw();
  };
  var gridFlip = function(){
    setGuideDraw(S.guideDraw === 'grid' ? 'none' : 'grid');
  };
  if (el.bGrid) el.bGrid.onclick = gridFlip;
  if (el.bGrid3) el.bGrid3.onclick = gridFlip;

  $('bFit').onclick = function(){ fitSheet(); msg(''); };
  peekWire('bPeek');
  el.inkS.oninput = function(){
    S.soft = parseInt(el.inkS.value, 10)/100;
    paintDot();
  };
  el.inkA.oninput = function(){
    var v = parseInt(el.inkA.value, 10)/100, o = selShape();
    if (o){ o.a = v; draw(); } else S.a = v;
    paintDot();
  };
  el.inkPal.onclick = function(e){
    var d2 = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d2) return;
    eyeGiveUp(e);
    if (d2.own){ openPicker('ink'); return; }
    var p2 = d2.ip;
    if (p2 === null || p2 === undefined) return;
    var o2 = selShape();
    if (o2){ o2.p = parseInt(p2, 10); o2.c = null; draw(); }
    else { S.p = parseInt(p2, 10); S.c = null; }
    drawPaint();
  };
  $('eMenu').onclick = openMenu;
  $('eOpen').onclick = openAnother;

  $('bFix').onclick    = function(){ easyToggle(S.fixOn ? null : 'fix'); };

  if ($('bHist')) $('bHist').onclick = function(){ easyToggle(S.histOn ? null : 'hist'); };
  $('bEZoom').onclick  = function(){ easyToggle(S.zoomOn ? null : 'zoom'); };
  $('bEGeo').onclick   = function(){ easyToggle(S.geoOn ? null : 'geo'); };

  if (el.gFoc) el.gFoc.oninput = function(){
    touch(); S.focus = sval(el.gFoc); geoApply();
  };
  if (el.gAng) el.gAng.oninput = function(){
    var was = S.ang || 0;
    touch(); S.ang = sval(el.gAng);
    dentClick(el.gAng, was);
    geoApply();
  };
  holdWire(el.gFoc, 'grid'); holdWire(el.gAng, 'lays'); holdWatch();

  if ($('bCam')) $('bCam').onclick = camStart;

  if ($('histSlide')) $('histSlide').oninput = function(){
    if (!S.histOn) return;

    S.histBy = 1;
    histShow(parseInt(this.value, 10) || 0);
  };
  el.fixSlide.oninput = function(){
    var raw = sval(el.fixSlide);
    var v = fixSnap(raw);
    S.fixV = v;
    if (Math.abs(raw - v) > 0.001) setSval(el.fixSlide, v);
    fixApply();
  };

  el.zoomSlide.oninput = function(){
    var was = S.zoomV || 0;
    S.zoomV = sval(el.zoomSlide);
    dentClick(el.zoomSlide, was);
    zoomApply();
  };
  $('bAdj').onclick    = adjStart;
  $('bGlass').onclick  = glassStart;
  $('bCut').onclick    = cutStart;
  $('cutDone').onclick = cutEnd;
  $('cutClear').onclick = function(){
    if (!S.cut.length) return;
    snap(); S.cut = []; cutDirty(); draw();
  };
  $('cutW').oninput = function(){ S.cutW = parseInt(this.value, 10)/1000; };
  $('cutS').oninput = function(){ S.cutSoft = parseInt(this.value, 10)/100; };
  $('cutZ').oninput = function(){ S.zoom = parseInt(this.value, 10); };
  $('cutT').oninput = function(){ S.cutTol = parseInt(this.value, 10)/100; };
  var ct = document.querySelectorAll ? document.querySelectorAll('[data-ct]') : [];
  for (var w5 = 0; w5 < ct.length; w5++){
    ct[w5].onclick = function(){
      if (!this.dataset) return;
      var k = this.dataset.ct;

      if (k === 'brush'){
        if (S.cutTool === 'brush') k = 'back';
        else if (S.cutTool === 'back') k = null;
      } else if (S.cutTool === k) k = null;
      S.cutTool = k;
      markAll('[data-ct]', 'ct', (S.cutTool === 'back') ? 'brush' : (S.cutTool || ''));
      cutPaint();
    };
  }
  var gg = document.querySelectorAll ? document.querySelectorAll('[data-g]') : [];
  for (var w4 = 0; w4 < gg.length; w4++){
    gg[w4].onclick = function(){ if (this.dataset) setGuide(this.dataset.g); };
  }
  if ($('inkR')) $('inkR').oninput = function(){

    var v = parseInt(this.value, 10)/100;
    var o = selShape();
    if (o){ o.rnd = v; draw(); } else S.rnd = v;
  };
  if ($('bHv')) $('bHv').onclick = function(){
    cfg.hv = (cfg.hv === 'always') ? 'once' : 'always';

    if (cfg.hv === 'always') cfg.saidCopy = 0;
    saveCfg(); paintSwitches();
    msg(T('hVoice') + ': ' + T(cfg.hv === 'always' ? 'hvOn' : 'hvOff'));
  };

  if ($('bClipF')) $('bClipF').onclick = clipPaste;

  if ($('bLite')) $('bLite').onclick = function(){
    cfg.lite = cfg.lite ? 0 : 1; saveCfg(); pastePaint();
    say(cfg.lite ? 'hLiteOn' : 'hLiteOff', 5000);
  };
  $('glassDone').onclick = glassEnd;

  if ($('camDone')) $('camDone').onclick = shotEnd;

  if ($('camEdit')) $('camEdit').onclick = function(){ camGo('edit'); };
  if ($('camPut')) $('camPut').onclick = function(){ camGo('put'); };
  if ($('camStk')) $('camStk').onclick = function(){ camGo('stk'); };

  if ($('frameCols')) $('frameCols').onclick = function(e){
    var c = e.target && e.target.dataset ? e.target.dataset.fc : null;
    if (!c) return;
    eyeGiveUp(e);
    if (c === 'own'){ openPicker('frameCol'); return; }
    touch();
    S.frameCol = c;
    frameMark();
    draw();
  };
  if ($('frameEye')) $('frameEye').onclick = function(){ eyeStart('frameCol'); };
  if ($('frameShell')) $('frameShell').onclick = function(){
    setGlass(S.glass === 'fShell' ? 'none' : 'fShell');
    frameMark();
    if (S.glass === 'fShell' && el.shellTxt) el.shellTxt.focus();
  };
  if (el.shellTxt) el.shellTxt.oninput = function(){
    touch();
    S.shellTxt = el.shellTxt.value;
    draw();
  };
  if ($('frameDone')) $('frameDone').onclick = function(){ frameEnd(false); };
  if ($('frameBack')) $('frameBack').onclick = function(){ frameEnd(true); };
  if ($('frameNone')) $('frameNone').onclick = function(){

    if (FRAME[S.glass]) setGlass('none');
    S.frameCol = null;
    frameMark();
    draw();
  };
  if (el.frameK) el.frameK.oninput = function(){
    touch();
    S.glassK = sval(el.frameK)/100;
    setGlassFilter();
    draw();
  };
  if ($('rndPrev')) $('rndPrev').onclick = function(){ rndRoll(-1); };
  if ($('rndNext')) $('rndNext').onclick = function(){ rndRoll(1); };
  if ($('rndBack')) $('rndBack').onclick = function(){ rndEnd(true); };
  if ($('rndDone')) $('rndDone').onclick = function(){ rndEnd(false); };

  if (el.rndK) el.rndK.oninput = function(){
    touch();
    S.glassK = sval(el.rndK)/100;
    setGlassFilter();
    draw();
  };

  var duoAsk = function(who){
    return function(){
      if (S.glass !== 'duo'){ say('hDuoOnly'); return; }
      if (DUO_ON !== who){ DUO_ON = who; duoPaint(); return; }
      openPicker(who);
    };
  };
  if ($('duoDark')) $('duoDark').onclick = duoAsk('duoDark');
  if ($('duoLite')) $('duoLite').onclick = duoAsk('duoLite');

  if ($('duoReset')) $('duoReset').onclick = function(){
    if (S.glass !== 'duo'){ say('hDuoOnly'); return; }

    cfg.duoDark = null; cfg.duoLite = null;
    saveCfg(); duoPaint(); setGlassFilter(); glassBuild(); draw();
  };

  if ($('duoFlip')) $('duoFlip').onclick = function(){
    if (S.glass !== 'duo'){ say('hDuoOnly'); return; }
    var p2 = duoPair();
    cfg.duoDark = p2[1]; cfg.duoLite = p2[0];
    saveCfg(); duoPaint(); setGlassFilter(); glassBuild(); draw();
    feel('duo');
  };
  if (el.duoPal) el.duoPal.onclick = function(e){
    if (S.glass !== 'duo'){ say('hDuoOnly'); return; }
    var d3 = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d3) return;
    eyeGiveUp(e);
    if (d3.own){ openPicker(DUO_ON); return; }
    if (d3.eye !== undefined){ eyeStart(DUO_ON); return; }
    var p3 = d3.dp;
    if (p3 === null || p3 === undefined) return;
    putColor(DUO_ON, PAL[parseInt(p3, 10)].fill);
  };
  $('glassK').oninput = function(){
    touch();
    S.glassK = parseInt(this.value, 10)/100;
    setGlassFilter();
    draw();
  };

  if ($('bycT')) $('bycT').oninput = function(){
    if (!S.byc) return;
    touch();
    S.byc = {x: S.byc.x, y: S.byc.y, tol: parseInt(this.value, 10)/100};
    draw();
  };

  $('bCaps').onclick   = openCaps;
  $('bNew').onclick    = function(){ addObj('text'); };
  $('bOpen2').onclick  = openAnother;
  hintWire();
  ringWire();

  $('adjDone').onclick = adjEnd;

  $('adjReset').onclick = adjReset;
  el.adjPick.onclick = function(e){
    var d = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d) return;
    if (!d.a) return;
    adjTake(d.a);
  };

  if ($('bGa')) $('bGa').onclick = function(){ adjTake('ga'); };

  if ($('bMix')) $('bMix').onclick = mixStart;
  if ($('mixDone')) $('mixDone').onclick = mixEnd;
  if (el.mixPick) el.mixPick.onclick = function(e){
    var b = e.target.closest ? e.target.closest('button[data-m]') : null;
    if (!b) return;
    S.mixI = +b.dataset.m;
    mixPaint();
  };

  if ($('mixWH')) $('mixWH').onclick = function(){ mixTake('h'); };
  if ($('mixWS')) $('mixWS').onclick = function(){ mixTake('s'); };
  if ($('mixWL')) $('mixWL').onclick = function(){ mixTake('l'); };
  if (el.mixSlide){
    el.mixSlide.oninput = function(){ touch(); mixSet(sval(el.mixSlide)); };
  }
  el.slide.oninput = function(){
    touch();
    var was = S.adj[S.pick2] || 0;
    S.adj[S.pick2] = sval(el.slide);
    dentClick(el.slide, was);
    if ((S.pick2 === 'sh' || S.pick2 === 'bl') && S.adj[S.pick2] > 60) say('hSlow', 3000);
    if (el.aval) el.aval.textContent = (S.adj[S.pick2] > 0 ? '+' : '') + S.adj[S.pick2];
    draw();
  };
  el.bUndo = $('bUndo');
  el.bUndo.onclick     = undo;

  var jotHold = 0, jotFired = false;
  el.menuBtn.onpointerdown = function(){
    jotFired = false;
    clearTimeout(jotHold);
    jotHold = setTimeout(function(){
      jotFired = true;

      openRef();
    }, 480);
  };
  el.menuBtn.onpointerup = el.menuBtn.onpointercancel = function(){
    clearTimeout(jotHold);
  };
  el.menuBtn.onclick = function(){
    if (jotFired){ jotFired = false; return; }

    var ov = overNow();
    if (ov){ overClose(ov); return; }
    if (el.menu.classList.contains('open')) closeMenu();
    else openMenu();
  };
  $('menuClose').onclick = closeMenu;
  $('bSave').onclick   = openSaver;
  $('bShare').onclick  = function(){ save(1); };

  $('cropNo').onclick = function(){ cropEnd(true); };

  if ($('cfEye')) $('cfEye').onclick = function(){ eyeStart('cutFill'); };
  if ($('cfColor')) $('cfColor').onclick = cfPick;
  if ($('bRatio')) $('bRatio').onclick = ratioTap;

  if ($('bFree')) $('bFree').onclick = function(){
    S.ratio = 'free';
    paintRatio();
  };

  el.orients.onclick = function(e){
    var d = e.target && e.target.dataset ? e.target.dataset : null;
    if (!d) return;
    if (d.g !== null && d.g !== undefined) return setGuide(d.g);
  };

  $('bOrient').onclick = function(){
    S.orient = (S.orient === 'v') ? 'h' : 'v';
    markOrient();
    paintRatio();
    if (S.ratio !== 'free'){
      S.ratio = String(1/parseFloat(S.ratio));
      applyRatio(parseFloat(S.ratio));
    } else if (S.cropRect){
      var R = S.cropRect, cx = R.x + R.w/2, cy = R.y + R.h/2;
      var w = R.h*S.ih/S.iw, h = R.w*S.iw/S.ih;
      var cb2 = sheetBox();
      var k = Math.min(1, (cb2.x1 - cb2.x0)/w, (cb2.y1 - cb2.y0)/h);
      w *= k; h *= k;
      R.w = w; R.h = h;
      R.x = clamp(cx - w/2, cb2.x0, cb2.x1 - w);
      R.y = clamp(cy - h/2, cb2.y0, cb2.y1 - h);

      cropShaped();
      draw();
    }
  };

  $('bReset').onclick = function(){
    resetCfg();
    applyTheme();
    paintDesk();
    paintLabels();
    openMenu();
    say('hReset', 3000);
  };

  if (el.bgA){
    el.bgA.oninput = function(){
      touch();
      S.bgA = parseInt(el.bgA.value, 10)/100;
      draw();
    };
  }

  if (el.tilt) el.tilt.oninput = function(){
    touch();

    if (S.tiltAxis === 'h') S.tiltH = sval(el.tilt); else S.tilt = sval(el.tilt);

    S.crop = warpFit(S.cropRaw);
    tiltAim();

    draw();
  };
  holdWire(el.tilt, 'stands');

  function tiltAxisPick(ax){
    S.tiltAxis = ax;
    if (el.tiltH) el.tiltH.classList.toggle('on', ax === 'h');
    if (el.tiltV) el.tiltV.classList.toggle('on', ax === 'v');
    if (el.tilt) setSval(el.tilt, (ax === 'h' ? S.tiltH : S.tilt) || 0);
    numsWire();
  }
  if ($('tiltH')) $('tiltH').onclick = function(){ tiltAxisPick('h'); };
  if ($('tiltV')) $('tiltV').onclick = function(){ tiltAxisPick('v'); };

  if ($('tiltNone')) $('tiltNone').onclick = function(){
    if (!S.tilt && !S.tiltH) return;
    touch();
    S.tilt = 0; S.tiltH = 0;
    if (el.tilt) setSval(el.tilt, 0);
    S.crop = warpFit(S.cropRaw);
    tiltAim();
    draw();
  };
  el.mask.oninput = function(){
    touch();

    S.mask = parseInt(el.mask.value, 10)/100;
    draw();
  };

  var ls = document.querySelectorAll ? document.querySelectorAll('.links button') : [];
  for (var z = 0; z < ls.length; z++){
    ls[z].onclick = function(){
      var u2 = this.dataset ? this.dataset.url : null;
      if (u2) window.location.href = u2;
    };
  }

  var ac2 = document.querySelectorAll ? document.querySelectorAll('[data-ac]') : [];
  for (var w2 = 0; w2 < ac2.length; w2++){
    ac2[w2].onclick = function(){ if (this.dataset) setAccent(this.dataset.ac); };
  }

  $('bFb').onclick = function(){ setFb(cfg.fb === 'snd' ? 'off' : 'snd'); };
  $('bHelp').onclick = openRef;
  $('refClose').onclick = closeRef;

  var DOCSL = ['pSize2', 'pAlpha2', 'pRot2',
               'oSize', 'alpha', 'round', 'orot', 'drot', 'inkR', 'popT', 'bycT'];
  for (var ds = 0; ds < DOCSL.length; ds++){
    var dn = $(DOCSL[ds]);
    if (dn) dn.onpointerdown = function(){ snap(); };
  }

  if ($('refGo')) $('refGo').onclick = function(){ refSeek(true); };
  if ($('refQ')) $('refQ').onkeydown = function(e){ if (e.key === 'Enter') refSeek(true); };
  if ($('bProbe')) $('bProbe').onclick = function(){ if (betaOn()) probeShow(); };
  if ($('bBeta')) $('bBeta').onclick = function(){
    cfg.beta = betaOn() ? 0 : 1;

    if (!betaOn()) cfg.dbg = 0;
    saveCfg();
    betaPaint();
    if (typeof dbgPaint === 'function') dbgPaint();
  };
  if ($('dbgOn')) $('dbgOn').onclick = function(){
    if (!betaOn()) return;
    cfg.dbg = cfg.dbg ? 0 : 1;
    saveCfg();
    dbgPaint();
  };
  if ($('probeClose')) $('probeClose').onclick = probeHide;
  if ($('probeClear')) $('probeClear').onclick = function(){

    ERRS.length = 0;
    PROBET = probeReport();
    probePaint();
  };
  if ($('probeFind')) $('probeFind').onclick = function(){
    var f = $('probeF');
    if (!f) return;
    if (f.classList.contains('on')){ f.classList.remove('on'); f.value = ''; }
    else { f.classList.add('on'); try { f.focus(); } catch(e){  } }
    probePaint();
  };
  if ($('probeF')) $('probeF').oninput = probePaint;
  if ($('probeCopy')) $('probeCopy').onclick = function(){

    var txt = PROBET;
    var done = function(){ say('hCopied', 2000); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done, function(){ probeCopyOld(txt, done); });
        return;
      }
    } catch(e){ errNote(logT('clip', e), 0); }
    probeCopyOld(txt, done);
  };
  var th = document.querySelectorAll ? document.querySelectorAll('[data-th]') : [];
  for (var y = 0; y < th.length; y++){
    th[y].onclick = function(){ if (this.dataset) setTheme(this.dataset.th); };
  }
  el.fmts.onclick = function(e){
    var f = e.target && e.target.dataset ? e.target.dataset.fmt : null;
    if (f) setFmt(f);
  };

  el.desk.oninput = function(){ setDesk(el.desk.value); };

  el.txt.oninput = function(){
    busyOn(); busyOff();
    edited(function(o){ o.text = el.txt.value; });
  };
  el.oSize.oninput = function(){
    edited(function(o){
      var v = parseInt(el.oSize.value, 10);
      if (isImg(o)) o.w = clamp(v/100, 0.02, 3);
      else o.size = v/1000;
    });
  };
  el.alpha.oninput = function(){ edited(function(o){ o.a = parseInt(el.alpha.value, 10)/100; }); };
  el.round.oninput = function(){ edited(function(o){ o.r = parseInt(el.round.value, 10)/100; }); };
  el.fname.oninput = function(){ cfg.name = el.fname.value; };
  el.fname.onchange = function(){ keepPrefix(el.fname.value); };
  el.bKind.onclick = function(){
    if (S.sel < 0) return;

    editStep(function(o){ o.kind = kindNext(o.kind); });
    openSheet();
  };
  el.pal.onclick = function(e){
    var dd = e.target && e.target.dataset ? e.target.dataset : null;
    if (!dd) return;
    eyeGiveUp(e);
    if (dd.own){ openPicker('cap'); return; }
    var p = dd.p;
    if (p === null || p === undefined) return;
    edited(function(o){ o.p = parseInt(p, 10); o.c = null; });
    openSheet();
  };
  var pks = [el.pkH, el.pkS, el.pkV];
  for (var k2 = 0; k2 < pks.length; k2++){
    pks[k2].oninput = function(){ pkPaint(); pkApply(); draw(); };
  }
  $('pkOk').onclick = function(){ closePicker(true); };

  if ($('pkCell')) $('pkCell').onclick = function(){ closePicker(true); };
  $('pkNo').onclick = function(){ closePicker(false); };
  $('bDel').onclick = delObj;
  $('bDone').onclick = function(){ closeSheet(); draw(); };

  if (document.addEventListener)
    document.addEventListener('pointerdown', typingOff, true);

  chevWire();

  var wasRail = railOn();
  var onViewport = function(){
    resize();
    var nowRail = railOn();
    if (nowRail !== wasRail){
      wasRail = nowRail;
      fit();
    } else if (!el.sheet.classList.contains('open')) reflow();
    clampView();
    draw();
  };
  window.addEventListener('resize', onViewport);
  if (window.visualViewport && window.visualViewport.addEventListener)
    window.visualViewport.addEventListener('resize', onViewport);
}
