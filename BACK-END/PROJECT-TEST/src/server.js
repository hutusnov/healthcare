// src/server.js
const app = require("./app");
const config = require("./config/env");

const HOST = "0.0.0.0";

app.listen(config.port, HOST, () => {
  console.log(`API running on http://${HOST}:${config.port}`);
});
