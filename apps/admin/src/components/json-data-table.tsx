import { statusLabelTr } from "@parton/api-contracts";
import { Link } from "react-router-dom";
import { fieldLabel, isHiddenField } from "@/components/field-labels";

type JsonDataTableProps = {
  rows: unknown[];
  linkBase?: string;
  idKey?: string;
};

function cellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }
  if (Array.isArray(value)) {
    return value.map((item) => cellValue(item)).join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const label =
      record.title ?? record.legalName ?? record.tradeName ?? record.name ?? record.slug;
    return typeof label === "string" ? label : "…";
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
      }
    }
    return statusLabelTr(value);
  }
  return String(value);
}

export function JsonDataTable({
  rows,
  linkBase,
  idKey = "id",
}: JsonDataTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Kayıt bulunamadı.</p>
    );
  }
  const first = rows[0];
  if (!first || typeof first !== "object") {
    return (
      <pre className="overflow-auto rounded-md bg-muted/40 p-4 text-xs">
        {JSON.stringify(rows, null, 2)}
      </pre>
    );
  }
  const columns = Object.keys(first as Record<string, unknown>)
    .filter((key) => !isHiddenField(key))
    .slice(0, 8);

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium text-foreground">
                {fieldLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const record = row as Record<string, unknown>;
            const rowId = record[idKey];
            const to =
              linkBase && typeof rowId === "string"
                ? `${linkBase}/${rowId}`
                : undefined;
            return (
              <tr
                key={typeof rowId === "string" ? rowId : index}
                className="border-b border-border/60 hover:bg-muted/20"
              >
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-muted-foreground">
                    {col === idKey && to ? (
                      <Link
                        to={to}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {cellValue(record[col])}
                      </Link>
                    ) : (
                      cellValue(record[col])
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
