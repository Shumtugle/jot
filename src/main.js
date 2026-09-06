'use strict';

var INAPP = (location.hostname === 'jot.local');

var SESS = 'one';

var SESS_BLOB = null;

function sessErr(where, e){
  var why = (e && e.message) ? e.message : (e ? String(e) : logT('noReason'));
  errNote(logT('sess', where, why), 0);
}

function sessPut(part, cb){
  var what = '';
  for (var kk in part) if (part.hasOwnProperty(kk)) what += (what ? '+' : '') + kk;
  stkOpen(function(d){
    if (!d){ errNote(logT('sessNoStoreWrite', what), 0);
             if (cb) cb(false); return; }
    try {
      var t = d.transaction('sess', 'readwrite'), st = t.objectStore('sess');
      var g = st.get(SESS);
      g.onsuccess = function(){
        var rec = g.result || {id:SESS};
        for (var k in part) if (part.hasOwnProperty(k)) rec[k] = part[k];
        var pr = st.put(rec);
        pr.onerror = function(){ sessErr(logT('sessWrite', what), pr.error); };
      };
      g.onerror = function(){ sessErr(logT('sessReadBefore', what), g.error); };
      t.oncomplete = function(){ if (cb) cb(true); };
      t.onerror = function(){ sessErr(logT('sessWrite', what), t.error); if (cb) cb(false); };
      t.onabort = function(){ sessErr(logT('sessWriteAbort', what), t.error); if (cb) cb(false); };
    } catch(e){ sessErr(logT('sessWrite', what), e); if (cb) cb(false); }
  });
}

function sessGet(cb){
  stkOpen(function(d){
    if (!d){ errNote(logT('sessNoStoreRead'), 0); cb(null); return; }
    try {
      var rq = d.transaction('sess', 'readonly').objectStore('sess').get(SESS);
      rq.onsuccess = function(){ cb(rq.result || null); };
      rq.onerror = function(){ sessErr(logT('sessRead'), rq.error); cb(null); };
    } catch(e){ sessErr(logT('sessRead'), e); cb(null); }
  });
}

function sessWipe(cb){
  stkOpen(function(d){
    if (!d){ errNote(logT('sessNoStoreErase'), 0);
             if (cb) cb(); return; }
    try {
      var t = d.transaction('sess', 'readwrite');
      t.objectStore('sess').delete(SESS);
      t.oncomplete = function(){ if (cb) cb(); };
      t.onerror = function(){ sessErr(logT('sessErase'), t.error); if (cb) cb(); };
    } catch(e){ sessErr(logT('sessErase'), e); if (cb) cb(); }
  });
}

function sessKeepFile(){
  if (!INAPP) return;

  if (S.pages > 1){ sessWipe(); return; }

  if (S.blank){ sessWipe(); return; }
  KEEP_WANT = true;
  if (window.requestIdleCallback) requestIdleCallback(sessKeepNow, {timeout:3000});
  else setTimeout(sessKeepNow, 1200);
}

var KEEP_WANT = false;
function sessKeepNow(){
  if (!KEEP_WANT || !INAPP) return;
  KEEP_WANT = false;
  try {
    fetch('/image?keep=' + Date.now()).then(function(r){ return r.blob(); })
      .then(function(b){
        if (!b || !b.size){
          errNote(logT('sessCopyEmpty'), 0);
          return;
        }
        var nm = '';

        try { if (BR && BR.srcName) nm = BR.srcName() || ''; }
        catch(e){  }
        SESS_BLOB = b;

        sessPut({blob:b, mime:b.type || '', name:nm, at:Date.now(), sign:sessSign(b)});

        if (S.img) sessWork();
      })['catch'](function(e){ sessErr(logT('sessCopy'), e); });
  } catch(e){ sessErr(logT('sessCopy'), e); }
}

var workT = null;
function sessWorkSoon(){
  if (noSheet()) return;
  if (workT) clearTimeout(workT);
  workT = setTimeout(function(){ workT = null; sessWork(); }, 800);
}

function sessSign(blob){
  var b = blob || null;
  return [ b ? (b.size || 0) : 0,
           b ? (b.type || '') : '',
           S.iw || 0, S.ih || 0 ].join('|');
}

function sessWork(){
  if (noSheet() || S.blank) return;
  try {
    sessPut({sign: sessSign(SESS_BLOB), work: JSON.stringify({
      o:S.objs, k:S.ink, sq:S.seq, ak:S.autoK, fv:S.fixV, zv:S.zoomV, an:S.ang, fo:S.focus, ti:S.tilt, th:S.tiltH, c:S.crop, cr:S.cropRaw, g:S.pad, gf:1, x:S.cut, m:S.mask, b:S.bg, ba:S.bgA, cf:S.cutFill, sx:S.shellTxt, bl:S.blank, u:S.out,
      t:S.turn,
      a:S.adj, mx:S.mix, gl:S.glass, gk:S.glassK, ga:S.glassAll, p:S.page,

      un:S.undo,
      v:{s:V.s, ox:V.ox, oy:V.oy, ah:V.ah}
    })}, function(okk){

      if (!okk) errNote(logT('sessMarkNotSaved'), 0);
    });
  } catch(e){ sessErr(logT('sessMarkBuild'), e); }
}

