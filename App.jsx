
import { useState, useEffect, useMemo } from 'react';
import './App.css';

const API = 'https://hackhers-linkpulse.onrender.com/api/links';

function App() {
  const [links, setLinks] = useState([]);
  const [destination, setDestination] = useState('');
  const [alias, setAlias] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [qrLink, setQrLink] = useState(null);

  async function loadLinks() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error('Could not load links.');
      setLinks(await response.json());
    } catch {
      setMessage('Could not connect to the backend. Please refresh.');
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function createLink(event) {
    event.preventDefault();
    setMessage('');

    const url = destination.trim();
    if (!url) return setMessage('Enter a destination URL.');

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return setMessage('Use an HTTP or HTTPS URL.');
      }
    } catch {
      return setMessage('Enter a valid URL starting with https://');
    }

    setLoading(true);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: url,
          alias: alias.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create link.');

      setDestination('');
      setAlias('');
      setMessage('Your short link is ready!');
      await loadLinks();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLink(code) {
    try {
      const response = await fetch(`${API}/${encodeURIComponent(code)}`, {
        method: 'PATCH'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed.');
      setLinks(previous => previous.map(link => link.code === code ? data : link));
      setMessage(data.active ? 'Link enabled.' : 'Link disabled.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteLink(code) {
    if (!window.confirm('Delete this short link? This cannot be undone.')) return;

    try {
      const response = await fetch(`${API}/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Delete failed.');

      setLinks(previous => previous.filter(link => link.code !== code));
      if (qrLink?.code === code) setQrLink(null);
      setMessage('Link deleted.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Short link copied!');
    } catch {
      setMessage('Copy failed. Copy the URL manually: ' + url);
    }
  }

  const totalClicks = links.reduce((sum, link) => sum + (Number(link.clicks) || 0), 0);
  const activeCount = links.filter(link => link.active).length;

  const visibleLinks = useMemo(() => {
    const result = links.filter(link => {
      const term = search.toLowerCase();
      const matches = `${link.shortUrl} ${link.destination} ${link.code}`
        .toLowerCase().includes(term);

      return matches &&
        (filter === 'all' ||
        (filter === 'active' && link.active) ||
        (filter === 'disabled' && !link.active));
    });

    result.sort((a, b) => {
      if (sort === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [links, search, filter, sort]);

  function qrImage(url) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#home"><span className="brand-icon">↗</span> LinkPulse</a>
        <p className="side-label">WORKSPACE</p>
        <a className="side-link selected" href="#home">▦ &nbsp; Overview</a>
        <a className="side-link" href="#links">↗ &nbsp; My links</a>
        <div className="sidebar-bottom">
          <div className="team-avatar">H</div>
          <div><strong>hackHERS</strong><small>LinkPulse workspace</small></div>
        </div>
      </aside>

      <main className="dashboard" id="home">
        <header className="topbar">
          <div><span className="eyebrow">YOUR WORKSPACE</span><h1>Link dashboard</h1></div>
          <button className="secondary-button" onClick={loadLinks}>↻ Refresh</button>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">LINK MANAGEMENT PLATFORM</p>
            <h2>Every link has a story.<br /><span>Make yours count.</span></h2>
            <p>Create, organize, and track your links in one place.</p>
          </div>
          <div className="welcome-symbol">↗</div>
        </section>

        <section className="stats">
          <article className="stat-card"><span className="stat-icon purple">↗</span><p>Total links</p><h2>{links.length}</h2><small>All created links</small></article>
          <article className="stat-card"><span className="stat-icon green">✓</span><p>Active links</p><h2>{activeCount}</h2><small>Ready to redirect</small></article>
          <article className="stat-card"><span className="stat-icon orange">◎</span><p>Total clicks</p><h2>{totalClicks}</h2><small>Tracked redirects</small></article>
        </section>

        <section className="create-card">
          <div className="card-heading"><div><h2>Create a short link</h2><p>Turn a long URL into something easy to share.</p></div><span className="create-icon">✦</span></div>
          <form onSubmit={createLink}>
            <label>Destination URL</label>
            <input type="url" placeholder="https://example.com/your-long-url" value={destination} onChange={e => setDestination(e.target.value)} required />
            <label>Custom alias <span className="optional">(optional)</span></label>
            <div className="alias-input"><span>your-domain/</span><input value={alias} onChange={e => setAlias(e.target.value)} placeholder="my-awesome-link" pattern="[a-zA-Z0-9_-]{3,30}" title="3–30 letters, numbers, hyphens or underscores" /></div>
            <div className="form-bottom"><small>Leave the alias blank to generate one automatically.</small><button type="submit" disabled={loading}>{loading ? 'Creating...' : '+ Create link'}</button></div>
          </form>
          {message && <p className="message" role="status">{message}</p>}
        </section>

        <section className="links-section" id="links">
          <div className="section-heading"><div><h2>Your links</h2><p>Search, organize, and manage your shortened URLs.</p></div><span className="link-count">{visibleLinks.length} links</span></div>
          <div className="toolbar">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕  Search URLs or aliases..." aria-label="Search links" />
            <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter links"><option value="all">All links</option><option value="active">Active</option><option value="disabled">Disabled</option></select>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort links"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="clicks">Most clicks</option></select>
          </div>

          {visibleLinks.length === 0 ? (
            <div className="empty-state"><span>↗</span><h3>{links.length ? 'No matching links' : 'Your link journey starts here'}</h3><p>{links.length ? 'Try another search or filter.' : 'Create your first short link above.'}</p></div>
          ) : (
            <div className="links-list">
              {visibleLinks.map(link => (
                <article className="link-card" key={link.code}>
                  <div className="link-mark">↗</div>
                  <div className="link-info">
                    <a className="short-url" href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a>
                    <p className="destination">{link.destination}</p>
                    <div className="link-meta"><span>◎ {link.clicks || 0} clicks</span><span className={link.active ? 'active' : 'inactive'}>{link.active ? '● Active' : '● Disabled'}</span></div>
                  </div>
                  <div className="link-actions">
                    <button onClick={() => copyLink(link.shortUrl)}>Copy</button>
                    <button onClick={() => setQrLink(link)}>QR code</button>
                    <button onClick={() => toggleLink(link.code)}>{link.active ? 'Disable' : 'Enable'}</button>
                    <button className="delete-button" onClick={() => deleteLink(link.code)} aria-label="Delete link">✕</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {qrLink && (
          <div className="modal-backdrop" onClick={() => setQrLink(null)}>
            <section className="qr-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setQrLink(null)}>✕</button>
              <h2>Your QR code</h2><p>Scan to open this short link.</p>
              <img src={qrImage(qrLink.shortUrl)} alt={`QR code for ${qrLink.shortUrl}`} />
              <strong>{qrLink.shortUrl}</strong>
              <a className="download-button" href={qrImage(qrLink.shortUrl)} target="_blank" rel="noreferrer">Open / save QR image ↗</a>
            </section>
          </div>
        )}

        <footer>LinkPulse <span>·</span> Built with care by hackHERS</footer>
      </main>
    </div>
  );
}

export default App;
