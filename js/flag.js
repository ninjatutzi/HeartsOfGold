/* Hearts of Gold – Flaggen werden prozedural aus einer Konfiguration gezeichnet */
window.HOG = window.HOG || {};
(function (H) {
  const F = (H.flag = {});
  const cache = {};

  F.random = function (rnd) {
    const r = rnd || Math.random;
    const pats = Object.keys(H.data.PATTERNS), ems = Object.keys(H.data.EMBLEMS);
    const col = () => `hsl(${Math.floor(r() * 360)},${50 + Math.floor(r() * 40)}%,${30 + Math.floor(r() * 35)}%)`;
    return { pattern: pats[Math.floor(r() * pats.length)], c1: col(), c2: col(), c3: '#f2f2f2', emblem: ems[Math.floor(r() * ems.length)] };
  };

  F.draw = function (ctx, w, h, f) {
    f = f || { pattern: 'solid', c1: '#888', c2: '#fff', c3: '#222', emblem: 'none' };
    const { c1, c2, c3 } = f;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = c2; ctx.strokeStyle = c2;
    const R = (x, y, ww, hh, c) => { if (c) ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); };
    const stripesH = (n) => { for (let i = 1; i < n; i += 2) R(0, (h * i) / n, w, h / n, c2); if (n % 2 === 0) { /* 4: c1,c2,c1,c2 */ } };
    switch (f.pattern) {
      case 'h2': R(0, h / 2, w, h / 2, c2); break;
      case 'h3': R(0, h / 3, w, h / 3, c2); R(0, (2 * h) / 3, w, h / 3, c3); break;
      case 'h4': for (let i = 1; i < 4; i += 2) R(0, (h * i) / 4, w, h / 4, c2); break;
      case 'h5': for (let i = 0; i < 5; i++) R(0, (h * i) / 5, w, h / 5, i % 2 ? c2 : i === 2 ? c3 : c1); break;
      case 'h9': for (let i = 0; i < 9; i++) R(0, (h * i) / 9, w, h / 9, i % 2 ? c2 : c1); break;
      case 'v2': R(w / 2, 0, w / 2, h, c2); break;
      case 'v3': R(w / 3, 0, w / 3, h, c2); R((2 * w) / 3, 0, w / 3, h, c3); break;
      case 'v5': for (let i = 0; i < 5; i++) R((w * i) / 5, 0, w / 5, h, i % 2 ? c2 : i === 2 ? c3 : c1); break;
      case 'cross': R(w * 0.42, 0, w * 0.16, h, c2); R(0, h * 0.4, w, h * 0.2, c2); break;
      case 'nordic': R(w * 0.25, 0, w * 0.14, h, c2); R(0, h * 0.4, w, h * 0.2, c2); break;
      case 'nordic2': R(w * 0.25, 0, w * 0.14, h, c2); R(0, h * 0.4, w, h * 0.2, c2); R(w * 0.285, 0, w * 0.07, h, c3); R(0, h * 0.455, w, h * 0.09, c3); break;
      case 'saltire': ctx.lineWidth = h * 0.22; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke(); break;
      case 'diag': ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); break;
      case 'diag2': ctx.lineWidth = h * 0.3; ctx.beginPath(); ctx.moveTo(-h * 0.1, h * 1.1); ctx.lineTo(w + h * 0.1, -h * 0.1); ctx.stroke(); break;
      case 'bend': ctx.lineWidth = h * 0.28; ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.lineTo(w, h * 0.1); ctx.stroke(); ctx.lineWidth = h * 0.1; ctx.strokeStyle = c3; ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.lineTo(w, h * 0.1); ctx.stroke(); break;
      case 'bendsin': ctx.lineWidth = h * 0.28; ctx.beginPath(); ctx.moveTo(0, h * 0.1); ctx.lineTo(w, h * 0.9); ctx.stroke(); break;
      case 'canton': R(0, 0, w * 0.45, h * 0.5, c2); break;
      case 'quarters': R(0, 0, w / 2, h / 2, c2); R(w / 2, h / 2, w / 2, h / 2, c2); break;
      case 'triangle': ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.5, h / 2); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); break;
      case 'chevron': ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.4, h / 2); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.fillStyle = c3; ctx.beginPath(); ctx.moveTo(0, h * 0.2); ctx.lineTo(w * 0.22, h / 2); ctx.lineTo(0, h * 0.8); ctx.closePath(); ctx.fill(); break;
      case 'border': R(w * 0.08, h * 0.12, w * 0.84, h * 0.76, c2); R(w * 0.14, h * 0.2, w * 0.72, h * 0.6, c1); break;
      case 'pall': ctx.lineWidth = h * 0.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.5, h * 0.5); ctx.lineTo(w, 0); ctx.moveTo(w * 0.5, h * 0.5); ctx.lineTo(w * 0.5, h); ctx.stroke(); break;
      case 'fesse': R(0, h * 0.25, w, h * 0.5, c2); break;
      case 'pale': R(w * 0.25, 0, w * 0.5, h, c2); break;
      case 'rhombus': ctx.beginPath(); ctx.moveTo(w / 2, h * 0.06); ctx.lineTo(w * 0.94, h / 2); ctx.lineTo(w / 2, h * 0.94); ctx.lineTo(w * 0.06, h / 2); ctx.closePath(); ctx.fill(); break;
      case 'halves': ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); break;
      case 'stripes_canton': for (let i = 1; i < 7; i += 2) R(0, (h * i) / 7, w, h / 7, c2); R(0, 0, w * 0.42, (h * 4) / 7, c3); break;
      case 'checker': { const n = 4, cw = w / (n * 2), ch = h / n; for (let y = 0; y < n; y++) for (let x = 0; x < n * 2; x++) if ((x + y) % 2) R(x * cw, y * ch, cw, ch, c2); break; }
      case 'sunburst': ctx.translate(w / 2, h / 2); for (let i = 0; i < 16; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, w, (i * Math.PI) / 8, ((i + 1) * Math.PI) / 8); ctx.closePath(); ctx.fill(); } ctx.translate(-w / 2, -h / 2); break;
      case 'hoist': R(0, 0, w * 0.3, h, c2); break;
    }
    // Emblem
    const side = ['triangle', 'canton', 'chevron', 'hoist', 'stripes_canton'].includes(f.pattern);
    const cx = f.pattern === 'canton' || f.pattern === 'stripes_canton' ? w * 0.2 : side ? w * 0.17 : w / 2, cy = f.pattern === 'canton' ? h * 0.25 : f.pattern === 'stripes_canton' ? h * 0.28 : h / 2;
    F.emblem(ctx, f.emblem, cx, cy, h * 0.2, c3);
    ctx.restore();
  };

  // Embleme: r = Radius, col = Farbe
  F.emblem = function (ctx, em, cx, cy, r, col) {
    if (!em || em === 'none') return;
    const real = ctx, S = Math.max(8, Math.ceil(r * 4)); // eigene Ebene, damit 'destination-out' nur das Emblem betrifft
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = S; ctx = tmp.getContext('2d');
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, r * 0.3); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const star = (x, y, rr, n) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, q = i % 2 ? rr * 0.42 : rr; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); ctx.fill(); };
    const circ = (x, y, rr) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); };
    switch (em) {
      case 'circle': circ(0, 0, r); break;
      case 'ring': ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); break;
      case 'diamond': ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.lineTo(r * 1.2, 0); ctx.lineTo(0, r * 1.2); ctx.lineTo(-r * 1.2, 0); ctx.closePath(); ctx.fill(); break;
      case 'cross': ctx.fillRect(-r * 0.3, -r, r * 0.6, r * 2); ctx.fillRect(-r, -r * 0.3, r * 2, r * 0.6); break;
      case 'star': star(0, 0, r * 1.15, 5); break;
      case 'stars3': star(-r * 1.5, 0, r * 0.7, 5); star(0, 0, r * 0.9, 5); star(r * 1.5, 0, r * 0.7, 5); break;
      case 'stars5': [[0, -r], [r, -r * 0.3], [r * 0.6, r * 0.8], [-r * 0.6, r * 0.8], [-r, -r * 0.3]].forEach(([x, y]) => star(x, y, r * 0.45, 5)); break;
      case 'ringstar': ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, 7); ctx.stroke(); star(0, 0, r * 0.8, 5); break;
      case 'crescent': ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.85, 0, 7); ctx.fill(); break;
      case 'moonstar': ctx.beginPath(); ctx.arc(-r * 0.3, 0, r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.82, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; star(r * 0.75, 0, r * 0.5, 5); break;
      case 'sun': circ(0, 0, r * 0.6); for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3); ctx.stroke(); } break;
      case 'crown': ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(-r, -r * 0.4); ctx.lineTo(-r * 0.5, r * 0.1); ctx.lineTo(0, -r * 0.8); ctx.lineTo(r * 0.5, r * 0.1); ctx.lineTo(r, -r * 0.4); ctx.lineTo(r, r * 0.7); ctx.closePath(); ctx.fill(); break;
      case 'sword': ctx.fillRect(-r * 0.12, -r * 1.2, r * 0.24, r * 2); ctx.fillRect(-r * 0.6, r * 0.1, r * 1.2, r * 0.2); ctx.fillRect(-r * 0.12, r * 0.8, r * 0.24, r * 0.4); break;
      case 'swords': [-0.7, 0.7].forEach((a) => { ctx.save(); ctx.rotate(a); ctx.fillRect(-r * 0.1, -r * 1.2, r * 0.2, r * 2.2); ctx.fillRect(-r * 0.5, r * 0.3, r, r * 0.18); ctx.restore(); }); break;
      case 'tree': ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.lineTo(r * 0.9, r * 0.1); ctx.lineTo(-r * 0.9, r * 0.1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(r * 1.1, r * 0.7); ctx.lineTo(-r * 1.1, r * 0.7); ctx.closePath(); ctx.fill(); ctx.fillRect(-r * 0.12, r * 0.7, r * 0.24, r * 0.5); break;
      case 'anchor': ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, r); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(r * 0.5, -r * 0.4); ctx.moveTo(-r, r * 0.3); ctx.quadraticCurveTo(-r * 0.7, r * 1.1, 0, r); ctx.quadraticCurveTo(r * 0.7, r * 1.1, r, r * 0.3); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -r, r * 0.22, 0, 7); ctx.stroke(); break;
      case 'bird': ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(r * 0.3, -r * 0.2); ctx.lineTo(r * 1.4, -r * 0.7); ctx.lineTo(r * 0.8, r * 0.2); ctx.lineTo(r * 0.3, r * 0.9); ctx.lineTo(0, r * 0.5); ctx.lineTo(-r * 0.3, r * 0.9); ctx.lineTo(-r * 0.8, r * 0.2); ctx.lineTo(-r * 1.4, -r * 0.7); ctx.lineTo(-r * 0.3, -r * 0.2); ctx.closePath(); ctx.fill(); break;
      case 'wheat': ctx.beginPath(); ctx.moveTo(0, r * 1.2); ctx.lineTo(0, -r * 0.9); ctx.stroke(); for (let i = 0; i < 4; i++) { [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.ellipse(sd * r * 0.35, -r * 0.7 + i * r * 0.45, r * 0.18, r * 0.35, sd * 0.6, 0, 7); ctx.fill(); }); } break;
      case 'triangle': ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 1.1, r * 0.9); ctx.lineTo(-r * 1.1, r * 0.9); ctx.closePath(); ctx.fill(); break;
      case 'bar': ctx.fillRect(-r * 1.4, -r * 0.25, r * 2.8, r * 0.5); break;
      case 'shield': ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, -r); ctx.lineTo(r, r * 0.2); ctx.quadraticCurveTo(r, r * 1.1, 0, r * 1.3); ctx.quadraticCurveTo(-r, r * 1.1, -r, r * 0.2); ctx.closePath(); ctx.fill(); break;
      case 'lion': ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.9, r * 0.5, 0, 0, 7); ctx.fill(); circ(-r * 0.8, -r * 0.5, r * 0.45); ctx.beginPath(); ctx.moveTo(r * 0.8, 0); ctx.quadraticCurveTo(r * 1.5, -r * 0.2, r * 1.2, -r); ctx.stroke(); ctx.fillRect(-r * 0.6, r * 0.4, r * 0.25, r * 0.7); ctx.fillRect(r * 0.4, r * 0.4, r * 0.25, r * 0.7); break;
      case 'tower': ctx.fillRect(-r * 0.7, -r * 0.4, r * 1.4, r * 1.6); [-0.7, -0.2, 0.3].forEach((x) => ctx.fillRect(r * x, -r * 0.9, r * 0.4, r * 0.5)); break;
      case 'gear': circ(0, 0, r * 0.75); for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 4); ctx.fillRect(-r * 0.2, -r * 1.15, r * 0.4, r * 0.5); ctx.restore(); } ctx.globalCompositeOperation = 'destination-out'; circ(0, 0, r * 0.3); break;
      case 'hex': ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); } ctx.closePath(); ctx.fill(); break;
      case 'heart': ctx.beginPath(); ctx.moveTo(0, r); ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.6, -r * 1.3, 0, -r * 0.4); ctx.bezierCurveTo(r * 0.6, -r * 1.3, r * 1.6, -r * 0.2, 0, r); ctx.fill(); break;
      case 'fleur': ctx.beginPath(); ctx.ellipse(0, -r * 0.3, r * 0.3, r * 0.8, 0, 0, 7); ctx.fill(); [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.ellipse(sd * r * 0.6, 0, r * 0.28, r * 0.65, sd * 0.7, 0, 7); ctx.fill(); }); ctx.fillRect(-r * 0.7, r * 0.45, r * 1.4, r * 0.2); break;
      case 'eye': ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.quadraticCurveTo(0, -r * 1.2, r * 1.3, 0); ctx.quadraticCurveTo(0, r * 1.2, -r * 1.3, 0); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; circ(0, 0, r * 0.45); break;
    }
    ctx.restore();
    real.drawImage(tmp, cx - S / 2, cy - S / 2);
  };

  F.canvas = function (f, w, h) {
    const c = document.createElement('canvas'); c.width = w || 60; c.height = h || 40;
    F.draw(c.getContext('2d'), c.width, c.height, f);
    return c;
  };
  const sprites = {};
  F.sprite = function (f, w, h) {
    const key = JSON.stringify(f) + w + 'x' + h;
    return sprites[key] || (sprites[key] = F.canvas(f, w * 2, h * 2));
  };
  F.url = function (f, w, h) {
    const key = JSON.stringify(f) + w + h;
    return cache[key] || (cache[key] = F.canvas(f, w, h).toDataURL());
  };
  // <img>-Element für UI
  F.img = function (f, w, h) {
    const i = document.createElement('img');
    i.className = 'flag'; i.src = F.url(f, (w || 30) * 2, (h || 20) * 2); i.width = w || 30; i.height = h || 20;
    return i;
  };

  // ---- Einheiten-Symbole (weiß mit dunkler Kontur), s = Kantenlänge ----
  F.unitIcon = function (ctx, type, cx, cy, s, embarked) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 16, s / 16);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fs = () => { ctx.fill(); ctx.stroke(); };
    if (embarked) { // Transportschiff ohne Kanonen
      ctx.beginPath(); ctx.moveTo(-7, 1); ctx.lineTo(7, 1); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); fs();
      ctx.beginPath(); ctx.rect(-4, -4, 8, 5); fs(); ctx.beginPath(); ctx.rect(-1, -7, 3, 3); fs();
    } else if (type === 'infantry') { // Helm
      ctx.beginPath(); ctx.arc(0, 2, 6.5, Math.PI, 0); ctx.lineTo(7.5, 3); ctx.lineTo(-7.5, 3); ctx.closePath(); fs();
      ctx.beginPath(); ctx.rect(-8, 3, 16, 2.2); fs();
    } else if (type === 'artillery') {
      ctx.save(); ctx.rotate(-0.45); ctx.beginPath(); ctx.rect(-6, -2.5, 14, 3.4); fs(); ctx.restore();
      ctx.beginPath(); ctx.arc(-1, 4.5, 3.6, 0, 7); fs();
    } else if (type === 'tank') {
      ctx.beginPath(); ctx.rect(-7, 0, 14, 5); fs();
      ctx.beginPath(); ctx.rect(-3.5, -4, 7, 4.2); fs();
      ctx.beginPath(); ctx.moveTo(3.5, -2); ctx.lineTo(9, -2.6); ctx.stroke();
    } else if (type === 'fighter') {
      ctx.beginPath(); ctx.moveTo(0, -7.5); ctx.lineTo(2, -1); ctx.lineTo(8, 3); ctx.lineTo(2, 2.5); ctx.lineTo(1.5, 6.5); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.lineTo(-1.5, 6.5); ctx.lineTo(-2, 2.5); ctx.lineTo(-8, 3); ctx.lineTo(-2, -1); ctx.closePath(); fs();
    } else if (type === 'destroyer') {
      ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(8, 1); ctx.lineTo(5, 5); ctx.lineTo(-6, 5); ctx.closePath(); fs();
      ctx.beginPath(); ctx.rect(-2, -3, 5, 4); fs();
    } else if (type === 'cruiser') {
      ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(8, 1); ctx.lineTo(5.5, 5.5); ctx.lineTo(-6.5, 5.5); ctx.closePath(); fs();
      ctx.beginPath(); ctx.rect(-4.5, -3, 4, 4); fs(); ctx.beginPath(); ctx.rect(1, -4.5, 3, 5.5); fs();
    } else if (type === 'battleship') {
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(6, 6); ctx.lineTo(-7, 6); ctx.closePath(); fs();
      ctx.beginPath(); ctx.rect(-6, -3.5, 4.5, 3.5); fs(); ctx.beginPath(); ctx.rect(1.5, -3.5, 4.5, 3.5); fs();
      ctx.beginPath(); ctx.rect(-1.5, -7, 3, 7); fs();
    }
    ctx.restore();
  };
})(window.HOG);
