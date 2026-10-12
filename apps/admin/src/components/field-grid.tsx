import { statusLabelTr } from "@parton/api-contracts";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type FieldItem = {
  label: string;
  value: unknown;
  href?: string;
};

export function opsText(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => opsText(item)).join(", ") || "—";
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

export function FieldGrid({ fields }: { fields: FieldItem[] }) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {fields.map((field) => (
        <div
          key={field.label}
          className="grid gap-1 border-t border-background/40 px-4 py-3 first:border-t-0"
        >
          <dt className="text-xs text-muted-foreground">{field.label}</dt>
          <dd className="text-sm text-foreground">
            {field.href ? (
              <Link to={field.href} className="underline-offset-2 hover:underline">
                {opsText(field.value)}
              </Link>
            ) : (
              opsText(field.value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function asRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function str(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function bool(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true;
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
