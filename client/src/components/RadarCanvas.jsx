import { useEffect, useRef } from "react";

/* =======================
   Radar Configuration
======================= */
const MAX_DISTANCE = 30; // meters
const RADAR_SIZE = 420; // canvas size

/* =======================
   Helper
======================= */

/**
 * Convert X,Y axis data to angle (radians)
 */
function axisToAngle(axis) {
  if (!axis) return null;
  return Math.atan2(axis.y, axis.x);
}

/* =======================
   Radar Canvas Component
======================= */

export default function RadarCanvas({ devices }) {
  const canvasRef = useRef(null);
  const sweepAngle = useRef(0);
  const devicesRef = useRef({});

  // Keep latest device data without re-rendering animation
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const center = RADAR_SIZE / 2;
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

      /* ===== Background ===== */
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, RADAR_SIZE, RADAR_SIZE);

      /* ===== Radar Rings ===== */
      ctx.strokeStyle = "#00ff00";
      ctx.fillStyle = "#00ff00";
      ctx.font = "12px monospace";

      [5, 10, 15, 20, 25].forEach((d) => {
        const radius = (d / MAX_DISTANCE) * center;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(`${d} m`, center + radius + 5, center);
      });

      /* ===== Cross Axes ===== */
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, RADAR_SIZE);
      ctx.moveTo(0, center);
      ctx.lineTo(RADAR_SIZE, center);
      ctx.stroke();

      /* ===== Radar Sweep ===== */
      sweepAngle.current += 0.015;
      ctx.strokeStyle = "rgba(0,255,0,0.35)";
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + center * Math.cos(sweepAngle.current),
        center + center * Math.sin(sweepAngle.current),
      );
      ctx.stroke();

      /* ===== Devices ===== */
      Object.values(devicesRef.current).forEach((device) => {
        if (!device.distance) return;

        // Parse axis from '3-axisData' if not present
        let axis = device.axis;
        if (!axis && device["3-axisData"]) {
          // '3-axisData' format: "0400,FB00,BD00" (hex little-endian)
          const parts = device["3-axisData"].split(",");
          if (parts.length === 3) {
            // Parse each part as signed 16-bit integer (little-endian)
            const parseAxis = (hex) => {
              const buf = new ArrayBuffer(2);
              const view = new DataView(buf);
              view.setUint8(0, parseInt(hex.slice(0, 2), 16));
              view.setUint8(1, parseInt(hex.slice(2, 4), 16));
              return view.getInt16(0, true); // little-endian
            };
            axis = {
              x: parseAxis(parts[0]),
              y: parseAxis(parts[1]),
              z: parseAxis(parts[2]),
            };
          }
        }
        const angle = axisToAngle(axis) ?? device.angle ?? 0;

        const r =
          (Math.min(device.distance, MAX_DISTANCE) / MAX_DISTANCE) * center;

        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);

        /* Dot */
        ctx.fillStyle = "rgba(0,255,0,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        /* Label (last 4 of MAC) */
        ctx.fillStyle = "#00ff00";
        ctx.font = "10px monospace";
        ctx.fillText(device.bleMac?.slice(-4) ?? "", x + 8, y);
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={RADAR_SIZE}
      height={RADAR_SIZE}
      style={{ border: "2px solid #00ff00" }}
    />
  );
}
