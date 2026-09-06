'use strict';

var S = {
  glassAll: 1,

  img: null,
  iw: 0, ih: 0,
  crop: {x:0, y:0, w:1, h:1},
  objs: [],
  sel: -1,
  undo: [],
  mode: 'edit',
  cropRect: null,
  ratio: 'free',
  orient: 'v',

  turn: {r:0, m:0},

  pop: null,

  popAt: null,
  mask: 0,
  bg: '#ffffff',

  bgA: 1,

  alpha: false,

  blank: false,
  bgOwn: '#e01b24',
  eye: false,
  eyeAt: null,
  eyeCol: null,
  pages: 0,
  page: 0,
  byPage: {},
  inkByPage: {},
  adj: {br:0, co:0, sa:0, te:0, ga:0, sh:0, bl:0, gr:0, vi:0},

  mix: [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
  mixI: 0,
  mixW: 'h',
  ink: [],
  tool: 'brush',
  toolWas: 'brush',

  padOn: false,
  stkPick: false,
  stkSel: null,
  p: 2,
  c: null,
  a: 1,
  w: 0.010,
  soft: 0,
  folds: {},
  cut: [],

  cutFill: null,

  shellTxt: '',
  cutW: 0.05,
  cutSoft: 0.3,
  cutTool: 'brush',
  cutTol: 0.15,
  poly: null,
  zoom: 3,

  guideCrop: 'none',
  guideDraw: 'none',
  glass: 'none',
  was: null,
  fromSess: false,
  glassK: 1,

  dash: 0, fill: false, blur: false, mark: false,

  peek: false,

  grp: {line:'line', shape:'arrow'},

  byc: null,

  rev: false,

  autoK: 0.5,

  fixV: 0,
  fixOn: false,

  zoomV: 0,
  zoomOn: false,
  zoomBase: null,

  zoomWin: null,

  geoOn: false,

  ang: 0,

  focus: 0,

  angBase: null,

  angWin: null,

  easySeq: 0,

  tilt: 0,

  tiltH: 0,

  tiltAxis: 'v',

  tiltWin: null,

  cropRaw: {x:0, y:0, w:1, h:1},

  zoomHold: false,

  warpHold: false,

  busy: false,
  inkTop: true,

  seq: 0,
  prev: 'edit',
  out: null,
  pad: {t:0, r:0, b:0, l:0},
  prop: true,
  screen: 'root',
  pick2: 'br'
};

var V = {s:1, ox:0, oy:0, ah:0};
var DPR = 1;

var PAL = [
  {fill:'#ffffff', line:'#111111', ink:'#111111'},
  {fill:'#ffd400', line:'#111111', ink:'#111111'},
  {fill:'#e01b24', line:'#ffffff', ink:'#ffffff'},
  {fill:'#111111', line:'#ffffff', ink:'#ffffff'}
];

var PALROW = [0, 3];

var WREV = 0.03;

var BYCTOL = 0.3;

var POPONE = false;

var PADS = false;

var SIZE = true;

function outNow(){ return SIZE ? (S.out || null) : null; }

function padPx(){
  var p = (PADS && S.pad) ? S.pad : {t:0, r:0, b:0, l:0};
  var cw = Math.max(1, S.crop.w*S.iw), ch = Math.max(1, S.crop.h*S.ih);
  return {t: (p.t || 0)*ch, r: (p.r || 0)*cw, b: (p.b || 0)*ch, l: (p.l || 0)*cw};
}

function padFrac(px, crop, iw, ih){
  var c = crop || {x:0, y:0, w:1, h:1};
  var cw = Math.max(1, c.w*iw), ch = Math.max(1, c.h*ih);
  var p = px || {t:0, r:0, b:0, l:0};
  return {t: (p.t || 0)/ch, r: (p.r || 0)/cw, b: (p.b || 0)/ch, l: (p.l || 0)/cw};
}

var DENT = 0.02;

function dentSize(lo, hi){
  if (!(lo < 0 && hi > 0)) return 0;
  return Math.max(1, Math.round((hi - lo)*DENT));
}

function dentOut(raw, d){
  if (!d) return raw;
  if (raw > -d && raw < d) return 0;
  return raw > 0 ? (raw - d) : (raw + d);
}

function dentRaw(v, d){
  if (!d || v === 0) return v;
  return v > 0 ? (v + d) : (v - d);
}

var AUTO_TRIM = 0.005;
var AUTO_LO = 0.40, AUTO_HI = 0.60;
var AUTO_GA = 30;
var AUTO_MIN = 3;

function autoNums(k){
  var t = (k === undefined) ? 0.5 : clamp(k, 0, 1);
  var trim = AUTO_TRIM * Math.pow(10, (t - 0.5)*1.2);
  var hw = 0.10 * Math.pow(2, (0.5 - t)*2);
  return {trim: trim, lo: 0.5 - hw, hi: 0.5 + hw, ga: AUTO_GA * Math.pow(2, (t - 0.5)*2)};
}

function autoFrom(lo, hi, med, nums){
  if (!(hi > lo)) return null;
  var s = 1/(hi - lo), i = -lo/(hi - lo);
  var b = s + 2*i;
  if (!(b > 0)) return null;
  var c = s/b;
  var nm = nums || autoNums(0.5);
  var ga = 0;
  if (med < nm.lo || med > nm.hi){

    var m = clamp(s*med + i, 0.02, 0.98);
    var g = Math.log(0.5)/Math.log(m);
    if (g > 0) ga = clamp(-100*Math.log(g)/Math.LN2, -nm.ga, nm.ga);
  }
  return {br: (b - 1)*100, co: (c - 1)*100, ga: ga};
}

function autoFit(v){
  if (!v) return null;
  var br = Math.round(clamp(v.br, -100, 100));
  var co = Math.round(clamp(v.co, -100, 100));
  var ga = Math.round(clamp(v.ga, -100, 100));
  var capped = Math.abs(v.br) > 100.5 || Math.abs(v.co) > 100.5;
  var idle = Math.abs(br) < AUTO_MIN && Math.abs(co) < AUTO_MIN && Math.abs(ga) < AUTO_MIN;
  return {br:br, co:co, ga:ga, capped:capped, idle:idle};
}

var FIXN = [0, 6, 30, 51, 65, 76, 88, 100];

var FIXPULL = 5;

function fixSnap(v){
  var t = clamp(v, 0, 100), i, best = 0, bd = 1e9;
  for (i = 0; i < FIXN.length; i++){
    var d = Math.abs(t - FIXN[i]);
    if (d < bd){ bd = d; best = i; }
  }
  if (bd >= FIXPULL) return t;

  var f = bd/FIXPULL;
  return FIXN[best] + (t > FIXN[best] ? 1 : -1)*FIXPULL*f*f;
}

function fixPath(v){
  var t = clamp(v, 0, 100)/100;
  return {k: 0.15 + 0.85*t, paper: Math.max(0, (t - 0.5)*2)};
}

function paperTe(wr, wb){
  if (!(wr > 0) || !(wb > 0)) return 0;
  return clamp(Math.round(220*(wb - wr)/(wb + wr)), -100, 100);
}

function fixNums(v, au, pt){
  var t = clamp(v, 0, 100);
  var o = {br:0, co:0, ga:0, te:0, capped:false};
  if (t <= 0) return o;
  if (au){ o.br = au.br; o.co = au.co; o.ga = au.ga; o.capped = !!au.capped; }
  o.te = Math.round(clamp((pt || 0)*fixPath(t).paper, -100, 100));
  return o;
}

var ZOOM_IN = 4;

function zoomCrop(base, v){
  var b = base || {x:0, y:0, w:1, h:1};
  var t = clamp(v, 0, 100)/100;
  var k = 1/(1 + t*(ZOOM_IN - 1));
  var w = b.w*k, h = b.h*k;
  var cx = b.x + b.w/2, cy = b.y + b.h/2;
  return {x: cx - w/2, y: cy - h/2, w: w, h: h};
}

function zoomClamp(r){
  var w = Math.min(1, r.w), h = Math.min(1, r.h);
  return {x: clamp(r.x, 0, 1 - w), y: clamp(r.y, 0, 1 - h), w: w, h: h};
}

function ratioDrag(anc, fin, r, iw, ih){
  if (!(r > 0)) return null;
  var bb = (typeof sheetBox === 'function') ? sheetBox() : {x0:0, y0:0, x1:1, y1:1};
  var lx0 = bb.x0*iw, lx1 = bb.x1*iw, ly0 = bb.y0*ih, ly1 = bb.y1*ih;
  var ax = anc[0]*iw, ay = anc[1]*ih;
  var ux = fin[0]*iw, uy = fin[1]*ih;
  var sx = (ux >= ax) ? 1 : -1, sy = (uy >= ay) ? 1 : -1;
  var dx = Math.abs(ux - ax), dy = Math.abs(uy - ay);
  var t = (dx*r + dy)/(r*r + 1);
  var w = t*r, h = t;
  var roomX = (sx > 0) ? (lx1 - ax) : (ax - lx0);
  var roomY = (sy > 0) ? (ly1 - ay) : (ay - ly0);
  var k = Math.min(1, w > 0 ? roomX/w : 1, h > 0 ? roomY/h : 1);
  w *= k; h *= k;
  return {x: ((sx > 0) ? ax : ax - w)/iw,
          y: ((sy > 0) ? ay : ay - h)/ih,
          w: w/iw, h: h/ih};
}

function noSheet(){ return !S.img; }

function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }

