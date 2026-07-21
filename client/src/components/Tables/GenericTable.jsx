export default function GenericTable({ headers, rows }) {
  return (
    <table style={table}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} style={td}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const table = { width: "100%", borderCollapse: "collapse" };
const th = { border: "1px solid #ccc", padding: 8, background: "#f5f5f5" };
const td = { border: "1px solid #ccc", padding: 8, fontSize: 14 };
