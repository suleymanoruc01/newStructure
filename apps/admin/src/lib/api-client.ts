import {
  errorEnvelopeSchema,
  meResponseSchema,
  adminPasswordLoginBodySchema,
  otpRequestBodySchema,
  otpRequestResponseSchema,
  otpVerifyBodySchema,
  otpVerifyResponseSchema,
  tokenRefreshResponseSchema,
  type MeUser,
  type OtpRequestBody,
  type OtpVerifyBody,
} from "@parton/api-contracts";
import { csrfHeaders } from "@/lib/csrf";
import {
  clearAccessSession,
  getAccessToken,
  setAccessSession,
} from "@/lib/session";

const API_PREFIX = "/api/v1";

function apiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  return "";
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  idempotencyKey?: string;
};

class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    const response = await fetch(`${apiBaseUrl()}${API_PREFIX}/auth/token/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...csrfHeaders(),
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      clearAccessSession();
      return false;
    }
    const json = await parseJsonResponse(response);
    const parsed = tokenRefreshResponseSchema.safeParse(json);
    if (!parsed.success) {
      clearAccessSession();
      return false;
    }
    setAccessSession({
      accessToken: parsed.data.data.accessToken,
      accessExpiresAt: parsed.data.data.accessExpiresAt,
    });
    return true;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...csrfHeaders(),
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await fetch(`${apiBaseUrl()}${API_PREFIX}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && options.auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  const json = await parseJsonResponse(response);
  if (!response.ok) {
    const errParsed = errorEnvelopeSchema.safeParse(json);
    if (errParsed.success) {
      throw new ApiClientError(
        response.status,
        errParsed.data.error.code,
        errParsed.data.error.message,
      );
    }
    throw new ApiClientError(
      response.status,
      "INTERNAL_ERROR",
      "İstek başarısız oldu.",
    );
  }
  return json as T;
}

export async function loginWithPassword(body: {
  email: string;
  password: string;
}) {
  const payload = adminPasswordLoginBodySchema.parse(body);
  const json = await request<unknown>("/auth/admin/login", {
    method: "POST",
    body: payload,
  });
  const parsed = otpVerifyResponseSchema.parse(json);
  setAccessSession({
    accessToken: parsed.data.accessToken,
    accessExpiresAt: parsed.data.accessExpiresAt,
  });
  return parsed;
}

export async function requestOtp(body: OtpRequestBody) {
  const payload = otpRequestBodySchema.parse(body);
  const json = await request<unknown>("/auth/otp/request", {
    method: "POST",
    body: payload,
  });
  return otpRequestResponseSchema.parse(json);
}

export async function verifyOtp(body: OtpVerifyBody) {
  const payload = otpVerifyBodySchema.parse(body);
  const json = await request<unknown>("/auth/otp/verify", {
    method: "POST",
    body: payload,
    idempotencyKey: crypto.randomUUID(),
  });
  const parsed = otpVerifyResponseSchema.parse(json);
  setAccessSession({
    accessToken: parsed.data.accessToken,
    accessExpiresAt: parsed.data.accessExpiresAt,
  });
  return parsed;
}

export async function logout(): Promise<void> {
  try {
    await request<unknown>("/auth/logout", {
      method: "POST",
      body: {},
      auth: true,
    });
  } finally {
    clearAccessSession();
  }
}

export async function fetchMe(): Promise<MeUser> {
  const json = await request<unknown>("/me", { auth: true });
  const parsed = meResponseSchema.parse(json);
  return parsed.data;
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export { ApiClientError, refreshAccessToken, request, request as apiRequest };
