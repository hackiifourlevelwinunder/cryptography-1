
const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || "DEFAULT_SECRET";

let history = [];

function getISTDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60000);
}

function getBaseTime() {
  const d = getISTDate();
  const base = new Date(d);
  base.setHours(5, 30, 0, 0);
  if (d < base) base.setDate(base.getDate() - 1);
  return base;
}

function getPeriod() {
  const now = getISTDate();
  const base = getBaseTime();
  const roundIndex = Math.floor((now - base) / 60000);

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `${y}${m}${d}${100010000 + roundIndex}`;
}

function generateNumber(period) {
  const seed = crypto
    .createHash("sha256")
    .update(SECRET + period + history.map(h => h.number).join(""))
    .digest("hex");

  return parseInt(seed.slice(-8), 16) % 10;
}

function getResult() {
  const period = getPeriod();
  const now = getISTDate();
  const second = now.getSeconds();

  let entry = history.find(h => h.period === period);
  if (!entry) {
    const number = generateNumber(period);
    entry = { period, number, time: now };
    history.unshift(entry);
    if (history.length > 20) history.pop();
  }

  return {
    period,
    number: entry.number,
    preview: second >= 30,
    seconds: second
  };
}

app.get("/api/current", (req, res) => {
  res.json(getResult());
});

app.get("/api/history", (req, res) => {
  res.json(history);
});

app.listen(PORT, () => {
  console.log("Crypto RNG running on port", PORT);
});
