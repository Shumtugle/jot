'use strict';

var cv, ctx;
var BG = '#000';
var INK = '#f2f2f4';

function selOut(){
  if (S.sel < 0 || S.sel >= S.objs.length) return null;
  var o = S.objs[S.sel];
  if (typeof ownScreen === 'function' && !ownScreen(o)) return null;
  var sh = sheet();
  var b, x1, y1, x2, y2;
  if (isImg(o)){
    b = imgBox(o);
    x1 = b.cx - b.w/2; x2 = b.cx + b.w/2; y1 = b.cy - b.h/2; y2 = b.cy + b.h/2;
  } else if (isShape(o) || o.kind === 'arrow'){
    x1 = Math.min(o.x, o.tx)*S.iw; x2 = Math.max(o.x, o.tx)*S.iw;
    y1 = Math.min(o.y, o.ty)*S.ih; y2 = Math.max(o.y, o.ty)*S.ih;
  } else {
    b = bodyOf(measurer(), o);
    var hw = (o.kind === 'bubble' ? b.rx : (b.w ? b.w/2 : b.L.w/2));
    var hh = (o.kind === 'bubble' ? b.ry : (b.h ? b.h/2 : b.L.h/2));
    x1 = b.cx - hw; x2 = b.cx + hw; y1 = b.cy - hh; y2 = b.cy + hh;
  }

  var px = sh.px, py = sh.py;
  x1 = px + (x1 - S.crop.x*S.iw)*sh.kx; x2 = px + (x2 - S.crop.x*S.iw)*sh.kx;
  y1 = py + (y1 - S.crop.y*S.ih)*sh.ky; y2 = py + (y2 - S.crop.y*S.ih)*sh.ky;
  if (x1 >= 0 && y1 >= 0 && x2 <= sh.w && y2 <= sh.h) return null;
  return {x1:Math.min(0, x1), y1:Math.min(0, y1),
          x2:Math.max(sh.w, x2), y2:Math.max(sh.h, y2)};
}

function fitCalc(whole){
  var keep = null;
  if (whole){ keep = S.crop; S.crop = {x:0, y:0, w:1, h:1}; }
  var r = fitMeasure(whole);
  if (keep) S.crop = keep;
  return r;
}

var RAIL_Q = '(min-aspect-ratio: 3/2)';
function railOn(){
  return typeof matchMedia === 'function' && matchMedia(RAIL_Q).matches;
}

function panelRight(){
  if (!railOn()) return 0;
  var w = 0;
  if (typeof document !== 'undefined'){
    var cb = document.getElementById('cmd');
    if (cb && !cb.classList.contains('hide')) w = cb.offsetWidth || 0;
  }
  return w || 232;
}

function topGap(){ return (S.mode === 'view' || railOn()) ? 0 : cssNum('--topBar', 52); }

function fitMeasure(whole){
  var cw = cv.clientWidth, ch = cv.clientHeight;
  var pad = (S.mode === 'view') ? 0 : 10;
  var top = topGap();
  var bot = (S.mode === 'view') ? 0 : panelBottom();

  var right = (S.mode === 'view') ? 0 : panelRight();
  var aw = Math.max(40, cw - pad*2 - right), ah = Math.max(40, ch - top - bot);
  var sh = sheet();
  if (!sh.w || !sh.h) return;

  var u = (S.mode === 'view') ? null : selOut();
  var uw = u ? (u.x2 - u.x1) : sh.w, uh = u ? (u.y2 - u.y1) : sh.h;
  var s = Math.min(aw/uw, ah/uh);
  var ox = pad + (aw - uw*s)/2 - (u ? u.x1*s : 0);

  var oy = (S.mode === 'view') ? (top + (ah - uh*s)/2 - (u ? u.y1*s : 0))
                               : (top - (u ? u.y1*s : 0));
  return {s:s, ox:ox, oy:oy, ah:ah};
}

function fit(){
  var f = fitCalc(false);
  if (!f) return;
  V.s = f.s; V.ox = f.ox; V.oy = f.oy; V.ah = f.ah;

  if (typeof pagerPlace === 'function') pagerPlace();
}

function fitOff(){
  if (noSheet() || !cv) return false;

  if (typeof S.zoomOn !== 'undefined' && S.zoomOn) return false;

  var f = fitCalc(false);
  if (!f) return false;
  var d = Math.max(Math.abs(V.ox - f.ox), Math.abs(V.oy - f.oy));
  return (Math.abs(V.s - f.s) > f.s*0.01) || (d > 1.5);
}

function viewStill(){
  if (S.mode !== 'view') return false;
  var f = fitCalc(false);
  if (!f) return true;
  return V.s <= f.s*1.01;
}

function fitWide(){
  var cw = cv.clientWidth;
  var pad = 10, top = topGap();
  var sh = sheet();
  if (!sh.w || !sh.h) return;
  var aw = Math.max(40, cw - pad*2 - ((S.mode === 'view') ? 0 : panelRight()));
  V.s = aw/sh.w;
  V.ox = pad;
  V.oy = top;
  V.ah = Math.max(40, cv.clientHeight - top - panelBottom());
  if (typeof pagerPlace === 'function') pagerPlace();
}

function reflow(){
  if (noSheet()) return;
  var ch = cv.clientHeight;

  var top = topGap();
  var bot = (S.mode === 'view') ? 0 : panelBottom();
  var ah = Math.max(40, ch - top - bot);
  if (V.ah) V.oy += (ah - V.ah)/2;
  V.ah = ah;
  if (typeof clampView === 'function') clampView();
  if (typeof pagerPlace === 'function') pagerPlace();
}

var FOOTH = 0;

function panelBottom(){

  if (railOn()) return 0;
  if (!FOOTH && typeof document !== 'undefined'){
    var f = document.querySelector('#draw .row.foot');
    if (f && f.offsetHeight) FOOTH = f.offsetHeight + 30;
  }

  var cmdH = 0;
  if (typeof document !== 'undefined'){
    var cb = document.getElementById('cmd');
    if (cb && !cb.classList.contains('hide')) cmdH = cb.offsetHeight || 0;
  }
  return (FOOTH || 58) + cmdH;
}

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width  = Math.max(1, Math.round(cv.clientWidth  * DPR));
  cv.height = Math.max(1, Math.round(cv.clientHeight * DPR));
}

function canvasFits(){
  if (!cv || !cv.clientWidth) return true;
  var w = Math.max(1, Math.round(cv.clientWidth  * DPR)),
      h = Math.max(1, Math.round(cv.clientHeight * DPR));
  return cv.width === w && cv.height === h;
}

function roundRect(p, x, y, w, h, r){
  r = Math.max(0, Math.min(r, w/2, h/2));
  if (p.arcTo){
    p.moveTo(x+r, y);
    p.arcTo(x+w, y,   x+w, y+h, r);
    p.arcTo(x+w, y+h, x,   y+h, r);
    p.arcTo(x,   y+h, x,   y,   r);
    p.arcTo(x,   y,   x+w, y,   r);
    p.closePath();
    return;
  }

  p.moveTo(x+r, y);
  p.lineTo(x+w-r, y);  p.quadraticCurveTo(x+w, y, x+w, y+r);
  p.lineTo(x+w, y+h-r); p.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  p.lineTo(x+r, y+h);   p.quadraticCurveTo(x, y+h, x, y+h-r);
  p.lineTo(x, y+r);     p.quadraticCurveTo(x, y, x+r, y);
  p.closePath();
}

