import { z } from 'zod';
import { taskflowRequest } from '../client.js';
function asText(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
export function registerIssueTools(server) {
    server.registerTool('taskflow_search_issues', {
        title: 'Search issues with JQL',
        description: 'Search TaskFlow issues using a JQL-like query string (e.g. "project = ABC AND status = \\"In Progress\\""). Supports pagination.',
        inputSchema: {
            jql: z.string().describe('JQL-like query string'),
            page: z.number().int().positive().optional().describe('Page number (default 1)'),
            limit: z.number().int().positive().max(100).optional().describe('Results per page (default 20, max 100)'),
        },
    }, async ({ jql, page, limit }) => {
        const data = await taskflowRequest('/issues/jql', { query: { jql, page, limit } });
        return asText(data);
    });
    server.registerTool('taskflow_get_issue', {
        title: 'Get an issue',
        description: 'Get a single issue by its key (e.g. "PROJ-123") or its internal id.',
        inputSchema: {
            key: z.string().optional().describe('Issue key, e.g. PROJ-123'),
            id: z.string().optional().describe('Internal issue id'),
        },
    }, async ({ key, id }) => {
        if (!key && !id) {
            throw new Error('Either "key" or "id" must be provided');
        }
        const data = key
            ? await taskflowRequest('/issues/by-key', { query: { key } })
            : await taskflowRequest(`/issues/${id}`);
        return asText(data);
    });
    server.registerTool('taskflow_create_issue', {
        title: 'Create an issue',
        description: 'Create a new issue (task, story, bug, epic, etc.) in a TaskFlow project.',
        inputSchema: {
            project: z.string().describe('Project id'),
            title: z.string().describe('Issue title/summary'),
            description: z.string().optional().describe('Issue description'),
            type: z.string().optional().describe('Issue type, e.g. task, story, bug, epic'),
            priority: z.string().optional().describe('Priority, e.g. low, medium, high'),
            status: z.string().optional().describe('Initial status'),
            assignee: z.string().optional().describe('User id to assign the issue to'),
            sprint: z.string().optional().describe('Sprint id'),
            labels: z.array(z.string()).optional(),
            dueDate: z.string().optional().describe('Due date (ISO 8601)'),
            parent: z.string().optional().describe('Parent issue id (for subtasks)'),
        },
    }, async (input) => {
        const data = await taskflowRequest('/issues', { method: 'POST', body: input });
        return asText(data);
    });
    server.registerTool('taskflow_update_issue', {
        title: 'Update an issue',
        description: 'Update fields on an existing issue, such as status, assignee, priority, or description.',
        inputSchema: {
            id: z.string().describe('Internal issue id'),
            title: z.string().optional(),
            description: z.string().optional(),
            type: z.string().optional(),
            priority: z.string().optional(),
            status: z.string().optional(),
            assignee: z.string().nullable().optional().describe('User id to assign, or null to unassign'),
            sprint: z.string().nullable().optional(),
            labels: z.array(z.string()).optional(),
            dueDate: z.string().optional(),
        },
    }, async ({ id, ...body }) => {
        const data = await taskflowRequest(`/issues/${id}`, { method: 'PATCH', body });
        return asText(data);
    });
    server.registerTool('taskflow_add_comment', {
        title: 'Add a comment to an issue',
        description: 'Add a comment to a TaskFlow issue.',
        inputSchema: {
            issueId: z.string().describe('Internal issue id'),
            body: z.string().describe('Comment text'),
        },
    }, async ({ issueId, body }) => {
        const data = await taskflowRequest(`/issues/${issueId}/comments`, { method: 'POST', body: { body } });
        return asText(data);
    });
}
//# sourceMappingURL=issues.js.map