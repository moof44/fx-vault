export const promptDefinitions = [
  {
    name: 'review-pull-request',
    description: 'Generates a code review prompt for a specific pull request',
    arguments: [
      { name: 'owner', description: 'Repository owner', required: true },
      { name: 'repo', description: 'Repository name', required: true },
      { name: 'pull_number', description: 'Pull request number', required: true },
    ],
  },
  {
    name: 'triage-issue',
    description: 'Generates an issue triaging prompt to analyze issue priority and components',
    arguments: [
      { name: 'owner', description: 'Repository owner', required: true },
      { name: 'repo', description: 'Repository name', required: true },
      { name: 'issue_number', description: 'Issue number', required: true },
    ],
  },
  {
    name: 'repository-audit',
    description: 'Generates a prompt for inspecting repository health and architecture',
    arguments: [
      { name: 'owner', description: 'Repository owner', required: true },
      { name: 'repo', description: 'Repository name', required: true },
    ],
  },
];

export async function handleGetPrompt(name: string, args: Record<string, string>) {
  switch (name) {
    case 'review-pull-request': {
      const { owner, repo, pull_number } = args;
      return {
        description: `Perform code review on PR #${pull_number} in ${owner}/${repo}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please perform a comprehensive code review on GitHub Pull Request #${pull_number} for repository ${owner}/${repo}.
1. Use \`get_pull_request\` to fetch PR title, description, author, and base/head branches.
2. Use \`list_pull_request_files\` to examine changed files, patches, additions, and deletions.
3. Check for security vulnerabilities, architectural concerns, code formatting issues, and test coverage.
4. Provide structured, actionable review comments and recommendation (Approve, Request Changes, or Comment).`,
            },
          },
        ],
      };
    }
    case 'triage-issue': {
      const { owner, repo, issue_number } = args;
      return {
        description: `Triage issue #${issue_number} in ${owner}/${repo}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please triage GitHub Issue #${issue_number} in ${owner}/${repo}.
1. Use \`get_issue\` to fetch the title, body, existing labels, and author.
2. Summarize the issue report concisely.
3. Categorize the issue (e.g., Bug, Feature Request, Documentation, Refactor).
4. Suggest appropriate labels, severity/priority level, and potential next steps or assignee.`,
            },
          },
        ],
      };
    }
    case 'repository-audit': {
      const { owner, repo } = args;
      return {
        description: `Audit repository ${owner}/${repo}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please perform an architectural and health audit for repository ${owner}/${repo}.
1. Use \`get_repository\` to retrieve project overview and stats.
2. Use \`list_directory_contents\` or \`get_tree\` to inspect project directory structure.
3. Use \`list_issues\` and \`list_pull_requests\` to inspect open activity.
4. Provide a summary report covering tech stack, project organization, open issue count, and maintenance recommendations.`,
            },
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