function sessLost(rec){
  if (!rec || rec.blob || !rec.work) return false;
  errNote(logT('sessMarkNoBytes'), 0);
  say('hLost', 6000);
  sessWipe();
  return true;
}

function sessTake(rec){
  if (!rec || !rec.blob) return false;
  var url = URL.createObjectURL(rec.blob);
  var img = new Image();
  img.onload = function(){
    var vback = null;
    adopt(img);
    URL.revokeObjectURL(url);
    SESS_BLOB = rec.blob;

    KEEP_WANT = false;

    var mine = sessSign(rec.blob);
    if (rec.work && rec.sign && rec.sign !== mine){
      errNote(logT('sessMarkOther'), 0);
      rec = {id:rec.id, blob:rec.blob};
    }

    var dOut = null;
    if (rec.work){
      try {
        var d = JSON.parse(rec.work);
        dOut = d;

        if (d.t && (d.t.r || d.t.m)){
          var tc = turnPixels(S.img, S.iw, S.ih, d.t);
          if (tc){ S.img = tc; S.iw = tc.width; S.ih = tc.height; S.turn = {r:d.t.r, m:d.t.m}; }
        }
        S.objs = d.o || []; S.ink = d.k || []; S.crop = d.c || S.crop;
        S.cropRaw = d.cr || d.c || S.cropRaw;

        if (d.g) S.pad = d.gf ? d.g : padFrac(d.g, S.crop, S.iw, S.ih);
        if (d.x) S.cut = d.x;
        if (d.m !== undefined) S.mask = d.m;
        if (d.b !== undefined) S.bg = d.b;
        if (d.cf !== undefined) S.cutFill = d.cf;
        if (d.sx !== undefined) S.shellTxt = d.sx;
        if (d.ba !== undefined) S.bgA = d.ba;
        if (d.bl !== undefined) S.blank = d.bl;

        if (d.sq !== undefined) S.seq = d.sq;
        if (d.ak !== undefined) S.autoK = d.ak;
        if (d.fv !== undefined) S.fixV = d.fv;
        if (d.zv !== undefined) S.zoomV = d.zv;
        if (d.an !== undefined) S.ang = d.an;
        if (d.fo !== undefined) S.focus = d.fo;
        S.out = (d.u === undefined) ? null : d.u;
        if (d.a) S.adj = d.a;
        if (d.mx) S.mix = d.mx;
        if (d.gl !== undefined){ S.glass = glassKnown(d.gl); S.glassK = d.gk; setGlassFilter(); }
        if (d.ga !== undefined) S.glassAll = d.ga;
        inkDirty(); cutDirty();

        if (d.v){ vback = d.v; }
      } catch(e){

        sessErr(logT('sessMarkParse'), e);
      }
    }

    S.undo = (dOut && dOut.un) ? dOut.un : [];

    if (typeof visit === 'function') visit();
    if (vback){ V.s = vback.s; V.ox = vback.ox; V.oy = vback.oy; V.ah = vback.ah;
                if (typeof clampView === 'function') clampView(); }

    say('hBack');
    draw();
  };
  img.onerror = function(){
    URL.revokeObjectURL(url);
    errNote(logT('sessCopyNotImage'), 0);
    sessWipe();
  };
  img.src = url;
  return true;
}

function shred(){
  if (typeof logNote === 'function') logNote(logT('release'));
  if (workT){ clearTimeout(workT); workT = null; }
  shredAnim();
  sessWipe(function(){
    S.img = null; S.objs = []; S.ink = []; S.cut = []; S.undo = [];
    S.turn = {r:0, m:0};
    S.sel = -1; S.out = null; S.mask = null;
    S.byPage = {}; S.inkByPage = {}; S.page = 0; S.pages = 0;
    S.crop = {x:0, y:0, w:1, h:1};
  S.cropRaw = {x:0, y:0, w:1, h:1};
    S.glass = 'none'; S.glassK = 1; S.glassAll = 1;
    for (var k in S.adj) if (S.adj.hasOwnProperty(k)) S.adj[k] = 0;
    inkDirty(); cutDirty(); colorForget();
    if (typeof setGlassFilter === 'function') setGlassFilter();

    S.mode = 'edit'; S.cropRect = null;

    if (typeof docClean === 'function') docClean();
    if (typeof soloPane === 'function') soloPane(null);
    if (typeof closeSheet === 'function') closeSheet();
    if (typeof closeSaver === 'function') closeSaver();
    if (typeof closeMenu === 'function') closeMenu();

    paintPager();
    showProps(false);
    proxyDrop();

    if (!blankSheet()){ fit(); draw(); }
  });
}

function shredAnim(){
  var a = document.getElementById('shredFx');
  if (!a) return;
  a.classList.remove('go');
  void a.offsetWidth;
  a.classList.add('go');
  setTimeout(function(){ a.classList.remove('go'); }, 420);

}

var OPEN_WAIT = 20000;

