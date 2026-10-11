import type { DevopsMcpAuth } from "./auth.js";

type FetchOptions = {
  method?: string;
  body?: unknown;
};

export class PartonDevopsClient {
  constructor(private readonly auth: DevopsMcpAuth) {}

  async request(path: string, options: FetchOptions = {}): Promise<unknown> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.auth.bearer) {
      headers.Authorization = `Bearer ${this.auth.bearer}`;
    }
    if (this.auth.mcpApiKey) {
      headers["x-parton-mcp-api-key"] = this.auth.mcpApiKey;
    }
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const url = `${this.auth.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const text = await response.text();
    const json = text.length > 0 ? (JSON.parse(text) as unknown) : null;
    if (!response.ok) {
      throw new Error(
        `Parton API ${response.status}: ${text.slice(0, 500)}`,
      );
    }
    return json;
  }
}
