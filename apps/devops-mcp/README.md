# PartOn DevOps MCP

Model Context Protocol facade for Nest `GET/PATCH/POST /api/v1/admin/devops/*` (ADR-0036).

## Required environment

| Variable | Purpose |
| --- | --- |
| `PARTON_API_BASE_URL` | e.g. `http://localhost:3000/api/v1` |
| `PARTON_ADMIN_TOKEN` **or** `PARTON_MCP_API_KEY` | Admin Bearer or MCP service key |

Optional: `PARTON_ENV` (`local` \| `staging` \| `production`) for labeling only.

## Cursor MCP config (example)

```json
{
  "mcpServers": {
    "parton-devops": {
      "command": "bun",
      "args": ["--filter", "@parton/devops-mcp", "run", "start"],
      "env": {
        "PARTON_API_BASE_URL": "http://localhost:3000/api/v1",
        "PARTON_MCP_API_KEY": "<from server env>"
      }
    }
  }
}
```

Build first: `bun run --filter @parton/devops-mcp build`.

## Tools

See [`PartonNewArch/web/10-devops-mcp.md`](../../PartonNewArch/web/10-devops-mcp.md).
