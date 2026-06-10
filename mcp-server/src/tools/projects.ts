import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { taskflowRequest } from '../client.js';

function asText(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    'taskflow_list_projects',
    {
      title: 'List TaskFlow projects',
      description: 'List projects in the active TaskFlow organization, with pagination.',
      inputSchema: {
        page: z.number().int().positive().optional().describe('Page number (default 1)'),
        limit: z.number().int().positive().max(100).optional().describe('Results per page (default 20, max 100)'),
      },
    },
    async ({ page, limit }) => {
      const data = await taskflowRequest('/projects', { query: { page, limit } });
      return asText(data);
    }
  );

  server.registerTool(
    'taskflow_list_sprints',
    {
      title: 'List sprints',
      description: 'List sprints, optionally filtered by project, board, or status.',
      inputSchema: {
        projectId: z.string().optional().describe('Filter by project id'),
        boardId: z.string().optional().describe('Filter by board id'),
        status: z.string().optional().describe('Filter by sprint status (e.g. active, planned, completed)'),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ projectId, boardId, status, page, limit }) => {
      const data = await taskflowRequest('/sprints', {
        query: { project: projectId, board: boardId, status, page, limit },
      });
      return asText(data);
    }
  );
}
