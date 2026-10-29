import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 发布使用服务端 CI 密钥；浏览器和官网构建均不接触此令牌。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.VERCEL_TOKEN;
const team = process.env.VERCEL_ORG_ID;
const project = process.env.VERCEL_PROJECT_ID;
if (!token || !team || !project) throw new Error('需要 VERCEL_TOKEN、VERCEL_ORG_ID 和 VERCEL_PROJECT_ID。');

async function api(endpoint, body) {
  const response = await fetch(`https://api.vercel.com${endpoint}?teamId=${encodeURIComponent(team)}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Vercel ${response.status}: ${data.error?.message || '请求失败'}`);
  return data;
}

const paths = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const files = await Promise.all(paths.map(async file => ({ file, data: (await readFile(path.join(root, file))).toString('base64'), encoding: 'base64' })));
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const deployment = await api('/v13/deployments', {
  name: 'moebot-website',
  project,
  target: 'production',
  files,
  projectSettings: { framework: 'astro', buildCommand: 'npm run build', installCommand: 'npm ci', outputDirectory: 'dist', nodeVersion: '24.x' },
  meta: { githubCommitSha: sha, githubCommitOrg: 'MoeBotOfficial', githubCommitRepo: 'MoeBot-Website', githubCommitRef: 'main' },
});
console.log(`部署已创建：${deployment.id} · https://${deployment.url}`);
const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 8000));
  const status = await api(`/v13/deployments/${deployment.id}`);
  if (status.readyState === 'READY') {
    console.log(`正式部署完成：https://moebot-website.vercel.app · ${sha.slice(0, 12)}`);
    process.exit(0);
  }
  if (['ERROR', 'CANCELED'].includes(status.readyState)) throw new Error(`部署未完成：${status.readyState}。请查看 Vercel 构建日志。`);
}
throw new Error('等待部署超时。请先核对 Vercel 状态，再决定是否重试。');
