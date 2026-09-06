

var GLASS_ID = [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];

var LR = 0.2126, LG = 0.7152, LB = 0.0722;

function grayRows(rMul, gMul, bMul){
  return [LR*rMul, LG*rMul, LB*rMul, 0, 0,
          LR*gMul, LG*gMul, LB*gMul, 0, 0,
          LR*bMul, LG*bMul, LB*bMul, 0, 0,
          0, 0, 0, 1, 0];
}

function hex2rgb(h){
  var t = String(h || '').replace('#', '');
  if (t.length === 3) t = t[0]+t[0]+t[1]+t[1]+t[2]+t[2];
  var n = parseInt(t, 16);
  if (!(n >= 0)) return [0, 0, 0];
  return [((n >> 16) & 255)/255, ((n >> 8) & 255)/255, (n & 255)/255];
}

function duoPair(){
  var d = (typeof cfg !== 'undefined' && cfg.duoDark) ? cfg.duoDark : null;
  var l = (typeof cfg !== 'undefined' && cfg.duoLite) ? cfg.duoLite : null;
  if (!d || !l){

    var th = (typeof THEMES !== 'undefined' && THEMES.jot) ? THEMES.jot : null;
    var ac = (typeof ACCENTS !== 'undefined' && ACCENTS.amber) ? ACCENTS.amber : '#fdcd05';
    d = d || (th ? th.bg : '#1a1a1e');
    l = l || ac;
  }
  return [d, l];
}

function duoMatrix(){
  var p = duoPair(), a = hex2rgb(p[0]), b = hex2rgb(p[1]);
  var row = function(i){
    var k = b[i] - a[i];
    return [LR*k, LG*k, LB*k, 0, a[i]];
  };
  return row(0).concat(row(1)).concat(row(2)).concat([0, 0, 0, 1, 0]);
}

var GLASS = {

  neg:   [-1,0,0,0,1, 0,-1,0,0,1, 0,0,-1,0,1, 0,0,0,1,0],

  gray:  grayRows(1, 1, 1),

  bw:    (function(){
           var k = 1.35, o = (1 - k)/2;
           return [LR*k, LG*k, LB*k, 0, o,
                   LR*k, LG*k, LB*k, 0, o,
                   LR*k, LG*k, LB*k, 0, o,
                   0, 0, 0, 1, 0];
         })(),

  sepia: grayRows(1.07, 0.94, 0.72),
  cyan:  grayRows(0.28, 0.78, 1.06),

  ir:    [0.10,1.30,0.10,0,0, 0.35,0.55,0.30,0,0, 0.60,0.10,0.55,0,0, 0,0,0,1,0],

  xray:  [-LR*1.1,-LG*1.1,-LB*1.1,0,1.02,
          -LR*1.05,-LG*1.05,-LB*1.05,0,1.0,
          -LR*0.95,-LG*0.95,-LB*0.95,0,1.0,
          0,0,0,1,0],

  fade:  [0.78,0.10,0.06,0,0.10, 0.06,0.76,0.08,0,0.11, 0.06,0.10,0.74,0,0.13, 0,0,0,1,0],
  polar: [0.92,0.14,0.02,0,0.04, 0.04,0.88,0.06,0,0.06, 0.02,0.10,0.82,0,0.10, 0,0,0,1,0],
  vint:  [0.86,0.20,0.06,0,0.02, 0.10,0.80,0.10,0,0.02, 0.08,0.16,0.68,0,0.04, 0,0,0,1,0],
  therm: null,

  afr:   [1.24, 0.10,-0.10, 0, 0.02,
          0.04, 1.02,-0.06, 0, 0.00,
         -0.06, 0.02, 0.70, 0,-0.02,
          0,    0,    0,    1, 0],

  hel:   [0.685, 0.286, 0.029, 0, 0.010,
          0.085, 0.886, 0.029, 0, 0.015,
          0.085, 0.286, 0.629, 0, 0.045,
          0,     0,     0,     1, 0]
};

function steps(n){

  var v = [];
  for (var i = 0; i < n; i++) v.push((i/(n-1)).toFixed(4));
  return v.join(' ');
}

function solarCurve(){

  var v = [];
  for (var i = 0; i <= 8; i++){
    var x = i/8;
    v.push((x < 0.5 ? x*2 : (1 - x)*2).toFixed(4));
  }
  return v.join(' ');
}

var THERM = {
  r: '0 0.10 0.45 0.75 0.95 1 1 1 1',
  g: '0 0.02 0.05 0.25 0.55 0.80 0.95 1 1',
  b: '0.10 0.45 0.70 0.60 0.30 0.10 0.20 0.60 1'
};

var CURVE = {
  post:  {t:'discrete', m:'gray0', fn:function(k){
            var n = Math.max(3, Math.round(32 - k*27));
            return {r:steps(n), g:steps(n), b:steps(n)};
          }},
  therm: {t:'table', m:'gray0', fn:function(){
            return {r:THERM.r, g:THERM.g, b:THERM.b};
          }},

  pop:   {t:'discrete', m:'sat', fn:function(k){
            var n = Math.max(2, Math.round(6 - k*3));
            return {r:steps(n), g:steps(n), b:steps(n)};
          }},

  dist:  {t:'table', m:'sat', fn:function(){
            var v = '0 0.10 0.42 0.48 0.50 0.52 0.58 0.90 1';
            return {r:v, g:v, b:v};
          }}
};

function kMix(base, k){
  var id = K_ID, out = [];
  for (var i = 0; i < 9; i++) out.push(id[i]*(1 - k) + base[i]*k);
  return out.join(' ');
}

var K_ID     = [0,0,0, 0,1,0, 0,0,0];
var K_EDGE   = [-1,-1,-1, -1,8,-1, -1,-1,-1];
var K_EMBOSS = [-2,-1,0, -1,1,1, 0,1,2];

function grayLift(a, b){
  return [0.33*a,0.33*a,0.33*a,0,b, 0.33*a,0.33*a,0.33*a,0,b,
          0.33*a,0.33*a,0.33*a,0,b, 0,0,0,1,0].join(' ');
}

var CONV = {
  emboss: {k:function(v){ return kMix(K_EMBOSS, v); }, b:0,
           m:function(){ return grayLift(1, 0.35); }},

  };

var GLASS_ORDER = ['none', 'abbr', 'rnd', 'frames', 'gray', 'bw', 'neg', 'sepia', 'vint', 'fade',
                   'polar', 'cyan', 'duo', 'byc', 'ir', 'xray',
                   'post', 'pop', 'therm', 'mosaic', 'emboss',
                   'afr', 'hel', 'dist'];

var GLASS_HOLES = 0;

