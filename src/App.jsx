
import { useState, useEffect } from 'react';
import './App.css';

const API = 'https://hackhers-linkpulse.onrender.com/api/links';

function App() {
  const [links, setLinks] = useState([]);
  const [destination, setDestination] = useState('');
  const [alias, setAlias] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadLinks() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();

      setLinks(await response.json());
    } catch {
      setMessage('Could not connect to the backend. Please try again.');
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function createLink(event) {
    event.preventDefault();
    setMessage('');

    const url = destination.trim();
    const customAlias = alias.trim();

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error();
      }
    } catch {
      setMessage('Enter a valid URL starting with http:// or https://');
      return;
    }

    if (customAlias && !/^[a-zA-Z0-9_-]{3,30}$/.test(customAlias)) {
      setMessage('Alias must be 3–30 characters: letters, numbers, _ or -.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: url,
          alias: customAlias || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not create the link.');
      }

      setDestination('');
      setAlias('');
      setMessage('Short link created successfully!');
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

      setLinks(previous =>
        previous.map(link => link.code === code ? data : link)
      );
      setMessage(data.active ? 'Link enabled.' : 'Link disabled.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Short link copied!');
    } catch {
      setMessage('Could not copy the link. Please copy it manually.');
    }
  }

  async function deleteLink(code) {
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await fetch(`${API}/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Delete is not supported by the backend yet.');
      }

      setLinks(previous => previous.filter(link => link.code !== code));
      setMessage('Link deleted.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  const totalClicks = links.reduce(
    (sum, link) => sum + (Number(link.clicks) || 0), 0
  );
  const activeCount = links.filter(link => link.active).length;

  const visibleLinks = links.filter(link => {
    const matchesSearch =
      (link.destination || '').toLowerCase().includes(search.toLowerCase()) ||
      (link.shortUrl || '').toLowerCase().includes(search.toLowerCase()) ||
      (link.code || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && link.active) ||
      (filter === 'disabled' && !link.active);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">↗</span>
          <span>LinkPulse</span>
        </div>
        <span className="team-label">hackHERS · Smart Link Management</span>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <p className="eyebrow">YOUR LINKS, UNDER CONTROL</p>
          <h1>Short links. <span>Clear insights.</span></h1>
          <p className="subtitle">
            Create, organize, and track your links from one dashboard.
          </p>
        </section>

        <section className="stats">
          <div className="stat-card">
            <p>Total Links</p>
            <h2>{links.length}</h2>
          </div>
          <div className="stat-card">
            <p>Active Links</p>
            <h2>{activeCount}</h2>
          </div>
          <div className="stat-card">
            <p>Total Clicks</p>
            <h2>{totalClicks}</h2>
          </div>
        </section>

        <section className="create-card">
          <h2>Create a short link</h2>
          <p>Turn a long URL into a convenient shareable link.</p>

          <form onSubmit={createLink} className="create-form">
            <input
              type="url"
              placeholder="https://example.com/your-long-url"
              value={destination}
              onChange={event => setDestination(event.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={alias}
              onChange={event => setAlias(event.target.value)}
              maxLength={30}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : '+ Create Link'}
            </button>
          </form>

          <p className="helper-text">
            Example alias: my-project. Leave blank for an automatic short code.
          </p>

          {message && <p className="message" role="status">{message}</p>}
        </section>

        <section className="links-section">
          <div className="section-heading">
            <div>
              <h2>Your Links</h2>
              <p>Search and manage your shortened URLs.</p>
            </div>
            <button className="refresh-button" onClick={loadLinks}>
              ↻ Refresh
            </button>
          </div>

          <div className="link-tools">
            <input
              type="search"
              placeholder="Search URL or alias..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <select value={filter} onChange={event => setFilter(event.target.value)}>
              <option value="all">All links</option>
              <option value="active">Active only</option>
              <option value="disabled">Disabled only</option>
            </select>
          </div>

          {visibleLinks.length === 0 ? (
            <div className="empty-state">
              <h3>{links.length ? 'No matching links' : 'No links yet'}</h3>
              <p>
                {links.length
                  ? 'Try another search or filter.'
                  : 'Create your first short link above.'}
              </p>
            </div>
          ) : (
            <div className="links-list">
              {visibleLinks.map(link => (
                <article className="link-card" key={link.code}>
                  <div className="link-info">
                    <a
                      className="short-url"
                      href={link.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.shortUrl}
                    </a>

                    <p className="destination">{link.destination}</p>

                    <div className="link-meta">
                      <span>{link.clicks || 0} clicks</span>
                      <span className={link.active ? 'active' : 'inactive'}>
                        {link.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="qr-container">
                      <img
                        className="qr-image"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link.shortUrl || '')}`}
                        alt={`QR code for ${link.shortUrl}`}
                        loading="lazy"
                      />
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link.shortUrl || '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open QR
                      </a>
                    </div>
                  </div>

                  <div className="link-actions">
                    <button onClick={() => copyLink(link.shortUrl)}>Copy</button>
                    <button
                      className="toggle-button"
                      onClick={() => toggleLink(link.code)}
                    >
                      {link.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteLink(link.code)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer>LinkPulse · Built by hackHERS</footer>
      </main>
    </div>
  );
}

export default App;
