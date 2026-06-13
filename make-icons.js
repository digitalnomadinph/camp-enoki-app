// Generates icon-192.png and icon-512.png (brand-green with a white tent) with
// no external libraries - pure Node (zlib). Run once: node make-icons.js
var zlib = require('zlib');
var fs = require('fs');

var crcTable = (function () {
  var t = [];
  for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { var c = 0xFFFFFFFF; for (var i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  var t = Buffer.from(type, 'ascii');
  var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function sign(ax, ay, bx, by, cx, cy) { return (ax - cx) * (by - cy) - (bx - cx) * (ay - cy); }
function inTri(px, py, ax, ay, bx, by, cx, cy) {
  var d1 = sign(px, py, ax, ay, bx, by), d2 = sign(px, py, bx, by, cx, cy), d3 = sign(px, py, cx, cy, ax, ay);
  var neg = (d1 < 0) || (d2 < 0) || (d3 < 0), pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(neg && pos);
}
function png(size, path) {
  var bg = [47, 93, 58], white = [255, 255, 255], door = [47, 93, 58];
  var ax = size * 0.5, ay = size * 0.24;       // tent apex
  var blx = size * 0.16, bly = size * 0.76;     // base left
  var brx = size * 0.84, bry = size * 0.76;     // base right
  var dax = size * 0.5, day = size * 0.46;      // door apex
  var dblx = size * 0.40, dbly = size * 0.76;   // door base left
  var dbrx = size * 0.60, dbry = size * 0.76;   // door base right
  var raw = Buffer.alloc((size * 4 + 1) * size);
  var o = 0;
  for (var y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (var x = 0; x < size; x++) {
      var col = bg;
      if (inTri(x + 0.5, y + 0.5, ax, ay, blx, bly, brx, bry)) col = white;
      if (inTri(x + 0.5, y + 0.5, dax, day, dblx, dbly, dbrx, dbry)) col = door;
      raw[o++] = col[0]; raw[o++] = col[1]; raw[o++] = col[2]; raw[o++] = 255;
    }
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  var sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  var out = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(path, out);
}
png(192, __dirname + '/icon-192.png');
png(512, __dirname + '/icon-512.png');
console.log('Wrote icon-192.png and icon-512.png');
