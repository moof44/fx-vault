import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const filesToolDefinitions = [
  {
    name: 'get_file_contents',
    description: 'Get the contents of a file or list contents of a directory in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path within repository (e.g. "src/index.ts")' },
        ref: { type: 'string', description: 'Git ref, commit SHA, or branch (defaults to default branch)' },
      },
      required: ['owner', 'repo', 'path'],
    },
  },
  {
    name: 'create_or_update_file',
    description: 'Create or update a file in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Path to create or update' },
        content: { type: 'string', description: 'File text content' },
        message: { type: 'string', description: 'Commit message' },
        branch: { type: 'string', description: 'Branch name (if omitted, uses default branch)' },
        sha: { type: 'string', description: 'Blob SHA of the file if updating existing file' },
      },
      required: ['owner', 'repo', 'path', 'content', 'message'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Path of file to delete' },
        message: { type: 'string', description: 'Commit message' },
        sha: { type: 'string', description: 'Blob SHA of the file being deleted' },
        branch: { type: 'string', description: 'Branch name' },
      },
      required: ['owner', 'repo', 'path', 'message', 'sha'],
    },
  },
  {
    name: 'list_directory_contents',
    description: 'List contents of a directory in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Directory path (use "" or "." for root)' },
        ref: { type: 'string', description: 'Branch or commit SHA' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_tree',
    description: 'Get a full recursive or flat file tree of a repository by branch or SHA',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        tree_sha: { type: 'string', description: 'Branch name or tree SHA (e.g., "main")' },
        recursive: { type: 'boolean', description: 'Whether to recursively list all subtrees (default true)' },
      },
      required: ['owner', 'repo', 'tree_sha'],
    },
  },
];

export async function handleFilesTools(name: string, args: any) {
  try {
    switch (name) {
      case 'get_file_contents': {
        const { owner, repo, path, ref } = args;
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref,
        });

        if (Array.isArray(data)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  data.map((item) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    size: item.size,
                    sha: item.sha,
                  })),
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (data.type === 'file' && 'content' in data) {
          const encoding = data.encoding || 'base64';
          const decoded = Buffer.from(data.content, encoding as BufferEncoding).toString('utf-8');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    name: data.name,
                    path: data.path,
                    sha: data.sha,
                    size: data.size,
                    encoding: data.encoding,
                    content: decoded,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'create_or_update_file': {
        const { owner, repo, path, content, message, branch, sha } = args;
        const encodedContent = Buffer.from(content, 'utf-8').toString('base64');
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: encodedContent,
          branch,
          sha,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'delete_file': {
        const { owner, repo, path, message, sha, branch } = args;
        const { data } = await octokit.rest.repos.deleteFile({
          owner,
          repo,
          path,
          message,
          sha,
          branch,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_directory_contents': {
        const { owner, repo, path = '', ref } = args;
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: path === '.' ? '' : path,
          ref,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'get_tree': {
        const { owner, repo, tree_sha, recursive = true } = args;
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha,
          recursive: recursive ? '1' : undefined,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown files tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Files tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