function openImage(src, done, always){
  var img = new Image();
  var fired = false;
  var timer = setTimeout(function(){
    if (fired) return;
    fired = true;
    img.onload = img.onerror = null;
    errNote(logT('openTimeout', OPEN_WAIT/1000, String(src).slice(0, 60)), 0);
    say('hFail', 6000);
    if (always) always();
  }, OPEN_WAIT);
  var end = function(ok, why){
    if (fired) return;
    fired = true;
    clearTimeout(timer);
    if (!ok){
      errNote(logT('openFail', why), 0);
      say('hFail', 6000);
      if (always) always();
      return;
    }
    done(img);
    if (always) always();
  };
  img.onload = function(){
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!(w > 0 && h > 0)){ end(false, logT('openZeroSize')); return; }
    end(true);
  };
  img.onerror = function(){ end(false, logT('openDecode')); };
  img.src = src;
}

function arrived(){
  if (noSheet()) return;
  if (typeof showProps === 'function') showProps(false);
  if (typeof reflow === 'function') reflow();
  draw();
}

function loadFromShell(keep){
  openImage('/image?t=' + Date.now(), function(img){
    adopt(img, keep);
    if (!keep) arrived();
  });
}

function loadFromFile(f){
  var url = URL.createObjectURL(f);
  openImage(url, function(img){ adopt(img); arrived(); },
            function(){ URL.revokeObjectURL(url); });
}

var LITE_CAP = 8e6;

function liteFit(img, w, h){
  if (!cfg.lite || w*h <= LITE_CAP) return null;
  var k = Math.sqrt(LITE_CAP/(w*h));
  var w2 = Math.max(1, Math.round(w*k)), h2 = Math.max(1, Math.round(h*k));
  var t = document.createElement('canvas');
  t.width = w2; t.height = h2;
  var q = t.getContext('2d');
  if (!q){ errNote(logT('liteNoCtx'), 0); return null; }
  q.imageSmoothingQuality = 'high';
  try { q.drawImage(img, 0, 0, w2, h2); }
  catch(e){ errNote(logT('liteFail', e), 0); return null; }
  return t;
}

var A4 = 1.4142135623730951;

function blankSheet(){
  var dpr = (typeof DPR === 'number' && DPR) ? DPR : 1;
  var sw = (typeof screen !== 'undefined' && screen.width) ? screen.width : 1080;
  var w = Math.max(1, Math.round(sw*dpr));
  var h = Math.max(1, Math.round(w*A4));
  var lim = 4096, big = Math.max(w, h);
  if (big > lim){ var k = lim/big; w = Math.max(1, Math.round(w*k)); h = Math.max(1, Math.round(h*k)); }
  var t = document.createElement('canvas');
  t.width = w; t.height = h;
  var g = t.getContext('2d');
  if (!g){ errNote(logT('sheetNoCtx'), 0); return false; }
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);

  adopt(t, false, true);
  return true;
}

function adopt(img, keep, blank){
  S.blank = !!blank;
  var w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
  var lite = liteFit(img, w0, h0);
  S.img = lite || img;
  S.iw = lite ? lite.width : w0;
  S.ih = lite ? lite.height : h0;
  S.crop = {x:0, y:0, w:1, h:1};
  S.cropRaw = {x:0, y:0, w:1, h:1};
  S.sel = -1; S.undo = [];
  S.mode = 'edit';

  S.objs = keep ? (S.byPage[S.page] || []) : [];
  S.ink  = keep ? (S.inkByPage[S.page] || []) : [];
  S.cut = [];

  S.cutFill = null;

  S.turn = {r:0, m:0};

  S.ang = 0; S.focus = 0; S.tilt = 0; S.tiltH = 0; S.mask = 0;
  inkDirty(); cutDirty(); colorForget();

  if (!keep){
    S.alpha = imgHasAlpha();
    if (S.alpha) S.bgA = 0;
  }
  if (!keep){ S.byPage = {}; S.inkByPage = {}; S.page = 0; probePages(); }
  showProps(false);
  fit(); draw();

  if (!keep) fitWide();
  if (!keep && S.pages > 1) say('hPdf', 6000, S.pages);

  if (!keep && lite) say('hLite', 6000, ' ' + S.iw + '×' + S.ih);

  if (!keep && !S.fromSess) sessKeepFile();

  if (typeof docClean === 'function') docClean();
  S.fromSess = false;
}

function addImg(n){
  var im = new Image();
  im.onload = function(){

    if (S.stkPick){ S.stkPick = false; stkTake(im); return; }
    IMGS[n] = im;
    snap();
    var c = centerOfView();
    S.objs.push({kind:'img', n:n, x:c[0], y:c[1], w:0.4, a:1});
    S.sel = S.objs.length - 1;
    dropCutTool();
    if (typeof objPaint === 'function') objPaint();
    draw();
    say('hIns', 4000);
  };
  im.onerror = function(){ S.stkPick = false; say('hFail', 4000); };
  im.src = '/img/' + n + '?t=' + Date.now();
}

var STK_MAX = 512, STK_CAP = 200, STK_NAME = 40;
var stkDB = null, stkCache = null;

