'use strict';

var TSZ = {1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8};

function parseIFDs(dv){
  var b0 = dv.getUint8(0), b1 = dv.getUint8(1);
  var le;
  if (b0 === 0x49 && b1 === 0x49) le = true;
  else if (b0 === 0x4D && b1 === 0x4D) le = false;
  else throw new Error('notTiff');
  if (dv.getUint16(2, le) !== 42) throw new Error('notTiff');

  var out = [], off = dv.getUint32(4, le), guard = 0;
  while (off && guard++ < 64){
    var n = dv.getUint16(off, le), tags = {};
    for (var i = 0; i < n; i++){
      var e = off + 2 + 12*i;
      var tag = dv.getUint16(e, le), typ = dv.getUint16(e+2, le), cnt = dv.getUint32(e+4, le);
      var size = (TSZ[typ] || 1) * cnt;
      var p = (size <= 4) ? (e + 8) : dv.getUint32(e+8, le);
      var v = [];
      for (var k = 0; k < cnt && k < 100000; k++){
        if (typ === 3) v.push(dv.getUint16(p + 2*k, le));
        else if (typ === 4 || typ === 9) v.push(dv.getUint32(p + 4*k, le));
        else if (typ === 5){
          var a = dv.getUint32(p + 8*k, le), b = dv.getUint32(p + 8*k + 4, le);
          v.push(b ? a/b : 0);
        }
        else if (typ === 1 || typ === 2 || typ === 6 || typ === 7) v.push(dv.getUint8(p + k));
        else v.push(0);
      }
      tags[tag] = v;
    }
    out.push(tags);
    off = dv.getUint32(off + 2 + 12*n, le);
  }
  if (!out.length) throw new Error('notTiff');
  return out;
}

function one(t, tag, dflt){ return (t[tag] && t[tag].length) ? t[tag][0] : dflt; }

function dpiOf(t){
  var r = one(t, 282, 300);
  return (r === 200 || r === 300 || r === 400 || r === 600) ? r : 300;
}

function planPage(t){
  var w = one(t, 256, 0), h = one(t, 257, 0);
  if (!w || !h) throw new Error('broken');
  if (t[322] !== undefined) throw new Error('tiled');
  if (one(t, 284, 1) !== 1) throw new Error('planar');

  var comp = one(t, 259, 1), photo = one(t, 262, 0);
  var bps = one(t, 258, 1), spp = one(t, 277, 1);
  if (spp !== 1 && spp !== 3) throw new Error('channels');
  if (bps !== 1 && bps !== 8) throw new Error('depth');

  var offs = t[273] || [], lens = t[279] || [];
  if (!offs.length || offs.length !== lens.length) throw new Error('broken');
  var rps = one(t, 278, h);
  if (rps <= 0) rps = h;

  var filter = '', parms = '', decode = '';
  if (comp === 1) filter = '';
  else if (comp === 2){ filter = '/Filter/CCITTFaxDecode'; parms = '/K 0/EncodedByteAlign true'; }
  else if (comp === 3){
    var t4 = one(t, 292, 0);
    filter = '/Filter/CCITTFaxDecode';
    parms = '/K ' + ((t4 & 1) ? '1' : '0') + ((t4 & 4) ? '/EncodedByteAlign true' : '');
  }
  else if (comp === 4){ filter = '/Filter/CCITTFaxDecode'; parms = '/K -1'; }
  else if (comp === 5){
    filter = '/Filter/LZWDecode';
    var pr = one(t, 317, 1);
    if (pr !== 1 && pr !== 2) throw new Error('predictor');
    if (pr === 2) parms = '/Predictor 2/Colors ' + spp + '/BitsPerComponent ' + bps + '/Columns ' + w;
  }
  else if (comp === 32773) filter = '/Filter/RunLengthDecode';
  else throw new Error('compression');

  var ccitt = (comp >= 2 && comp <= 4);

  if (!ccitt && photo === 0 && bps === 1) decode = '/Decode[1 0]';
  if (!ccitt && photo === 0 && bps === 8) decode = '/Decode[1 0]';

  var strips = [];
  for (var i = 0; i < offs.length; i++){
    var rows = Math.min(rps, h - i*rps);
    if (rows <= 0) break;
    strips.push({off:offs[i], len:lens[i], rows:rows, top:i*rps});
  }
  if (!strips.length) throw new Error('broken');

  return {
    w:w, h:h, dpi:dpiOf(t), strips:strips, filter:filter, parms:parms, decode:decode,
    ccitt:ccitt, comp:comp, photo:photo, bps:bps,
    cs: (spp === 3) ? '/DeviceRGB' : '/DeviceGray'
  };
}

