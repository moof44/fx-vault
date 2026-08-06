import { octokit } from '../github-client.js';
import { formatError } from '../utils.js';

export const actionsToolDefinitions = [
  {
    name: 'list_workflows',
    description: 'List GitHub Actions workflows for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_workflow_runs',
    description: 'List workflow runs for a repository or specific workflow',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: { type: 'string', description: 'Workflow ID or filename (e.g. "main.yml")' },
        branch: { type: 'string', description: 'Filter by branch' },
        event: { type: 'string', description: 'Filter by event (e.g. "push", "pull_request")' },
        status: { type: 'string', description: 'Filter by status (e.g. "completed", "queued", "in_progress")' },
        per_page: { type: 'number', description: 'Results per page' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'trigger_workflow_dispatch',
    description: 'Manually trigger a GitHub Actions workflow dispatch event',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: { type: 'string', description: 'Workflow ID or filename (e.g. "main.yml")' },
        ref: { type: 'string', description: 'Git ref to trigger on (e.g. "main" or branch)' },
        inputs: { type: 'object', description: 'Input parameters expected by the workflow' },
      },
      required: ['owner', 'repo', 'workflow_id', 'ref'],
    },
  },
];

export async function handleActionsTools(name: string, args: any) {
  try {
    switch (name) {
      case 'list_workflows': {
        const { owner, repo, per_page } = args;
        const { data } = await octokit.rest.actions.listRepoWorkflows({
          owner,
          repo,
          per_page,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'list_workflow_runs': {
        const { owner, repo, workflow_id, branch, event, status, per_page } = args;
        let data;
        if (workflow_id) {
          const res = await octokit.rest.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id,
            branch,
            event,
            status: status as any,
            per_page,
          });
          data = res.data;
        } else {
          const res = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            branch,
            event,
            status: status as any,
            per_page,
          });
          data = res.data;
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'trigger_workflow_dispatch': {
        const { owner, repo, workflow_id, ref, inputs } = args;
        await octokit.rest.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id,
          ref,
          inputs,
        });
        return {
          content: [{ type: 'text', text: `Successfully triggered workflow dispatch '${workflow_id}' on ref '${ref}'` }],
        };
      }
      default:
        throw new Error(`Unknown actions tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Actions tool '${name}' error: ${formatError(err)}` }],
    };
  }
}