function stkOpen(cb){
  if (stkDB){ cb(stkDB); return; }
  try {
    var rq = indexedDB.open('jot', 2);
    rq.onupgradeneeded = function(){
      var d = rq.result;
      if (!d.objectStoreNames.contains('stk')) d.createObjectStore('stk', {keyPath:'id'});
      if (!d.objectStoreNames.contains('sess')) d.createObjectStore('sess', {keyPath:'id'});
    };
    rq.onsuccess = function(){ stkDB = rq.result; cb(stkDB); };
    rq.onerror = function(){
      errNote(logT('storeFail', (rq.error && rq.error.message) ? rq.error.message : logT('noReason')), 0);
      cb(null);
    };

  } catch(e){
    errNote(logT('storeFail', e), 0);
    cb(null);
  }
}

function stkSeed(cb){
  var mark = document.getElementById('bMenu');
  var svg = mark ? mark.querySelector('svg') : null;
  if (!svg){ cb(null); return; }
  var box = 'width="512" height="332" viewBox="17 28 74 48"';
  var body = svg.innerHTML.replace(/currentColor/g, '#e01b24');
  var src = 'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + box +
              ' fill="none" stroke="#e01b24" stroke-width="4.6" ' +
              'stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>');
  var im = new Image();
  im.onload = function(){
    var cn = document.createElement('canvas');
    cn.width = 512; cn.height = 332;
    cn.getContext('2d').drawImage(im, 0, 0, 512, 332);
    var url;
    try { url = cn.toDataURL('image/png'); }
    catch(e){

      errOnce('stkThumb', logT('stkThumb', e));
      cb(null); return;
    }
    cb({id:'s-jot', url:url, w:512, h:332, at:1});
  };
  im.onerror = function(){ cb(null); };
  im.src = src;
}

function stkAll(cb){
  if (stkCache){ cb(stkCache); return; }
  stkOpen(function(d){
    if (!d){ cb([]); return; }
    try {
      var rq = d.transaction('stk', 'readonly').objectStore('stk').getAll();
      rq.onsuccess = function(){
        stkCache = (rq.result || []).sort(function(a, b){ return a.at - b.at; });
        if (!stkCache.length && !cfg.stkSeed){
          cfg.stkSeed = 1;
          saveCfg();
          stkSeed(function(rec){
            if (!rec){ cb(stkCache); return; }
            stkCache = null;
            stkPut(rec, function(){ stkAll(cb); });
          });
          return;
        }
        cb(stkCache);
      };
      rq.onerror = function(){
        errOnce('stkList', logT('stkList'));
        cb([]);
      };
    } catch(e){

      errOnce('stkList', logT('stkListWhy', e));
      cb([]);
    }
  });
}

function stkPut(rec, cb){
  stkOpen(function(d){
    if (!d){ say('hStkFail', 4000); return; }
    try {
      var t = d.transaction('stk', 'readwrite');
      t.objectStore('stk').put(rec);
      t.oncomplete = function(){ stkCache = null; cb && cb(); };
      t.onerror = function(){
        errOnce('stkPut', logT('stkPut'));
        say('hStkFail', 4000);
      };
    } catch(e){
      errOnce('stkPut', logT('stkPutWhy', e));
      say('hStkFail', 4000);
    }
  });
}

function stkDrop(id, cb){
  stkOpen(function(d){
    if (!d) return;
    try {
      var t = d.transaction('stk', 'readwrite');
      t.objectStore('stk').delete(id);
      t.oncomplete = function(){ stkCache = null; cb && cb(); };
    } catch(e){

      errOnce('stkDel', logT('stkDel', e));
    }
  });
}

function toPack(){
  if (noSheet()){ say('hNoImg'); return; }
  var out;
  try { out = renderExport('png'); }
  catch(e){
    var why = String(e && e.message ? e.message : e);
    errNote(logT('toPackBuild', why), 0);
    say(why.indexOf('DEAD:') === 0 ? 'hDead' : 'hMem', 6000);
    return;
  }
  var im = new Image();
  im.onload = function(){ stkTake(im); feel('save'); say('hToPack', 4000); };
  im.onerror = function(){
    errOnce('toPack', logT('toPack'));
    say('hFail', 4000);
  };
  im.src = out.url;
}

function stkTake(im){
  var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
  if (!w || !h){ say('hFail', 4000); return; }
  var k = Math.min(1, STK_MAX/Math.max(w, h));
  var nw = Math.max(1, Math.round(w*k)), nh = Math.max(1, Math.round(h*k));
  var cn = document.createElement('canvas');
  cn.width = nw; cn.height = nh;
  cn.getContext('2d').drawImage(im, 0, 0, nw, nh);
  var url;
  try { url = cn.toDataURL('image/png'); }
  catch(e){
    errOnce('stkScale', logT('stkScale', e));
    say('hFail', 4000); return;
  }

  stkAll(function(list){
    if (list.length >= STK_CAP){ say('hStkFull', 5000, STK_CAP); return; }
    stkPut({id: 's' + Date.now() + '-' + Math.floor(Math.random()*1e6),
            url: url, w: nw, h: nh, at: Date.now()},
           function(){
             stkPaint();
             if (k < 1) say('hStkSmall', 4000, STK_MAX);
           });
  });
}

