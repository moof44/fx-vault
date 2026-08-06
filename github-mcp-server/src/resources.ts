import { octokit } from './github-client.js';
import { formatError } from './utils.js';

export const resourceTemplates = [
  {
    uriTemplate: 'github://user/me',
    name: 'Authenticated User Profile',
    description: 'Returns profile details for the authenticated user',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'github://repo/{owner}/{repo}',
    name: 'GitHub Repository Info',
    description: 'Returns metadata for a GitHub repository',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'github://repo/{owner}/{repo}/file/{path}',
    name: 'GitHub File Content',
    description: 'Returns content of a file in a GitHub repository',
    mimeType: 'text/plain',
  },
  {
    uriTemplate: 'github://repo/{owner}/{repo}/issue/{issue_number}',
    name: 'GitHub Issue Details',
    description: 'Returns details of a GitHub issue',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'github://repo/{owner}/{repo}/pull/{pull_number}',
    name: 'GitHub Pull Request Details',
    description: 'Returns details of a GitHub pull request',
    mimeType: 'application/json',
  },
];

export async function handleReadResource(uri: string) {
  try {
    const url = new URL(uri);

    if (uri === 'github://user/me') {
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // Match github://repo/{owner}/{repo}
    const repoMatch = uri.match(/^github:\/\/repo\/([^/]+)\/([^/]+)$/);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      const { data } = await octokit.rest.repos.get({ owner, repo });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // Match github://repo/{owner}/{repo}/file/{path}
    const fileMatch = uri.match(/^github:\/\/repo\/([^/]+)\/([^/]+)\/file\/(.+)$/);
    if (fileMatch) {
      const [, owner, repo, filePath] = fileMatch;
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path: filePath });
      if (!Array.isArray(data) && data.type === 'file' && 'content' in data) {
        const decoded = Buffer.from(data.content, (data.encoding || 'base64') as BufferEncoding).toString('utf-8');
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: decoded,
            },
          ],
        };
      }
    }

    // Match github://repo/{owner}/{repo}/issue/{issue_number}
    const issueMatch = uri.match(/^github:\/\/repo\/([^/]+)\/([^/]+)\/issue\/(\d+)$/);
    if (issueMatch) {
      const [, owner, repo, issue_number] = issueMatch;
      const { data } = await octokit.rest.issues.get({ owner, repo, issue_number: parseInt(issue_number, 10) });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // Match github://repo/{owner}/{repo}/pull/{pull_number}
    const pullMatch = uri.match(/^github:\/\/repo\/([^/]+)\/([^/]+)\/pull\/(\d+)$/);
    if (pullMatch) {
      const [, owner, repo, pull_number] = pullMatch;
      const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: parseInt(pull_number, 10) });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unsupported resource URI: ${uri}`);
  } catch (err) {
    throw new Error(`Error reading resource '${uri}': ${formatError(err)}`);
  }
}