function cutOn(){ return !!(S.cut && S.cut.length); }

var CUTC = {}, CUTSIG = {};

var EYEPX = null;

function maskBox(){
  var b0 = sheetBox();
  var x0 = b0.x0*S.iw, y0 = b0.y0*S.ih;
  var w = Math.max(1, (b0.x1 - b0.x0)*S.iw);
  var h = Math.max(1, (b0.y1 - b0.y0)*S.ih);
  var k = Math.min(1, Math.sqrt(Math.max(1, S.iw*S.ih) / (w*h)));
  var cw = Math.max(1, Math.round(w*k)), ch = Math.max(1, Math.round(h*k));

  return {x0:x0, y0:y0, w:w, h:h, k:k, cw:cw, ch:ch, kx:cw/w, ky:ch/h};
}

var SHEET_CAP = 1000;

function sheetPixels(c, rect, dpr){
  if (!c || !c.canvas || !rect) return null;
  if (typeof document === 'undefined') return null;
  var b = maskBox();
  var kk = Math.min(1, SHEET_CAP/Math.max(1, Math.max(b.cw, b.ch)));
  var cw = Math.max(1, Math.round(b.cw*kk)), ch = Math.max(1, Math.round(b.ch*kk));
  try {
    var t = document.createElement('canvas');
    t.width = cw; t.height = ch;
    var q = t.getContext('2d');
    if (!q) return null;
    var d = dpr || 1;
    q.drawImage(c.canvas, rect.x*d, rect.y*d, rect.w*d, rect.h*d, 0, 0, cw, ch);
    var px = q.getImageData(0, 0, cw, ch);

    px.canvas = t;
    return px;
  } catch(e){

    return null;
  }
}

function cutMask(sheet, from, to){
  if (!cutOn() || noSheet()) return null;
  var i0 = (from === undefined) ? 0 : from;
  var i1 = (to === undefined) ? S.cut.length : to;
  if (i1 <= i0) return null;
  var b = maskBox();
  var p0 = S.pad || {t:0, r:0, b:0, l:0};
  var last = S.cut[S.cut.length-1];

  var sig = [S.iw, S.ih, b.cw, b.ch, Math.round(b.x0), Math.round(b.y0),
             i0, i1,
             S.cut.length, last && last.pts ? last.pts.length : 0,
             last && last.kind ? last.kind : '', last && last.back ? 1 : 0,
             last && last.keep ? 1 : 0, last && last.live ? 1 : 0,
             p0.t, p0.r, p0.b, p0.l,
             S.objs.length, S.ink.length, S.page,
             S.objs.length ? JSON.stringify(S.objs[S.objs.length-1]).length : 0,
             S.ink.length ? (S.ink[S.ink.length-1].pts || []).length : 0].join(',');

  var slot = (sheet ? 1 : 0) + ':' + i0 + ':' + i1;
  if (CUTC[slot] && CUTSIG[slot] === sig) return CUTC[slot];
  var t = document.createElement('canvas');
  t.width = b.cw; t.height = b.ch;
  var q = t.getContext('2d');
  if (!q) return null;

  q.fillStyle = '#fff';
  q.fillRect(0, 0, b.cw, b.ch);

  q.setTransform(b.kx, 0, 0, b.ky, -b.x0*b.kx, -b.y0*b.ky);
  q.lineJoin = 'round'; q.lineCap = 'round';
  q.strokeStyle = '#fff'; q.fillStyle = '#fff';
  var unit = Math.min(S.iw, S.ih);
  for (var i = i0; i < i1; i++){
    var o = S.cut[i];

    if (o.live) continue;
    q.globalCompositeOperation = o.back ? 'source-over' : 'destination-out';
    if (o.kind === 'brush'){
      var lw = Math.max(1, (o.w || 0.01) * unit);
      q.lineWidth = lw;

      var blur = (typeof softPx === 'function') ? softPx(o, lw)*b.kx : 0;
      q.filter = blur ? ('blur(' + (Math.round(blur*100)/100) + 'px)') : 'none';
      q.beginPath();
      for (var j = 0; j < o.pts.length; j++){
        var px = o.pts[j][0]*S.iw, py = o.pts[j][1]*S.ih;
        if (j) q.lineTo(px, py); else q.moveTo(px, py);
      }
      if (o.pts.length === 1) q.lineTo(o.pts[0][0]*S.iw + 0.01, o.pts[0][1]*S.ih);
      q.stroke();
      q.filter = 'none';
    } else if (o.kind === 'free'){

      q.filter = 'none';
      if (o.soft > 0){
        var fb = softPx({soft:o.soft}, unit*0.02)*b.kx;
        if (fb) q.filter = 'blur(' + (Math.round(fb*100)/100) + 'px)';
      }
      q.beginPath();
      for (var f = 0; f < o.pts.length; f++){
        var fx2 = o.pts[f][0]*S.iw, fy2 = o.pts[f][1]*S.ih;
        if (f) q.lineTo(fx2, fy2); else q.moveTo(fx2, fy2);
      }
      q.closePath();
      if (o.keep){

        var pad = Math.max(8, Math.max(b.w, b.h)*0.01);
        q.moveTo(b.x0 - pad, b.y0 - pad);
        q.lineTo(b.x0 + b.w + pad, b.y0 - pad);
        q.lineTo(b.x0 + b.w + pad, b.y0 + b.h + pad);
        q.lineTo(b.x0 - pad, b.y0 + b.h + pad);
        q.closePath();
        q.fill('evenodd');
      } else q.fill();
      q.filter = 'none';
    } else if (o.kind === 'poly'){

      q.filter = 'none';
      q.beginPath();
      for (var v = 0; v < o.pts.length; v++){
        var vx = o.pts[v][0]*S.iw, vy = o.pts[v][1]*S.ih;
        if (v) q.lineTo(vx, vy); else q.moveTo(vx, vy);
      }
      q.closePath();
      q.fill();
    } else if (o.kind === 'color'){
      q.filter = 'none';
      colorCut(q, o, sheet, b);
    } else if (typeof shapePath === 'function'){
      q.filter = 'none';
      q.fill(shapePath(o));
    }
  }
  q.globalCompositeOperation = 'source-over';
  q.setTransform(1, 0, 0, 1, 0, 0);
  CUTC[slot] = t; CUTSIG[slot] = sig;
  return t;
}

function cutDirty(){
  CUTC = {}; CUTSIG = {};
  if (typeof alphaFlatWarn === 'function') alphaFlatWarn();
}