function lum(hex){
  var h = String(hex || '#ffffff').replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2), 16)/255;
  var gg = parseInt(h.slice(2,4), 16)/255;
  var b = parseInt(h.slice(4,6), 16)/255;
  return 0.2126*r + 0.7152*gg + 0.0722*b;
}

function shade(hex, d){
  var h = String(hex || '#ffffff').replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var k = 1 + d, out = '#';
  for (var i = 0; i < 3; i++){
    var v = parseInt(h.slice(i*2, i*2+2), 16);
    v = Math.round(d < 0 ? v*k : v + (255 - v)*d);
    v = clamp(v, 0, 255);
    out += (v < 16 ? '0' : '') + v.toString(16);
  }
  return out;
}

function hsv2hex(h, s, v){
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); v = clamp(v, 0, 1);
  var c = v*s, x = c*(1 - Math.abs(((h/60) % 2) - 1)), m = v - c;
  var r = 0, g2 = 0, b = 0;
  if (h < 60){ r = c; g2 = x; }
  else if (h < 120){ r = x; g2 = c; }
  else if (h < 180){ g2 = c; b = x; }
  else if (h < 240){ g2 = x; b = c; }
  else if (h < 300){ r = x; b = c; }
  else { r = c; b = x; }
  var f = function(n){
    var q = Math.round((n + m)*255).toString(16);
    return q.length < 2 ? '0'+q : q;
  };
  return '#' + f(r) + f(g2) + f(b);
}

