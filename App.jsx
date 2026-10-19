
import { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:3001/api/links';

function App() {
  const [links, setLinks] = useState([]);
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load links from the backend
  async function loadLinks() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error('Could not load links');
      }

      const data = await response.json();
      setLinks(data);
    } catch (error) {
      setMessage('Cannot connect to backend. Make sure server.js is running.');
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  // Create a new short link
  async function createLink(event) {
    event.preventDefault();
    setMessage('');

    const url = destination.trim();

    if (!url) {
      setMessage('Please enter a destination URL.');
      return;
    }

    let validUrl;

    try {
      validUrl = new URL(url);

      if (validUrl.protocol !== 'http:' &&
          validUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      setMessage('Enter a valid URL starting with https:// or http://');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ destination: url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not create link');
      }

      setLinks((previous) => [data, ...previous]);
      setDestination('');
      setMessage('Short link created successfully!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Enable or disable a link
  async function toggleLink(code) {
    try {
      const response = await fetch(`${API}/${code}`, {
        method: 'PATCH'
      });

      const updatedLink = await response.json();

      if (!response.ok) {
        throw new Error(updatedLink.error || 'Could not update link');
      }

      setLinks((previous) =>
        previous.map((link) =>
          link.code === code ? updatedLink : link
        )
      );

      setMessage(
        updatedLink.active ? 'Link enabled.' : 'Link disabled.'
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Copy a short link
  async function copyLink(shortUrl) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setMessage('Short link copied!');
    } catch {
      setMessage('Copy failed. Open the short link and copy it manually.');
    }
  }

  const totalLinks = links.length;
  const activeLinks = links.filter((link) => link.active).length;
  const totalClicks = links.reduce(
    (total, link) => total + link.clicks,
    0
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">↗</span>
          <span>LinkPulse</span>
        </div>
        <span className="team-label">hackHERS · URL Management</span>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <p className="eyebrow">LINK MANAGEMENT PLATFORM</p>
          <h1>Short links. <span>Clear insights.</span></h1>
          <p className="subtitle">
            Create, manage, and track your links from one simple dashboard.
          </p>
        </section>

        <section className="stats">
          <div className="stat-card">
            <p>Total Links</p>
            <h2>{totalLinks}</h2>
          </div>

          <div className="stat-card">
            <p>Active Links</p>
            <h2>{activeLinks}</h2>
          </div>

          <div className="stat-card">
            <p>Total Clicks</p>
            <h2>{totalClicks}</h2>
          </div>
        </section>

        <section className="create-card">
          <h2>Create a short link</h2>
          <p>Paste a long URL to generate a shareable short link.</p>

          <form onSubmit={createLink} className="create-form">
            <input
              type="url"
              placeholder="https://example.com/your-long-url"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : '+ Create Link'}
            </button>
          </form>

          {message && (
            <p className="message" role="status">{message}</p>
          )}
        </section>

        <section className="links-section">
          <div className="section-heading">
            <div>
              <h2>Your Links</h2>
              <p>Manage your shortened URLs.</p>
            </div>

            <button className="refresh-button" onClick={loadLinks}>
              ↻ Refresh
            </button>
          </div>

          {links.length === 0 ? (
            <div className="empty-state">
              <h3>No links yet</h3>
              <p>Create your first short link using the form above.</p>
            </div>
          ) : (
            <div className="links-list">
              {links.map((link) => (
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

                    <p className="destination">
                      {link.destination}
                    </p>

                    <div className="link-meta">
                      <span>{link.clicks} clicks</span>
                      <span className={link.active ? 'active' : 'inactive'}>
                        {link.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="link-actions">
                    <button
                      onClick={() => copyLink(link.shortUrl)}
                    >
                      Copy
                    </button>

                    <button
                      className="toggle-button"
                      onClick={() => toggleLink(link.code)}
                    >
                      {link.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer>
          LinkPulse · Built by hackHERS
        </footer>
      </main>
    </div>
  );
}

export default App;