function stkUse(rec){
  var im = new Image();
  im.onload = function(){
    var n = 'stk:' + rec.id;
    IMGS[n] = im;
    snap();
    var c = centerOfView();
    S.objs.push({kind:'img', n:n, x:c[0], y:c[1], w:0.4, a:1});
    S.sel = S.objs.length - 1;
    dropCutTool();
    stkEnd();
    if (typeof objPaint === 'function') objPaint();
    draw();
    say('hIns', 4000);
  };
  im.onerror = function(){ say('hFail', 4000); };
  im.src = rec.url;
}

function jotShot(n){
  if (typeof shotStart === 'function') shotStart(n);
}

function openAnother(){
  if (BR && BR.pick) { BR.pick(); return; }
  el.file.click();
}

function probePages(){
  S.pages = (BR && BR.pages) ? (BR.pages() | 0) : 0;
  paintPager();
}

function paintPager(){
  if (!el.pager) return;
  if (S.pages > 1){
    el.pager.classList.add('open');
    el.pnum.textContent = (S.page + 1) + ' / ' + S.pages;
    pagerPlace();
  } else el.pager.classList.remove('open');
}

function pagerPlace(){
  if (!el.pager || !el.pager.classList.contains('open')) return;
  var sh = (typeof sheet === 'function') ? sheet() : null;
  var top0 = cssNum('--topBar', 52);
  if (!sh || !sh.h || !V.s){ el.pager.style.top = top0 + 'px'; return; }
  var below = V.oy + sh.h*V.s + 8;
  var room = (cv.clientHeight || 0) - panelBottom() - 44;

  el.pager.style.top = (below < room ? below : top0) + 'px';
}

function gotoPage(n){
  if (!S.pages || n < 0 || n >= S.pages || n === S.page) return;
  S.byPage[S.page] = S.objs;
  S.inkByPage[S.page] = S.ink;
  S.page = n;
  paintPager();
  if (BR && BR.page) BR.page(n);
  loadFromShell(true);
}

function turnAdd(t, kind, dir){
  var r = t.r, m = t.m;
  if (kind === 'rot')  r = (r + (dir > 0 ? 1 : 3)) % 4;
  if (kind === 'mirX'){ r = (4 - r) % 4; m = m ? 0 : 1; }
  if (kind === 'mirY'){ r = (6 - r) % 4; m = m ? 0 : 1; }
  return {r:r, m:m};
}

function turnBack(t){
  if (!t) return;
  if (!S.turn) S.turn = {r:0, m:0};
  if ((S.turn.m|0) !== (t.m|0)) flip(false, true);
  var guard = 0;
  while ((S.turn.r|0) !== (t.r|0) && guard++ < 4) rotate(1, true);
}

function turnPixels(img, w, h, t){
  if (!t || (!t.r && !t.m)) return null;
  var swap = (t.r % 2) === 1;
  var cn = document.createElement('canvas');
  cn.width = swap ? h : w;
  cn.height = swap ? w : h;
  var c = cn.getContext('2d');
  if (!c) return null;
  c.translate(cn.width/2, cn.height/2);
  c.rotate(t.r*Math.PI/2);
  if (t.m) c.scale(-1, 1);
  c.drawImage(img, -w/2, -h/2, w, h);
  return cn;
}

function turnPt(p, dir){
  return (dir > 0) ? [1 - p[1], p[0]] : [p[1], 1 - p[0]];
}

function turnObj(o, dir, iw, ih){
  var m;
  if (o.kind === 'line' || o.kind === 'arrow'){
    m = turnPt([o.x, o.y], dir); o.x = m[0]; o.y = m[1];
    m = turnPt([o.tx, o.ty], dir); o.tx = m[0]; o.ty = m[1];
    return;
  }
  if (isShape(o)){
    var cx = (o.x + o.tx)/2, cy = (o.y + o.ty)/2;
    var wpx = Math.abs(o.tx - o.x)*iw, hpx = Math.abs(o.ty - o.y)*ih;
    m = turnPt([cx, cy], dir);

    var hw = (wpx/2)/ih, hh = (hpx/2)/iw;
    o.x = m[0] - hw; o.tx = m[0] + hw;
    o.y = m[1] - hh; o.ty = m[1] + hh;
    o.rot = (((o.rot || 0) + 90*dir) % 360 + 360) % 360;
    return;
  }
  m = turnPt([o.x, o.y], dir); o.x = m[0]; o.y = m[1];
  if (o.tx !== undefined){ m = turnPt([o.tx, o.ty], dir); o.tx = m[0]; o.ty = m[1]; }

  if (isImg(o)) o.w = (o.w === undefined ? 0.4 : o.w) * iw / ih;
  o.rot = (((o.rot || 0) + 90*dir) % 360 + 360) % 360;
}