function rgb2hex(r, g, b){
  var f = function(n){ var t = Math.max(0, Math.min(255, n|0)).toString(16); return t.length < 2 ? '0'+t : t; };
  return '#' + f(r) + f(g) + f(b);
}

function hex2hsv(hex){
  var h2 = String(hex || '#e01b24').replace('#', '');
  if (h2.length === 3) h2 = h2[0]+h2[0]+h2[1]+h2[1]+h2[2]+h2[2];
  var r = parseInt(h2.slice(0,2), 16)/255;
  var g2 = parseInt(h2.slice(2,4), 16)/255;
  var b = parseInt(h2.slice(4,6), 16)/255;
  var mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), d = mx - mn;
  var h = 0;
  if (d){
    if (mx === r) h = 60*(((g2 - b)/d) % 6);
    else if (mx === g2) h = 60*(((b - r)/d) + 2);
    else h = 60*(((r - g2)/d) + 4);
  }
  return {h:((h % 360)+360)%360, s: mx ? d/mx : 0, v: mx};
}

function colOf(o){
  if (o && o.c){
    var dark = lum(o.c) < 0.55;
    var op = dark ? '#ffffff' : '#111111';
    return {fill:o.c, line:op, ink:op};
  }
  return PAL[(o && o.p) || 0] || PAL[0];
}

function alphaOf(o){ return (o && o.a !== undefined) ? o.a : 1; }

function dashOf(o){
  var d = o ? o.dash : 0;
  if (d === true) return 2.2;
  return (typeof d === 'number' && d > 0) ? d : 0;
}

function markX(f){ return f * S.iw; }
function markY(f){ return f * S.ih; }

function sheet(){
  var cw = Math.max(1, S.crop.w*S.iw), ch = Math.max(1, S.crop.h*S.ih);
  var p = padPx();
  var bw = Math.max(1, cw + p.l + p.r), bh = Math.max(1, ch + p.t + p.b);
  var o = outNow();
  if (!o) return {w:bw, h:bh, kx:1, ky:1, px:p.l, py:p.t, bw:bw, bh:bh, fw:cw, fh:ch};
  var W = Math.max(1, o.w), H = Math.max(1, o.h);

  var kx = W/cw, ky = H/ch;
  if (S.prop){ var k = Math.min(kx, ky); kx = k; ky = k; }

  var fw = cw*kx, fh = ch*ky;
  return {w: W + (p.l + p.r)*kx, h: H + (p.t + p.b)*ky,
          kx:kx, ky:ky,
          px: p.l*kx + (W - fw)/2, py: p.t*ky + (H - fh)/2,
          bw:bw, bh:bh, fw:fw, fh:fh};
}

function sheetAfter(R){
  if (!R) return sheet();

  var keepC = S.crop;
  S.crop = R;
  var s = sheet();
  S.crop = keepC;
  return s;
}

function sheetOf(R){
  if (!R) return sheet();
  var keep = S.crop;
  S.crop = R;
  var s = sheet();
  S.crop = keep;
  return s;
}

function sheetBox(){
  var iw = Math.max(1, S.iw), ih = Math.max(1, S.ih);
  var s = sheet();
  var kx = s.kx || 1, ky = s.ky || 1;
  var x0 = S.crop.x - (s.px/kx)/iw, y0 = S.crop.y - (s.py/ky)/ih;
  return {x0: x0, y0: y0, x1: x0 + (s.w/kx)/iw, y1: y0 + (s.h/ky)/ih};
}

