import { statusLabelTr } from "@parton/api-contracts";
import { fieldLabel, isHiddenField } from "@/components/field-labels";
import { JsonDataTable } from "@/components/json-data-table";

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }
  if (typeof value === "number") {
    return String(value);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function RecordView({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return <JsonDataTable rows={value} />;
  }
  if (!isRecord(value)) {
    return <p className="text-sm text-foreground">{formatValue(value)}</p>;
  }
  const entries = Object.entries(value).filter(([key]) => !isHiddenField(key));
  return (
    <dl className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {entries.map(([key, entry]) => (
        <div key={key} className="grid gap-1 border-t border-background/40 px-4 py-3 first:border-t-0">
          <dt className="text-xs text-muted-foreground">{fieldLabel(key)}</dt>
          <dd className="text-sm text-foreground">
            {Array.isArray(entry) ? (
              entry.length > 0 && isRecord(entry[0]) ? (
                <JsonDataTable rows={entry} />
              ) : (
                entry.map((item) => formatValue(item)).join(", ") || "—"
              )
            ) : isRecord(entry) ? (
              <RecordView value={entry} />
            ) : (
              formatValue(entry)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
