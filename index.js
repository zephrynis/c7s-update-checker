require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const SXC_API_BASE =
  process.env.SXC_API_BASE || "https://www.sourcexchange.net/api";

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS, 10) || 300000;
const cache = new Map();

/**
 * Fetches and cleans product releases from SourceXchange
 */
async function getProductReleases(productId, token) {
  const response = await fetch(
    `${SXC_API_BASE}/products/${productId}/releases`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`SXC API responded with ${response.status}`);
  }

  const releases = await response.json();

  // Return only necessary metadata, stripping IDs and counts
  return releases.map(
    ({ id, product_id, downloads_count, ...metadata }) => metadata,
  );
}

/**
 * Gets product releases, using cache if available and not expired
 */
async function getCachedProductReleases(productId, token) {
  const now = Date.now();
  const cached = cache.get(productId);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log(`Cache hit for product: ${productId}`);
    return cached.data;
  }

  console.log(`Cache miss for product: ${productId}. Fetching fresh data...`);
  const data = await getProductReleases(productId, token);
  cache.set(productId, { data, timestamp: now });
  return data;
}

app.get("/updatecheck", async (req, res) => {
  try {
    const { SXC_PRODUCT_ID, SXC_API_TOKEN } = process.env;

    if (!SXC_PRODUCT_ID || !SXC_API_TOKEN) {
      console.error("Missing SXC_PRODUCT_ID or SXC_API_TOKEN in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const releases = await getCachedProductReleases(SXC_PRODUCT_ID, SXC_API_TOKEN);
    res.json(releases);
  } catch (error) {
    console.error("Update check failed:", error.message);
    res.status(502).json({ error: "Failed to fetch updates from upstream" });
  }
});

app.listen(PORT, () => {
  console.log(`Update checker running on port ${PORT}`);
});