function roam(){
  var over = 0.2;
  var b = sheetBox();
  return {
    x0: Math.min(-over, b.x0 - over),
    x1: Math.max(1 + over, b.x1 + over),
    y0: Math.min(-over, b.y0 - over),
    y1: Math.max(1 + over, b.y1 + over)
  };
}

function lockPt(ax, ay, px, py, R){
  var iw = Math.max(1, S.iw), ih = Math.max(1, S.ih);
  var dx = (px - ax)*iw, dy = (py - ay)*ih;
  var m = Math.max(Math.abs(dx), Math.abs(dy));
  if (R){

    var lx = (dx < 0 ? ax - R.x0 : R.x1 - ax)*iw;
    var ly = (dy < 0 ? ay - R.y0 : R.y1 - ay)*ih;
    m = Math.min(m, Math.max(0, lx), Math.max(0, ly));
  }
  return [ax + (dx < 0 ? -m : m)/iw, ay + (dy < 0 ? -m : m)/ih];
}

function dragPt(o, ax, ay, px, py, R){
  if (o && o.lock) return lockPt(ax, ay, px, py, R);
  return [clamp(px, R.x0, R.x1), clamp(py, R.y0, R.y1)];
}

function angRad(){ return (S.ang || 0) * Math.PI/180; }

var FOCUS_N = 64;
var FOCUS_MAX = 0.30;
var FOCUS_EPS = 1;

var FOCUS_LAP = 3;

var FOCUS_LIVE = 2;

function focusN(a, w, t, th){
  if (!(w > 0) || (!a && !t && !th)) return 0;
  var k = 1.5/(FOCUS_MAX*Math.pow(4000/FOCUS_N, 2));
  var nA = a ? w*Math.sqrt(k*Math.abs(a)/FOCUS_EPS) : 0;

  var nT = t ? Math.sqrt(Math.abs(t)*w/FOCUS_EPS) : 0;

  var nH = th ? Math.sqrt(Math.abs(th)*w/FOCUS_EPS) : 0;
  return clamp(Math.round(Math.max(nA, nT, nH)), 2, FOCUS_N);
}

function focusA(){ return clamp((S.focus || 0)/100, -1, 1) * FOCUS_MAX; }

var TILT_MAX = 0.20;

function tiltA(){ return clamp((S.tilt || 0)/100, -1, 1) * TILT_MAX; }
function tiltHA(){ return clamp((S.tiltH || 0)/100, -1, 1) * TILT_MAX; }

function tiltMap(x, y, t, th, iw, ih){
  if (!t && !th) return [x, y];
  var cx = iw/2, cy = ih/2;
  var fx = t  ? 1 + t *(2*y/ih - 1) : 1;
  var fy = th ? 1 + th*(2*x/iw - 1) : 1;
  return [cx + (x - cx)*fx, cy + (y - cy)*fy];
}

function focusAt(r, a){ return r*(1 + a*(1 - r*r)); }

function focusFit(a){ return 1 - Math.max(0, a || 0); }

var WARP_EDGE = null;
var WARP_EDGE_N = 128;

function warpEdge(a, t, th){
  var e = WARP_EDGE, iw = S.iw, ih = S.ih;
  if (e && e.a === a && e.t === t && e.th === th && e.iw === iw && e.ih === ih) return e.p;
  var N = WARP_EDGE_N, p = new Array(N), i;
  for (i = 0; i < N; i++){
    var u = i/N*4, sx, sy;
    if (u < 1){ sx = u*iw; sy = 0; }
    else if (u < 2){ sx = iw; sy = (u-1)*ih; }
    else if (u < 3){ sx = (3-u)*iw; sy = ih; }
    else { sx = 0; sy = (4-u)*ih; }

    var q = focusMap(sx, sy, a, iw, ih);
    p[i] = tiltMap(q[0], q[1], t, th, iw, ih);
  }
  WARP_EDGE = {a:a, t:t, th:th, iw:iw, ih:ih, p:p};
  return p;
}

function warpInside(p, px, py){
  if (px < 0 || py < 0 || px > S.iw || py > S.ih) return false;
  var c = false, n = p.length;
  for (var i = 0, j = n - 1; i < n; j = i++){
    var xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi)*(py - yi)/(yj - yi) + xi)) c = !c;
  }
  return c;
}

