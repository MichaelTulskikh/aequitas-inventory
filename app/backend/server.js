const express = require("express");
const app = express();

app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/", (_, res) => res.send("Aequitas Inventory API"));
app.get("/test", (_, res) => res.send("Test passed"));

app.listen(3000, () => console.log("Listening on :3000"));
