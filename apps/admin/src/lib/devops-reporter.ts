import { devopsErrorIngestSchema } from "@parton/api-contracts";
import { apiRequest } from "@/lib/api-client";

function fingerprintFrom(message: string, stack?: string): string {
  const raw = `${message}|${stack ?? ""}`.slice(0, 500);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `admin-${Math.abs(hash)}`;
}

export function reportClientError(message: string, stack?: string): void {
  const release =
    typeof import.meta.env.VITE_PARTON_RELEASE === "string"
      ? import.meta.env.VITE_PARTON_RELEASE
      : "dev";
  const payload = devopsErrorIngestSchema.parse({
    app: "admin",
    release,
    platform: "web",
    message: message.slice(0, 2000),
    stack: stack?.slice(0, 16_000),
    fingerprint: fingerprintFrom(message, stack),
  });
  void apiRequest("/admin/devops/errors", {
    method: "POST",
    body: payload,
    auth: true,
  }).catch(() => {
    // Ingest must not break the UI.
  });
}

export function installDevopsReporter(): void {
  window.addEventListener("error", (event) => {
    reportClientError(event.message, event.error?.stack);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? "rejection");
    const stack = reason instanceof Error ? reason.stack : undefined;
    reportClientError(message, stack);
  });
}
