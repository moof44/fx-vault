import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const pullRequestToolDefinitions = [
  {
    name: 'list_pull_requests',
    description: 'List pull requests in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'PR state (default open)' },
        head: { type: 'string', description: 'Filter by head user or branch (e.g. "user:branch-name")' },
        base: { type: 'string', description: 'Filter by base branch (e.g. "main")' },
        sort: { type: 'string', enum: ['created', 'updated', 'popularity', 'long-running'], description: 'Sort field' },
        direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_pull_request',
    description: 'Get details of a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'create_pull_request',
    description: 'Create a new pull request in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Pull request title' },
        head: { type: 'string', description: 'The branch containing changes (e.g. "feature-branch")' },
        base: { type: 'string', description: 'The branch to merge into (e.g. "main")' },
        body: { type: 'string', description: 'Pull request description body' },
        draft: { type: 'boolean', description: 'Create as a draft PR' },
      },
      required: ['owner', 'repo', 'title', 'head', 'base'],
    },
  },
  {
    name: 'update_pull_request',
    description: 'Update a pull request title, body, base branch, or state',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        title: { type: 'string', description: 'New title' },
        body: { type: 'string', description: 'New body' },
        state: { type: 'string', enum: ['open', 'closed'], description: 'New state' },
        base: { type: 'string', description: 'New base branch' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'list_pull_request_commits',
    description: 'List commits in a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'list_pull_request_files',
    description: 'List changed files in a pull request with diff stats and patches',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'merge_pull_request',
    description: 'Merge a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        commit_title: { type: 'string', description: 'Title for merge commit' },
        commit_message: { type: 'string', description: 'Extra detail for merge commit' },
        merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'], description: 'Merge method to use' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'create_pull_request_review',
    description: 'Submit a code review on a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        event: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'], description: 'Review action' },
        body: { type: 'string', description: 'Review comment body' },
      },
      required: ['owner', 'repo', 'pull_number', 'event'],
    },
  },
];

export async function handlePullRequestTools(name: string, args: any) {
  try {
    switch (name) {
      case 'list_pull_requests': {
        const { owner, repo, state, head, base, sort, direction, per_page } = args;
        const { data } = await octokit.rest.pulls.list({
          owner,
          repo,
          state: state as any,
          head,
          base,
          sort: sort as any,
          direction: direction as any,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                data.map((pr) => ({
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  draft: pr.draft,
                  user: pr.user?.login,
                  head: pr.head.ref,
                  base: pr.base.ref,
                  html_url: pr.html_url,
                  created_at: pr.created_at,
                  updated_at: pr.updated_at,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
      case 'get_pull_request': {
        const { owner, repo, pull_number } = args;
        const { data } = await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'create_pull_request': {
        const { owner, repo, title, head, base, body, draft } = args;
        const { data } = await octokit.rest.pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body,
          draft,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'update_pull_request': {
        const { owner, repo, pull_number, title, body, state, base } = args;
        const { data } = await octokit.rest.pulls.update({
          owner,
          repo,
          pull_number,
          title,
          body,
          state: state as any,
          base,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_pull_request_commits': {
        const { owner, repo, pull_number, per_page } = args;
        const { data } = await octokit.rest.pulls.listCommits({
          owner,
          repo,
          pull_number,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_pull_request_files': {
        const { owner, repo, pull_number, per_page } = args;
        const { data } = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'merge_pull_request': {
        const { owner, repo, pull_number, commit_title, commit_message, merge_method } = args;
        const { data } = await octokit.rest.pulls.merge({
          owner,
          repo,
          pull_number,
          commit_title,
          commit_message,
          merge_method: merge_method as any,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'create_pull_request_review': {
        const { owner, repo, pull_number, event, body } = args;
        const { data } = await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number,
          event: event as any,
          body,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown pull request tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Pull Request tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
