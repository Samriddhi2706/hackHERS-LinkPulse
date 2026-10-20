
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = (
  process.env.BASE_URL || `http://localhost:${PORT}`
).replace(/\/$/, "");

app.use(cors());
app.use(express.json());

const links = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

function validDestination(destination) {
  try {
    const url = new URL(destination);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Get all links
app.get("/api/links", (req, res) => {
  res.json(Array.from(links.values()));
});

// Create a short link with an optional custom alias
app.post("/api/links", (req, res) => {
  const { destination, alias } = req.body;

  if (!destination || !validDestination(destination)) {
    return res.status(400).json({
      error: "Enter a valid HTTP or HTTPS destination URL."
    });
  }

  let code = alias ? String(alias).trim() : generateCode();

  if (
    !/^[a-zA-Z0-9_-]{3,30}$/.test(code)
  ) {
    return res.status(400).json({
      error: "Alias must be 3–30 characters using letters, numbers, - or _."
    });
  }

  if (links.has(code)) {
    return res.status(409).json({
      error: "That alias is already taken. Try another."
    });
  }

  // Avoid accidentally overwriting an existing generated code
  if (!alias) {
    while (links.has(code)) {
      code = generateCode();
    }
  }

  const link = {
    code,
    destination: new URL(destination).href,
    shortUrl: `${BASE_URL}/${code}`,
    clicks: 0,
    active: true,
    createdAt: new Date().toISOString()
  };

  links.set(code, link);
  res.status(201).json(link);
});

// Enable or disable a link
app.patch("/api/links/:code", (req, res) => {
  const link = links.get(req.params.code);

  if (!link) {
    return res.status(404).json({ error: "Link not found." });
  }

  link.active = !link.active;
  res.json(link);
});

// Delete a link
app.delete("/api/links/:code", (req, res) => {
  if (!links.has(req.params.code)) {
    return res.status(404).json({ error: "Link not found." });
  }

  links.delete(req.params.code);
  res.json({ message: "Link deleted successfully." });
});

// Redirect and count clicks
app.get("/:code", (req, res) => {
  const link = links.get(req.params.code);

  if (!link) {
    return res.status(404).send("Short link not found.");
  }

  if (!link.active) {
    return res.status(403).send("This short link is disabled.");
  }

  link.clicks++;
  res.redirect(link.destination);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LinkPulse backend running on port ${PORT}`);
});
