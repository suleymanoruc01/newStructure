export type DevopsMcpAuth = {
  baseUrl: string;
  bearer?: string;
  mcpApiKey?: string;
};

export function loadAuthFromEnv(): DevopsMcpAuth {
  const baseUrl = process.env.PARTON_API_BASE_URL;
  if (!baseUrl || baseUrl.trim().length === 0) {
    throw new Error("PARTON_API_BASE_URL is required.");
  }
  const bearer = process.env.PARTON_ADMIN_TOKEN?.trim();
  const mcpApiKey = process.env.PARTON_MCP_API_KEY?.trim();
  if ((!bearer || bearer.length === 0) && (!mcpApiKey || mcpApiKey.length === 0)) {
    throw new Error(
      "PARTON_ADMIN_TOKEN or PARTON_MCP_API_KEY is required.",
    );
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    bearer: bearer && bearer.length > 0 ? bearer : undefined,
    mcpApiKey: mcpApiKey && mcpApiKey.length > 0 ? mcpApiKey : undefined,
  };
}