function cutMove(fn){
  if (!S.cut || !S.cut.length) return;
  for (var i = 0; i < S.cut.length; i++){
    var o = S.cut[i];
    if (o.pts) for (var j = 0; j < o.pts.length; j++) o.pts[j] = fn(o.pts[j]);
    if (o.x !== undefined && o.y !== undefined){
      var a = fn([o.x, o.y]); o.x = a[0]; o.y = a[1];
    }
    if (o.tx !== undefined && o.ty !== undefined){
      var b = fn([o.tx, o.ty]); o.tx = b[0]; o.ty = b[1];
    }
  }
  cutDirty();
  if (typeof colorForget === 'function') colorForget();
}

var CSRC = null, CSRCW = 0, CSRCH = 0;

function colorSource(){
  if (CSRC && CSRCW) return CSRC;
  var long = Math.max(S.iw, S.ih);
  var k = Math.min(1, 1000/long);
  var w = Math.max(1, Math.round(S.iw*k)), h = Math.max(1, Math.round(S.ih*k));
  var t = document.createElement('canvas');
  t.width = w; t.height = h;
  var q = t.getContext('2d');
  if (!q){ errNote(logT('proxyNoCtx'), 0); return null; }
  try { q.drawImage(S.img, 0, 0, w, h); }
  catch(e){ errNote(logT('proxyFail', e), 0); return null; }
  try { CSRC = q.getImageData(0, 0, w, h); }
  catch(e){ errNote(logT('proxyPixels', e), 0); return null; }

  var dd = CSRC.data, live = 0;
  for (var z = 0; z + 3 < dd.length && !live; z += 4*997)
    live = dd[z] | dd[z+1] | dd[z+2] | dd[z+3];

  if (!live && !S.blank){
    errNote(logT('proxyEmpty'), 0);
    CSRC = null; return null;
  }
  CSRCW = w; CSRCH = h;
  return CSRC;
}

function colorForget(){ CSRC = null; CSRCW = 0; CSRCH = 0; POPC = null; POPSIG = ''; }

var POPC = null, POPSIG = '';

function popSig(){
  var p = S.pop;
  if (!p) return '';
  return [S.iw, S.ih, Math.round(p.x*1e4), Math.round(p.y*1e4),
          Math.round((p.tol || 0.15)*1e3)].join(':');
}

function popBake(){
  var p = S.pop;
  if (!p || noSheet()) return null;
  var sig = popSig();
  if (POPC && POPSIG === sig) return POPC;
  var d = colorSource();
  if (!d) return null;
  var w = CSRCW, h = CSRCH;
  var px = Math.max(0, Math.min(w-1, Math.round(p.x*w)));
  var py = Math.max(0, Math.min(h-1, Math.round(p.y*h)));
  var i0 = (py*w + px)*4;
  var r0 = d.data[i0], g0 = d.data[i0+1], b0 = d.data[i0+2];
  var lim = (p.tol || 0.15) * 441.7;

  var mt = document.createElement('canvas');
  mt.width = w; mt.height = h;
  var mq = mt.getContext('2d');
  if (!mq) return null;
  var out = mq.createImageData(w, h);
  for (var i = 0; i < d.data.length; i += 4){
    var dr = d.data[i] - r0, dg = d.data[i+1] - g0, db = d.data[i+2] - b0;
    var dist = Math.sqrt(dr*dr + dg*dg + db*db);
    var a = dist <= lim ? 1 : Math.max(0, 1 - (dist - lim)/40);
    out.data[i] = out.data[i+1] = out.data[i+2] = 255;
    out.data[i+3] = Math.round(a*255);
  }
  mq.putImageData(out, 0, 0);

  var lt = document.createElement('canvas');
  lt.width = S.iw; lt.height = S.ih;
  var lq = lt.getContext('2d');
  if (!lq) return null;
  try {
    lq.drawImage(S.img, 0, 0, S.iw, S.ih);
    lq.globalCompositeOperation = 'destination-in';
    lq.drawImage(mt, 0, 0, S.iw, S.ih);
    lq.globalCompositeOperation = 'source-over';
  } catch(e){ errNote(logT('oneColLive', e), 0); return null; }

  var t = document.createElement('canvas');
  t.width = S.iw; t.height = S.ih;
  var q = t.getContext('2d');
  if (!q) return null;
  try {
    q.filter = 'grayscale(1)';
    q.drawImage(S.img, 0, 0, S.iw, S.ih);
    q.filter = 'none';
    q.drawImage(lt, 0, 0);
  } catch(e){ errNote(logT('oneColGrey', e), 0); return null; }

  POPC = t; POPSIG = sig;
  return POPC;
}

var PROXYCN = null;
var PROXY = null, PROXYSRC = null, PROXYW = 0;

function proxyDrop(){ PROXY = null; PROXYSRC = null; PROXYW = 0; }

function photoSmall(src, want, tight){
  var iw = S.iw || 0, ih = S.ih || 0;
  if (!src || !iw || !ih) return src;

  if (!(want > 0) || want * 2 >= iw) return src;

  if (PROXY && PROXYSRC === src && PROXYW >= want && PROXYW <= want * 4) return PROXY;

  var grow = (PROXYW > 0 && PROXYW < want);
  var w = Math.round((grow && !tight) ? Math.min(iw, want * 2) : want);
  if (w >= iw) return src;
  var h = Math.max(1, Math.round(w * ih / iw));
  w = Math.max(1, w);
  try {

    if (!PROXYCN) PROXYCN = document.createElement('canvas');
    var t = PROXYCN;
    if (t.width !== w || t.height !== h){ t.width = w; t.height = h; }
    var q = t.getContext('2d');
    if (!q) return src;
    q.clearRect(0, 0, w, h);
    q.imageSmoothingQuality = 'high';
    q.drawImage(src, 0, 0, w, h);
    if (!S.alpha){
      var d = q.getImageData(w >> 1, h >> 1, 1, 1).data;
      if (d[3] === 0){
        errOnce('proxy', logT('proxyBlank'));
        return src;
      }
    }
    PROXY = t; PROXYSRC = src; PROXYW = w;
    return PROXY;
  } catch(e){
    errOnce('proxy', logT('proxyNoBuild', e));
    return src;
  }
}

var MIXCN = null, MIXOUT = null, MIXKEY = '', MIXSRC = null;

function mixIdle(){
  var m = S.mix;
  if (!m) return true;
  for (var i = 0; i < m.length; i++)
    if (m[i] && (m[i][0] || m[i][1] || m[i][2])) return false;
  return true;
}

function mixDrop(){ MIXOUT = null; MIXKEY = ''; MIXSRC = null; }

