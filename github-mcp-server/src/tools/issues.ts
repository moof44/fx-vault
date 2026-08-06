import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const issueToolDefinitions = [
  {
    name: 'search_issues',
    description: 'Search GitHub issues and pull requests using GitHub search syntax',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. "repo:owner/repo is:issue is:open label:bug")' },
        sort: { type: 'string', enum: ['comments', 'reactions', 'created', 'updated'], description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_issues',
    description: 'List issues for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'State of issues (default open)' },
        labels: { type: 'string', description: 'Comma separated list of label names' },
        assignee: { type: 'string', description: 'Username of assignee' },
        creator: { type: 'string', description: 'User that created the issue' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get details of a specific issue by issue number',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new issue in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body content' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Array of label names' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Array of GitHub usernames to assign' },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 'update_issue',
    description: 'Update an existing issue (title, body, state, labels, assignees)',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
        title: { type: 'string', description: 'New issue title' },
        body: { type: 'string', description: 'New issue body' },
        state: { type: 'string', enum: ['open', 'closed'], description: 'State of the issue' },
        state_reason: { type: 'string', enum: ['completed', 'not_planned', 'reopened'], description: 'Reason for state change' },
        labels: { type: 'array', items: { type: 'string' }, description: 'New array of label names' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'New array of usernames to assign' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'add_issue_comment',
    description: 'Add a comment to an issue or pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue or PR number' },
        body: { type: 'string', description: 'Comment markdown body' },
      },
      required: ['owner', 'repo', 'issue_number', 'body'],
    },
  },
  {
    name: 'list_issue_comments',
    description: 'List comments on an issue or pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue or PR number' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
];

export async function handleIssueTools(name: string, args: any) {
  try {
    switch (name) {
      case 'search_issues': {
        const { query, sort, order, per_page } = args;
        const { data } = await octokit.rest.search.issuesAndPullRequests({
          q: query,
          sort: sort as any,
          order: order as any,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_issues': {
        const { owner, repo, state, labels, assignee, creator, per_page } = args;
        const { data } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: state as any,
          labels,
          assignee,
          creator,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                data.map((i) => ({
                  number: i.number,
                  title: i.title,
                  state: i.state,
                  user: i.user?.login,
                  labels: i.labels.map((l) => (typeof l === 'string' ? l : l.name)),
                  comments: i.comments,
                  created_at: i.created_at,
                  updated_at: i.updated_at,
                  html_url: i.html_url,
                  is_pull_request: !!i.pull_request,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
      case 'get_issue': {
        const { owner, repo, issue_number } = args;
        const { data } = await octokit.rest.issues.get({
          owner,
          repo,
          issue_number,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'create_issue': {
        const { owner, repo, title, body, labels, assignees } = args;
        const { data } = await octokit.rest.issues.create({
          owner,
          repo,
          title,
          body,
          labels,
          assignees,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'update_issue': {
        const { owner, repo, issue_number, title, body, state, state_reason, labels, assignees } = args;
        const { data } = await octokit.rest.issues.update({
          owner,
          repo,
          issue_number,
          title,
          body,
          state: state as any,
          state_reason: state_reason as any,
          labels,
          assignees,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'add_issue_comment': {
        const { owner, repo, issue_number, body } = args;
        const { data } = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number,
          body,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_issue_comments': {
        const { owner, repo, issue_number, per_page } = args;
        const { data } = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown issue tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Issue tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
