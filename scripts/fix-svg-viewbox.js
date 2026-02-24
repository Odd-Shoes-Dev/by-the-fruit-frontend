/**
 * fix-svg-viewbox.js
 *
 * Recalculates the viewBox for every SVG in public/icons/ so they display
 * tightly around the actual artwork instead of a full A4 canvas.
 *
 * Run from the frontend directory:
 *   node scripts/fix-svg-viewbox.js
 *
 * No npm deps needed — pure Node.js.
 */

const fs   = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PADDING   = 8; // px gap around the artwork

// ─── Helpers ────────────────────────────────────────────────────────────────

function nums(str) {
  return (str.match(/-?[\d.]+(?:e[+-]?\d+)?/gi) || []).map(Number);
}

/**
 * Rough but effective tight-bounding-box from a path `d` attribute.
 * Tracks anchor points + cubic/quadratic control points — good enough for icon
 * art where Bezier overshoots are tiny.
 */
function pathBBox(d) {
  const xs = [], ys = [];
  const segments = d.replace(/,/g, ' ').split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
  let cx = 0, cy = 0;

  for (const seg of segments) {
    if (!seg.trim()) continue;
    const cmd = seg[0];
    const n   = nums(seg.slice(1));

    switch (cmd) {
      case 'M': case 'L': case 'T':
        for (let i = 0; i + 1 < n.length; i += 2) {
          xs.push(n[i]); ys.push(n[i + 1]);
          cx = n[i]; cy = n[i + 1];
        }
        break;
      case 'm': case 'l': case 't':
        for (let i = 0; i + 1 < n.length; i += 2) {
          cx += n[i]; cy += n[i + 1];
          xs.push(cx); ys.push(cy);
        }
        break;
      case 'H':
        for (const x of n) { xs.push(x); cx = x; }
        break;
      case 'h':
        for (const x of n) { cx += x; xs.push(cx); }
        break;
      case 'V':
        for (const y of n) { ys.push(y); cy = y; }
        break;
      case 'v':
        for (const y of n) { cy += y; ys.push(cy); }
        break;
      case 'C':
        for (let i = 0; i + 5 < n.length; i += 6) {
          xs.push(n[i], n[i + 2], n[i + 4]);
          ys.push(n[i + 1], n[i + 3], n[i + 5]);
          cx = n[i + 4]; cy = n[i + 5];
        }
        break;
      case 'c':
        for (let i = 0; i + 5 < n.length; i += 6) {
          xs.push(cx + n[i], cx + n[i + 2], cx + n[i + 4]);
          ys.push(cy + n[i + 1], cy + n[i + 3], cy + n[i + 5]);
          cx += n[i + 4]; cy += n[i + 5];
        }
        break;
      case 'S':
        for (let i = 0; i + 3 < n.length; i += 4) {
          xs.push(n[i], n[i + 2]); ys.push(n[i + 1], n[i + 3]);
          cx = n[i + 2]; cy = n[i + 3];
        }
        break;
      case 's':
        for (let i = 0; i + 3 < n.length; i += 4) {
          xs.push(cx + n[i], cx + n[i + 2]); ys.push(cy + n[i + 1], cy + n[i + 3]);
          cx += n[i + 2]; cy += n[i + 3];
        }
        break;
      case 'Q':
        for (let i = 0; i + 3 < n.length; i += 4) {
          xs.push(n[i], n[i + 2]); ys.push(n[i + 1], n[i + 3]);
          cx = n[i + 2]; cy = n[i + 3];
        }
        break;
      case 'q':
        for (let i = 0; i + 3 < n.length; i += 4) {
          xs.push(cx + n[i], cx + n[i + 2]); ys.push(cy + n[i + 1], cy + n[i + 3]);
          cx += n[i + 2]; cy += n[i + 3];
        }
        break;
      case 'A':
        for (let i = 0; i + 6 < n.length; i += 7) {
          xs.push(n[i + 5]); ys.push(n[i + 6]);
          cx = n[i + 5]; cy = n[i + 6];
        }
        break;
      case 'a':
        for (let i = 0; i + 6 < n.length; i += 7) {
          cx += n[i + 5]; cy += n[i + 6];
          xs.push(cx); ys.push(cy);
        }
        break;
    }
  }

  if (!xs.length) return null;
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function merge(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  let bbox = null;

  // paths
  for (const m of src.matchAll(/\sd="([^"]+)"/g)) {
    bbox = merge(bbox, pathBBox(m[1]));
  }

  // rects
  for (const m of src.matchAll(/<rect([^>]*)>/g)) {
    const a = m[1];
    const attr = k => parseFloat((a.match(new RegExp(`\\b${k}="([^"]+)"`)) || [, 'NaN'])[1]);
    const x = attr('x') || 0, y = attr('y') || 0, w = attr('width'), h = attr('height');
    if (!isNaN(w)) bbox = merge(bbox, { minX: x, minY: y, maxX: x + w, maxY: y + h });
  }

  // circles
  for (const m of src.matchAll(/<circle([^>]*)>/g)) {
    const a = m[1];
    const attr = k => parseFloat((a.match(new RegExp(`\\b${k}="([^"]+)"`)) || [, 'NaN'])[1]);
    const cx = attr('cx'), cy = attr('cy'), r = attr('r');
    if (!isNaN(r)) bbox = merge(bbox, { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r });
  }

  // ellipses
  for (const m of src.matchAll(/<ellipse([^>]*)>/g)) {
    const a = m[1];
    const attr = k => parseFloat((a.match(new RegExp(`\\b${k}="([^"]+)"`)) || [, 'NaN'])[1]);
    const cx = attr('cx'), cy = attr('cy'), rx = attr('rx'), ry = attr('ry');
    if (!isNaN(rx)) bbox = merge(bbox, { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry });
  }

  // polygons / polylines
  for (const m of src.matchAll(/points="([^"]+)"/g)) {
    const pts = nums(m[1]);
    for (let i = 0; i + 1 < pts.length; i += 2) {
      bbox = merge(bbox, { minX: pts[i], minY: pts[i+1], maxX: pts[i], maxY: pts[i+1] });
    }
  }

  // lines
  for (const m of src.matchAll(/<line([^>]*)>/g)) {
    const a = m[1];
    const attr = k => parseFloat((a.match(new RegExp(`\\b${k}="([^"]+)"`)) || [, 'NaN'])[1]);
    const x1 = attr('x1'), y1 = attr('y1'), x2 = attr('x2'), y2 = attr('y2');
    if (!isNaN(x1)) bbox = merge(bbox, { minX: Math.min(x1,x2), minY: Math.min(y1,y2), maxX: Math.max(x1,x2), maxY: Math.max(y1,y2) });
  }

  if (!bbox) {
    console.log(`  SKIP  (no artwork found): ${path.basename(filePath)}`);
    return;
  }

  const vx = (bbox.minX - PADDING).toFixed(2);
  const vy = (bbox.minY - PADDING).toFixed(2);
  const vw = (bbox.maxX - bbox.minX + PADDING * 2).toFixed(2);
  const vh = (bbox.maxY - bbox.minY + PADDING * 2).toFixed(2);
  const newViewBox = `${vx} ${vy} ${vw} ${vh}`;

  // 1. Strip XML declaration
  src = src.replace(/<\?xml[^?]*\?>\s*/g, '');
  // 2. Strip Illustrator generator comment
  src = src.replace(/<!--.*?-->\s*/gs, '');
  // 3. Replace viewBox value
  src = src.replace(/viewBox="[^"]*"/, `viewBox="${newViewBox}"`);
  // 4. Remove fixed width / height on root <svg> (so it scales with CSS)
  src = src.replace(/(<svg[^>]*?)\s+width="[^"]*"/, '$1');
  src = src.replace(/(<svg[^>]*?)\s+height="[^"]*"/, '$1');
  // 5. Remove Illustrator's enable-background style
  src = src.replace(/\s+style="enable-background:[^"]*"/, '');
  // 6. Remove x="0px" y="0px" from root <svg>
  src = src.replace(/(<svg[^>]*?)\s+x="0px"/, '$1');
  src = src.replace(/(<svg[^>]*?)\s+y="0px"/, '$1');
  // 7. Add preserveAspectRatio so the icon centers in any container
  if (!src.includes('preserveAspectRatio')) {
    src = src.replace(/(<svg[^>]*?)(\s*>)/, '$1 preserveAspectRatio="xMidYMid meet"$2');
  }

  fs.writeFileSync(filePath, src.trimStart(), 'utf8');
  console.log(`  OK  viewBox="${newViewBox}"  →  ${path.basename(filePath)}`);
}

const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
console.log(`\nProcessing ${files.length} SVGs in ${ICONS_DIR}\n`);
let ok = 0, skip = 0;
for (const f of files) {
  const before = Math.floor(ok);
  processFile(path.join(ICONS_DIR, f));
  if (ok === before) skip++; else ok++;
  ok = files.indexOf(f) - skip + 1; // rough count
}
console.log('\nAll done.\n');
