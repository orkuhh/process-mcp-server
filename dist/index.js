import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
const SERVER_NAME = "process-mcp-server";
const SERVER_VERSION = "1.0.0";
const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
});
// In-memory session store (simulated)
const sessions = new Map();
const sessionLogs = new Map();
server.registerTool("process_list", {
    description: "List all running background process sessions",
    inputSchema: z.object({}),
}, async () => {
    const sessionList = Array.from(sessions.values()).map(s => ({
        sessionId: s.sessionId,
        command: s.command,
        status: s.status,
        pid: s.pid,
        startTime: s.startTime
    }));
    return {
        content: [{
                type: "text",
                text: JSON.stringify({ sessions: sessionList, count: sessionList.length }, null, 2)
            }]
    };
});
server.registerTool("process_status", {
    description: "Get detailed status of a specific process session",
    inputSchema: z.object({
        sessionId: z.string().describe("The session ID to query"),
    }),
}, async ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' not found` }],
            isError: true
        };
    }
    return {
        content: [{
                type: "text",
                text: JSON.stringify(session, null, 2)
            }]
    };
});
server.registerTool("process_log", {
    description: "Get the output log from a process session",
    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
        limit: z.number().optional().default(100).describe("Maximum number of log entries"),
        offset: z.number().optional().default(0).describe("Offset for pagination"),
    }),
}, async ({ sessionId, limit = 100, offset = 0 }) => {
    const logs = sessionLogs.get(sessionId) || [];
    const sliced = logs.slice(offset, offset + limit);
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    sessionId,
                    total: logs.length,
                    offset,
                    limit,
                    entries: sliced
                }, null, 2)
            }]
    };
});
server.registerTool("process_kill", {
    description: "Terminate (kill) a running process session",
    inputSchema: z.object({
        sessionId: z.string().describe("The session ID to terminate"),
    }),
}, async ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' not found` }],
            isError: true
        };
    }
    session.status = 'stopped';
    sessions.set(sessionId, session);
    return {
        content: [{
                type: "text",
                text: `Session '${sessionId}' terminated successfully`
            }]
    };
});
server.registerTool("process_send_keys", {
    description: "Send keystrokes to a running process session",
    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
        keys: z.array(z.string()).describe("Array of key tokens to send"),
    }),
}, async ({ sessionId, keys }) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' not found` }],
            isError: true
        };
    }
    if (session.status !== 'running') {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' is not running` }],
            isError: true
        };
    }
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'stdout',
        content: `[SENT KEYS] ${keys.join(' ')}`
    };
    const logs = sessionLogs.get(sessionId) || [];
    logs.push(logEntry);
    sessionLogs.set(sessionId, logs);
    return {
        content: [{
                type: "text",
                text: `Keys sent to session '${sessionId}': ${keys.join(', ')}`
            }]
    };
});
server.registerTool("process_paste", {
    description: "Paste text into a running process session",
    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
        text: z.string().describe("Text to paste"),
        bracketed: z.boolean().optional().default(true).describe("Use bracketed paste mode"),
    }),
}, async ({ sessionId, text, bracketed = true }) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' not found` }],
            isError: true
        };
    }
    if (session.status !== 'running') {
        return {
            content: [{ type: "text", text: `Session '${sessionId}' is not running` }],
            isError: true
        };
    }
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'stdout',
        content: bracketed ? `[PASTE] ${text}` : text
    };
    const logs = sessionLogs.get(sessionId) || [];
    logs.push(logEntry);
    sessionLogs.set(sessionId, logs);
    return {
        content: [{
                type: "text",
                text: `Text pasted to session '${sessionId}' (bracketed: ${bracketed})`
            }]
    };
});
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
console.log("Process MCP Server running on stdio");