function bubblePath(p, B, o){
  var tx = markX(o.tx), ty = markY(o.ty);
  var dx = tx - B.cx, dy = ty - B.cy;
  var len = Math.hypot(dx, dy);
  if (len < Math.min(B.rx, B.ry)*1.15){
    p.ellipse(B.cx, B.cy, B.rx, B.ry, 0, 0, Math.PI*2);
    return;
  }
  var t = Math.atan2(dy/B.ry, dx/B.rx);
  var d = 0.40;

  p.ellipse(B.cx, B.cy, B.rx, B.ry, 0, t + d, t - d + Math.PI*2);
  p.lineTo(tx, ty);
  p.closePath();
}

function drawArrow(c, o, P){
  var x1 = markX(o.x), y1 = markY(o.y), x2 = markX(o.tx), y2 = markY(o.ty);

  var f = (o.w !== undefined) ? Math.max(2, o.w*4*Math.min(S.iw, S.ih)) : fontOf(o);
  var dx = x2-x1, dy = y2-y1;
  var len = Math.hypot(dx, dy) || 1;
  var ux = dx/len, uy = dy/len, nx = -uy, ny = ux;
  var aw = f*0.17, hw = f*0.46, hl = Math.min(len*0.55, f*0.95);
  var bx = x2 - ux*hl, by = y2 - uy*hl;
  var p = new Path2D();
  p.moveTo(x1+nx*aw, y1+ny*aw);
  p.lineTo(bx+nx*aw, by+ny*aw);
  p.lineTo(bx+nx*hw, by+ny*hw);
  p.lineTo(x2, y2);
  p.lineTo(bx-nx*hw, by-ny*hw);
  p.lineTo(bx-nx*aw, by-ny*aw);
  p.lineTo(x1-nx*aw, y1-ny*aw);
  p.closePath();
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.globalAlpha = alphaOf(o);
  c.lineWidth = f*0.13; c.strokeStyle = P.line; c.stroke(p);
  c.fillStyle = P.fill; c.fill(p);
  c.globalAlpha = 1;
}

var _atop = null;
function atopLayer(c, mode, paint){
  var cv = c.canvas;
  if (!cv || !cv.width || !cv.height) return;
  if (!_atop) _atop = document.createElement('canvas');
  if (_atop.width !== cv.width || _atop.height !== cv.height){
    _atop.width = cv.width; _atop.height = cv.height;
  }
  var s = _atop.getContext('2d');
  if (!s) return;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'source-over';
  s.clearRect(0, 0, _atop.width, _atop.height);

  var m = c.getTransform ? c.getTransform() : null;
  s.save();
  if (m) s.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  paint(s);
  s.restore();

  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'destination-in';
  s.drawImage(cv, 0, 0);
  s.globalCompositeOperation = 'source-over';

  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = mode;
  c.drawImage(_atop, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.restore();
}

function blurThrough(c, o, p, l, t, r, b){
  if (noSheet()) return false;
  var w = r - l, h = b - t;
  if (!(w > 1 && h > 1)) return false;
  var rad = Math.max(1, Math.min(w, h) * 0.18);
  var pad = rad * 3;
  var sx = Math.max(0, l - pad), sy = Math.max(0, t - pad);
  var ex = Math.min(S.iw, r + pad), ey = Math.min(S.ih, b + pad);
  if (!(ex > sx && ey > sy)) return false;

  var k = 1;
  if (c.getTransform){
    var m = c.getTransform();
    k = Math.hypot(m.a, m.b) || 1;
  }

  atopLayer(c, 'source-over', function(s){
    s.save();
    s.clip(p);
    s.filter = 'blur(' + (Math.round(rad*k*100)/100) + 'px)';
    try { s.drawImage(S.img, sx, sy, ex-sx, ey-sy, sx, sy, ex-sx, ey-sy); }
    catch(_){ errOnce('blurDraw', logT('blurDraw')); }
    s.filter = 'none';
    s.restore();
  });
  return true;
}

function canBlur(o){
  if (!o || !isShape(o)) return false;
  if (o.kind === 'line') return false;
  if (o.kind === 'arc' && !o.fill) return false;
  return true;
}

function shapeInto(p, o, x1, y1, x2, y2, l, t, r, b, cx, cy, rx, ry){
  if (o.kind === 'line'){ p.moveTo(x1, y1); p.lineTo(x2, y2); }

  else if (o.kind === 'rect'){
    var rw = Math.abs(r-l), rh = Math.abs(b-t);
    var rr = (o.rnd || 0) * Math.min(rw, rh) / 2;
    if (rr > 0.5) p.addPath(frameShape(Math.min(l, r), Math.min(t, b), rw, rh, o.rnd || 0));
    else p.rect(l, t, r-l, b-t);
  }
  else if (o.kind === 'tri'){ p.moveTo(cx, t); p.lineTo(r, b); p.lineTo(l, b); p.closePath(); }

  else if (o.kind === 'diam'){
    p.moveTo(cx, t); p.lineTo(r, cy); p.lineTo(cx, b); p.lineTo(l, cy); p.closePath();
  }
  else if (o.kind === 'hex'){

    for (var hv = 0; hv < 6; hv++){
      var ha = hv*Math.PI/3;
      var hx = cx + Math.cos(ha)*rx, hy = cy + Math.sin(ha)*ry;
      if (hv) p.lineTo(hx, hy); else p.moveTo(hx, hy);
    }
    p.closePath();
  }
  else if (o.kind === 'star'){

    for (var v = 0; v < 10; v++){
      var ang = -Math.PI/2 + v*Math.PI/5;
      var kk = (v % 2) ? 0.382 : 1;
      var px = cx + Math.cos(ang)*rx*kk, py = cy + Math.sin(ang)*ry*kk;
      if (v) p.lineTo(px, py); else p.moveTo(px, py);
    }
    p.closePath();
  }
  else if (o.kind === 'arc'){

    p.ellipse(cx, b, rx, (b-t), 0, Math.PI, 2*Math.PI);
  }
  else { p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); }
}

function shapePath(o){
  var p = new Path2D();
  var x1 = markX(o.x), y1 = markY(o.y), x2 = markX(o.tx), y2 = markY(o.ty);
  var l = Math.min(x1,x2), t = Math.min(y1,y2), r = Math.max(x1,x2), b = Math.max(y1,y2);
  var cx = (l+r)/2, cy = (t+b)/2, rx = (r-l)/2, ry = (b-t)/2;
  shapeInto(p, o, x1, y1, x2, y2, l, t, r, b, cx, cy, rx, ry);
  return p;
}

function drawShape(c, o, P){
  var al = alphaOf(o);
  var x1 = markX(o.x), y1 = markY(o.y), x2 = markX(o.tx), y2 = markY(o.ty);
  var lw = lineW(o);

  if (lw > 0){ c.lineWidth = lw; }
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = P.fill;
  var dsh = dashOf(o);
  if (dsh && lw > 0) c.setLineDash([lw*dsh, lw*dsh]);
  var p = new Path2D();
  var l = Math.min(x1,x2), t = Math.min(y1,y2), r = Math.max(x1,x2), b = Math.max(y1,y2);
  var cx = (l+r)/2, cy = (t+b)/2, rx = (r-l)/2, ry = (b-t)/2;
  shapeInto(p, o, x1, y1, x2, y2, l, t, r, b, cx, cy, rx, ry);

  if (o.blur && canBlur(o) && blurThrough(c, o, p, l, t, r, b)){
    if (lw > 0){
      c.globalAlpha = al * 0.5;
      c.lineWidth = Math.max(1, lw * 0.4);
      c.stroke(p);
      c.globalAlpha = 1;
    }
    c.setLineDash([]);
    return;
  }

  if (o.fill && o.kind !== 'line'){
    c.globalAlpha = al;
    c.fillStyle = P.fill;
    c.fill(p);
  }
  if (lw > 0){
    c.globalAlpha = al;
    c.stroke(p);
    c.globalAlpha = 1;
  }
  c.setLineDash([]);
}

