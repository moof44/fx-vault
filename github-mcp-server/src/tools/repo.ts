import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const repoToolDefinitions = [
  {
    name: 'search_repositories',
    description: 'Search for GitHub repositories using query parameters',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. "topic:react stars:>1000")' },
        sort: { type: 'string', enum: ['stars', 'forks', 'help-wanted-issues', 'updated'], description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100, default 30)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_repository',
    description: 'Get detailed information about a specific GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username or org)' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_user_repositories',
    description: 'List repositories for a specific user or the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'GitHub username (if omitted, lists authenticated user repos)' },
        type: { type: 'string', enum: ['all', 'owner', 'member'], description: 'Filter by relationship' },
        sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], description: 'Sort field' },
        per_page: { type: 'number', description: 'Number of results per page' },
      },
      required: [],
    },
  },
  {
    name: 'create_repository',
    description: 'Create a new GitHub repository for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name' },
        description: { type: 'string', description: 'Repository description' },
        private: { type: 'boolean', description: 'Whether the repository should be private (default false)' },
        auto_init: { type: 'boolean', description: 'Pass true to create an initial commit with empty README' },
      },
      required: ['name'],
    },
  },
  {
    name: 'fork_repository',
    description: 'Fork a GitHub repository to your account',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Owner of the repo to fork' },
        repo: { type: 'string', description: 'Repository name to fork' },
        organization: { type: 'string', description: 'Optional organization to fork to' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'star_repository',
    description: 'Star a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'unstar_repository',
    description: 'Unstar a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
];

export async function handleRepoTools(name: string, args: any) {
  try {
    switch (name) {
      case 'search_repositories': {
        const { query, sort, order, per_page, page } = args;
        const { data } = await octokit.rest.search.repos({
          q: query,
          sort: sort as any,
          order: order as any,
          per_page,
          page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_count: data.total_count,
                  items: data.items.map((item) => ({
                    id: item.id,
                    full_name: item.full_name,
                    description: item.description,
                    html_url: item.html_url,
                    stargazers_count: item.stargazers_count,
                    forks_count: item.forks_count,
                    language: item.language,
                    updated_at: item.updated_at,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }
      case 'get_repository': {
        const { owner, repo } = args;
        const { data } = await octokit.rest.repos.get({ owner, repo });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_user_repositories': {
        const { username, type, sort, per_page } = args;
        let data;
        if (username) {
          const res = await octokit.rest.repos.listForUser({ username, type: type as any, sort: sort as any, per_page });
          data = res.data;
        } else {
          const res = await octokit.rest.repos.listForAuthenticatedUser({ type: type as any, sort: sort as any, per_page });
          data = res.data;
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                data.map((r) => ({
                  name: r.name,
                  full_name: r.full_name,
                  private: r.private,
                  description: r.description,
                  html_url: r.html_url,
                  stargazers_count: r.stargazers_count,
                  updated_at: r.updated_at,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
      case 'create_repository': {
        const { name: repoName, description, private: isPrivate, auto_init } = args;
        const { data } = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description,
          private: isPrivate,
          auto_init,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'fork_repository': {
        const { owner, repo, organization } = args;
        const { data } = await octokit.rest.repos.createFork({
          owner,
          repo,
          organization,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'star_repository': {
        const { owner, repo } = args;
        await octokit.rest.activity.starRepoForAuthenticatedUser({ owner, repo });
        return {
          content: [{ type: 'text', text: `Successfully starred repository ${owner}/${repo}` }],
        };
      }
      case 'unstar_repository': {
        const { owner, repo } = args;
        await octokit.rest.activity.unstarRepoForAuthenticatedUser({ owner, repo });
        return {
          content: [{ type: 'text', text: `Successfully unstarred repository ${owner}/${repo}` }],
        };
      }
      default:
        throw new Error(`Unknown repo tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Repo tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