function mixW8(h, i){
  var c = MIXHUE[i];
  var d = Math.abs(h - c); if (d > 180) d = 360 - d;
  var prev = MIXHUE[(i + 7) % 8], next = MIXHUE[(i + 1) % 8];
  var dp = Math.abs(c - prev); if (dp > 180) dp = 360 - dp;
  var dn = Math.abs(next - c); if (dn > 180) dn = 360 - dn;
  var span = ((h - c + 540) % 360 - 180 >= 0 ? dn : dp);
  if (!(span > 0) || d >= span) return 0;
  return 0.5 + 0.5 * Math.cos(Math.PI * d / span);
}

var MIXHUE = [0, 30, 60, 120, 180, 240, 285, 320];

function mixBake(src){
  if (mixIdle() || !src) return src;
  var w = src.width || src.naturalWidth || 0, h = src.height || src.naturalHeight || 0;
  if (!w || !h) return src;
  var key = JSON.stringify(S.mix) + '|' + w + 'x' + h;
  if (MIXOUT && MIXKEY === key && MIXSRC === src) return MIXOUT;
  try {
    if (!MIXCN) MIXCN = document.createElement('canvas');
    var t = MIXCN;
    t.width = w; t.height = h;
    var q = t.getContext('2d', {willReadFrequently: true});
    if (!q) return src;
    q.clearRect(0, 0, w, h);
    q.drawImage(src, 0, 0, w, h);
    var im = q.getImageData(0, 0, w, h), d = im.data, m = S.mix;
    for (var p = 0; p < d.length; p += 4){
      if (!d[p + 3]) continue;
      var r = d[p] / 255, g = d[p + 1] / 255, b = d[p + 2] / 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      if (mx === mn) continue;
      var c = mx - mn;
      var s = l > 0.5 ? c / (2 - mx - mn) : c / (mx + mn);
      var hu = mx === r ? ((g - b) / c + (g < b ? 6 : 0))
             : mx === g ? ((b - r) / c + 2)
                        : ((r - g) / c + 4);
      hu *= 60;
      var dh = 0, ds = 0, dl = 0, sum = 0, i, wt;
      for (i = 0; i < 8; i++){
        wt = mixW8(hu, i);
        if (!wt) continue;
        sum += wt;
        dh += wt * (m[i] ? m[i][0] : 0);
        ds += wt * (m[i] ? m[i][1] : 0);
        dl += wt * (m[i] ? m[i][2] : 0);
      }
      if (!sum) continue;
      dh /= sum; ds /= sum; dl /= sum;

      hu = (hu + dh * 0.9 + 360) % 360;
      s = clamp(s * (1 + ds / 100), 0, 1);
      l = clamp(l + dl / 200, 0, 1);
      var c2 = (1 - Math.abs(2 * l - 1)) * s;
      var x = c2 * (1 - Math.abs((hu / 60) % 2 - 1)), m2 = l - c2 / 2, k = (hu / 60) | 0;
      var rr = k === 0 ? c2 : k === 1 ? x : k === 4 ? x : k === 5 ? c2 : 0;
      var gg = k === 0 ? x : (k === 1 || k === 2) ? c2 : k === 3 ? x : 0;
      var bb = k === 2 ? x : (k === 3 || k === 4) ? c2 : k === 5 ? x : 0;
      d[p]     = Math.round((rr + m2) * 255);
      d[p + 1] = Math.round((gg + m2) * 255);
      d[p + 2] = Math.round((bb + m2) * 255);
    }
    q.putImageData(im, 0, 0);
    MIXOUT = t; MIXKEY = key; MIXSRC = src;
    return t;
  } catch(e){
    errOnce('mixBake', logT('mixFail', e));
    return src;
  }
}

function photo(want, tight){
  var src = S.pop ? (popBake() || S.img) : S.img;
  if (!(want > 0)) return mixBake(src);
  return mixBake(photoSmall(src, want, tight));
}

function imgHasAlpha(){
  var d = colorSource();
  if (!d) return false;
  var dd = d.data;
  for (var i = 3; i < dd.length; i += 4) if (dd[i] < 250) return true;
  return false;
}

function colorCut(q, o, sheet, box){
  var d = sheet || colorSource();
  if (!d) return;
  var own = !!sheet;
  var w = own ? d.width : CSRCW, h = own ? d.height : CSRCH;

  var fx = own ? (o.x*S.iw - box.x0)/box.w : o.x;
  var fy = own ? (o.y*S.ih - box.y0)/box.h : o.y;
  var px = Math.max(0, Math.min(w-1, Math.round(fx*w)));
  var py = Math.max(0, Math.min(h-1, Math.round(fy*h)));
  var i0 = (py*w + px)*4;
  var r0 = d.data[i0], g0 = d.data[i0+1], b0 = d.data[i0+2], a0 = d.data[i0+3];

  var lim = (o.tol || 0.15) * 441.7;
  var t = document.createElement('canvas');
  t.width = w; t.height = h;
  var c2 = t.getContext('2d');
  if (!c2) return;
  var out = c2.createImageData(w, h);

  var clear0 = a0 < 8;
  for (var i = 0; i < d.data.length; i += 4){
    var ai = d.data[i+3];
    var clear = ai < 8;
    if (clear !== clear0){
      out.data[i] = out.data[i+1] = out.data[i+2] = 255;
      out.data[i+3] = 0;
      continue;
    }
    var dr = d.data[i] - r0, dg = d.data[i+1] - g0, db = d.data[i+2] - b0;
    var dist = Math.sqrt(dr*dr + dg*dg + db*db);

    var a = dist <= lim ? 1 : Math.max(0, 1 - (dist - lim)/40);

    if (!clear) a *= Math.min(1, ai/255);
    out.data[i] = out.data[i+1] = out.data[i+2] = 255;
    out.data[i+3] = Math.round(a*255);
  }
  c2.putImageData(out, 0, 0);
  if (own){

    q.save();
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.drawImage(t, 0, 0, box.cw, box.ch);
    q.restore();
  } else {
    q.drawImage(t, 0, 0, S.iw, S.ih);
  }
}

var CUT_LAY = null;

function cutFull(m, b, want){
  if (typeof document === 'undefined' || !document.createElement) return null;
  try {
    var w = Math.max(1, Math.round(Math.min(S.iw, want > 0 ? want : S.iw)));
    var h = Math.max(1, Math.round(w * S.ih / S.iw));
    if (!CUT_LAY) CUT_LAY = document.createElement('canvas');
    var t = CUT_LAY;
    if (t.width !== w || t.height !== h){ t.width = w; t.height = h; }
    var q = t.getContext('2d');
    if (!q) return null;
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.clearRect(0, 0, w, h);
    var kx = w/S.iw, ky = h/S.ih;

    q.fillStyle = '#fff';
    q.beginPath();
    q.rect(0, 0, w, h);
    q.rect(b.x0*kx, b.y0*ky, b.w*kx, b.h*ky);
    q.fill('evenodd');
    q.setTransform(kx, 0, 0, ky, 0, 0);
    q.drawImage(m, b.x0, b.y0, b.w, b.h);
    return t;
  } catch(_){

    return null;
  }
}