var WARP_LAY = null;

function drawObj(c, o){
  if (o.rot || o.mir){
    var q = objCenter(o);
    c.save();
    c.translate(q[0], q[1]);
    if (o.rot) c.rotate(o.rot*Math.PI/180);
    if (o.mir) c.scale(-1, 1);
    c.translate(-q[0], -q[1]);
    drawObjBody(c, o);
    c.restore();
    return;
  }
  drawObjBody(c, o);
}

function drawObjBody(c, o){
  if (isImg(o)){
    var im = IMGS[o.n];
    if (!im) return;
    var b = imgBox(o);
    c.globalAlpha = alphaOf(o);
    c.drawImage(im, b.cx - b.w/2, b.cy - b.h/2, b.w, b.h);
    c.globalAlpha = 1;
    return;
  }
  var P = colOf(o);
  if (isShape(o)){ drawShape(c, o, P); return; }
  if (o.kind === 'arrow'){ drawArrow(c, o, P); return; }

  var B = bodyOf(c, o);
  c.lineJoin = 'round'; c.lineCap = 'round';

  if (o.kind !== 'text'){
    var p = new Path2D();
    if (o.kind === 'bubble') bubblePath(p, B, o);
    else roundRect(p, B.cx-B.w/2, B.cy-B.h/2, B.w, B.h, B.r);

    var a = (o.a === undefined) ? 1 : o.a;
    c.globalAlpha = a;
    c.fillStyle = P.fill; c.fill(p);
    c.globalAlpha = 1;
    c.lineWidth = B.L.f*0.15;
    c.strokeStyle = P.line; c.stroke(p);
  }

  c.font = '700 ' + B.L.f + 'px sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  var top = B.cy - B.L.h/2 + B.L.lh/2;
  var al2 = alphaOf(o);
  c.globalAlpha = (!o.text || !o.text.length) ? al2*0.45 : (o.kind === 'text' ? al2 : 1);
  for (var i = 0; i < B.L.lines.length; i++){
    var y = top + i*B.L.lh;
    if (o.kind === 'text'){
      c.lineWidth = B.L.f*0.24; c.strokeStyle = P.line;
      c.strokeText(B.L.lines[i], B.cx, y);
      c.fillStyle = P.fill;
    } else {
      c.fillStyle = P.ink;
    }
    c.fillText(B.L.lines[i], B.cx, y);
  }
  c.globalAlpha = 1;
}

var _grid = null, _gridKey = '', _gridCtx = null;

function deskTone(){
  var v = (cfg && typeof cfg.desk === 'number') ? cfg.desk : 0;
  return clamp(Math.round(v), 0, 100);
}

function deskHex(v){
  var n = Math.round(clamp(v, 0, 100) * 2.55);
  var h = (n < 16 ? '0' : '') + n.toString(16);
  return '#' + h + h + h;
}

function paperGrid(c){
  var tone = deskTone();
  var base = deskHex(tone);
  var t1 = tone > 50 ? '#000000' : '#ffffff';
  var key = base + '|' + t1;

  if (_grid && _gridKey === key && _gridCtx === c) return _grid;
  var t = document.createElement('canvas');
  t.width = 40; t.height = 40;
  var q = t.getContext('2d');
  q.fillStyle = base; q.fillRect(0, 0, 40, 40);
  q.strokeStyle = t1;
  q.globalAlpha = 0.16;
  q.lineWidth = 1;
  for (var i = 8; i < 40; i += 8){
    q.beginPath(); q.moveTo(i+0.5, 0); q.lineTo(i+0.5, 40); q.stroke();
    q.beginPath(); q.moveTo(0, i+0.5); q.lineTo(40, i+0.5); q.stroke();
  }

  q.globalAlpha = 0.30;
  q.beginPath(); q.moveTo(0.5, 0); q.lineTo(0.5, 40);
  q.moveTo(0, 0.5); q.lineTo(40, 0.5); q.stroke();
  _grid = c.createPattern(t, 'repeat');
  _gridKey = key; _gridCtx = c;
  return _grid;
}

function checker(c){ return paperGrid(c); }

function bgAlpha(){ return Math.max(0, Math.min(1, S.bgA === undefined ? 1 : S.bgA)); }

function bgHex(){
  var h = (S.bg || '#ffffff').replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return '#' + (/^[0-9a-fA-F]{6}$/.test(h) ? h : 'ffffff');
}

function bgFill(){
  var a = bgAlpha();
  var h = (S.bg || '#ffffff').replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2), 16) || 0, g = parseInt(h.slice(2,4), 16) || 0,
      b = parseInt(h.slice(4,6), 16) || 0;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function bgFlat(){ return false; }

function frameShape(x, y, w, h, m){
  var p = new Path2D();
  if (m >= 0.995){ p.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2); return p; }
  roundRect(p, x, y, w, h, m * Math.min(w, h) / 2);
  return p;
}

var LOUPE_R = 52, LOUPE_K = 1.5, LOUPE_LIFT = 78;

function srcPerPoint(){
  var sh = sheet();
  var k = V.s * Math.min(sh.kx || 1, sh.ky || 1);
  return (k > 0) ? (1/k) : 1;
}

var _lens = null;
function lensCanvas(d){
  if (!_lens) _lens = document.createElement('canvas');
  if (_lens.width !== d){ _lens.width = d; _lens.height = d; }
  return _lens;
}

function loupePoint(x, y){
  var up = (y - LOUPE_LIFT - LOUPE_R > 6);
  return [x, y + (up ? -LOUPE_LIFT : LOUPE_LIFT), up];
}