function warpJoint(b, a, t, th, ang, cx, cy){
  var iw = S.iw, ih = S.ih, p = warpEdge(a, t, th);
  var px = cx*iw, py = cy*ih;
  var co = Math.cos(-ang), si = Math.sin(-ang), M = 32;
  var fit = function(s){
    var hw = s*b.w*iw/2, hh = s*b.h*ih/2;
    for (var i = 0; i <= M; i++){
      var u = i/M;
      var qs = [[-hw + 2*hw*u, -hh], [hw, -hh + 2*hh*u],
                [hw - 2*hw*u, hh], [-hw, hh - 2*hh*u]];
      for (var j = 0; j < 4; j++){
        var qx = qs[j][0], qy = qs[j][1];
        var d = Math.sqrt(qx*qx + qy*qy) || 1;
        qx += qx/d; qy += qy/d;
        if (!warpInside(p, px + qx*co - qy*si, py + qx*si + qy*co)) return false;
      }
    }
    return true;
  };
  var lo = 0.02, hi = 1;
  if (fit(1)) return 1;
  for (var k = 0; k < 18; k++){
    var m = (lo + hi)/2;
    if (fit(m)) lo = m; else hi = m;
  }
  return lo;
}

function warpFit(base, hand){
  var b = base || S.cropRaw;
  var a = focusA(), t = Math.abs(tiltA()), th = Math.abs(tiltHA()), ang = angRad();
  var cx = hand ? (hand.x + hand.w/2) : (b.x + b.w/2);
  var cy = hand ? (hand.y + hand.h/2) : (b.y + b.h/2);
  if (!a && !t && !th){

    return angFit(hand ? {x:hand.x, y:hand.y, w:b.w, h:b.h} : b);
  }

  var k = (ang || th) ? warpJoint(b, a, t ? tiltA() : 0, th ? tiltHA() : 0, ang, cx, cy)
                      : focusFit(a)*(1 - t);
  if (k < 1){
    var w = b.w*k, h = b.h*k;
    return {x: clamp(cx - w/2, 0, Math.max(0, 1 - w)),
            y: clamp(cy - h/2, 0, Math.max(0, 1 - h)),
            w: w, h: h};
  }
  return hand ? {x: hand.x, y: hand.y, w: b.w, h: b.h}
              : {x: b.x, y: b.y, w: b.w, h: b.h};
}

function focusMap(x, y, a, iw, ih){
  if (!a) return [x, y];
  var cx = iw/2, cy = ih/2;
  var dx = (x - cx)/cx, dy = (y - cy)/cy;
  var r = Math.sqrt(dx*dx + dy*dy);
  if (r < 1e-12) return [x, y];
  var f = focusAt(r, a)/r;
  return [cx + dx*f*cx, cy + dy*f*cy];
}

function angFit(base){
  var b = base || S.crop;
  var a = angRad();

  if (!a) return {x:b.x, y:b.y, w:b.w, h:b.h};
  var iw = S.iw, ih = S.ih;
  var cx = (b.x + b.w/2)*iw, cy = (b.y + b.h/2)*ih;
  var hw = b.w*iw/2, hh = b.h*ih/2;
  var co = Math.cos(-a), si = Math.sin(-a);
  var s = 1, k;
  var qs = [[-hw,-hh], [hw,-hh], [hw,hh], [-hw,hh]];
  for (var i = 0; i < 4; i++){
    var dx = qs[i][0]*co - qs[i][1]*si;
    var dy = qs[i][0]*si + qs[i][1]*co;
    if (dx > 1e-9){ k = (iw - cx)/dx; if (k < s) s = k; }
    else if (dx < -1e-9){ k = cx/(-dx); if (k < s) s = k; }
    if (dy > 1e-9){ k = (ih - cy)/dy; if (k < s) s = k; }
    else if (dy < -1e-9){ k = cy/(-dy); if (k < s) s = k; }
  }
  s = clamp(s, 0.02, 1);
  var w = b.w*s, h = b.h*s;
  return {x: cx/iw - w/2, y: cy/ih - h/2, w: w, h: h};
}

function angMatrix(kx, ky, ox, oy){
  var a = angRad();
  if (!a) return [kx, 0, 0, ky, ox, oy];

  var cxp = (S.crop.x + S.crop.w/2)*S.iw, cyp = (S.crop.y + S.crop.h/2)*S.ih;
  var co = Math.cos(a), si = Math.sin(a);

  var A = kx*co,  B = ky*si;
  var C = -kx*si, D = ky*co;
  var E = ox + kx*(cxp - cxp*co + cyp*si);
  var F = oy + ky*(cyp - cxp*si - cyp*co);
  return [A, B, C, D, E, F];
}

function warpFwd(x, y){
  var a = focusA(), t = tiltA(), th = tiltHA();
  if (!a && !t && !th) return [x, y];
  var q = focusMap(x, y, a, S.iw, S.ih);
  return tiltMap(q[0], q[1], t, th, S.iw, S.ih);
}

