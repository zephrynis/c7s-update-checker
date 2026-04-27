require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

app.get("/updatecheck", async (req, res) => {
  const sxcres = await fetch(
    `https://www.sourcexchange.net/api/products/${process.env.SXC_PRODUCT_ID}/releases`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SXC_API_TOKEN}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  const sxcjson = await sxcres.json();
  const cleanData = sxcjson.map(
    ({ id, product_id, downloads_count, ...keepRemaining }) => keepRemaining,
  );
  res.json(cleanData);
});

app.listen(port, () => {
  console.log(`Update checker running on port ${port}`);
});
