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
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-background">
          <tr>
            {columns.map((col) => (
              <th key={col} className="h-10 px-3 text-xs font-medium text-muted-foreground">
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
                className="border-t border-background/50 hover:bg-background/30"
              >
                {columns.map((col) => {
                  const mono = col === idKey || col === "fingerprint" || col.endsWith("Id");
                  const text = cellValue(record[col]);
                  return (
                    <td key={col} className={mono ? "h-10 px-3 font-sans text-sm tabular-nums text-foreground" : "h-10 px-3 text-foreground"}>
                      {col === idKey && to ? (
                        <Link to={to} className="underline-offset-2 hover:underline">
                          {text}
                        </Link>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
