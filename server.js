const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const app = express();

/* 🔧 FIX: Use CORS only once */
app.use(
  cors({
    origin: "*",
  }),
);

app.use(morgan("common"));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

/* Allowed beacon MAC addresses (whitelist) */
const ALLOWED_BEACON_MACS = [
  "D2:38:39:28:69:CC",
  "E8:55:97:CA:CB:21",
  "CB:2D:F8:27:9A:3A",
].map((mac) => mac.replace(/:/g, "").toUpperCase());

const normalizeMac = (mac) =>
  (mac && String(mac).replace(/[:-]/g, "").toUpperCase()) || "";

wss.on("error", (err) => {
  console.error("⚠️ WebSocket server error:", err.message);
});

/**
 * WebSocket connection
 */
wss.on("connection", (ws) => {
  console.log("🟢 WebSocket client connected");
  clients.add(ws);

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket client error:", err.message);
    clients.delete(ws);
  });

  ws.on("close", () => {
    console.log("🔴 WebSocket client disconnected");
    clients.delete(ws);
  });
});

/**
 * HTTP POST endpoint
 * 🔑 IMPORTANT: We forward data AS-IS (no destructive renaming)
 */
app.post("/data", (req, res) => {
  try {
    const payload = req.body;

    if (!Array.isArray(payload)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload, expected array",
      });
    }

    const sanitizedPayload = payload.filter(
      (item) => item && typeof item === "object" && !Array.isArray(item),
    );

    if (sanitizedPayload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload, expected array of objects",
      });
    }

    /* Filter: only data from whitelisted beacon MAC addresses */
    const filteredPayload = sanitizedPayload.filter((item) => {
      const mac = normalizeMac(item.BLEMAC);
      return mac && ALLOWED_BEACON_MACS.includes(mac);
    });

    /* 🔧 FIX: Light validation + keep original keys */
    const formattedData = filteredPayload.map((item) => ({
      TimeStamp: item.TimeStamp ?? new Date().toISOString(),
      Format: item.Format ?? null,

      /* 🔑 ONE-LINE RULE FIELDS */
      BLEMAC: item.BLEMAC ?? null,
      RSSI: typeof item.RSSI === "number" ? item.RSSI : null,
      BattVoltage:
        typeof item.BattVoltage === "number" ? item.BattVoltage : null,
      "3-axisData": item["3-axisData"] ?? null,
      GatewayMAC: item.GatewayMAC ?? null,

      /* Optional / future use */
      TxPower: item.TxPower ?? null,
      "RSSI@0m": item["RSSI@0m"] ?? null,
      RawData: item.RawData ?? null,
    }));

    /* 🔧 FIX: Broadcast RAW + COMPLETE data */
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(formattedData));
      }
    });
    return res.json({
      success: true,
      message: "Data pushed to WebSocket clients",
      count: formattedData.length,
    });
  } catch (err) {
    console.error("❌ Error handling /data payload:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing payload",
    });
  }
});

/* Static files */
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

/* SPA fallback */
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

/* Start server */
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
