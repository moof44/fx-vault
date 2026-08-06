import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const branchCommitToolDefinitions = [
  {
    name: 'list_branches',
    description: 'List branches in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        protected: { type: 'boolean', description: 'Filter protected branches' },
        per_page: { type: 'number', description: 'Number of results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_branch',
    description: 'Get details of a specific branch in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'Branch name' },
      },
      required: ['owner', 'repo', 'branch'],
    },
  },
  {
    name: 'create_branch',
    description: 'Create a new branch from a base branch or commit SHA',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'New branch name to create' },
        from_sha: { type: 'string', description: 'Commit SHA to branch from (if omitted, uses default branch head)' },
      },
      required: ['owner', 'repo', 'branch'],
    },
  },
  {
    name: 'list_commits',
    description: 'List commits in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        sha: { type: 'string', description: 'Branch name or commit SHA to start listing from' },
        path: { type: 'string', description: 'Only commits containing this file path' },
        author: { type: 'string', description: 'GitHub username or email' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_commit',
    description: 'Get details of a specific commit by SHA',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        ref: { type: 'string', description: 'Commit SHA' },
      },
      required: ['owner', 'repo', 'ref'],
    },
  },
];

export async function handleBranchCommitTools(name: string, args: any) {
  try {
    switch (name) {
      case 'list_branches': {
        const { owner, repo, protected: isProtected, per_page } = args;
        const { data } = await octokit.rest.repos.listBranches({
          owner,
          repo,
          protected: isProtected,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'get_branch': {
        const { owner, repo, branch } = args;
        const { data } = await octokit.rest.repos.getBranch({
          owner,
          repo,
          branch,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'create_branch': {
        const { owner, repo, branch, from_sha } = args;
        let targetSha = from_sha;
        if (!targetSha) {
          const repoInfo = await octokit.rest.repos.get({ owner, repo });
          const defaultBranch = repoInfo.data.default_branch;
          const refInfo = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${defaultBranch}`,
          });
          targetSha = refInfo.data.object.sha;
        }
        const { data } = await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: targetSha,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_commits': {
        const { owner, repo, sha, path, author, per_page } = args;
        const { data } = await octokit.rest.repos.listCommits({
          owner,
          repo,
          sha,
          path,
          author,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                data.map((c) => ({
                  sha: c.sha,
                  author: c.commit.author,
                  message: c.commit.message,
                  html_url: c.html_url,
                })),
                null,
                2
              ),
            },
          ],
        };
      }
      case 'get_commit': {
        const { owner, repo, ref } = args;
        const { data } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown branch/commit tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Branch/Commit tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