function drawLoupe(x, y, col){
  if (noSheet()) return;
  var r = LOUPE_R;
  var lp = loupePoint(x, y);
  var up = lp[2];
  var cx = lp[0], cy = lp[1];
  var q = toImage(cx, cy);
  var half = (r/LOUPE_K) * srcPerPoint();

  var d = Math.max(2, Math.round(r*2*DPR));
  var lens = lensCanvas(d);
  var g = lens.getContext('2d');
  var k = (d/2)/half;
  var LX = function(ix){ return (ix - q[0])*k + d/2; };
  var LY = function(iy){ return (iy - q[1])*k + d/2; };
  var b = maskBox();
  var sx = LX(b.x0), sy = LY(b.y0), sw = b.w*k, sh = b.h*k;
  var fx = LX(S.crop.x*S.iw), fy = LY(S.crop.y*S.ih);
  var fw = S.crop.w*S.iw*k, fh = S.crop.h*S.ih*k;

  try {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, d, d);

    var cvp = EYEPX && EYEPX.canvas ? EYEPX.canvas : null;
    if (cvp){
      var kx2 = EYEPX.width/Math.max(1, b.w), ky2 = EYEPX.height/Math.max(1, b.h);
      g.imageSmoothingEnabled = false;
      g.drawImage(cvp, (q[0] - half - b.x0)*kx2, (q[1] - half - b.y0)*ky2,
                       half*2*kx2, half*2*ky2, 0, 0, d, d);
    }

    g.save();
    g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(S.img, q[0] - half, q[1] - half, half*2, half*2, 0, 0, d, d);
    g.restore();

    var mk = (typeof cutMask === 'function') ? cutMask() : null;
    if (mk){
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(mk, (q[0] - half - b.x0)*b.kx, (q[1] - half - b.y0)*b.ky,
                      half*2*b.kx, half*2*b.ky, 0, 0, d, d);
      g.globalCompositeOperation = 'source-over';
    }

    if (typeof paperGrid === 'function'){
      g.save();
      g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
      g.globalCompositeOperation = 'destination-over';
      g.fillStyle = paperGrid(g);
      g.fillRect(sx, sy, sw, sh);
      g.restore();
    }
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = '#00000055';
    g.fillRect(0, 0, d, d);
    g.globalCompositeOperation = 'source-over';
  } catch(_){ errOnce('lensBuild', logT('lensBuild')); }

  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.save();
  ctx.clip();

  try { ctx.drawImage(lens, cx - r, cy - r, r*2, r*2); }
  catch(_){ errOnce('lensShow', logT('lensShow')); }
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ffffffcc';

  ctx.beginPath();
  ctx.moveTo(cx, cy + (up ? r : -r));
  ctx.lineTo(x, y + (up ? -6 : 6));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 3, cy);
  ctx.moveTo(cx + 3, cy);  ctx.lineTo(cx + 12, cy);
  ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 3);
  ctx.moveTo(cx, cy + 3);  ctx.lineTo(cx, cy + 12);
  ctx.stroke();

  if (col !== undefined && col){
    var dx = cx + r*0.45, dy = cy + r*0.45, dr = r*0.22;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00000099';
    ctx.stroke();
  }

  if (col !== undefined && typeof EYETIP === 'string' && EYETIP){
    var ty = cy + (up ? r + 18 : -r - 10);
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000cc';
    ctx.strokeText(EYETIP, cx, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(EYETIP, cx, ty);
    ctx.textAlign = 'start';
    ctx.lineWidth = 1;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI*2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#00000066';
  ctx.stroke();
  ctx.restore();
}

var GUIDES = ['none', 'thirds', 'phi', 'diag', 'center', 'grid', 'safe', 'lays', 'stands'];

var LAY_N = 6;

function guideNow(){
  if (!el) return 'none';
  if (S.mode === 'crop') return S.guideCrop || 'none';

  if (typeof S.zoomOn !== 'undefined' && S.zoomOn && S.zoomHold) return 'thirds';

  if (S.warpHold) return S.warpHold;

  var live = (el.draw && el.draw.classList.contains('open')) ||
             (el.cut && el.cut.classList.contains('open'));
  return live ? (S.guideDraw || 'none') : 'none';
}

function drawGuides(c, x0, y0, w, h){
  if (noSheet()) return;
  var g = guideNow();
  if (!g || g === 'none') return;
  if (!(w > 4 && h > 4)) return;

  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.beginPath();
  c.rect(x0, y0, w, h);
  c.clip();
  c.lineWidth = 1;

  var line = function(ax, ay, bx, by, strong){

    c.strokeStyle = strong ? '#00000077' : '#00000044';
    c.beginPath(); c.moveTo(ax+0.5, ay+0.5); c.lineTo(bx+0.5, by+0.5); c.stroke();
    c.strokeStyle = strong ? '#ffffffbb' : '#ffffff66';
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  };
  var vx = function(u, s){ line(x0 + w*u, y0, x0 + w*u, y0 + h, s); };
  var hy = function(v, s){ line(x0, y0 + h*v, x0 + w, y0 + h*v, s); };

  if (g === 'lays'){
    for (var li = 1; li < LAY_N; li++) hy(li/LAY_N, li*2 === LAY_N);
  }
  else if (g === 'stands'){
    for (var si = 1; si < LAY_N; si++) vx(si/LAY_N, si*2 === LAY_N);
  }
  else if (g === 'thirds'){ vx(1/3); vx(2/3); hy(1/3); hy(2/3); }
  else if (g === 'phi'){

    vx(0.382); vx(0.618); hy(0.382); hy(0.618);
  }
  else if (g === 'diag'){
    line(x0, y0, x0 + w, y0 + h);
    line(x0 + w, y0, x0, y0 + h);
  }
  else if (g === 'center'){ vx(0.5); hy(0.5); }
  else if (g === 'grid'){

    var step = Math.min(w, h)/12;
    for (var x = step; x < w - 0.5; x += step) line(x0 + x, y0, x0 + x, y0 + h);
    for (var y = step; y < h - 0.5; y += step) line(x0, y0 + y, x0 + w, y0 + y);
  }
  else if (g === 'safe'){
    var mx = w/12, my = h/12;
    line(x0 + mx, y0 + my, x0 + w - mx, y0 + my);
    line(x0 + w - mx, y0 + my, x0 + w - mx, y0 + h - my);
    line(x0 + w - mx, y0 + h - my, x0 + mx, y0 + h - my);
    line(x0 + mx, y0 + h - my, x0 + mx, y0 + my);
  }
  c.restore();
}

function ring(c, x, y, r, fill){
  c.beginPath(); c.arc(x, y, r, 0, Math.PI*2);
  c.fillStyle = fill; c.fill();
  c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
}

function drawHandles(c){
  if (S.sel < 0 || S.sel >= S.objs.length) return;

  if (typeof ownScreen === 'function' && !ownScreen(S.objs[S.sel])) return;
  var o = S.objs[S.sel];
  var B = null;
  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (o.kind !== 'arrow'){
    var a, b;
    if (isShape(o)){

      var sb = shapeBox(o);
      a = toScreen(sb.x1, sb.y1); b = toScreen(sb.x2, sb.y2);
    } else {
      B = bodyOf(measurer(), o);
      var hw = (o.kind === 'bubble') ? B.rx : (o.kind === 'plate' ? B.w/2 : B.L.w/2);
      var hh = (o.kind === 'bubble') ? B.ry : (o.kind === 'plate' ? B.h/2 : B.L.h/2);
      a = toScreen(B.cx-hw, B.cy-hh); b = toScreen(B.cx+hw, B.cy+hh);
    }
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = furnitureCol();
    ctx.strokeRect(a[0], a[1], b[0]-a[0], b[1]-a[1]);
    ctx.setLineDash([]);
  }

  if (isShape(o)){

    var h1 = cornerPt(o, false), h2 = cornerPt(o, true);
    ring(ctx, h1[0], h1[1], 12, '#ffd400');
    ring(ctx, h2[0], h2[1], 12, '#ffd400');

    var mp = movePt(o);
    moveMark(ctx, mp[0], mp[1]);
  } else {
    var sp = sizeHandleScreen(measurer(), o);
    ring(ctx, sp[0], sp[1], 11, furnitureCol());

    if (o.kind === 'plate'){
      var Bp = B || bodyOf(measurer(), o);
      edgeTicks(ctx, o, Bp);
    }
    if (hasTail(o)){
      var tq = [markX(o.tx), markY(o.ty)];
      if (o.rot){ var oc = objCenter(o); tq = rotPt(tq[0], tq[1], oc[0], oc[1], o.rot); }
      var tp = toScreen(tq[0], tq[1]);
      ring(ctx, tp[0], tp[1], 12, '#ffd400');
    }
  }
  ctx.restore();
}

function edgeTicks(c, o, B){
  var half = 13;
  var mids = [[B.cx, B.cy - B.h/2, true],
              [B.cx - B.w/2, B.cy, false],
              [B.cx + B.w/2, B.cy, false]];
  c.save();
  c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = furnitureCol();
  for (var i = 0; i < mids.length; i++){
    var m = mids[i], p = [m[0], m[1]];
    if (o.rot) p = rotPt(p[0], p[1], markX(o.x), markY(o.y), o.rot);
    var s = toScreen(p[0], p[1]);
    var ang = (o.rot || 0)*Math.PI/180 + (m[2] ? 0 : Math.PI/2);
    c.beginPath();
    c.moveTo(s[0] - Math.cos(ang)*half, s[1] - Math.sin(ang)*half);
    c.lineTo(s[0] + Math.cos(ang)*half, s[1] + Math.sin(ang)*half);
    c.stroke();
  }
  c.restore();
}

function moveMark(c, x, y){
  c.save();
  c.beginPath();
  c.arc(x, y, 15, 0, Math.PI*2);
  c.fillStyle = 'rgba(0,0,0,.45)';
  c.fill();
  c.strokeStyle = '#f2ead8';
  c.lineWidth = 2;
  c.stroke();
  c.beginPath();
  c.moveTo(x-8, y); c.lineTo(x+8, y);
  c.moveTo(x, y-8); c.lineTo(x, y+8);
  var t = 3.2;
  c.moveTo(x-8, y); c.lineTo(x-8+t, y-t);
  c.moveTo(x-8, y); c.lineTo(x-8+t, y+t);
  c.moveTo(x+8, y); c.lineTo(x+8-t, y-t);
  c.moveTo(x+8, y); c.lineTo(x+8-t, y+t);
  c.moveTo(x, y-8); c.lineTo(x-t, y-8+t);
  c.moveTo(x, y-8); c.lineTo(x+t, y-8+t);
  c.moveTo(x, y+8); c.lineTo(x-t, y+8-t);
  c.moveTo(x, y+8); c.lineTo(x+t, y+8-t);
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  c.stroke();
  c.restore();
}

function padGrips(){
  var s = sheet();
  var x = V.ox, y = V.oy, w = s.w*V.s, h = s.h*V.s;
  return {
    x:x, y:y, w:w, h:h,
    l:[x, y + h/2], r:[x + w, y + h/2],
    t:[x + w/2, y], b:[x + w/2, y + h]
  };
}

function drawPads(c){
  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  var g = padGrips();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = furnitureCol();
  ctx.strokeRect(g.x, g.y, g.w, g.h);
  ctx.setLineDash([]);
  var keys = ['l', 'r', 't', 'b'];
  for (var i = 0; i < keys.length; i++){
    var p = g[keys[i]];
    ring(ctx, p[0], p[1], 13, furnitureCol());
  }
  ctx.restore();
}

function futureSheet(R, x, y, w, h){
  if (!(w > 0 && h > 0)) return null;

  var s2 = sheetAfter(R);
  if (!(s2.fw > 0 && s2.fh > 0)) return null;

  if (s2.w - s2.fw <= 1 && s2.h - s2.fh <= 1) return null;
  var kx = w/s2.fw, ky = h/s2.fh;
  return {x: x - s2.px*kx, y: y - s2.py*ky, w: s2.w*kx, h: s2.h*ky};
}

function drawCropFrame(c){

  var R = (typeof warpFit === 'function' && S.cropRect) ? warpFit(S.cropRect) : S.cropRect;
  if (!R) return;
  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  var a = toScreen(R.x*S.iw, R.y*S.ih);
  var b = toScreen((R.x+R.w)*S.iw, (R.y+R.h)*S.ih);
  var x = a[0], y = a[1], w = b[0]-a[0], h = b[1]-a[1];
  var W = cv.clientWidth, H = cv.clientHeight;

  var fs = futureSheet(R, x, y, w, h);
  var dx = fs ? fs.x : x, dy = fs ? fs.y : y,
      dw = fs ? fs.w : w, dh = fs ? fs.h : h;

  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(0, 0, W, dy);
  ctx.fillRect(0, dy+dh, W, H-dy-dh);
  ctx.fillRect(0, dy, dx, dh);
  ctx.fillRect(dx+dw, dy, W-dx-dw, dh);

  if (fs){

    var band = function(bx, by, bw, bh){
      if (!(bw > 0.5 && bh > 0.5)) return;
      ctx.fillStyle = checker(ctx);
      ctx.fillRect(bx, by, bw, bh);
      if (bgAlpha() > 0){ ctx.fillStyle = bgFill(); ctx.fillRect(bx, by, bw, bh); }
    };
    band(dx, dy, dw, y-dy);
    band(dx, y+h, dw, dy+dh-(y+h));
    band(dx, y, x-dx, h);
    band(x+w, y, dx+dw-(x+w), h);

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.strokeRect(dx+0.5, dy+0.5, dw-1, dh-1);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.strokeRect(dx+0.5, dy+0.5, dw-1, dh-1);
    ctx.restore();
  }

  ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
  ctx.strokeRect(x, y, w, h);
  if (S.mask > 0){
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.55)';
    ctx.stroke(frameShape(x, y, w, h, S.mask));
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
    ctx.stroke(frameShape(x, y, w, h, S.mask));
  }

  var cor = [[x,y],[x+w,y],[x,y+h],[x+w,y+h]];
  for (var k = 0; k < 4; k++) ring(ctx, cor[k][0], cor[k][1], 13, furnitureCol());
  ctx.restore();
}

