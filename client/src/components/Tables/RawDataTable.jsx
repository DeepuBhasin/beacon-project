import GenericTable from "./GenericTable";

export default function RawDataTable({ rows }) {
  return (
    <GenericTable
      headers={["Time", "BLE MAC", "RSSI", "ADV Type", "Raw Data"]}
      rows={rows.map((r) => [
        r.timeStamp,
        r.bleMac,
        r.rssi,
        r.advType,
        r.rawData,
      ])}
    />
  );
}
