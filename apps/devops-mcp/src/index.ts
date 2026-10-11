#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  devopsErrorPatchSchema,
  devopsErrorsListQuerySchema,
  devopsReleaseRegisterSchema,
} from "@parton/api-contracts";
import { z } from "zod";

import { loadAuthFromEnv } from "./auth.js";
import { PartonDevopsClient } from "./client.js";

const auth = loadAuthFromEnv();
const client = new PartonDevopsClient(auth);

const server = new McpServer({
  name: "parton-devops-mcp",
  version: "0.1.0",
});

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

server.tool(
  "devops_errors_list",
  "List fingerprinted DevOps error groups (GET /admin/devops/errors).",
  devopsErrorsListQuerySchema.shape,
  async (args) => {
    const query = devopsErrorsListQuerySchema.parse(args);
    const params = new URLSearchParams();
    if (query.app) params.set("app", query.app);
    if (query.status) params.set("status", query.status);
    if (query.release) params.set("release", query.release);
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    const data = await client.request(
      `/admin/devops/errors${qs ? `?${qs}` : ""}`,
    );
    return textResult(data);
  },
);

server.tool(
  "devops_errors_get",
  "Get a DevOps error group by fingerprint.",
  { fingerprint: z.string().min(1) },
  async ({ fingerprint }) => {
    const data = await client.request(
      `/admin/devops/errors/${encodeURIComponent(fingerprint)}`,
    );
    return textResult(data);
  },
);

server.tool(
  "devops_errors_resolve",
  "Resolve or ignore a DevOps error group (PATCH).",
  {
    fingerprint: z.string().min(1),
    status: z.enum(["resolved", "ignored"]),
  },
  async ({ fingerprint, status }) => {
    const body = devopsErrorPatchSchema.parse({ status });
    const data = await client.request(
      `/admin/devops/errors/${encodeURIComponent(fingerprint)}`,
      { method: "PATCH", body },
    );
    return textResult(data);
  },
);

server.tool(
  "devops_releases_list",
  "List registered releases.",
  {
    app: z.string().optional(),
    environment: z.string().optional(),
  },
  async ({ app, environment }) => {
    const params = new URLSearchParams();
    if (app) params.set("app", app);
    if (environment) params.set("environment", environment);
    const qs = params.toString();
    const data = await client.request(
      `/admin/devops/releases${qs ? `?${qs}` : ""}`,
    );
    return textResult(data);
  },
);

server.tool(
  "devops_releases_register",
  "Register a release after deploy (POST).",
  devopsReleaseRegisterSchema.shape,
  async (args) => {
    const body = devopsReleaseRegisterSchema.parse(args);
    const data = await client.request("/admin/devops/releases", {
      method: "POST",
      body,
    });
    return textResult(data);
  },
);

server.tool(
  "devops_services_status",
  "Aggregate service health (GET /admin/devops/services).",
  {},
  async () => {
    const data = await client.request("/admin/devops/services");
    return textResult(data);
  },
);

server.tool(
  "devops_clients_list",
  "Client build versions and error rates (GET /admin/devops/clients).",
  {},
  async () => {
    const data = await client.request("/admin/devops/clients");
    return textResult(data);
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