function adjNeutral(){
  var a = S.adj;
  return !a.br && !a.co && !a.sa && !a.te && !a.ga && !a.sh && !a.bl && !a.gr && !a.vi;
}

function setAttr(id, k, v){
  var n = document.getElementById(id);
  if (n && n.setAttribute) n.setAttribute(k, String(v));
}

function setSvgFilter(identity, drawn){
  var a = identity ? {br:0, co:0, sa:0, te:0, ga:0, sh:0, bl:0} : S.adj;

  setAttr('fxSat', 'values', Math.max(0, 1 + a.sa/100));

  var b = 1 + a.br/100;
  var c = 1 + a.co/100;
  var t = a.te/220;
  var inter = b * 0.5 * (1 - c);
  var ch = [['lR', 1 + t], ['lG', 1], ['lB', 1 - t]];
  for (var i = 0; i < 3; i++){
    setAttr(ch[i][0], 'slope', Math.max(0, b * c * ch[i][1]));
    setAttr(ch[i][0], 'intercept', inter);
  }

  var g = Math.pow(2, -a.ga/100);
  setAttr('gR', 'exponent', g);
  setAttr('gG', 'exponent', g);
  setAttr('gB', 'exponent', g);

  var px = a.bl/100 * 0.012 * (drawn || 1000);
  setAttr('fxBlur', 'stdDeviation', px/2);

  var k = a.sh/100 * 0.9;
  setAttr('fxCM', 'kernelMatrix',
    '0 ' + (-k) + ' 0 ' + (-k) + ' ' + (1 + 4*k) + ' ' + (-k) + ' 0 ' + (-k) + ' 0');
}

