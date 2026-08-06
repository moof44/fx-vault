import dotenv from 'dotenv';
import path from 'path';
import { handleUserTools } from '../src/tools/user.js';
import { handleRepoTools } from '../src/tools/repo.js';
import { handleFilesTools } from '../src/tools/files.js';
import { handleBranchCommitTools } from '../src/tools/branches-commits.js';
import { handleIssueTools } from '../src/tools/issues.js';
import { handleSearchTools } from '../src/tools/search.js';
import { handleReadResource } from '../src/resources.js';
import { handleGetPrompt } from '../src/prompts.js';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function runTests() {
  console.log('🧪 Starting GitHub MCP Server integration tests with live GitHub API...\n');

  let passed = 0;
  let failed = 0;

  async function assertTool(testName: string, fn: () => Promise<any>) {
    try {
      const res = await fn();
      if (res?.isError) {
        console.error(`❌ ${testName} failed:`, res.content?.[0]?.text);
        failed++;
      } else {
        console.log(`✅ ${testName} passed`);
        passed++;
      }
    } catch (err: any) {
      console.error(`❌ ${testName} threw exception:`, err?.message || err);
      failed++;
    }
  }

  // 1. Test get_me
  await assertTool('User Tools: get_me', async () => {
    const res = await handleUserTools('get_me', {});
    const data = JSON.parse(res.content[0].text);
    if (!data.login) throw new Error('Missing login field in user response');
    console.log(`   Authenticated user login: @${data.login}`);
    return res;
  });

  // 2. Test get_user
  await assertTool('User Tools: get_user (octocat)', async () => {
    return handleUserTools('get_user', { username: 'octocat' });
  });

  // 3. Test search_repositories
  await assertTool('Repo Tools: search_repositories', async () => {
    return handleRepoTools('search_repositories', { query: 'language:typescript stars:>50000', per_page: 2 });
  });

  // 4. Test list_user_repositories
  await assertTool('Repo Tools: list_user_repositories', async () => {
    return handleRepoTools('list_user_repositories', { per_page: 5 });
  });

  // 5. Test search_code
  await assertTool('Search Tools: search_code', async () => {
    return handleSearchTools('search_code', { query: 'octokit repo:octokit/octokit.js', per_page: 2 });
  });

  // 6. Test Resource: github://user/me
  await assertTool('Resources: github://user/me', async () => {
    const res = await handleReadResource('github://user/me');
    if (!res.contents[0]?.text) throw new Error('Empty resource content');
    return { isError: false, content: [] };
  });

  // 7. Test Prompt: review-pull-request
  await assertTool('Prompts: review-pull-request', async () => {
    const res = await handleGetPrompt('review-pull-request', { owner: 'moof44', repo: 'fx-vault', pull_number: '1' });
    if (!res.messages[0]?.content?.text) throw new Error('Empty prompt text');
    return { isError: false, content: [] };
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
