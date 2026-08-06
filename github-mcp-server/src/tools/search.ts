import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const searchToolDefinitions = [
  {
    name: 'search_code',
    description: 'Search code across GitHub repositories using GitHub search parameters',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Code search query (e.g. "addClass repo:jquery/jquery")' },
        sort: { type: 'string', enum: ['indexed'], description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_users',
    description: 'Search for GitHub users',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'User search query (e.g. "fullname:John location:SF")' },
        sort: { type: 'string', enum: ['followers', 'repositories', 'joined'], description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['query'],
    },
  },
];

export async function handleSearchTools(name: string, args: any) {
  try {
    switch (name) {
      case 'search_code': {
        const { query, sort, order, per_page } = args;
        const { data } = await octokit.rest.search.code({
          q: query,
          sort: sort as any,
          order: order as any,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_count: data.total_count,
                  items: data.items.map((i) => ({
                    name: i.name,
                    path: i.path,
                    sha: i.sha,
                    html_url: i.html_url,
                    repository: i.repository.full_name,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }
      case 'search_users': {
        const { query, sort, order, per_page } = args;
        const { data } = await octokit.rest.search.users({
          q: query,
          sort: sort as any,
          order: order as any,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown search tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Search tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
