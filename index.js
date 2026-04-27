require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const SXC_API_BASE =
  process.env.SXC_API_BASE || "https://www.sourcexchange.net/api";

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

app.get("/updatecheck", async (req, res) => {
  try {
    const { SXC_PRODUCT_ID, SXC_API_TOKEN } = process.env;

    if (!SXC_PRODUCT_ID || !SXC_API_TOKEN) {
      console.error("Missing SXC_PRODUCT_ID or SXC_API_TOKEN in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const releases = await getProductReleases(SXC_PRODUCT_ID, SXC_API_TOKEN);
    res.json(releases);
  } catch (error) {
    console.error("Update check failed:", error.message);
    res.status(502).json({ error: "Failed to fetch updates from upstream" });
  }
});

app.listen(PORT, () => {
  console.log(`Update checker running on port ${PORT}`);
});
