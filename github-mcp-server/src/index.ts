import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { userToolDefinitions, handleUserTools } from './tools/user.js';
import { repoToolDefinitions, handleRepoTools } from './tools/repo.js';
import { filesToolDefinitions, handleFilesTools } from './tools/files.js';
import { branchCommitToolDefinitions, handleBranchCommitTools } from './tools/branches-commits.js';
import { issueToolDefinitions, handleIssueTools } from './tools/issues.js';
import { pullRequestToolDefinitions, handlePullRequestTools } from './tools/pulls.js';
import { searchToolDefinitions, handleSearchTools } from './tools/search.js';
import { actionsToolDefinitions, handleActionsTools } from './tools/actions.js';

import { resourceTemplates, handleReadResource } from './resources.js';
import { promptDefinitions, handleGetPrompt } from './prompts.js';

const allToolDefinitions = [
  ...userToolDefinitions,
  ...repoToolDefinitions,
  ...filesToolDefinitions,
  ...branchCommitToolDefinitions,
  ...issueToolDefinitions,
  ...pullRequestToolDefinitions,
  ...searchToolDefinitions,
  ...actionsToolDefinitions,
];

const server = new Server(
  {
    name: 'github-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Register Tools List
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allToolDefinitions,
  };
});

// Register Tool Execution Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (userToolDefinitions.some((t) => t.name === name)) {
    return handleUserTools(name, args);
  }
  if (repoToolDefinitions.some((t) => t.name === name)) {
    return handleRepoTools(name, args);
  }
  if (filesToolDefinitions.some((t) => t.name === name)) {
    return handleFilesTools(name, args);
  }
  if (branchCommitToolDefinitions.some((t) => t.name === name)) {
    return handleBranchCommitTools(name, args);
  }
  if (issueToolDefinitions.some((t) => t.name === name)) {
    return handleIssueTools(name, args);
  }
  if (pullRequestToolDefinitions.some((t) => t.name === name)) {
    return handlePullRequestTools(name, args);
  }
  if (searchToolDefinitions.some((t) => t.name === name)) {
    return handleSearchTools(name, args);
  }
  if (actionsToolDefinitions.some((t) => t.name === name)) {
    return handleActionsTools(name, args);
  }

  throw new Error(`Tool non-existent or unhandled: ${name}`);
});

// Register Resources
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates,
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleReadResource(request.params.uri);
});

// Register Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: promptDefinitions,
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return handleGetPrompt(request.params.name, request.params.arguments || {});
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error starting GitHub MCP Server:', error);
  process.exit(1);
});
