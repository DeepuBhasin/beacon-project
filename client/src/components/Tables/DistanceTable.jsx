import GenericTable from "./GenericTable";

export default function DistanceTable({ rows }) {
  return (
    <GenericTable
      headers={["BLE MAC", "RSSI", "Distance (m)"]}
      rows={rows.map((r) => [
        r.bleMac,
        r.rssi,
        r.distance ? `${r.distance} m` : "N/A",
      ])}
    />
  );
}