var FXOK = null;

function fxWorks(){
  if (FXOK !== null) return FXOK;
  FXOK = false;
  try {
    var t = document.createElement('canvas');
    t.width = 4; t.height = 4;
    var q = t.getContext('2d');
    if (!q || !q.getImageData) return FXOK;
    setSvgFilter(true, 1000);
    q.filter = 'url(#jotAdj)';
    q.fillStyle = '#ff8040';
    q.fillRect(0, 0, 4, 4);
    q.filter = 'none';
    var p = q.getImageData(1, 1, 1, 1).data;
    FXOK = (p[3] > 200 && Math.abs(p[0] - 255) < 45 && Math.abs(p[1] - 128) < 55
            && (p[0] + p[1] + p[2]) > 60);
  } catch(e){

    FXOK = false;
  }
  return FXOK;
}

function cssFallback(drawn){
  var a = S.adj, out = [];
  if (a.br) out.push('brightness(' + (1 + a.br/100) + ')');
  if (a.co) out.push('contrast(' + (1 + a.co/100) + ')');
  if (a.sa) out.push('saturate(' + (1 + a.sa/100) + ')');
  if (a.bl) out.push('blur(' + (a.bl/100 * 0.012 * drawn) + 'px)');
  if (a.ga) out.push('brightness(' + Math.pow(2, a.ga/260) + ')');
  if (a.te > 0) out.push('sepia(' + (a.te/100*0.4) + ')');
  if (a.te < 0) out.push('hue-rotate(' + (-a.te/100*14) + 'deg)');
  return out.length ? out.join(' ') : 'none';
}

function peeking(){ return !!S.peek; }

function filterOf(drawn){
  if (peeking() || adjNeutral()) return 'none';
  if (fxWorks()){
    setSvgFilter(false, drawn);
    return 'url(#jotAdj)';
  }
  return cssFallback(drawn || 1000);
}

var _noise = null;
function noise(c){
  if (_noise) return _noise;
  var t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  var q = t.getContext('2d');
  var d2 = q.createImageData(128, 128);
  for (var i = 0; i < d2.data.length; i += 4){
    var v = 90 + Math.random()*76;
    d2.data[i] = d2.data[i+1] = d2.data[i+2] = v;
    d2.data[i+3] = 255;
  }
  q.putImageData(d2, 0, 0);
  _noise = c.createPattern(t, 'repeat');
  return _noise;
}

function overlays(c){
  if (peeking()) return;
  var a = S.adj;
  if (a.vi){
    var cx = S.iw/2, cy = S.ih/2, r = Math.hypot(cx, cy);
    var gr = c.createRadialGradient(cx, cy, r*0.42, cx, cy, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,' + (a.vi/100 * 0.85) + ')');
    c.fillStyle = gr;
    c.fillRect(0, 0, S.iw, S.ih);
  }
  if (a.gr){
    c.save();
    c.globalAlpha = a.gr/100 * 0.5;
    c.globalCompositeOperation = 'overlay';
    c.fillStyle = noise(c);
    c.fillRect(0, 0, S.iw, S.ih);
    c.restore();
  }
}

var INKC = {}, INKSIG = '';

function strokePath(c, st, sx, sy){
  var n = st.pts.length;
  if (!n) return;
  c.beginPath();
  c.moveTo(st.pts[0][0]*sx, st.pts[0][1]*sy);
  if (n === 1){ c.lineTo(st.pts[0][0]*sx + 0.01, st.pts[0][1]*sy); }
  for (var i = 1; i < n; i++) c.lineTo(st.pts[i][0]*sx, st.pts[i][1]*sy);
  c.stroke();
}

function softPx(st, lw){
  var k = st.soft || 0;
  if (!(k > 0)) return 0;
  return Math.max(0.5, lw * Math.min(1, k) * 0.34);
}

function paintStroke(c, st, sx, sy, unit){
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = Math.max(1, (st.w || 0.01) * unit);
  var blur = softPx(st, c.lineWidth);
  c.filter = blur ? ('blur(' + (Math.round(blur*100)/100) + 'px)') : 'none';
  if (st.erase){
    c.globalCompositeOperation = 'destination-out';
    c.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = alphaOf(st);
    c.strokeStyle = colOf(st).fill;
    var dst = dashOf(st);
    if (dst) c.setLineDash([c.lineWidth*dst, c.lineWidth*dst]);
  }
  strokePath(c, st, sx, sy);
  c.filter = 'none';
  c.setLineDash([]);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

function isMark(st){ return !!st.mark && !st.erase; }

function kindOf(st){ return st.rev ? 'rev' : (isMark(st) ? 'mark' : 'plain'); }

function inkLayer(w, h, sx, sy, unit, ox, oy, kind, from, to, cl){
  var t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(w));
  t.height = Math.max(1, Math.round(h));
  var q = t.getContext('2d');
  if (!q) return t;
  q.setTransform(1, 0, 0, 1, ox, oy);
  q.beginPath();
  if (cl) q.rect(cl.x, cl.y, cl.w, cl.h);
  else q.rect(0, 0, sx, sy);
  q.clip();
  var seen = false;
  var i0 = (from === undefined) ? 0 : from;
  var i1 = (to === undefined) ? S.ink.length : to;
  for (var i = i0; i < i1; i++){
    var st = S.ink[i];

    if (!st.erase && kindOf(st) !== kind) continue;
    if (!st.erase) seen = true;
    paintStroke(q, st, sx, sy, unit);
  }
  return seen ? t : null;
}

function inkLayers(w, h, sx, sy, unit, ox, oy, from, to, cl){
  return {
    mark:  inkLayer(w, h, sx, sy, unit, ox, oy, 'mark', from, to, cl),
    plain: inkLayer(w, h, sx, sy, unit, ox, oy, 'plain', from, to, cl),
    rev:   inkLayer(w, h, sx, sy, unit, ox, oy, 'rev', from, to, cl)
  };
}

function handOrder(){
  var out = [];
  var oldWork = false, i;
  for (i = 0; i < S.ink.length; i++) if (!S.ink[i].z){ oldWork = true; break; }
  if (!oldWork) for (i = 0; i < S.objs.length; i++) if (!S.objs[i].z){ oldWork = true; break; }

  if (!oldWork) for (i = 0; i < S.cut.length; i++) if (!S.cut[i].z){ oldWork = true; break; }
  if (oldWork){
    if (S.inkTop){
      for (i = 0; i < S.objs.length; i++) out.push({obj:i});
      if (S.ink.length) out.push({ink:[0, S.ink.length]});
    } else {
      if (S.ink.length) out.push({ink:[0, S.ink.length]});
      for (i = 0; i < S.objs.length; i++) out.push({obj:i});
    }
    if (typeof cutOn === 'function' && cutOn()) out.push({cut:1});
    return out;
  }
  var list = [];
  for (i = 0; i < S.ink.length; i++) list.push({z:S.ink[i].z, ink:i});
  for (i = 0; i < S.objs.length; i++) list.push({z:S.objs[i].z, obj:i});
  for (i = 0; i < S.cut.length; i++) list.push({z:S.cut[i].z, cut:i});
  list.sort(function(a, b){ return a.z - b.z; });

  var run = null, cun = null;
  for (i = 0; i < list.length; i++){
    var it = list[i];
    if (it.ink !== undefined){
      cun = null;
      if (run && run[1] === it.ink) run[1] = it.ink + 1;
      else { run = [it.ink, it.ink + 1]; out.push({ink:run}); }
    } else if (it.cut !== undefined){
      run = null;
      if (cun && cun[1] === it.cut) cun[1] = it.cut + 1;
      else { cun = [it.cut, it.cut + 1]; out.push({cut:cun}); }
    } else {
      run = null; cun = null;
      out.push({obj:it.obj});
    }
  }
  return out;
}