function rotate(dir, quiet){
  if (noSheet()) return;
  if (S.mode !== 'edit' && S.mode !== 'crop') return;
  dir = (dir < 0) ? -1 : 1;

  if (!quiet) snap();
  var iw = S.iw, ih = S.ih;
  var cn = document.createElement('canvas');
  cn.width = ih; cn.height = iw;
  var c = cn.getContext('2d');
  c.translate(cn.width/2, cn.height/2);
  c.rotate(dir*Math.PI/2);
  c.drawImage(S.img, -iw/2, -ih/2, iw, ih);

  for (var i = 0; i < S.objs.length; i++) turnObj(S.objs[i], dir, iw, ih);

  for (var j = 0; j < S.ink.length; j++){
    var p = S.ink[j].pts;
    for (var k = 0; k < p.length; k++) p[k] = turnPt(p[k], dir);
  }
  inkDirty();

  cutMove(function(p){ return turnPt(p, dir); });

  S.turn = turnAdd(S.turn || {r:0, m:0}, 'rot', dir);

  var R = S.cropRaw || S.crop;
  S.cropRaw = (dir > 0) ? {x: 1 - (R.y + R.h), y: R.x, w: R.h, h: R.w}
                        : {x: R.y, y: 1 - (R.x + R.w), w: R.h, h: R.w};
  S.crop = warpFit(S.cropRaw);
  S.cropRect = null;

  var d = S.pad || {t:0, r:0, b:0, l:0};
  S.pad = (dir > 0) ? {t:d.l, r:d.t, b:d.r, l:d.b} : {t:d.r, r:d.b, b:d.l, l:d.t};

  if (S.out) S.out = {w:S.out.h, h:S.out.w};

  S.img = cn; S.iw = cn.width; S.ih = cn.height;
  fit(); draw();
}

function flip(vert, quiet){
  if (noSheet()) return;
  if (S.mode !== 'edit' && S.mode !== 'crop') return;
  if (!quiet) snap();
  var cn = document.createElement('canvas');
  cn.width = S.iw; cn.height = S.ih;
  var c = cn.getContext('2d');
  if (vert){ c.translate(0, S.ih); c.scale(1, -1); }
  else { c.translate(S.iw, 0); c.scale(-1, 1); }
  focusDraw(c, photo(), focusA(), tiltA(), tiltHA(), S.iw, S.ih);

  var mir = function(o){
    if (vert){
      o.y = 1 - o.y;
      if (o.ty !== undefined) o.ty = 1 - o.ty;
    } else {
      o.x = 1 - o.x;
      if (o.tx !== undefined) o.tx = 1 - o.tx;
    }
    if (o.rot) o.rot = (((-o.rot) % 360) + 360) % 360;

    if (ownFace(o)) o.mir = o.mir ? 0 : 1;
  };
  for (var i = 0; i < S.objs.length; i++) mir(S.objs[i]);
  for (var j = 0; j < S.ink.length; j++){
    var p = S.ink[j].pts;
    for (var k = 0; k < p.length; k++)
      p[k] = vert ? [p[k][0], 1 - p[k][1]] : [1 - p[k][0], p[k][1]];
  }
  inkDirty();

  cutMove(function(p){ return vert ? [p[0], 1 - p[1]] : [1 - p[0], p[1]]; });

  S.turn = turnAdd(S.turn || {r:0, m:0}, vert ? 'mirY' : 'mirX', 1);

  var R = S.cropRaw || S.crop;
  S.cropRaw = vert ? {x:R.x, y:1 - (R.y + R.h), w:R.w, h:R.h}
                   : {x:1 - (R.x + R.w), y:R.y, w:R.w, h:R.h};
  S.crop = warpFit(S.cropRaw);
  S.cropRect = null;
  var d = S.pad || {t:0, r:0, b:0, l:0};
  S.pad = vert ? {t:d.b, r:d.r, b:d.t, l:d.l} : {t:d.t, r:d.l, b:d.b, l:d.r};

  S.img = cn;
  fit(); draw();
}