function warpBack(x, y){
  var a = focusA(), t = tiltA(), th = tiltHA();
  if (!a && !t && !th) return [x, y];
  var cx = S.iw/2, cy = S.ih/2, i;
  var px = x, py = y;
  if (t || th){
    for (i = 0; i < 4; i++){
      var fx = t  ? 1 + t *(2*py/S.ih - 1) : 1;
      var fy = th ? 1 + th*(2*px/S.iw - 1) : 1;
      px = cx + (x - cx)/fx;
      py = cy + (y - cy)/fy;
    }
  }
  if (!a) return [px, py];
  var dx = (px - cx)/cx, dy = (py - cy)/cy;
  var R = Math.sqrt(dx*dx + dy*dy);
  if (R < 1e-12) return [px, py];
  var hi = (a > 0) ? Math.sqrt((1 + a)/(3*a)) : 2.5, lo = 0;
  for (i = 0; i < 16; i++){
    var m = (lo + hi)/2;
    if (focusAt(m, a) < R) lo = m; else hi = m;
  }
  var k = ((lo + hi)/2)/R;
  return [cx + dx*k*cx, cy + dy*k*cy];
}

function angPt(x, y, sign){
  var a = angRad();
  if (!a) return [x, y];
  var cx = (S.crop.x + S.crop.w/2)*S.iw, cy = (S.crop.y + S.crop.h/2)*S.ih;
  var co = Math.cos(sign*a), si = Math.sin(sign*a);
  var dx = x - cx, dy = y - cy;
  return [cx + dx*co - dy*si, cy + dx*si + dy*co];
}

function toSheet(x, y){
  var s = sheet();
  var q = angPt.apply(null, warpFwd(x, y).concat([1]));
  return [(q[0] - S.crop.x*S.iw)*s.kx + s.px, (q[1] - S.crop.y*S.ih)*s.ky + s.py];
}

function toScreen(x, y){
  var p = toSheet(x, y);
  return [p[0]*V.s + V.ox, p[1]*V.s + V.oy];
}

function toImage(x, y){
  var s = sheet();
  var sx = (x - V.ox)/V.s, sy = (y - V.oy)/V.s;
  var q = angPt((sx - s.px)/s.kx + S.crop.x*S.iw, (sy - s.py)/s.ky + S.crop.y*S.ih, -1);
  return warpBack(q[0], q[1]);
}

function segDist(px, py, x1, y1, x2, y2){
  var dx = x2-x1, dy = y2-y1;
  var L = dx*dx + dy*dy;
  var t = L ? ((px-x1)*dx + (py-y1)*dy) / L : 0;
  t = clamp(t, 0, 1);
  var qx = x1 + t*dx, qy = y1 + t*dy;
  return Math.hypot(px-qx, py-qy);
}

function fontOf(o){ return Math.max(6, o.size * Math.min(S.iw, S.ih)); }