function inkOnScreen(from, to){
  if (!S.ink.length) return null;
  var sig = [cv.width, cv.height, V.s, V.ox, V.oy, JSON.stringify(S.out), S.ink.length,
             S.ink.length ? S.ink[S.ink.length-1].pts.length : 0].join(',');
  if (INKSIG !== sig){ INKC = {}; INKSIG = sig; }
  var i0 = (from === undefined) ? 0 : from;
  var i1 = (to === undefined) ? S.ink.length : to;
  var key = i0 + ':' + i1;
  if (INKC[key]) return INKC[key];
  var sh2 = sheet();
  var args = [cv.width, cv.height,
              S.iw * V.s * sh2.kx * DPR, S.ih * V.s * sh2.ky * DPR,
              Math.min(S.iw, S.ih) * V.s * Math.min(sh2.kx, sh2.ky) * DPR,
              (V.ox + (sh2.px - S.crop.x*S.iw*sh2.kx)*V.s) * DPR,
              (V.oy + (sh2.py - S.crop.y*S.ih*sh2.ky)*V.s) * DPR];

  var cl = {x: V.ox*DPR - args[5], y: V.oy*DPR - args[6],
            w: sh2.w*V.s*DPR, h: sh2.h*V.s*DPR};
  INKC[key] = inkLayers(args[0], args[1], args[2], args[3], args[4], args[5], args[6], i0, i1, cl);
  return INKC[key];
}

function inkDirty(){ INKSIG = ''; INKC = {}; }

var _pending = false;
function draw(){

  if (typeof dbgPaint === 'function') dbgPaint();
  if (_pending) return;
  _pending = true;
  requestAnimationFrame(function(){
    _pending = false;

    if (!canvasFits()){
      resize();
      if (typeof reflow === 'function') reflow();
      if (typeof clampView === 'function') clampView();
    }

    var t0 = perfNow();
    paint();
    var dp = perfNow() - t0;
    perfAdd(PERF.paint, dp);
    perfWatch('paint', dp);
  });
  var tt = perfNow();

  if (typeof sessWorkSoon === 'function') sessWorkSoon();

  if (typeof paintUndo === 'function') paintUndo();

  if (typeof pastePaint === 'function') pastePaint();

  var dt = perfNow() - tt;
  perfAdd(PERF.tail, dt);
  perfWatch(logT('perfTail'), dt);
}