function warpMask(c, m, a, t, th, iw, ih, want){
  if (typeof peeking === 'function' && peeking()){ c.drawImage(m, 0, 0, iw, ih); return; }
  c.drawImage(focusBake(m, a, t, th, want) || m, 0, 0, iw, ih);
}

function cutApply(c, mt, rect, dpr, from, to, want){
  var m = cutMask(sheetPixels(c, rect, dpr), from, to);
  if (!m) return;
  var b = maskBox();
  var a = focusA(), t = tiltA(), th = tiltHA();
  var warp = (a !== 0 || t !== 0 || th !== 0);
  var full = warp ? cutFull(m, b, want) : null;
  try {
    c.save();
    var d = dpr || 1;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.beginPath();
    c.rect(rect.x, rect.y, rect.w, rect.h);
    c.clip();
    c.setTransform(mt[0], mt[1], mt[2], mt[3], mt[4], mt[5]);
    c.globalCompositeOperation = 'destination-in';
    if (full) warpMask(c, full, a, t, th, S.iw, S.ih, want);
    else c.drawImage(m, b.x0, b.y0, b.w, b.h);

    if (S.cutFill){
      var mm = full || m;
      var fl = document.createElement('canvas');
      fl.width = mm.width; fl.height = mm.height;
      var fq = fl.getContext('2d');
      if (fq){
        fq.fillStyle = S.cutFill;
        fq.fillRect(0, 0, fl.width, fl.height);
        fq.globalCompositeOperation = 'destination-out';
        fq.drawImage(mm, 0, 0);
        c.globalCompositeOperation = 'destination-over';
        if (full) warpMask(c, fl, a, t, th, S.iw, S.ih, want);
        else c.drawImage(fl, b.x0, b.y0, b.w, b.h);
      }
    }
    c.globalCompositeOperation = 'source-over';
    c.restore();
  } catch(_){

    errOnce('glassDraw', logT('glassDraw'));
  }
}

var PIXEL = {mosaic: 1, byc: 1, abbr: 1};

var FRAME = {

  fLine:  {w: 0.010, kind: 'line'},

  fMat:   {w: 0.060, kind: 'mat'},

  fShade: {w: 0.045, kind: 'shade'},

  fNeg:   {w: 0.055, kind: 'neg'},

  fShell: {w: 0.001, kind: 'shell'},

  fTwin:  {w: 0.030, kind: 'twin'},
  fCorn:  {w: 0.045, kind: 'corn'},
  fBevel: {w: 0.050, kind: 'bevel'},
  fDash:  {w: 0.014, kind: 'dash'}
};

var FRAME_ORDER = ['fLine', 'fTwin', 'fDash', 'fBevel',
                   'fMat', 'fShade', 'fCorn', 'fNeg'];

function frameOn(g){ return !!FRAME[g === undefined ? S.glass : g]; }

function glassKnownReal(n){
  return !!(GLASS[n] || CURVE[n] || CONV[n] || PIXEL[n] || FRAME[n] || n === 'duo');
}

function frameOver(c, cnv, x, y, w, h){
  var f = FRAME[S.glass];
  if (!f) return;

  if (f.kind === 'shell'){ shellOver(c, cnv, x, y, w, h); return; }
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var b = Math.max(1, Math.round(Math.min(w, h) * f.w));

  var inset = b * (1 - k);
  var iw = Math.max(1, w - inset*2), ih = Math.max(1, h - inset*2);
  try {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(x, y, w, h); c.clip();

    if (inset > 0.5){
      c.globalCompositeOperation = 'copy';
      c.drawImage(cnv, x, y, w, h, x + inset, y + inset, iw, ih);
      c.globalCompositeOperation = 'source-over';
    }

    var col = frameInk();
    var x0 = x, y0 = y, x1 = x + w, y1 = y + h;

    if (f.kind === 'shade'){

      var g1 = c.createLinearGradient(x0, y0, x0, y0 + b);
      g1.addColorStop(0, col); g1.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g1; c.fillRect(x0, y0, w, b);
      var g2 = c.createLinearGradient(x0, y1, x0, y1 - b);
      g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g2; c.fillRect(x0, y1 - b, w, b);
      var g3 = c.createLinearGradient(x0, y0, x0 + b, y0);
      g3.addColorStop(0, col); g3.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g3; c.fillRect(x0, y0, b, h);
      var g4 = c.createLinearGradient(x1, y0, x1 - b, y0);
      g4.addColorStop(0, col); g4.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g4; c.fillRect(x1 - b, y0, b, h);
      c.restore();
      return;
    }

    var p = new Path2D();
    p.rect(x0, y0, w, h);
    p.rect(x0 + b, y0 + b, Math.max(0, w - b*2), Math.max(0, h - b*2));
    c.fillStyle = col;
    c.fill(p, 'evenodd');

    if (f.kind === 'mat'){

      c.strokeStyle = frameLine();
      c.lineWidth = Math.max(1, b*0.06);
      c.strokeRect(x0 + b + 0.5, y0 + b + 0.5, Math.max(0, w - b*2 - 1), Math.max(0, h - b*2 - 1));
    }

    if (f.kind === 'twin'){

      c.strokeStyle = col;
      c.lineWidth = Math.max(1, b*0.28);
      var g5 = b*0.36;
      c.strokeRect(x0 + g5, y0 + g5, Math.max(0, w - g5*2), Math.max(0, h - g5*2));
      c.strokeRect(x0 + b, y0 + b, Math.max(0, w - b*2), Math.max(0, h - b*2));
      c.restore();
      return;
    }

    if (f.kind === 'dash'){

      c.strokeStyle = col;
      c.lineWidth = Math.max(1, b);
      var d5 = Math.max(2, b*4);
      c.setLineDash([d5, d5*0.7]);
      c.strokeRect(x0 + b/2, y0 + b/2, Math.max(0, w - b), Math.max(0, h - b));
      c.setLineDash([]);
      c.restore();
      return;
    }

    if (f.kind === 'corn'){

      var arm = Math.min(w, h) * 0.14;
      c.strokeStyle = col;
      c.lineWidth = Math.max(1, b*0.5);
      var q1 = c.lineWidth/2;
      c.beginPath();
      c.moveTo(x0 + q1, y0 + arm); c.lineTo(x0 + q1, y0 + q1); c.lineTo(x0 + arm, y0 + q1);
      c.moveTo(x1 - arm, y0 + q1); c.lineTo(x1 - q1, y0 + q1); c.lineTo(x1 - q1, y0 + arm);
      c.moveTo(x1 - q1, y1 - arm); c.lineTo(x1 - q1, y1 - q1); c.lineTo(x1 - arm, y1 - q1);
      c.moveTo(x0 + arm, y1 - q1); c.lineTo(x0 + q1, y1 - q1); c.lineTo(x0 + q1, y1 - arm);
      c.stroke();
      c.restore();
      return;
    }

    if (f.kind === 'bevel'){

      var cut = b*1.6;
      var pb = new Path2D();
      pb.rect(x0, y0, w, h);
      pb.moveTo(x0 + b + cut, y0 + b);
      pb.lineTo(x1 - b - cut, y0 + b);
      pb.lineTo(x1 - b, y0 + b + cut);
      pb.lineTo(x1 - b, y1 - b - cut);
      pb.lineTo(x1 - b - cut, y1 - b);
      pb.lineTo(x0 + b + cut, y1 - b);
      pb.lineTo(x0 + b, y1 - b - cut);
      pb.lineTo(x0 + b, y0 + b + cut);
      pb.closePath();
      c.fillStyle = col;
      c.fill(pb, 'evenodd');
      c.restore();
      return;
    }

    if (f.kind === 'neg'){

      var step = b * 1.7, r = b * 0.28;
      var n = Math.max(2, Math.floor((h - b) / step));
      var gap = (h - b) / n;
      c.fillStyle = frameLine();
      for (var i = 0; i < n; i++){
        var cy = y0 + b/2 + gap*(i + 0.5);
        c.fillRect(x0 + b*0.28, cy - r, r*2, r*2);
        c.fillRect(x1 - b*0.28 - r*2, cy - r, r*2, r*2);
      }
    }
    c.restore();
  } catch(_){
    errOnce('frameDraw', logT('frameDraw'));
  }
}

