
import express from "express";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 3001;
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Temporary storage for links
const links = new Map();

// Generate a short code
function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

// Get all links
app.get("/api/links", (req, res) => {
  res.json(Array.from(links.values()));
});

// Create a short link
app.post("/api/links", (req, res) => {
  const { destination } = req.body;

  if (!destination) {
    return res.status(400).json({
      error: "Destination URL is required"
    });
  }

  let destinationUrl;

  try {
    destinationUrl = new URL(destination);

    if (
      destinationUrl.protocol !== "http:" &&
      destinationUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid URL protocol");
    }
  } catch {
    return res.status(400).json({
      error: "Enter a valid HTTP or HTTPS URL"
    });
  }

  let code = generateCode();

  while (links.has(code)) {
    code = generateCode();
  }

  const link = {
    code,
    destination: destinationUrl.href,
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
    return res.status(404).json({
      error: "Link not found"
    });
  }

  link.active = !link.active;

  res.json(link);
});

// Redirect visitors through a short link
app.get("/:code", (req, res) => {
  const link = links.get(req.params.code);

  if (!link) {
    return res.status(404).send("Short link not found");
  }

  if (!link.active) {
    return res.status(403).send("This short link is disabled");
  }

  link.clicks++;

  res.redirect(link.destination);
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`LinkPulse backend running on port ${PORT}`);
});
