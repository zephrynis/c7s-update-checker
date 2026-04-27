require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

app.get("/updatecheck", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Update checker running on port ${port}`);
});
