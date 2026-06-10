#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TaskflowApiError } from './client.js';
import { registerProjectTools } from './tools/projects.js';
import { registerIssueTools } from './tools/issues.js';
const server = new McpServer({
    name: 'taskflow-mcp-server',
    version: '1.0.0',
});
registerProjectTools(server);
registerIssueTools(server);
async function main() {
    if (!process.env.TASKFLOW_API_TOKEN) {
        console.error('Warning: TASKFLOW_API_TOKEN is not set. Tool calls will fail until it is configured.');
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    const message = err instanceof TaskflowApiError ? `${err.message} (status ${err.status})` : String(err);
    console.error('Fatal error starting TaskFlow MCP server:', message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map