import React, { useEffect, useState } from "react";
import RadarCanvas from "./components/RadarCanvas";
import RawDataTable from "./components/Tables/RawDataTable";
import DistanceTable from "./components/Tables/DistanceTable";
import DecodedTable from "./components/Tables/DecodedTable";
import { calculateDistance } from "./utils/distance";
import { decodeManufacturerData } from "./utils/manufacturerDecoder";
import { parse3AxisData } from "./utils/axis";

const WS_URL =
  (window.location.protocol === "https:" ? "wss://" : "ws://") +
  window.location.host;
// const WS_URL = "ws://localhost:5000";
const DEVICE_TIMEOUT = 5000;

export default function App() {
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState({});

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onmessage = (e) => {
      const incoming = JSON.parse(e.data);
      const now = Date.now();

      const enriched = incoming.map((item) => {
        /* 🔧 FIX: normalize backend fields */
        const bleMac = item.BLEMAC;
        const rssi = item.RSSI;
        const rawData = item.RawData;
        const gatewayMac = item.GatewayMAC;

        let axis = null;
        if (item.Format === "BXP-ACC" && item["3-axisData"]) {
          axis = parse3AxisData(item["3-axisData"]);
        }

        return {
          ...item,
          // Normalized field names for UI tables
          timeStamp: item.TimeStamp ?? item.timeStamp ?? new Date().toISOString(),
          advType: item.Format ?? item.advType ?? null,
          bleMac,
          rssi,
          rawData,
          gatewayMac,
          axis,

          /* 🔧 FIX: correct RSSI usage */
          distance: calculateDistance({
            rssi: item.RSSI,
            rssiAt1m: item["RSSI@0m"],
            txPower: item.TxPower,
          }),

          /* 🔧 FIX: decode only RawData packets */
          decoded:
            rawData && item.Format === "RawData"
              ? decodeManufacturerData(rawData)
              : null,

          lastSeen: now,
        };
      });

      /* Keep only latest point per beacon (no history, live location only) */
      setRows((prev) => {
        const byMac = new Map();
        prev.forEach((r) => r.bleMac && byMac.set(r.bleMac, r));
        enriched.forEach((item) => item.bleMac && byMac.set(item.bleMac, item));
        return Array.from(byMac.values());
      });

      setDevices((prev) => {
        const updated = { ...prev };

        enriched.forEach((item) => {
          /* 🔧 FIX: proper null check */
          if (item.distance == null || !item.bleMac) return;

          updated[item.bleMac] = {
            bleMac: item.bleMac,
            rssi: item.rssi,
            distance: item.distance,
            battery: item.BattVoltage ?? prev[item.bleMac]?.battery, // 🔧 added
            axis: item.axis ?? prev[item.bleMac]?.axis,
            gatewayMac: item.gatewayMac ?? prev[item.bleMac]?.gatewayMac, // 🔧 added
            angle: prev[item.bleMac]?.angle ?? Math.random() * Math.PI * 2,
            lastSeen: now,
          };
        });

        return updated;
      });
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      setDevices((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(
            ([, d]) => now - d.lastSeen < DEVICE_TIMEOUT,
          ),
        ),
      );

      setRows((prev) => prev.filter((r) => now - r.lastSeen < DEVICE_TIMEOUT));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 Live BLE Radar</h2>
      <RadarCanvas devices={devices} />

      <h2 style={{ marginTop: 40 }}>📡 BLE Raw Data</h2>
      <RawDataTable rows={rows} />

      <h2 style={{ marginTop: 40 }}>📏 Estimated Distance</h2>
      <DistanceTable rows={rows} />

      <h2 style={{ marginTop: 40 }}>🧩 Decoded Manufacturer Data</h2>
      <DecodedTable rows={rows} />
    </div>
  );
}
