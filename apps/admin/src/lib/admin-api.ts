import {
  adminDashboardResponseSchema,
  adminJobCatalogOccupationCreateSchema,
  adminJobCatalogOccupationPatchSchema,
  adminJobCatalogOccupationResponseSchema,
  adminJobCatalogSectorCreateSchema,
  adminJobCatalogSectorPatchSchema,
  adminJobCatalogSectorResponseSchema,
  adminJobCatalogDeleteResponseSchema,
  adminJobCatalogTreeResponseSchema,
  auditEventsListResponseSchema,
  auditReportCreateResponseSchema,
  auditReportCreateSchema,
  devopsErrorDetailResponseSchema,
  devopsErrorsListResponseSchema,
  devopsErrorPatchSchema,
  type AdminJobCatalogOccupationCreateBody,
  type AdminJobCatalogOccupationPatchBody,
  type AdminJobCatalogSectorCreateBody,
  type AdminJobCatalogSectorPatchBody,
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

export async function fetchAdminList(path: string): Promise<unknown[]> {
  const data = await adminGetLoose(path);
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items: unknown }).items;
    return Array.isArray(items) ? items : [];
  }
  return Array.isArray(data) ? data : [];
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

export async function fetchAdminJobCatalogTree() {
  const json = await apiRequest<unknown>("/admin/catalog", { auth: true });
  return adminJobCatalogTreeResponseSchema.parse(json).data;
}

export async function createAdminJobCatalogSector(
  body: AdminJobCatalogSectorCreateBody,
) {
  const payload = adminJobCatalogSectorCreateSchema.parse(body);
  const json = await apiRequest<unknown>("/admin/catalog/sectors", {
    method: "POST",
    body: payload,
    auth: true,
  });
  return adminJobCatalogSectorResponseSchema.parse(json).data;
}

export async function patchAdminJobCatalogSector(
  id: string,
  body: AdminJobCatalogSectorPatchBody,
) {
  const payload = adminJobCatalogSectorPatchSchema.parse(body);
  const json = await apiRequest<unknown>(`/admin/catalog/sectors/${id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
  return adminJobCatalogSectorResponseSchema.parse(json).data;
}

export async function createAdminJobCatalogOccupation(
  sectorId: string,
  body: AdminJobCatalogOccupationCreateBody,
) {
  const payload = adminJobCatalogOccupationCreateSchema.parse(body);
  const json = await apiRequest<unknown>(
    `/admin/catalog/sectors/${sectorId}/occupations`,
    { method: "POST", body: payload, auth: true },
  );
  return adminJobCatalogOccupationResponseSchema.parse(json).data;
}

export async function patchAdminJobCatalogOccupation(
  id: string,
  body: AdminJobCatalogOccupationPatchBody,
) {
  const payload = adminJobCatalogOccupationPatchSchema.parse(body);
  const json = await apiRequest<unknown>(`/admin/catalog/occupations/${id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
  return adminJobCatalogOccupationResponseSchema.parse(json).data;
}

export async function deleteAdminJobCatalogSector(id: string) {
  const json = await apiRequest<unknown>(`/admin/catalog/sectors/${id}`, {
    method: "DELETE",
    auth: true,
  });
  return adminJobCatalogDeleteResponseSchema.parse(json).data;
}

export async function deleteAdminJobCatalogOccupation(id: string) {
  const json = await apiRequest<unknown>(`/admin/catalog/occupations/${id}`, {
    method: "DELETE",
    auth: true,
  });
  return adminJobCatalogDeleteResponseSchema.parse(json).data;
}
