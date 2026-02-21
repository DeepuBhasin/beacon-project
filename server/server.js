const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const app = express();
app.use(
  cors({
    // when we are on same origin then this cors cod is not needed
    origin: "*",
    credentials: true,
  }),
);
app.use(morgan("common"));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

/**
 * WebSocket connection
 */
wss.on("connection", (ws) => {
  console.log("🟢 WebSocket client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("🔴 WebSocket client disconnected");
    clients.delete(ws);
  });
});

/**
 * HTTP POST endpoint (replacement of PHP code)
 */
app.post("/data", (req, res) => {
  const payload = req.body;

  if (!Array.isArray(payload)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload, expected array",
    });
  }

  // Normalize data (similar to your PHP logic)
  const formattedData = payload.map((item) => ({
    timeStamp: item.TimeStamp || "N/A",
    format: item.Format || "N/A",
    bleMac: item.BLEMAC || "N/A",
    rssi: item.RSSI || "N/A",
    advType: item.AdvType || "N/A",
    rawData: item.RawData || "N/A",
  }));

  // Push data to all WebSocket clients
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
});

const publicPath = path.join(__dirname, "public");

// Serve CSS, JS, images
app.use(express.static(publicPath));

// SPA / fallback route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
