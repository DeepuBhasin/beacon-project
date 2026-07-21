// src/utils/radarMath.js

export function axisToRadarPoint(axis, radarRadiusPx) {
  if (!axis) return { x: 0, y: 0 };

  const { x, y, z } = axis;

  // Stable angle
  const angle = Math.atan2(y, x);

  // Stable magnitude
  const magnitude = Math.sqrt(x * x + y * y + z * z);

  // Normalize (tweak 500 if needed)
  const normalized = Math.min(magnitude / 500, 1);

  return {
    x: Math.cos(angle) * normalized * radarRadiusPx,
    y: Math.sin(angle) * normalized * radarRadiusPx,
  };
}
