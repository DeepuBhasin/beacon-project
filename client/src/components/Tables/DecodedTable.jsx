import GenericTable from "./GenericTable";

export default function DecodedTable({ rows }) {
  return (
    <GenericTable
      headers={["BLE MAC", "Company", "Length"]}
      rows={rows
        .filter((r) => r.decoded)
        .map((r) => [r.bleMac, r.decoded.companyName, r.decoded.length])}
    />
  );
}
