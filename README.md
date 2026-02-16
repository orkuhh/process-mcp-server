# Process MCP Server

MCP server for managing background process sessions via the OpenClaw `process` tool.

## Tools

| Tool | Description |
|------|-------------|
| `process_list` | List all running background sessions |
| `process_status` | Get detailed status of a session |
| `process_log` | Get output log from a session |
| `process_kill` | Terminate a running session |
| `process_send_keys` | Send keystrokes to a session |
| `process_paste` | Paste text into a session |

## Usage

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new McpServer({
  name: "process-mcp-server",
  version: "1.0.0"
});

// Register tools...

const transport = new StdioServerTransport();
server.connect(transport);
```

## Integration with mcporter

Add to your mcporter config:

```json
{
  "mcpServers": {
    "process": {
      "command": "node",
      "args": ["/root/.openclaw/workspace/process-mcp-server/dist/index.js"]
    }
  }
}
```

## Build

```bash
cd process-mcp-server
npm install
npm run build
```