function shellChars(txt){
  var out = [], prevZwj = false;
  var join = function(cp){
    return cp === 0x200D || cp === 0xFE0F || cp === 0xFE0E ||
           (cp >= 0x1F3FB && cp <= 0x1F3FF) ||
           (cp >= 0x0300 && cp <= 0x036F) ||
           (cp >= 0x20D0 && cp <= 0x20FF) ||
           (cp >= 0x1F1E6 && cp <= 0x1F1FF && out.length &&
            out[out.length-1].codePointAt(0) >= 0x1F1E6 &&
            out[out.length-1].codePointAt(0) <= 0x1F1FF &&
            out[out.length-1].length <= 2);
  };
  for (var i = 0; i < txt.length; ){
    var cp = txt.codePointAt(i);
    var ch = String.fromCodePoint(cp);
    i += ch.length;
    if (out.length && (prevZwj || join(cp))) out[out.length-1] += ch;
    else out.push(ch);
    prevZwj = (cp === 0x200D);
  }
  return out;
}

function shellOver(c, cnv, x, y, w, h){
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var txt = String(S.shellTxt || '');
  if (!txt) return;
  var chars = shellChars(txt);
  var col = frameInk();

  var lum = (function(){
    var t = hex2rgb(col);
    return 0.2126*t[0] + 0.7152*t[1] + 0.0722*t[2];
  })();
  var ink = (lum > 0.55) ? '#101010' : '#f2f2f2';
  var m = Math.min(w, h);
  var f0 = Math.max(6, m * (0.020 + k*0.075));
  try {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    for (var pass = 0; pass < 4; pass++){
      var f = f0 * (1 - pass*0.22);
      if (f < 6) break;
      c.font = '700 ' + f + 'px sans-serif';
      var band = f * 1.5;
      var need = c.measureText(txt).width;

      var have = 0, rings = 0, iw2 = w, ih2 = h;
      while (iw2 > band*2 && ih2 > band*2){
        have += (iw2 - band) * 2 + (ih2 - band) * 2;
        iw2 -= band*2; ih2 -= band*2; rings++;
      }
      if (have < need && pass < 3) continue;

      var full = 0, iw3 = w, ih3 = h, snap = 0;
      while (iw3 > band*2 && ih3 > band*2){
        full += (iw3 - band)*2 + (ih3 - band)*2;
        if (need >= full*0.70 && need <= full){ snap = full; break; }
        iw3 -= band*2; ih3 -= band*2;
      }
      var gap = snap ? (snap - need) / Math.max(1, chars.length) : 0;

      var done = 0;
      var ox = x, oy = y, ow = w, oh = h;
      for (var r = 0; r < rings && done < chars.length; r++){
        var sides = [
          [ox, oy + band/2, ow - band, 0],
          [ox + ow - band/2, oy, oh - band, 90],
          [ox + ow, oy + oh - band/2, ow - band, 180],
          [ox + band/2, oy + oh, oh - band, 270]
        ];
        for (var si = 0; si < 4 && done < chars.length; si++){
          var sd = sides[si], run = sd[2];
          if (run <= 0) continue;

          var take = 0, wsum = 0;
          while (done + take < chars.length){
            var cw = c.measureText(chars[done + take]).width + gap;

            if (snap ? (wsum >= run) : (wsum + cw > run)) break;
            wsum += cw; take++;
          }
          if (!take) take = 1;
          c.save();
          c.translate(sd[0], sd[1]);
          c.rotate(sd[3]*Math.PI/180);
          c.fillStyle = col;
          c.fillRect(0, -band/2, Math.min(run, wsum) + band/2, band);
          c.fillStyle = ink;

          var pen2 = band*0.2;
          for (var ci = 0; ci < take; ci++){
            var chr = chars[done + ci];
            c.fillText(chr, pen2, 0);
            pen2 += c.measureText(chr).width + gap;
          }
          c.restore();
          done += take;
        }
        ox += band; oy += band; ow -= band*2; oh -= band*2;
      }
      break;
    }
    c.restore();
  } catch(_){
    errOnce('glassShell', logT('glassShell'));
  }
}

function frameInk(){
  if (S.glass === 'fNeg') return '#141414';

  if (S.frameCol) return S.frameCol;

  if (S.glass === 'fShell') return '#ffffff';
  return (typeof bgFill === 'function') ? bgFill() : '#ffffff';
}

function frameLine(){
  if (S.glass === 'fNeg') return '#f2f2f2';
  return 'rgba(0,0,0,.28)';
}

function glassOn(){
  if (!S.glass || S.glass === 'none') return false;
  if (!((S.glassK || 0) > 0.001)) return false;

  return !!(GLASS[S.glass] || CURVE[S.glass] || CONV[S.glass] ||
            S.glass === 'duo' || PIXEL[S.glass] || FRAME[S.glass]);
}