function wrap(c, text, maxw){
  var out = [];
  var paras = String(text === undefined || text === null ? '' : text).split('\n');
  for (var p = 0; p < paras.length; p++){
    var words = paras[p].split(/\s+/).filter(Boolean);
    if (!words.length){ out.push(''); continue; }
    var line = '';
    for (var i = 0; i < words.length; i++){
      var w = words[i];

      while (c.measureText(w).width > maxw && w.length > 1){
        var k = 1;
        while (k < w.length && c.measureText(w.slice(0, k+1)).width <= maxw) k++;
        if (line) { out.push(line); line = ''; }
        out.push(w.slice(0, k));
        w = w.slice(k);
      }
      var t = line ? line + ' ' + w : w;
      if (!line || c.measureText(t).width <= maxw) line = t;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

function shown(o){ return (o.text && o.text.length) ? o.text : '\u2026'; }

function unit(){ return Math.min(S.iw, S.ih); }
function boxed(o){ return !!o && o.kind === 'plate' && o.bw !== undefined && o.bh !== undefined; }

var FONT_FLOOR = 0.5;

function plateInner(W, H, f){ return {w: W - f*1.0, h: H - f*0.62}; }

function layout(c, o, maxw, f){
  if (f === undefined) f = fontOf(o);
  if (maxw === undefined) maxw = S.iw * 0.62;
  c.font = '700 ' + f + 'px sans-serif';
  var lines = wrap(c, shown(o), Math.max(1, maxw));
  var w = 0;
  for (var i = 0; i < lines.length; i++) w = Math.max(w, c.measureText(lines[i]).width);
  var lh = f * 1.22;
  return {f:f, lines:lines, w:w, h:lines.length*lh, lh:lh};
}

function plateLay(c, o, W, H){
  var f0 = fontOf(o), L = null;
  for (var i = 0; i <= 10; i++){
    var f = f0 * (1 - (1 - FONT_FLOOR)*i/10);
    var in0 = plateInner(W, H, f);
    L = layout(c, o, in0.w, f);
    if (L.h <= in0.h) return L;
  }
  return L;
}

function plateFits(c, o, W, H){
  var f = fontOf(o) * FONT_FLOOR;
  var in0 = plateInner(W, H, f);
  if (in0.w < f*0.6 || in0.h < f*1.0) return false;
  return layout(c, o, in0.w, f).h <= in0.h;
}

function bodyOf(c, o){
  if (boxed(o)){
    var Wb = o.bw*unit(), Hb = o.bh*unit();
    var Lb = plateLay(c, o, Wb, Hb);
    var rb = (o.r === undefined ? 0.35 : o.r);
    return {L:Lb, cx:markX(o.x), cy:markY(o.y), w:Wb, h:Hb, r: rb * Math.min(Wb, Hb) / 2};
  }
  var L = layout(c, o);
  var cx = markX(o.x), cy = markY(o.y);
  if (o.kind === 'bubble'){

    return {L:L, cx:cx, cy:cy,
            rx: (L.w/2 + L.f*0.30) * 1.42,
            ry: (L.h/2 + L.f*0.22) * 1.45};
  }
  if (o.kind === 'plate'){
    var w = L.w + L.f*1.0, h = L.h + L.f*0.62;
    var rr = (o.r === undefined ? 0.35 : o.r);
    return {L:L, cx:cx, cy:cy, w:w, h:h, r: rr * Math.min(w, h) / 2};
  }
  return {L:L, cx:cx, cy:cy, w:L.w, h:L.h};
}

function hit(c, o, x, y){
  if (o && o.rot){ var q = unrot(o, x, y); x = q[0]; y = q[1]; }
  if (isImg(o)){
    var b = imgBox(o);
    return Math.abs(x - b.cx) <= b.w/2 && Math.abs(y - b.cy) <= b.h/2;
  }
  if (isShape(o)){
    var x1 = Math.min(o.x, o.tx)*S.iw, x2 = Math.max(o.x, o.tx)*S.iw;
    var y1 = Math.min(o.y, o.ty)*S.ih, y2 = Math.max(o.y, o.ty)*S.ih;

    var m = Math.max(lineW(o) * 1.5, 14 / Math.max(V.s, 1e-6));
    if (o.kind === 'line') return segDist(x, y, markX(o.x), markY(o.y), markX(o.tx), markY(o.ty)) <= m;

    if (typeof shapePath === 'function' && c && c.isPointInStroke){
      var pth = shapePath(o);
      var lwWas = c.lineWidth;
      c.lineWidth = m*2;
      var got = c.isPointInStroke(pth, x, y) ||
                ((o.fill || o.blur) && c.isPointInPath && c.isPointInPath(pth, x, y));
      c.lineWidth = lwWas;
      if (got) return true;

      var tiny = (x2 - x1) < m*3 || (y2 - y1) < m*3;
      if (tiny) return x >= x1-m && x <= x2+m && y >= y1-m && y <= y2+m;
      return false;
    }

    if (o.fill) return x >= x1-m && x <= x2+m && y >= y1-m && y <= y2+m;
    var inside = x >= x1-m && x <= x2+m && y >= y1-m && y <= y2+m;
    var deep = x >= x1+m && x <= x2-m && y >= y1+m && y <= y2-m;
    return inside && !deep;
  }
  if (o.kind === 'arrow'){
    var f = fontOf(o);
    return segDist(x, y, markX(o.x), markY(o.y), markX(o.tx), markY(o.ty)) <= f*0.55;
  }
  var B = bodyOf(c, o);
  if (o.kind === 'bubble'){
    var a = (x-B.cx)/B.rx, b = (y-B.cy)/B.ry;
    return a*a + b*b <= 1;
  }
  var w = (o.kind === 'plate' ? B.w : B.L.w) + B.L.f*0.4;
  var h = (o.kind === 'plate' ? B.h : B.L.h) + B.L.f*0.4;
  return Math.abs(x-B.cx) <= w/2 && Math.abs(y-B.cy) <= h/2;
}

function hitGrab(c, o, x, y){
  if (!o) return false;
  if (o && o.rot){ var q = unrot(o, x, y); x = q[0]; y = q[1]; }
  if (!isShape(o)) return hit(c, o, x, y);
  var m = Math.max(lineW(o) * 1.5, 14 / Math.max(V.s, 1e-6));
  if (o.kind === 'line')
    return segDist(x, y, markX(o.x), markY(o.y), markX(o.tx), markY(o.ty)) <= m*2;
  if (typeof shapePath === 'function' && c && c.isPointInPath){
    var pth = shapePath(o);
    if (c.isPointInPath(pth, x, y)) return true;
  }
  var x1 = Math.min(o.x, o.tx)*S.iw, x2 = Math.max(o.x, o.tx)*S.iw;
  var y1 = Math.min(o.y, o.ty)*S.ih, y2 = Math.max(o.y, o.ty)*S.ih;
  return x >= x1-m && x <= x2+m && y >= y1-m && y <= y2+m;
}

function pick(c, x, y, f){
  for (var i = S.objs.length - 1; i >= 0; i--){
    var o = S.objs[i];
    if (f && !f(o)) continue;
    if (hit(c, o, x, y)) return i;
  }
  return -1;
}

function isDrawn(o){ return isShape(o) || (o && o.kind === 'arrow'); }

function isImg(o){ return o && o.kind === 'img'; }

var SHAPES = {line:1, rect:1, oval:1, tri:1, diam:1, hex:1, star:1, arc:1};

function isShape(o){ return !!(o && SHAPES[o.kind]); }

function hasTail(o){
  return o && (o.kind === 'bubble' || o.kind === 'arrow' || isShape(o));
}

function ownFace(o){ return !!o && !isDrawn(o); }

var IMGS = {};

function objCenter(o){
  if (isShape(o)) return [(o.x + o.tx)/2*S.iw, (o.y + o.ty)/2*S.ih];
  return [markX(o.x), markY(o.y)];
}

function rotPt(px, py, cx, cy, deg){
  var a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  var dx = px - cx, dy = py - cy;
  return [cx + dx*c - dy*s, cy + dx*s + dy*c];
}

function unrot(o, x, y){
  if (!o || !o.rot) return [x, y];
  var c = objCenter(o);
  return rotPt(x, y, c[0], c[1], -o.rot);
}

function hasBody(o){
  if (!o || !isShape(o)) return false;
  if (o.kind === 'line') return false;
  if (o.blur && typeof canBlur === 'function' && canBlur(o)) return true;
  return !!o.fill;
}

var W_MIN = 0.002;
function wFloor(o){ return hasBody(o) ? 0 : W_MIN; }

function lineW(o){
  var w = (o && o.w !== undefined) ? o.w : 0.01;
  if (w <= 0) return hasBody(o) ? 0 : 1;
  return Math.max(1, w * Math.min(S.iw, S.ih));
}

function imgBox(o){
  var im = IMGS[o.n];
  var ar = (im && im.naturalHeight) ? (im.naturalWidth/im.naturalHeight) : 1;
  var w = (o.w || 0.4) * S.iw;
  return {cx:markX(o.x), cy:markY(o.y), w:w, h:w/ar, ar:ar};
}

function sizeHandle(c, o){
  if (isImg(o)){
    var b = imgBox(o);
    return [b.cx + b.w/2, b.cy + b.h/2];
  }
  if (isShape(o)){
    return [Math.min(o.x, o.tx)*S.iw, Math.max(o.y, o.ty)*S.ih];
  }
  if (o.kind === 'arrow'){
    var mx = (o.x + o.tx)/2*S.iw, my = (o.y + o.ty)/2*S.ih;
    return [mx, my + fontOf(o)*0.9];
  }
  var B = bodyOf(c, o);
  var hw = (o.kind === 'bubble') ? B.rx : (o.kind === 'plate' ? B.w/2 : B.L.w/2);
  var hh = (o.kind === 'bubble') ? B.ry : (o.kind === 'plate' ? B.h/2 : B.L.h/2);
  return [B.cx + hw*0.86, B.cy + hh*0.86];
}

function cornerPt(o, second){
  var p = second ? [markX(o.tx), markY(o.ty)] : [markX(o.x), markY(o.y)];
  if (o.rot){ var c = objCenter(o); p = rotPt(p[0], p[1], c[0], c[1], o.rot); }
  return toScreen(p[0], p[1]);
}

function shapeBox(o){
  return {x1:Math.min(o.x, o.tx)*S.iw, x2:Math.max(o.x, o.tx)*S.iw,
          y1:Math.min(o.y, o.ty)*S.ih, y2:Math.max(o.y, o.ty)*S.ih};
}

function movePt(o){
  var b = shapeBox(o);
  var p = [b.x1, b.y2];
  if (o.rot){ var c = objCenter(o); p = rotPt(p[0], p[1], c[0], c[1], o.rot); }
  var s = toScreen(p[0], p[1]);
  var m = toScreen((b.x1+b.x2)/2, (b.y1+b.y2)/2);
  var dx = s[0]-m[0], dy = s[1]-m[1], L = Math.hypot(dx, dy);
  if (L < 1){ dx = -0.7; dy = 0.7; L = 1; }
  return [s[0] + dx/L*26, s[1] + dy/L*26];
}

function sizeHandleScreen(c, o){
  var p = sizeHandle(c, o);
  if (o.rot){ var q = objCenter(o); p = rotPt(p[0], p[1], q[0], q[1], o.rot); }
  var s = toScreen(p[0], p[1]);
  var k = toScreen(markX(o.x), markY(o.y));
  var dx = s[0]-k[0], dy = s[1]-k[1];
  var L = Math.hypot(dx, dy);
  if (L < 1){ dx = 0.7; dy = 0.7; L = 1; }
  return [s[0] + dx/L*20, s[1] + dy/L*20];
}