function paint(){
  if (!cv) return;
  var c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  if (el && el.empty) el.empty.classList.toggle('hide', !noSheet());

  if (el && el.bFit) el.bFit.classList.toggle('on', !noSheet() && S.mode !== 'crop' && fitOff());

  if (el && el.bPeek)
    el.bPeek.classList.toggle('on',
      !noSheet() && ((!!el.adj && el.adj.classList.contains('open') && !adjNeutral()) ||
                  (!!S.geoOn && !!((S.focus || 0) || (S.ang || 0)))));

  if (noSheet()){
    c.fillStyle = BG;
    c.fillRect(0, 0, cv.width, cv.height);
    return;
  }

  var sh = sheet();

  var onCrop = (S.mode === 'crop');

  var clipped = !onCrop;
  if (clipped){
    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);

    c.beginPath();
    c.rect(V.ox, V.oy, sh.w*V.s, sh.h*V.s);
    c.clip();
  }

  var mS = angMatrix(DPR*V.s*sh.kx, DPR*V.s*sh.ky,
                     DPR*(V.ox + (sh.px - S.crop.x*S.iw*sh.kx)*V.s),
                     DPR*(V.oy + (sh.py - S.crop.y*S.ih*sh.ky)*V.s));
  c.setTransform(mS[0], mS[1], mS[2], mS[3], mS[4], mS[5]);
  c.imageSmoothingQuality = 'high';
  c.filter = filterOf(S.iw * V.s * DPR);

  var pw = S.iw * V.s * sh.kx * DPR;

  var bw = (S.warpHold || S.busy) ? pw/FOCUS_LIVE : pw;

  var warp = focusA() !== 0 || tiltA() !== 0 || tiltHA() !== 0;
  var tph = perfNow();
  focusDraw(c, photo(warp ? bw : pw, warp), focusA(), tiltA(), tiltHA(), S.iw, S.ih, bw);
  perfAdd(PERF.photo, perfNow() - tph);
  c.filter = 'none';

  var rlay = inkOnScreen();
  var pre = (S.tool === 'reveal' && typeof drawing === 'function' && drawing());
  if (pre || (rlay && rlay.rev)){
    atopLayer(c, 'source-over', function(s){
      s.filter = 'grayscale(1)';
      focusDraw(s, photo(warp ? bw : pw, warp), focusA(), tiltA(), tiltHA(), S.iw, S.ih, bw);
      s.filter = 'none';
      if (rlay && rlay.rev){
        s.setTransform(1, 0, 0, 1, 0, 0);
        s.globalCompositeOperation = 'destination-out';
        s.drawImage(rlay.rev, 0, 0);
        s.globalCompositeOperation = 'source-over';
      }
    });
  }
  overlays(c);
  if (clipped) c.restore();

  var sc = sheet();
  var cutRect = {x: V.ox, y: V.oy, w: sh.w*V.s, h: sh.h*V.s};

  var eyeDone = false;
  var eyeSnap = function(){
    if (eyeDone) return;
    eyeDone = true;
    EYEPX = S.eye ? sheetPixels(c, cutRect, DPR) : null;
  };
  var blit = function(lay){
    if (!lay) return;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);

    if (lay.mark){
      atopLayer(c, 'multiply', function(sx){ sx.drawImage(lay.mark, 0, 0); });
    }
    if (lay.plain) c.drawImage(lay.plain, 0, 0);
    c.restore();
  };

  var warpLay = null, warpQ = null;
  var layW = 0, layH = 0;
  var layerOn = warp && typeof focusDraw === 'function';
  if (layerOn){
    layW = Math.max(1, Math.round(bw || S.iw));
    layH = Math.max(1, Math.round(layW * S.ih / S.iw));
    try {
      if (!WARP_LAY) WARP_LAY = document.createElement('canvas');
      warpLay = WARP_LAY;
      if (warpLay.width !== layW || warpLay.height !== layH){
        warpLay.width = layW; warpLay.height = layH;
      }
      warpQ = warpLay.getContext('2d');
      if (warpQ){ warpQ.setTransform(1,0,0,1,0,0); warpQ.clearRect(0,0,layW,layH); }
      else layerOn = false;
    } catch (e){

      layerOn = false;
    }
  }

  var flushLayer = function(){
    if (!layerOn || !warpQ) return;
    c.save();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.beginPath();
    ctx.rect(V.ox, V.oy, sc.w*V.s, sc.h*V.s);
    ctx.clip();

    var mL = angMatrix(DPR*V.s*sc.kx, DPR*V.s*sc.ky,
                       DPR*(V.ox + (sc.px - S.crop.x*S.iw*sc.kx)*V.s),
                       DPR*(V.oy + (sc.py - S.crop.y*S.ih*sc.ky)*V.s));
    ctx.setTransform(mL[0], mL[1], mL[2], mL[3], mL[4], mL[5]);
    focusDraw(c, warpLay, focusA(), tiltA(), tiltHA(), S.iw, S.ih, bw);
    c.restore();
    warpQ.setTransform(1,0,0,1,0,0);
    warpQ.clearRect(0, 0, layW, layH);
  };

  var openSheet = false;
  var enterSheet = function(){
    if (openSheet) return;
    if (layerOn){

      warpQ.setTransform(layW/S.iw, 0, 0, layH/S.ih, 0, 0);
      openSheet = true;
      return;
    }
    c.save();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.beginPath();
    ctx.rect(V.ox, V.oy, sc.w*V.s, sc.h*V.s);
    ctx.clip();

    var mO = angMatrix(DPR*V.s*sc.kx, DPR*V.s*sc.ky,
                       DPR*(V.ox + (sc.px - S.crop.x*S.iw*sc.kx)*V.s),
                       DPR*(V.oy + (sc.py - S.crop.y*S.ih*sc.ky)*V.s));
    ctx.setTransform(mO[0], mO[1], mO[2], mO[3], mO[4], mO[5]);
    openSheet = true;
  };
  var leaveSheet = function(){
    if (!openSheet) return;
    if (layerOn){ flushLayer(); openSheet = false; return; }
    c.restore(); openSheet = false;
  };
  enterSheet();
  var ord = handOrder();
  for (var oi = 0; oi < ord.length; oi++){
    var pc = ord[oi];

    if (pc.cut){
      leaveSheet();
      eyeSnap();

      cutApply(c, mS, cutRect, DPR, pc.cut[0], pc.cut[1], bw);
      continue;
    }

    if (pc.ink){
      if (layerOn && openSheet) leaveSheet();
      blit(inkOnScreen(pc.ink[0], pc.ink[1]));
      continue;
    }
    enterSheet();
    drawObj(layerOn ? warpQ : c, S.objs[pc.obj]);
  }
  leaveSheet();

  eyeSnap();

  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.save();
  c.globalCompositeOperation = 'destination-over';
  if (S.mode === 'crop'){

    var CW = cv.clientWidth, CH = cv.clientHeight;
    var pa = toScreen(0, 0), pb = toScreen(S.iw, S.ih);
    var dx = Math.max(0, Math.min(pa[0], pb[0]));
    var dy = Math.max(0, Math.min(pa[1], pb[1]));
    var dw = Math.min(CW, Math.max(pa[0], pb[0])) - dx;
    var dh = Math.min(CH, Math.max(pa[1], pb[1])) - dy;

    if (!(dw > 0 && dh > 0)){ dx = 0; dy = 0; dw = 0; dh = 0; }
    else { c.fillStyle = paperGrid(c); c.fillRect(dx, dy, dw, dh); }

    c.fillStyle = BG;
    c.fillRect(0, 0, CW, dy);
    c.fillRect(0, dy + dh, CW, CH - (dy + dh));
    c.fillRect(0, dy, dx, dh);
    c.fillRect(dx + dw, dy, CW - (dx + dw), dh);
  } else {

    var CW2 = cv.clientWidth, CH2 = cv.clientHeight;
    var lx = Math.max(0, V.ox), ly = Math.max(0, V.oy);
    var lw = Math.min(CW2, V.ox + sh.w*V.s) - lx;
    var lh = Math.min(CH2, V.oy + sh.h*V.s) - ly;
    if (lw > 0 && lh > 0){
      c.fillStyle = paperGrid(c);
      c.fillRect(lx, ly, lw, lh);
    }
  }
  c.restore();

  var liveCut = null;
  for (var lc = 0; lc < S.cut.length; lc++) if (S.cut[lc].live) liveCut = S.cut[lc];
  if (liveCut && liveCut.pts && liveCut.pts.length > 1){
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.save();
    c.beginPath();
    for (var lp = 0; lp < liveCut.pts.length; lp++){
      var ls = toScreen(liveCut.pts[lp][0]*S.iw, liveCut.pts[lp][1]*S.ih);
      if (lp) c.lineTo(ls[0], ls[1]); else c.moveTo(ls[0], ls[1]);
    }

    c.closePath();
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.setLineDash([]);
    c.lineWidth = 3.5; c.strokeStyle = 'rgba(0,0,0,.55)';
    c.stroke();
    c.setLineDash([7, 5]);
    c.lineWidth = 1.5; c.strokeStyle = '#fff';
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  if (S.mode !== 'crop') drawGuides(c, V.ox, V.oy, sh.w*V.s, sh.h*V.s);

  if (typeof S.zoomOn !== 'undefined' && S.zoomOn && S.img){
    c.save();
    c.strokeStyle = INK;
    c.globalAlpha = 0.55;
    c.lineWidth = 1;
    c.strokeRect(V.ox + 0.5, V.oy + 0.5, sh.w*V.s - 1, sh.h*V.s - 1);
    c.restore();
  }

  if (glassOn()){
    var gs = toScreen(S.crop.x*S.iw, S.crop.y*S.ih);
    c.setTransform(1, 0, 0, 1, 0, 0);

    var gA = glassAllOn();
    glassOver(c, cv,
              (V.ox + (gA ? 0 : sh.px*V.s))*DPR,
              (V.oy + (gA ? 0 : sh.py*V.s))*DPR,
              (gA ? sh.w : sh.fw)*V.s*DPR,
              (gA ? sh.h : sh.fh)*V.s*DPR);
  }

  if (S.mode !== 'crop'){
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var a = toScreen(S.crop.x*S.iw, S.crop.y*S.ih);
    var b = toScreen((S.crop.x+S.crop.w)*S.iw, (S.crop.y+S.crop.h)*S.ih);
    var W = cv.clientWidth, H = cv.clientHeight;
    var sx = V.ox, sy = V.oy, sw = sh.w*V.s, shh = sh.h*V.s;

    c.fillStyle = BG;
    c.fillRect(0, 0, W, sy);
    c.fillRect(0, sy+shh, W, H-(sy+shh));
    c.fillRect(0, sy, sx, shh);
    c.fillRect(sx+sw, sy, W-(sx+sw), shh);
  }

  if (S.eye && S.eyeAt) drawLoupe(S.eyeAt[0], S.eyeAt[1], S.eyeCol);

  if (S.popPick && S.popAt) drawLoupe(S.popAt[0], S.popAt[1], null);

  if (typeof padsOn === 'function' && padsOn()) drawPads(c);
  if (S.mode === 'crop'){
    drawCropFrame(c);

    var ca = toScreen(S.cropRect.x*S.iw, S.cropRect.y*S.ih);
    var cb = toScreen((S.cropRect.x+S.cropRect.w)*S.iw, (S.cropRect.y+S.cropRect.h)*S.ih);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawGuides(c, ca[0], ca[1], cb[0]-ca[0], cb[1]-ca[1]);
  }
  else if (S.mode !== 'view') drawHandles(c);
}

var _m = null;
function measurer(){
  if (!_m){
    var t = document.createElement('canvas');
    t.width = 8; t.height = 8;
    _m = t.getContext('2d');
  }
  return _m;
}
