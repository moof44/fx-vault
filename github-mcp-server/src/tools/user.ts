import { z } from 'zod';
import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const userToolDefinitions = [
  {
    name: 'get_me',
    description: 'Get details of the currently authenticated GitHub user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_user',
    description: 'Get public profile details of a GitHub user by username',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'GitHub username',
        },
      },
      required: ['username'],
    },
  },
];

export async function handleUserTools(name: string, args: any) {
  switch (name) {
    case 'get_me': {
      try {
        const { data } = await octokit.rest.users.getAuthenticated();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to get authenticated user: ${formatError(err)}` }],
        };
      }
    }
    case 'get_user': {
      try {
        const { username } = args;
        const { data } = await octokit.rest.users.getByUsername({ username });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to get user '${args?.username}': ${formatError(err)}` }],
        };
      }
    }
    default:
      throw new Error(`Unknown user tool: ${name}`);
  }
}
