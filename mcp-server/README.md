# TaskFlow MCP Server

An [MCP](https://modelcontextprotocol.io) server that connects Claude (or any MCP-compatible client) to a TaskFlow
instance, similar to how the Atlassian Jira MCP server connects Claude to Jira.

It exposes tools for searching, reading, creating, and updating issues, listing projects and sprints, and adding
comments.

## 1. Generate a personal access token

1. Log in to TaskFlow.
2. Go to **Profile → API tokens** (`/profile/api-tokens`).
3. Create a token (e.g. name it "Claude MCP"). Copy it immediately — it is only shown once. Tokens look like
   `tfk_...`.

## 2. Build the server

```bash
cd mcp-server
npm install
npm run build
```

This produces `dist/index.js`.

## 3. Configure your MCP client

### Claude Code

Add to your MCP configuration (e.g. via `claude mcp add` or your `.claude` config):

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["/absolute/path/to/taskflow/mcp-server/dist/index.js"],
      "env": {
        "TASKFLOW_API_URL": "http://localhost:5000/api",
        "TASKFLOW_API_TOKEN": "tfk_your_token_here"
      }
    }
  }
}
```

### Claude Desktop

Add the same `taskflow` block to `claude_desktop_config.json`.

## Environment variables

| Variable                  | Required | Description                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------- |
| `TASKFLOW_API_URL`          | No       | Base URL of the TaskFlow API. Defaults to `http://localhost:5000/api`.     |
| `TASKFLOW_API_TOKEN`        | Yes      | Personal access token (`tfk_...`) generated from your TaskFlow profile.   |
| `TASKFLOW_ORGANIZATION_ID`  | No       | Organization id to scope requests to, sent as `X-Organization-Id`. Defaults to your account's active organization. |

## Available tools

- `taskflow_list_projects` — list projects (paginated)
- `taskflow_list_sprints` — list sprints, optionally filtered by project/board/status
- `taskflow_search_issues` — search issues with a JQL-like query string
- `taskflow_get_issue` — get a single issue by key (e.g. `PROJ-123`) or id
- `taskflow_create_issue` — create a new issue
- `taskflow_update_issue` — update fields on an existing issue
- `taskflow_add_comment` — add a comment to an issue

## Development

```bash
npm run dev   # tsc --watch
```

You can test the server interactively with the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```