function makePdf(jpegB64, iw, ih){
  var img = atob(jpegB64);
  var A = 595.28, B = 841.89;
  var pw = (iw >= ih) ? B : A, ph = (iw >= ih) ? A : B;
  var m = 24;
  var k = Math.min((pw - 2*m)/iw, (ph - 2*m)/ih);
  var w = iw*k, h = ih*k, tx = (pw - w)/2, ty = (ph - h)/2;
  var f = function(n){ return String(Math.round(n*100)/100); };

  var content = 'q ' + f(w) + ' 0 0 ' + f(h) + ' ' + f(tx) + ' ' + f(ty) + ' cm /Im0 Do Q\n';
  var obj = [];
  obj[1] = '<</Type/Catalog/Pages 2 0 R>>';
  obj[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  obj[3] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + f(pw) + ' ' + f(ph) +
           ']/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>';
  obj[4] = '<</Type/XObject/Subtype/Image/Width ' + iw + '/Height ' + ih +
           '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' +
           img.length + '>>\nstream\n' + img + '\nendstream';
  obj[5] = '<</Length ' + content.length + '>>\nstream\n' + content + 'endstream';

  var out = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n';
  var off = [0, 0, 0, 0, 0, 0];
  for (var i = 1; i <= 5; i++){
    off[i] = out.length;
    out += i + ' 0 obj\n' + obj[i] + '\nendobj\n';
  }
  var xref = out.length;
  var pad = function(n, w2){ var s = String(n); while (s.length < w2) s = '0' + s; return s; };
  out += 'xref\n0 6\n0000000000 65535 f \n';
  for (var j = 1; j <= 5; j++) out += pad(off[j], 10) + ' 00000 n \n';
  out += 'trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF\n';
  return btoa(out);
}

var CAP = 42e6;

var WATCH_PX = 12e6;

function canvasDead(cn, c, W, H){
  if (!cn || !c) return logT('guardNoCtx');
  if (!cn.width || !cn.height) return logT('guardZero');
  if (cn.width !== W || cn.height !== H) return logT('guardSize', cn.width + '×' + cn.height);
  return '';
}

function sheetEmpty(cn, c, W, H){
  if (typeof cutOn === 'function' && cutOn()) return false;
  if (noSheet()) return false;
  try {
    var n = 3, seen = 0;
    for (var i = 1; i <= n; i++){
      for (var j = 1; j <= n; j++){
        var x = Math.min(W - 1, Math.max(0, Math.round(W*i/(n + 1))));
        var y = Math.min(H - 1, Math.max(0, Math.round(H*j/(n + 1))));
        if (c.getImageData(x, y, 1, 1).data[3] > 0){ seen++; }
      }
    }
    return seen === 0;
  } catch(e){

    errNote(logT('guardPixels', e), 0);
    return false;
  }
}

function renderExport(fmt){
  var keep = null;

  if (S.mode === 'crop' && S.cropRect){ keep = S.crop; S.crop = warpFit(S.cropRect); }
  try { return renderSheet(fmt); }
  finally { if (keep) S.crop = keep; }
}

function renderSheet(fmt){
  fmt = fmt || cfg.fmt;
  var sh = sheet();
  var wpx = Math.max(1, Math.round(sh.w));
  var hpx = Math.max(1, Math.round(sh.h));
  var k = 1;
  if (wpx*hpx > CAP) k = Math.sqrt(CAP/(wpx*hpx));
  var W = Math.max(1, Math.round(wpx*k)), H = Math.max(1, Math.round(hpx*k));
  var cn = document.createElement('canvas');
  cn.width = W; cn.height = H;
  var c = cn.getContext('2d');

  var dead = canvasDead(cn, c, W, H);
  if (dead) throw new Error('DEAD:' + dead);
  c.imageSmoothingQuality = 'high';

  var bg = S.bg;

  if (fmt !== 'png'){ c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); }

  var fx = sh.px*k, fy = sh.py*k;
  var fw = S.crop.w*S.iw*sh.kx*k, fh = S.crop.h*S.ih*sh.ky*k;

  c.save();
  c.beginPath();
  c.rect(fx, fy, fw, fh);
  c.clip();

  var mF = angMatrix(k*sh.kx, k*sh.ky,
                     k*(sh.px - S.crop.x*S.iw*sh.kx),
                     k*(sh.py - S.crop.y*S.ih*sh.ky));
  c.setTransform(mF[0], mF[1], mF[2], mF[3], mF[4], mF[5]);
  c.filter = filterOf(S.iw * k);
  focusDraw(c, photo(), focusA(), tiltA(), tiltHA(), S.iw, S.ih);
  c.filter = 'none';
  overlays(c);
  c.restore();

  var warpF = (focusA() !== 0 || tiltA() !== 0 || tiltHA() !== 0);
  var layF = document.createElement('canvas');
  layF.width = Math.max(1, Math.round(S.iw*k));
  layF.height = Math.max(1, Math.round(S.ih*k));
  var layQ = layF.getContext('2d');
  var layDirty = false;

  var warpPut = function(q2, img){
    if (warpF) focusDraw(q2, img, focusA(), tiltA(), tiltHA(), S.iw, S.ih);
    else q2.drawImage(img, 0, 0, S.iw, S.ih);
  };
  var layOut = function(img, mode){
    if (!img) return;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(0, 0, W, H); c.clip();
    c.setTransform(mF[0], mF[1], mF[2], mF[3], mF[4], mF[5]);
    if (mode) atopLayer(c, mode, function(sx){ warpPut(sx, img); });
    else warpPut(c, img);
    c.restore();
  };
  var flushLay = function(){
    if (!layDirty || !layQ) return;
    layOut(layF, null);
    layQ.setTransform(1, 0, 0, 1, 0, 0);
    layQ.clearRect(0, 0, layF.width, layF.height);
    layDirty = false;
  };

  var blit2 = function(from, to){

    flushLay();

    var lay = S.ink.length ? inkLayers(layF.width, layF.height, S.iw*k, S.ih*k,
                                       Math.min(S.iw, S.ih)*k, 0, 0, from, to, null) : null;
    if (!lay) return;
    layOut(lay.mark, 'multiply');
    layOut(lay.plain, null);
  };

  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();

  var ord2 = handOrder();
  for (var oi2 = 0; oi2 < ord2.length; oi2++){
    var pc2 = ord2[oi2];
    if (pc2.cut){
      flushLay();

      cutApply(c, mF, {x: 0, y: 0, w: W, h: H}, 1, pc2.cut[0], pc2.cut[1]);
      continue;
    }
    if (pc2.ink){ blit2(pc2.ink[0], pc2.ink[1]); continue; }
    if (layQ){
      layQ.setTransform(k, 0, 0, k, 0, 0);
      drawObj(layQ, S.objs[pc2.obj]);
      layDirty = true;
    }
  }
  flushLay();
  c.restore();

  var gA2 = glassAllOn();
  glassOver(c, cn, gA2 ? 0 : sh.px*k, gA2 ? 0 : sh.py*k,
            (gA2 ? sh.w : sh.fw)*k, (gA2 ? sh.h : sh.fh)*k);

  var thin = !S.blank && (W*H > WATCH_PX) && sheetEmpty(cn, c, W, H);

  if (fmt === 'png') return {url: cn.toDataURL('image/png'), ext:'png', w:W, h:H, thin:thin};
  if (fmt === 'pdf'){
    var j = cn.toDataURL('image/jpeg', 0.92);
    var b = makePdf(j.slice(j.indexOf(',') + 1), W, H);
    return {url: 'data:application/pdf;base64,' + b, ext:'pdf', w:W, h:H, thin:thin};
  }
  var q = (fmt === 'jpg100') ? 1.0 : 0.92;
  return {url: cn.toDataURL('image/jpeg', q), ext:'jpg', w:W, h:H, thin:thin};
}

