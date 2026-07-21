// src/utils/axis.js

export function parse3AxisData(raw) {
  if (!raw || typeof raw !== "string") return null;

  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 3) return null;

  const toInt16 = (hex) => {
    const val = parseInt(hex, 16);
    if (Number.isNaN(val)) return null;
    return val > 0x7fff ? val - 0x10000 : val;
  };

  const x = toInt16(parts[0]);
  const y = toInt16(parts[1]);
  const z = toInt16(parts[2]);

  if (x === null || y === null || z === null) return null;

  return { x, y, z };
}
