const express = require("express");
const path = require("node:path");

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");

app.get("/health", (_request, response) => {
  response.json({ status: "ok", version: "1.0.0" });
});

app.use(express.static(publicDirectory));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`TaskFlow est disponible sur le port ${port}.`);
  });
}

module.exports = app;
