import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const canonical = new Set(['main', 'dev']);

export function classifyBranch(branch, { main, dev, openPulls = [] } = {}) {
  if (!branch || !branch.name || !branch.sha) throw new TypeError('Branch name/SHA required');
  const prNumbers = openPulls.filter((pr) =>
    pr?.head?.repo?.full_name === branch.repository &&
    pr.head.ref === branch.name
  ).map((pr) => pr.number);
  const row = { branch: branch.name, sha: branch.sha, prNumbers, automaticDelete: false };
  if (canonical.has(branch.name)) return { ...row, disposition: 'RETAIN', reason: 'canonical branch' };
  if (prNumbers.length) return { ...row, disposition: 'RETAIN', reason: 'active PR head (including draft)' };
  if (branch.protected) return { ...row, disposition: 'RETAIN', reason: 'protected branch' };
  if (!Number.isInteger(main?.ahead_by) || main.ahead_by < 0 ||
      !Number.isInteger(dev?.ahead_by) || dev.ahead_by < 0) {
    return { ...row, disposition: 'RETAIN', reason: 'unverified ancestry or GitHub API failure' };
  }
  if (main.ahead_by === 0 || dev.ahead_by === 0) {
    return { ...row, disposition: 'REVIEW_ONLY', reason: 'contained in canonical history; archival and retention approval required' };
  }
  return { ...row, disposition: 'RETAIN', reason: 'unique commits outside both canonical heads' };
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo) || !token) {
    throw new Error('Valid GITHUB_REPOSITORY and GH_TOKEN required');
  }
  const api = async (endpoint) => {
    const response = await fetch('https://api.github.com/repos/' + repo + '/' + endpoint, {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: 'Bearer ' + token,
        'x-github-api-version': '2022-11-28',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('GitHub read failed for ' + endpoint + ': HTTP ' + response.status);
    return response.json();
  };
  const pages = async (endpoint) => {
    const rows = [];
    for (let page = 1; page <= 25; page++) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const result = await api(endpoint + separator + 'per_page=100&page=' + page);
      if (!Array.isArray(result)) throw new Error('Malformed response: ' + endpoint);
      rows.push(...result);
      if (result.length < 100) return rows;
    }
    throw new Error('Pagination limit reached: ' + endpoint);
  };

  const [branches, openPulls] = await Promise.all([
    pages('branches'),
    pages('pulls?state=open'),
  ]);
  const byName = new Map(branches.map((branch) => [branch.name, branch]));
  const mainSha = byName.get('main')?.commit?.sha;
  const devSha = byName.get('dev')?.commit?.sha;
  if (!mainSha || !devSha) throw new Error('Missing canonical branch; fail closed');
  const rows = [];
  for (const branch of branches) {
    const b = {
      repository: repo,
      name: branch.name,
      sha: branch.commit?.sha,
      protected: branch.protected === true,
    };
    if (!b.sha) throw new Error('Branch without SHA: ' + b.name);
    if (canonical.has(b.name)) {
      rows.push(classifyBranch(b, { openPulls }));
    } else {
      // Comparing immutable commit SHAs avoids a changing ref during inventory.
      const [m, d] = await Promise.all([
        api('compare/' + mainSha + '...' + b.sha),
        api('compare/' + devSha + '...' + b.sha),
      ]);
      rows.push(classifyBranch(b, { main: m, dev: d, openPulls }));
    }
  }
  const escaped = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const lines = [
    '## Branch policy — audit only',
    '',
    'Main SHA: ' + mainSha + '; dev SHA: ' + devSha,
    'Branches: ' + branches.length + '; open PRs: ' + openPulls.length,
    '**No deletions or pushes are possible in this workflow.**',
    '**REVIEW_ONLY never implies permission to delete.**',
    '',
    '| Branch | Status | Reason | Active PRs |',
    '|---|---|---|---|',
    ...rows.map((r) => '| ' + escaped(r.branch) + ' | ' + r.disposition +
      ' | ' + escaped(r.reason) + ' | ' + (r.prNumbers.join(', ') || '—') + ' |'),
    '',
    'API errors fail the inventory without modifying refs.',
    '',
  ];
  const summary = lines.join('\n');
  process.stdout.write(summary + '\n');
  process.stdout.write('Audit JSON: ' + JSON.stringify({ repo, mainSha, devSha, rows }) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
