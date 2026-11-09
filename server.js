const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const OTC_KEY = process.env.OTC_CHARTS_API_KEY;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Saiful Live Signal",
    regular: "available",
    otc: "configured"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// REGULAR FOREX DATA
app.get("/api/market", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Twelve Data API key missing"
      });
    }

    const symbol = req.query.symbol || "EUR/USD";

    if (!/^[A-Za-z0-9/_.:-]{3,30}$/.test(symbol)) {
      return res.status(400).json({
        error: "Invalid symbol"
      });
    }

    const url = new URL(
      "https://api.twelvedata.com/time_series"
    );

    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", "1min");
    url.searchParams.set("outputsize", "30");
    url.searchParams.set("apikey", API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.values) {
      return res.status(502).json({
        error: data.message || "Market data unavailable"
      });
    }

    res.json({
      status: "success",
      market: "regular",
      symbol,
      candles: data.values,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Regular market request failed"
    });
  }
});

// QUOTEX OTC DATA
app.get("/api/otc", async (req, res) => {
  try {
    if (!OTC_KEY) {
      return res.status(500).json({
        error: "OTC API key missing"
      });
    }

    const symbol = req.query.symbol || "EURUSD_otc";
    const limit = Number(req.query.limit || 30);

    if (!/^[A-Za-z0-9_]{3,30}$/.test(symbol)) {
      return res.status(400).json({
        error: "Invalid OTC symbol"
      });
    }

    if (!Number.isInteger(limit) || limit < 2 || limit > 100) {
      return res.status(400).json({
        error: "Limit must be between 2 and 100"
      });
    }

    const url = new URL(
      "https://otcharts.com/v1/candles"
    );

    url.searchParams.set("venue", "otc");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", "1m");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${OTC_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok || !Array.isArray(data.candles)) {
      return res.status(502).json({
        error: data.message || "OTC data unavailable"
      });
    }

    res.json({
      status: "success",
      market: "otc",
      symbol,
      candles: data.candles,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: "OTC market request failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    "Saiful Live Signal running on port " + PORT
  );
});
