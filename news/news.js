(function () {
  const list = document.getElementById('news-list');
  const updated = document.getElementById('news-updated');
  const count = document.getElementById('news-count');
  const empty = document.getElementById('news-empty');
  const search = document.getElementById('news-search');
  const category = document.getElementById('news-category');
  const source = document.getElementById('news-source');
  let items = [];

  const esc = (value) => String(value || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]);
  const date = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? '' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  function render() {
    const term = search.value.trim().toLowerCase();
    const filtered = items.filter(item => {
      const text = [item.title, item.summary, ...(item.tags || [])].join(' ').toLowerCase();
      return (!term || text.includes(term)) && (!category.value || item.category === category.value) && (!source.value || item.source === source.value);
    });
    count.textContent = `${filtered.length} update${filtered.length === 1 ? '' : 's'}`;
    empty.hidden = Boolean(filtered.length);
    list.innerHTML = filtered.map(item => `
      <article class="news-card">
        <div class="news-card-meta"><span>${esc(item.category || 'India')}</span><time datetime="${esc(item.published_at)}">${date(item.published_at)}</time></div>
        <h2>${esc(item.title)}</h2>
        <p>${esc(item.summary || 'Open the source for the full update.')}</p>
        <div class="news-card-footer"><span>${esc(item.source || 'Source')}</span>${item.blog_url ? `<a href="${esc(item.blog_url)}">Read analysis <span aria-hidden="true">→</span></a>` : `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Read source <span aria-hidden="true">→</span></a>`}</div>
      </article>`).join('');
  }
  function options(select, values) {
    values.forEach(value => select.insertAdjacentHTML('beforeend', `<option value="${esc(value)}">${esc(value)}</option>`));
  }
  fetch('data/news.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('Could not load feed'); return response.json(); })
    .then(data => {
      items = Array.isArray(data.items) ? data.items : [];
      options(category, [...new Set(items.map(item => item.category).filter(Boolean))].sort());
      options(source, [...new Set(items.map(item => item.source).filter(Boolean))].sort());
      updated.textContent = data.generated_at ? `Updated ${date(data.generated_at)} · Sources: PIB and Google News` : 'Latest updates';
      render();
    })
    .catch(() => { updated.textContent = 'Updates are being prepared. Please check back shortly.'; empty.hidden = false; });
  [search, category, source].forEach(control => control.addEventListener('input', render));
}());
