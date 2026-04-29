// practice/next.js
// Adds a "Next Practice" button on practice pages by reading the practice hub
(async function(){
  try {
    const hubPath = '/practice/cognitive-tests.html';
    const resp = await fetch(hubPath, {cache: 'no-store'});
    if (!resp.ok) return;
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const links = [];
    anchors.forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
      try {
        const abs = new URL(href, location.origin + hubPath).pathname;
        if (!abs.endsWith('.html')) return;
        if (!abs.startsWith('/practice/')) return;
        if (!links.includes(abs)) links.push(abs);
      } catch (e) { /* ignore invalid */ }
    });
    if (!links.length) return;

    const current = location.pathname.replace(/\\/+$/, '');
    let idx = links.indexOf(current);
    if (idx === -1) {
      idx = links.findIndex(p => p.endsWith(current) || current.endsWith(p));
    }

    let nextHref = '/practice/cognitive-tests.html';
    if (idx >= 0 && idx < links.length - 1) nextHref = links[idx + 1];
    else if (idx === links.length - 1) nextHref = '/practice/cognitive-tests.html';
    else nextHref = links[0];

    const insertTargets = ['.synq-controls', '.btn-row', '.drill-footer', '.practice-actions', '.practice-card'];
    let placed = false;
    for (const sel of insertTargets) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const a = document.createElement('a');
      a.className = (sel === '.btn-row') ? 'btn btn-gold btn-sm' : 'btn btn-gold';
      a.textContent = 'Next Practice';
      a.href = new URL(nextHref, location.origin).pathname;
      a.style.marginLeft = '8px';
      el.appendChild(a);
      placed = true;
      break;
    }

    if (!placed) {
      const main = document.querySelector('main') || document.body;
      const wrap = document.createElement('div');
      wrap.style.textAlign = 'center';
      wrap.style.marginTop = '14px';
      const a = document.createElement('a');
      a.className = 'btn btn-gold';
      a.href = new URL(nextHref, location.origin).pathname;
      a.textContent = 'Next Practice';
      wrap.appendChild(a);
      main.appendChild(wrap);
    }
  } catch (err) {
    console.error('practice/next.js error', err);
  }
})();