function glassValues(name, k){
  var m = (name === 'duo') ? duoMatrix() : GLASS[name];
  if (!m) return GLASS_ID.join(' ');
  var out = [];
  for (var i = 0; i < 20; i++) out.push(GLASS_ID[i] + (m[i] - GLASS_ID[i])*k);
  return out.join(' ');
}

function tableMix(v, k){
  var a = v.split(' ').map(Number), n = a.length, out = [];
  for (var i = 0; i < n; i++){
    var id = (n === 1) ? a[i] : i/(n-1);
    out.push((id + (a[i] - id)*k).toFixed(4));
  }
  return out.join(' ');
}

var GRAY0 = [LR,LG,LB,0,0, LR,LG,LB,0,0, LR,LG,LB,0,0, 0,0,0,1,0];

var FRAME_ORDER = ['fLine', 'fTwin', 'fDash', 'fBevel',
                   'fMat', 'fShade', 'fCorn', 'fNeg'];

function convOn(g){ return !!CONV[g === undefined ? S.glass : g]; }

function glassKnown(name){

  if (FRAME_ORDER.indexOf(name) >= 0) return name;
  return GLASS_ORDER.indexOf(name) >= 0 ? name : 'none';
}

function setConvFilter(){
  var cv = CONV[S.glass];
  if (!cv) return;
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var n;
  n = document.getElementById('cvK'); if (n) n.setAttribute('kernelMatrix', cv.k(k));

  n = document.getElementById('cvB'); if (n) n.setAttribute('stdDeviation', String(cv.b*k));
  n = document.getElementById('cvM'); if (n) n.setAttribute('values', cv.m(k));
}

function setGlassFilter(){
  if (convOn()){ setConvFilter(); return; }
  var m = document.getElementById('glassM');
  var c = CURVE[S.glass];
  var k = (S.glassK === undefined) ? 1 : S.glassK;

  if (m){

    if (c && c.m === 'sat'){
      m.setAttribute('values', [1.5,-0.25,-0.25,0,0, -0.25,1.5,-0.25,0,0,
                                -0.25,-0.25,1.5,0,0, 0,0,0,1,0].join(' '));
    } else if (c && c.m === 'gray0'){

      m.setAttribute('values', GRAY0.join(' '));
    } else if (c && c.mv){

      m.setAttribute('values', glassValues(S.glass, k));
    } else {
      m.setAttribute('values', glassValues(c ? 'none' : S.glass, k));
    }
  }
  var v = c ? c.fn(k) : null;
  var ids = ['tR', 'tG', 'tB'], key = ['r', 'g', 'b'];
  for (var i = 0; i < 3; i++){
    var n = document.getElementById(ids[i]);
    if (!n) continue;
    n.setAttribute('type', c ? c.t : 'table');

    n.setAttribute('tableValues',
      v ? (c.t === 'table' ? tableMix(v[key[i]], k) : v[key[i]]) : '0 1');
  }
}

var ROUND_CN = null;
var ROUND_BAKE = null;

function roundSrc(src, m, iw, ih){
  if (!(m > 0) || !src) return src;
  var sw = src.width || iw, sh = src.height || ih;
  if (!sw || !sh) return src;
  var cr = S.crop || {x:0, y:0, w:1, h:1};
  var key = m + '|' + cr.x + '|' + cr.y + '|' + cr.w + '|' + cr.h + '|' + sw + '|' + sh;
  var b = ROUND_BAKE;
  if (b && b.src === src && b.key === key) return b.cn;
  if (typeof document === 'undefined' || !document.createElement) return src;
  if (typeof frameShape !== 'function') return src;
  try {
    if (!ROUND_CN) ROUND_CN = document.createElement('canvas');
    var cn = ROUND_CN;
    if (cn.width !== sw || cn.height !== sh){ cn.width = sw; cn.height = sh; }
    var q = cn.getContext('2d');
    if (!q) return src;
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.clearRect(0, 0, sw, sh);
    q.drawImage(src, 0, 0, sw, sh);

    q.globalCompositeOperation = 'destination-in';
    q.fill(frameShape(cr.x*sw, cr.y*sh, cr.w*sw, cr.h*sh, m));
    q.globalCompositeOperation = 'source-over';
    ROUND_BAKE = {src: src, key: key, cn: cn};
    return cn;
  } catch (e){

    return src;
  }
}

var FOCUS_BAKE = null;
var FOCUS_CN = null;

function focusBake(src, a, t, th, want){
  var sw0 = (src && src.width) || 0, sh0 = (src && src.height) || 0;
  if (!sw0 || !sh0) return null;
  var STEP = 256;
  var w = (want > 0)
        ? Math.min(sw0, Math.max(STEP, Math.ceil(want/STEP)*STEP))
        : sw0;
  var N = focusN(a, w, t, th);
  if (!N) return null;
  var b = FOCUS_BAKE;
  if (b && b.src === src && b.a === a && b.t === t && b.th === th && b.w === w) return b.cn;
  if (typeof document === 'undefined' || !document.createElement) return null;
  var h = Math.max(1, Math.round(w * sh0 / sw0));
  var cn, q;
  try {

    if (!FOCUS_CN) FOCUS_CN = document.createElement('canvas');
    cn = FOCUS_CN;
    if (cn.width !== w || cn.height !== h){ cn.width = w; cn.height = h; }
    q = cn.getContext('2d');
    if (q) q.clearRect(0, 0, w, h);
  } catch(_){

    return null;
  }
  if (!q) return null;
  var k = sw0/w;
  var i, j;
  var g = new Array(N+1);
  for (i = 0; i <= N; i++){
    g[i] = new Array(N+1);
    for (j = 0; j <= N; j++){

      var q0 = focusMap(w*i/N, h*j/N, a, w, h);
      g[i][j] = tiltMap(q0[0], q0[1], t, th, w, h);
    }
  }
  var sw = w/N, sh = h/N, ov = FOCUS_LAP;
  for (i = 0; i < N; i++){
    for (j = 0; j < N; j++){
      var p00 = g[i][j], p10 = g[i+1][j], p01 = g[i][j+1];

      var A = (p10[0] - p00[0])/sw, B = (p10[1] - p00[1])/sw;
      var C = (p01[0] - p00[0])/sh, D = (p01[1] - p00[1])/sh;
      var E = p00[0] - (A*i*sw + C*j*sh);
      var F = p00[1] - (B*i*sw + D*j*sh);
      var x0 = Math.max(0, i*sw - ov),     y0 = Math.max(0, j*sh - ov);
      var x1 = Math.min(w, (i+1)*sw + ov), y1 = Math.min(h, (j+1)*sh + ov);
      if (x1 <= x0 || y1 <= y0) continue;
      q.save();
      q.setTransform(A, B, C, D, E, F);
      q.drawImage(src, x0*k, y0*k, (x1 - x0)*k, (y1 - y0)*k,
                       x0,   y0,   x1 - x0,      y1 - y0);
      q.restore();
    }
  }

  if (want > 0) FOCUS_BAKE = {src: src, a: a, t: t, th: th, w: w, cn: cn};
  return cn;
}

