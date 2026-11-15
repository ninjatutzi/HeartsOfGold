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
    ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = c2;
    switch (f.pattern) {
      case 'h2': ctx.fillRect(0, h / 2, w, h / 2); break;
      case 'h3': ctx.fillStyle = c2; ctx.fillRect(0, h / 3, w, h / 3); ctx.fillStyle = c3; ctx.fillRect(0, (2 * h) / 3, w, h / 3); break;
      case 'v3': ctx.fillStyle = c2; ctx.fillRect(w / 3, 0, w / 3, h); ctx.fillStyle = c3; ctx.fillRect((2 * w) / 3, 0, w / 3, h); break;
      case 'cross': ctx.fillRect(w * 0.42, 0, w * 0.16, h); ctx.fillRect(0, h * 0.4, w, h * 0.2); break;
      case 'nordic': ctx.fillRect(w * 0.25, 0, w * 0.14, h); ctx.fillRect(0, h * 0.4, w, h * 0.2); break;
      case 'saltire':
        ctx.strokeStyle = c2; ctx.lineWidth = h * 0.22;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke(); break;
      case 'diag': ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); break;
      case 'canton': ctx.fillRect(0, 0, w * 0.45, h * 0.5); break;
      case 'triangle': ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.5, h / 2); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); break;
    }
    // Emblem
    const cx = f.pattern === 'triangle' || f.pattern === 'canton' ? w * 0.2 : w / 2, cy = f.pattern === 'canton' ? h * 0.25 : h / 2;
    const r = h * 0.2;
    ctx.fillStyle = c3; ctx.strokeStyle = c3;
    if (f.emblem === 'circle') { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); }
    else if (f.emblem === 'diamond') { ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.2); ctx.lineTo(cx + r * 1.2, cy); ctx.lineTo(cx, cy + r * 1.2); ctx.lineTo(cx - r * 1.2, cy); ctx.closePath(); ctx.fill(); }
    else if (f.emblem === 'cross') { ctx.fillRect(cx - r * 0.3, cy - r, r * 0.6, r * 2); ctx.fillRect(cx - r, cy - r * 0.3, r * 2, r * 0.6); }
    else if (f.emblem === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r * 1.15; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
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
})(window.HOG);
