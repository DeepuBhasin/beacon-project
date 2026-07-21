// Standard BLE log-distance path loss model
// distance = 10 ^ ((referencePower - RSSI) / (10 * n))

export function calculateDistance({
  rssi,
  rssiAt1m,
  txPower,
  envFactor = 2.8, // indoor default (office / home)
}) {
  // ❌ invalid RSSI
  if (typeof rssi !== "number" || rssi >= 0) return null;

  // ✅ choose best reference power
  const referencePower =
    typeof rssiAt1m === "number"
      ? rssiAt1m
      : typeof txPower === "number"
        ? txPower
        : -59; // last fallback

  const ratio = (referencePower - rssi) / (10 * envFactor);
  const distance = Math.pow(10, ratio);

  // ✅ clamp distance for UI + radar sanity
  const clamped = Math.min(Math.max(distance, 0.2), 50);

  return Number(clamped.toFixed(2)); // meters
}