function focusDraw(c, src, a, t, th, iw, ih, want){

  if (typeof roundSrc === 'function') src = roundSrc(src, S.mask || 0, iw, ih);

  if (typeof peeking === 'function' && peeking()){
    c.drawImage(src, 0, 0, iw, ih);
    return;
  }
  c.drawImage(focusBake(src, a, t, th, want) || src, 0, 0, iw, ih);
}

function mosaicOver(c, cnv, x, y, w, h){
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var cell = Math.max(2, Math.round(Math.min(w, h) / 90 * (0.25 + k*1.75)));
  var sw = Math.max(1, Math.round(w/cell)), sh2 = Math.max(1, Math.round(h/cell));
  try {
    var t = document.createElement('canvas');
    t.width = sw; t.height = sh2;
    var q = t.getContext('2d');
    if (!q) return;
    q.imageSmoothingEnabled = false;
    q.drawImage(cnv, x, y, w, h, 0, 0, sw, sh2);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.imageSmoothingEnabled = false;
    c.globalCompositeOperation = 'copy';
    c.drawImage(t, 0, 0, sw, sh2, x, y, w, h);
    c.globalCompositeOperation = 'source-over';
    c.imageSmoothingEnabled = true;
    c.restore();
  } catch(_){
    errOnce('glassSoft', logT('glassSoft'));
  }
}

var ABBR_CN = null, ABBR_CH = null;

function abbrOver(c, cnv, x, y, w, h){
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var d = Math.max(0.5, Math.min(w, h) * 0.022 * k);
  try {
    var W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
    if (!ABBR_CN) ABBR_CN = document.createElement('canvas');
    if (!ABBR_CH) ABBR_CH = document.createElement('canvas');
    var t = ABBR_CN, ch = ABBR_CH;
    if (t.width !== W || t.height !== H){ t.width = W; t.height = H; }
    if (ch.width !== W || ch.height !== H){ ch.width = W; ch.height = H; }
    var q = t.getContext('2d'), qc = ch.getContext('2d');
    if (!q || !qc) return;
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.globalCompositeOperation = 'copy';
    q.clearRect(0, 0, W, H);
    var lay = function(col, dx, dy){
      qc.setTransform(1, 0, 0, 1, 0, 0);
      qc.globalCompositeOperation = 'copy';
      qc.drawImage(cnv, x, y, w, h, 0, 0, W, H);
      qc.globalCompositeOperation = 'multiply';
      qc.fillStyle = col;
      qc.fillRect(0, 0, W, H);

      qc.globalCompositeOperation = 'destination-in';
      qc.drawImage(cnv, x, y, w, h, 0, 0, W, H);
      q.globalCompositeOperation = 'lighter';
      q.drawImage(ch, dx, dy);
    };
    lay('#00ff00', 0, 0);
    lay('#ff0000', d, d*0.6);
    lay('#0000ff', -d, -d*0.6);

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalCompositeOperation = 'copy';
    c.drawImage(t, x, y, w, h);
    c.globalCompositeOperation = 'source-over';
    c.restore();
  } catch(_){
    errOnce('glassAbbr', logT('glassAbbr'));
  }
}

function bycOver(c, cnv, x, y, w, h){
  var p = S.byc;
  if (!p) return;
  var k = (S.glassK === undefined) ? 1 : S.glassK;
  var long = Math.max(w, h);
  var kk = Math.min(1, 320/long);
  var sw = Math.max(1, Math.round(w*kk)), sh2 = Math.max(1, Math.round(h*kk));
  try {

    var t = document.createElement('canvas');
    t.width = sw; t.height = sh2;
    var q = t.getContext('2d');
    if (!q) return;
    q.drawImage(cnv, x, y, w, h, 0, 0, sw, sh2);
    var d = q.getImageData(0, 0, sw, sh2);
    var px = Math.max(0, Math.min(sw-1, Math.round(p.x*sw)));
    var py = Math.max(0, Math.min(sh2-1, Math.round(p.y*sh2)));
    var i0 = (py*sw + px)*4;
    var r0 = d.data[i0], g0 = d.data[i0+1], b0 = d.data[i0+2];
    var lim = (p.tol === undefined ? 1 : p.tol) * 441.7;

    for (var i = 0; i < d.data.length; i += 4){
      var dr = d.data[i] - r0, dg = d.data[i+1] - g0, db = d.data[i+2] - b0;
      var dist = Math.sqrt(dr*dr + dg*dg + db*db);
      var keep = dist <= lim ? 1 : Math.max(0, 1 - (dist - lim)/40);
      if (keep >= 1) continue;
      var lum = LR*d.data[i] + LG*d.data[i+1] + LB*d.data[i+2];
      var m = (1 - keep) * k;
      d.data[i]   = d.data[i]   + (lum - d.data[i])*m;
      d.data[i+1] = d.data[i+1] + (lum - d.data[i+1])*m;
      d.data[i+2] = d.data[i+2] + (lum - d.data[i+2])*m;
    }
    q.putImageData(d, 0, 0);

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalCompositeOperation = 'copy';
    c.drawImage(t, 0, 0, sw, sh2, x, y, w, h);
    c.globalCompositeOperation = 'source-over';
    c.restore();
  } catch(_){
    errOnce('bycDraw', logT('bycDraw'));
  }
}

function glassAllOn(){ return !(S.glassAll === 0); }

function glassOver(c, cnv, x, y, w, h){
  if (!glassOn()) return;
  if (S.glass === 'mosaic'){ mosaicOver(c, cnv, x, y, w, h); return; }
  if (S.glass === 'byc'){ bycOver(c, cnv, x, y, w, h); return; }
  if (S.glass === 'abbr'){ abbrOver(c, cnv, x, y, w, h); return; }
  if (FRAME[S.glass]){ frameOver(c, cnv, x, y, w, h); return; }
  if (!fxWorks()) return;
  try {
    setGlassFilter();
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.globalCompositeOperation = 'copy';
    c.filter = convOn() ? 'url(#jotConv)' : 'url(#jotGlass)';
    c.drawImage(cnv, 0, 0);
    c.filter = 'none';
    c.globalCompositeOperation = 'source-over';
    c.restore();
  } catch(_){

    errOnce('glassDraw', logT('glassDraw'));
  }
}
