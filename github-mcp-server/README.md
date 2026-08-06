# GitHub MCP Server

A Model Context Protocol (MCP) server for GitHub API, built with TypeScript, `@modelcontextprotocol/sdk`, and `@octokit/rest`.

## Features

### 🛠️ 27+ Available MCP Tools

- **User Tools**: `get_me`, `get_user`
- **Repository Tools**: `search_repositories`, `get_repository`, `list_user_repositories`, `create_repository`, `fork_repository`, `star_repository`, `unstar_repository`
- **Files & Tree Tools**: `get_file_contents`, `create_or_update_file`, `delete_file`, `list_directory_contents`, `get_tree`
- **Branches & Commits**: `list_branches`, `get_branch`, `create_branch`, `list_commits`, `get_commit`
- **Issues**: `search_issues`, `list_issues`, `get_issue`, `create_issue`, `update_issue`, `add_issue_comment`, `list_issue_comments`
- **Pull Requests**: `list_pull_requests`, `get_pull_request`, `create_pull_request`, `update_pull_request`, `list_pull_request_commits`, `list_pull_request_files`, `merge_pull_request`, `create_pull_request_review`
- **Code & User Search**: `search_code`, `search_users`
- **GitHub Actions**: `list_workflows`, `list_workflow_runs`, `trigger_workflow_dispatch`

### 📦 MCP Resources
- `github://user/me`
- `github://repo/{owner}/{repo}`
- `github://repo/{owner}/{repo}/file/{path}`
- `github://repo/{owner}/{repo}/issue/{issue_number}`
- `github://repo/{owner}/{repo}/pull/{pull_number}`

### 💡 MCP Prompts
- `review-pull-request`
- `triage-issue`
- `repository-audit`

## Getting Started

### 1. Build
```bash
npm run build
```

### 2. Run Integration Tests
```bash
npm test
```

### 3. Run Server
```bash
npm start
# or via dev mode
npm run dev
```

## Client Integration Configuration

Add the following to your MCP client configuration (e.g. `mcp-config.json`, Antigravity IDE, Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": [
        "/home/jirehpadua/fx-vault/github-mcp-server/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```
