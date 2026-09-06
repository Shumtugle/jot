'use strict';

var BR = (typeof Jot !== 'undefined') ? Jot : null;
var PDF = null, NAME = 'velho';

function t(k){ return T(k); }

function $(i){ return document.getElementById(i); }
function say(s){ $('s').textContent = s; }

function labels(){
  $('bSave').textContent = t('vSave');
  $('bShare').textContent = t('vShare');
  $('bOpen').textContent = t('vOpen');
  $('bJot').textContent = t('vJot');

  $('vTiny').textContent = t('vTiny');
}

function b64(u8){
  var out = '', N = 32768;
  for (var i = 0; i < u8.length; i += N){
    var s = '';
    var end = Math.min(i + N, u8.length);
    for (var j = i; j < end; j++) s += String.fromCharCode(u8[j]);
    out += s;
  }
  return btoa(out);
}

function baseName(){
  var n = '';
  try { if (BR && BR.srcName) n = BR.srcName() || ''; } catch(e){}
  n = String(n).replace(/\.[^.]*$/, '').replace(/[\\\/:*?"<>|]/g, '').trim();
  return n.length ? n : 'velho-' + Date.now();
}

function run(){
  if (BR && BR.has && !BR.has()){ say(t('vNone')); return; }
  say(t('vWait'));
  fetch('/image?t=' + Date.now()).then(function(r){ return r.arrayBuffer(); }).then(function(b){
    var u = new Uint8Array(b);
    var r = convert(u);
    PDF = r.pdf;
    NAME = baseName();
    var g = r.pages[0];
    var kb = Math.round(PDF.length/1024);
    say(t('vOk').replace('%p', r.pages.length + ' × ' + g.w + '×' + g.h)
                .replace('%s', kb + ' ' + t('vKb')) + '\n' + NAME + '.pdf');
    $('bSave').disabled = false;
    $('bShare').disabled = false;
    $('bJot').disabled = !(BR && BR.stash);
  }).catch(function(e){

    var k = (e && e.message) ? e.message : 'fail';
    var key = 'v' + k.charAt(0).toUpperCase() + k.slice(1);
    say(T(key) === key ? (t('vFail') + k) : t(key));
  });
}

function send(mode){
  if (!PDF || !BR || !BR.begin) return;
  try {
    var s = b64(PDF), N = 262144;
    BR.begin();
    for (var i = 0; i < s.length; i += N) BR.chunk(s.substr(i, N));
    BR.end('pdf', NAME, mode);
    if (mode === 0) say(t('vSaved') + '\n' + NAME + '.pdf');
  } catch(e){ say(t('vFail') + e); }
}

function toJot(){
  if (!PDF || !BR || !BR.stash) return;
  try {
    var s = b64(PDF), N = 262144;
    BR.begin();
    for (var i = 0; i < s.length; i += N) BR.chunk(s.substr(i, N));
    BR.stash(NAME);
  } catch(e){ say(t('vFail') + e); }
}

function boot(){
  labels();
  $('bJot').onclick = toJot;
  $('bSave').onclick = function(){ send(0); };
  $('bShare').onclick = function(){ send(1); };
  $('bOpen').onclick = function(){ if (BR && BR.pick) BR.pick(); };
  run();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
