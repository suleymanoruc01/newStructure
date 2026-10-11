import {
  adminDashboardResponseSchema,
  auditEventsListResponseSchema,
  auditReportCreateResponseSchema,
  auditReportCreateSchema,
  devopsErrorDetailResponseSchema,
  devopsErrorsListResponseSchema,
  devopsErrorPatchSchema,
  type AuditReportCreateBody,
  type DevopsErrorPatchBody,
} from "@parton/api-contracts";
import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const envelopeDataSchema = z.object({
  data: z.unknown(),
});

async function adminGetLoose(path: string): Promise<unknown> {
  const json = await apiRequest<unknown>(path, { auth: true });
  const parsed = envelopeDataSchema.parse(json);
  return parsed.data;
}

export async function fetchAdminDashboard() {
  const json = await apiRequest<unknown>("/admin/dashboard", { auth: true });
  return adminDashboardResponseSchema.parse(json).data;
}

export async function fetchAdminList(path: string) {
  const data = await adminGetLoose(path);
  if (data && typeof data === "object" && "items" in data) {
    return (data as { items: unknown[] }).items;
  }
  return data;
}

export async function fetchAdminResource(path: string) {
  return adminGetLoose(path);
}

export async function updateAdminPolicy(
  id: string,
  body: { title: string; body: string },
) {
  const json = await apiRequest<unknown>(`/admin/policies/${id}`, {
    method: "PATCH",
    auth: true,
    body,
  });
  return envelopeDataSchema.parse(json).data;
}

export async function fetchAuditEvents(query?: string) {
  const path = query ? `/admin/audit/events?${query}` : "/admin/audit/events";
  const json = await apiRequest<unknown>(path, { auth: true });
  return auditEventsListResponseSchema.parse(json).data.items;
}

export async function createAuditReport(body: AuditReportCreateBody) {
  const payload = auditReportCreateSchema.parse(body);
  const json = await apiRequest<unknown>("/admin/audit/reports", {
    method: "POST",
    body: payload,
    auth: true,
  });
  return auditReportCreateResponseSchema.parse(json).data;
}

export function auditDownloadUrl(token: string): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  const prefix =
    typeof base === "string" && base.length > 0
      ? `${base.replace(/\/$/, "")}/api/v1`
      : "/api/v1";
  return `${prefix}/admin/audit/reports/download/${token}`;
}

export async function fetchDevopsErrors(query?: string) {
  const path = query
    ? `/admin/devops/errors?${query}`
    : "/admin/devops/errors";
  const json = await apiRequest<unknown>(path, { auth: true });
  return devopsErrorsListResponseSchema.parse(json).data.items;
}

export async function fetchDevopsErrorDetail(fingerprint: string) {
  const json = await apiRequest<unknown>(
    `/admin/devops/errors/${encodeURIComponent(fingerprint)}`,
    { auth: true },
  );
  return devopsErrorDetailResponseSchema.parse(json).data;
}

export async function patchDevopsError(
  fingerprint: string,
  body: DevopsErrorPatchBody,
) {
  const payload = devopsErrorPatchSchema.parse(body);
  await apiRequest<unknown>(
    `/admin/devops/errors/${encodeURIComponent(fingerprint)}`,
    { method: "PATCH", body: payload, auth: true },
  );
}

export async function adminPatch(path: string, body: unknown) {
  return apiRequest<unknown>(path, { method: "PATCH", body, auth: true });
}

export async function adminPost(path: string, body: unknown) {
  return apiRequest<unknown>(path, { method: "POST", body, auth: true });
}
