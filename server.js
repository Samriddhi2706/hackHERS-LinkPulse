
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());

// Render provides the port through process.env.PORT
const PORT = process.env.PORT || 3000;

// Your deployed backend URL
const BASE_URL = (
  process.env.BASE_URL || 'https://hackhers-linkpulse.onrender.com'
).replace(/\/$/, '');

// Temporary in-memory storage
const links = new Map();

// Generate a random short code
function generateCode() {
  return crypto.randomBytes(4).toString('hex');
}

// Convert stored link data into the frontend response format
function formatLink(link) {
  return {
    code: link.code,
    alias: link.code,
    destination: link.destination,
    shortUrl: `${BASE_URL}/${link.code}`,
    clicks: link.clicks,
    active: link.active,
    createdAt: link.createdAt
  };
}

// Home route: check whether the server is running
app.get('/', (req, res) => {
  res.send('LinkPulse backend is running!');
});

// Get all links
app.get('/api/links', (req, res) => {
  const result = Array.from(links.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(formatLink);

  res.json(result);
});

// Create a short link, optionally with a custom alias
app.post('/api/links', (req, res) => {
  const destination =
    typeof req.body.destination === 'string'
      ? req.body.destination.trim()
      : '';

  const requestedAlias =
    typeof req.body.alias === 'string'
      ? req.body.alias.trim()
      : '';

  // Validate the destination URL
  let parsedUrl;

  try {
    parsedUrl = new URL(destination);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return res.status(400).json({
      error: 'Enter a valid HTTP or HTTPS destination URL.'
    });
  }

  let code;

  if (requestedAlias) {
    // Allow letters, numbers, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(requestedAlias)) {
      return res.status(400).json({
        error: 'Alias must be 3–30 characters using letters, numbers, _ or -.'
      });
    }

    code = requestedAlias;

    if (links.has(code)) {
      return res.status(409).json({
        error: 'This custom alias is already in use. Choose another one.'
      });
    }
  } else {
    // Generate a unique automatic code
    do {
      code = generateCode();
    } while (links.has(code));
  }

  const link = {
    code,
    destination,
    clicks: 0,
    active: true,
    createdAt: Date.now()
  };

  links.set(code, link);

  return res.status(201).json(formatLink(link));
});

// Enable or disable a link
app.patch('/api/links/:code', (req, res) => {
  const link = links.get(req.params.code);

  if (!link) {
    return res.status(404).json({
      error: 'Link not found.'
    });
  }

  link.active = !link.active;

  return res.json(formatLink(link));
});

// Delete a link
app.delete('/api/links/:code', (req, res) => {
  const code = req.params.code;

  if (!links.has(code)) {
    return res.status(404).json({
      error: 'Link not found.'
    });
  }

  links.delete(code);

  return res.json({
    message: 'Link deleted successfully.',
    code
  });
});

// Redirect visitors to the original destination
app.get('/:code', (req, res) => {
  const code = req.params.code;
  const link = links.get(code);

  if (!link) {
    return res.status(404).send('Short link not found.');
  }

  if (!link.active) {
    return res.status(410).send('This short link has been disabled.');
  }

  link.clicks += 1;

  return res.redirect(link.destination);
});

// Handle unexpected errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  res.status(500).json({
    error: 'An unexpected server error occurred.'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`LinkPulse backend running on port ${PORT}`);
});