function cleanName(s){
  s = String(s || '').replace(/[\\\/:*?"<>|\n\r\t]/g, '').trim();
  return s.length ? s.slice(0, 80) : stamp();
}

function alphaFlatMaybe(){
  if (noSheet()) return false;
  var pd0 = S.pad || {t:0, r:0, b:0, l:0};

  var cutClear = (S.cut && S.cut.length) && !S.cutFill;
  var clear = (S.mask > 0) || (outNow() && outNow().mode === 'fit')
              || pd0.t || pd0.r || pd0.b || pd0.l || S.alpha
              || cutClear;
  return !!(clear && bgAlpha() < 1 && cfg.fmt !== 'png');
}

function alphaFlatWarn(out){
  if (!alphaFlatMaybe()) return false;
  if (!out || !out.width) return false;
  var q;
  try { q = out.getContext('2d'); } catch(e){  q = null; }
  if (!q) return false;
  var d;
  try { d = q.getImageData(0, 0, out.width, out.height).data; }
  catch(e){  return false; }
  for (var i = 3; i < d.length; i += 4){
    if (d[i] < 250){ say('hFlat', 5000); return true; }
  }
  return false;
}

function save(mode){
  if (typeof logNote === 'function')
    logNote(logT(mode ? 'shareAs' : 'saveAs', (typeof cfg !== 'undefined' ? cfg.fmt : '?')));
  if (noSheet()){ say('hNoImg'); return; }

  if (S.mode === 'view') viewEnd();
  S.sel = -1; closeSheet(); closeMenu(); closeSaver(); draw();
  el.wait.classList.add('open');
  setTimeout(function(){ doSave(mode); }, 80);
}

function doSave(mode, fmt){
  var out;
  try {
    out = renderExport(fmt);
    alphaFlatWarn(out);
  } catch(e){
    el.wait.classList.remove('open');

    var why = String(e && e.message ? e.message : e);
    if (why.indexOf('DEAD:') === 0){
      errNote(logT('saveCancel', why.slice(5)), 0);
      say('hDead', 8000);
    } else {
      errNote(logT('saveFail', why), 0);
      say('hMem', 6000);
    }
    return;
  }

  if (out && out.thin){
    errNote(logT('guardBlank'), 0);
    say(out.w*out.h >= CAP*0.9 ? 'hThinBig' : 'hThin', 8000);
  }
  var name = cleanName(el.fname ? el.fname.value : '');
  var b64 = out.url.slice(out.url.indexOf(',') + 1);
  if (BR && BR.begin){
    try {
      BR.begin();
      var N = 262144;
      for (var i = 0; i < b64.length; i += N) BR.chunk(b64.substr(i, N));
      BR.end(out.ext, name, mode);
      if (mode === 0){
        feel('save');

        say('hSaved', 5000, ': ' + saveDir() + '/' + name + '.' + out.ext);
      }
    } catch(e){

      errNote(logT('handOff', e), 0);
      say('hFail', 6000);
    }
  } else {
    var a = document.createElement('a');
    a.href = out.url;
    a.download = name + '.' + out.ext;
    a.click();
  }
  el.wait.classList.remove('open');
}

function init(){
  cv = document.getElementById('cv');
  ctx = cv.getContext('2d');
  if (typeof Jot !== 'undefined') BR = Jot;
  loadCfg();
  wire();
  applyTheme();
  paintDesk();

  paintSwitches();
  setLang(cfg.lang);
  initFolds();
  numsWire();
  paintLabels();
  resize();
  draw();

  el.file.onchange = function(){
    if (el.file.files && el.file.files[0]) loadFromFile(el.file.files[0]);
  };

  if (INAPP){

    if (BR && BR.has && !BR.has()){
      sessGet(function(rec){
        if (rec && rec.blob){ S.fromSess = true; sessTake(rec); }

        else { sessLost(rec); blankSheet(); }
      });
    }
    else loadFromShell();
  } else {
    blankSheet();
  }

  var goneAway = function(){ sessKeepNow(); sessWork(); };
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) goneAway();
  });
  window.addEventListener('pagehide', goneAway);

  window.jotBack = goBack;
  window.jotImg = addImg;
  window.jotShot = jotShot;
  syncDepth();
  window.jotReload = function(){ S.byPage = {}; S.inkByPage = {}; S.page = 0; loadFromShell(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