function num(x){
  var s = (Math.round(x*100)/100).toString();
  return s;
}

function convert(bytes){
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  var ifds = parseIFDs(dv);
  var pages = [];
  for (var i = 0; i < ifds.length; i++) pages.push(planPage(ifds[i]));

  var out = [], off = [], total = 0;
  function put(s){
    if (typeof s === 'string'){
      var a = new Uint8Array(s.length);
      for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff;
      out.push(a); total += a.length;
    } else { out.push(s); total += s.length; }
  }

  var num1 = 3;
  var plan = [];
  for (var p = 0; p < pages.length; p++){
    var pg = pages[p];
    var self = num1++;
    var ims = [];
    for (var s = 0; s < pg.strips.length; s++) ims.push(num1++);
    var cont = num1++;
    plan.push({pg:pg, self:self, ims:ims, cont:cont});
  }

  put('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');

  function obj(n, head, raw, tail){
    off[n] = total;
    put(n + ' 0 obj\n' + head);
    if (raw) put(raw);
    if (tail) put(tail);
    put('\nendobj\n');
  }

  var kids = plan.map(function(q){ return q.self + ' 0 R'; }).join(' ');
  obj(1, '<</Type/Catalog/Pages 2 0 R>>');
  obj(2, '<</Type/Pages/Kids[' + kids + ']/Count ' + plan.length + '>>');

  for (var q = 0; q < plan.length; q++){
    var it = plan[q], g = it.pg;
    var k = 72 / g.dpi;
    var pw = g.w * k, ph = g.h * k;
    var res = '/XObject<<';
    for (var m = 0; m < it.ims.length; m++) res += '/Im' + m + ' ' + it.ims[m] + ' 0 R';
    res += '>>';
    obj(it.self, '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + num(pw) + ' ' + num(ph) +
                 ']/Resources<<' + res + '>>/Contents ' + it.cont + ' 0 R>>');

    var cs = '';
    for (var j = 0; j < g.strips.length; j++){
      var st = g.strips[j];
      var data = bytes.subarray(st.off, st.off + st.len);
      var dp = '';
      if (g.ccitt) dp = '/DecodeParms<<' + g.parms + '/Columns ' + g.w + '/Rows ' + st.rows +
                        '/BlackIs1 false>>';
      else if (g.parms) dp = '/DecodeParms<<' + g.parms + '>>';
      obj(it.ims[j],
          '<</Type/XObject/Subtype/Image/Width ' + g.w + '/Height ' + st.rows +
          '/ColorSpace' + g.cs + '/BitsPerComponent ' + g.bps + g.filter + dp + g.decode +
          '/Length ' + data.length + '>>\nstream\n',
          data, '\nendstream');
      var y = ph - (st.top + st.rows) * k;
      cs += 'q ' + num(pw) + ' 0 0 ' + num(st.rows * k) + ' 0 ' + num(y) + ' cm /Im' + j + ' Do Q\n';
    }
    obj(it.cont, '<</Length ' + cs.length + '>>\nstream\n' + cs + 'endstream');
  }

  var xref = total;
  var last = num1 - 1;
  var pad = function(n){ var s = String(n); while (s.length < 10) s = '0' + s; return s; };
  var x = 'xref\n0 ' + (last+1) + '\n0000000000 65535 f \n';
  for (var r = 1; r <= last; r++) x += pad(off[r] || 0) + ' 00000 n \n';
  x += 'trailer\n<</Size ' + (last+1) + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF\n';
  put(x);

  var res2 = new Uint8Array(total), at = 0;
  for (var z = 0; z < out.length; z++){ res2.set(out[z], at); at += out[z].length; }
  return {pdf:res2, pages:pages};
}
