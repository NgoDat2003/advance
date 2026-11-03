import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.join(REPO_ROOT, 'scripts', 'teacher.mjs');
const TMP_BASE = path.join(REPO_ROOT, '.teacher', 'tmp');

function gitInitFixture(dir) {
  fs.mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: dir, shell: false });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir, shell: false });
  spawnSync('git', ['config', 'user.name', 'Test Learner'], { cwd: dir, shell: false });

  fs.mkdirSync(path.join(dir, '.teacher'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.gitignore'),
    'node_modules/\n/.teacher/state.local.json\n/.teacher/tmp/\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(dir, '.teacher', 'config.json'),
    JSON.stringify(
      {
        version: 1,
        defaultLevel: 2,
        defaultRung: 0,
        quietMs: 5000,
        timeoutMs: 0,
        hubPath: '../omnipos-finledger-hub',
        forbiddenHubPorts: [3000, 3001, 5433, 6379],
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  fs.mkdirSync(path.join(dir, 'labs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'labs', 'base.js'), 'export const x = 1;\n', 'utf8');
  spawnSync('git', ['add', '.'], { cwd: dir, shell: false });
  spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir, shell: false });
}

function makeFixture(name) {
  const dir = path.join(TMP_BASE, `${name}-${process.pid}-${Date.now()}`);
  gitInitFixture(dir);
  return dir;
}

function runCli(args, cwd = REPO_ROOT) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    encoding: 'utf8',
    shell: false,
  });
}

test.after(() => {
  fs.rmSync(TMP_BASE, { recursive: true, force: true });
});

test('status & level: resolves Level 2 default, supports git-clean local override, and restricts --save keys', (t) => {
  const root = makeFixture('status-level');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const s0 = runCli(['status', '--root', root, '--json']);
  assert.equal(s0.status, 0, s0.stderr);
  const p0 = JSON.parse(s0.stdout);
  assert.equal(p0.level, 2);
  assert.equal(p0.levelName, 'middle');
  assert.equal(p0.currentRung, 0);
  assert.equal(p0.isLocalOverride, false);

  const l3 = runCli(['level', 'SeNiOr', '--root', root, '--json']);
  assert.equal(l3.status, 0, l3.stderr);
  const p3 = JSON.parse(l3.stdout);
  assert.equal(p3.level, 3);
  assert.equal(p3.levelName, 'senior');
  assert.equal(p3.isLocalOverride, true);

  // Tracked config.json must stay clean (defaultLevel still 2)
  const trackedBeforeSave = JSON.parse(fs.readFileSync(path.join(root, '.teacher', 'config.json'), 'utf8'));
  assert.equal(trackedBeforeSave.defaultLevel, 2);

  // Inject transient runtime keys into state.local.json and verify --save NEVER copies them into tracked config.json
  const statePath = path.join(root, '.teacher', 'state.local.json');
  const rawState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  rawState.lastTarget = 'custom/local/path';
  rawState.lastReviewedHash = 'deadbeef1234';
  fs.writeFileSync(statePath, JSON.stringify(rawState, null, 2), 'utf8');

  const saved = runCli(['status', '--root', root, '--save', '--json']);
  assert.equal(saved.status, 0, saved.stderr);
  const trackedAfterSave = JSON.parse(fs.readFileSync(path.join(root, '.teacher', 'config.json'), 'utf8'));
  assert.equal(trackedAfterSave.defaultLevel, 3);
  assert.equal('lastTarget' in trackedAfterSave, false);
  assert.equal('lastReviewedHash' in trackedAfterSave, false);

  // Invalid levels exit with code 2
  const bad = runCli(['level', 'godmode', '--root', root]);
  assert.equal(bad.status, 2);
});

test('rung & hint: supports query, explicit set, auto-advance clamping at 3, and invalid rejection', (t) => {
  const root = makeFixture('rung-hint');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  // Zero-arg rung queries without advancing
  const r0 = JSON.parse(runCli(['rung', '--root', root, '--json']).stdout);
  assert.equal(r0.currentRung, 0);

  // Zero-arg hint advances 0 -> 1 -> 2 -> 3 and clamps at 3
  assert.equal(JSON.parse(runCli(['hint', '--root', root, '--json']).stdout).currentRung, 1);
  assert.equal(JSON.parse(runCli(['hint', 'next', '--root', root, '--json']).stdout).currentRung, 2);
  assert.equal(JSON.parse(runCli(['hint', '--root', root, '--json']).stdout).currentRung, 3);
  assert.equal(JSON.parse(runCli(['hint', '--root', root, '--json']).stdout).currentRung, 3);

  // Explicit reset back to 0
  assert.equal(JSON.parse(runCli(['rung', '0', '--root', root, '--json']).stdout).currentRung, 0);

  // Invalid rung exits 2
  assert.equal(runCli(['hint', '4', '--root', root]).status, 2);
  assert.equal(runCli(['rung', '-1', '--root', root]).status, 2);
});

test('diff: captures tracked, staged, and untracked files plus TODO(Đạt) and __N__ slots', (t) => {
  const root = makeFixture('diff-slots');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  // Enable diff.noprefix + default quotepath to ensure parser resists custom git configs & Vietnamese paths
  spawnSync('git', ['config', 'diff.noprefix', 'true'], { cwd: root, shell: false });
  fs.writeFileSync(path.join(root, 'labs', 'base.js'), 'export const x = 2;\n', 'utf8');
  spawnSync('git', ['add', 'labs/base.js'], { cwd: root, shell: false });

  // Create brand-new untracked exercise file with Vietnamese diacritics, TODO(Đạt), and __1__, __2__ slots
  fs.writeFileSync(
    path.join(root, 'labs', 'bài-tập-redis-lock.ts'),
    [
      '// TODO(Đạt): cài đặt khóa phân tán chống race condition',
      'export async function acquire(redis: any, key: string) {',
      '  const ok = await redis.set(key, "1", "__1__", 5, "__2__");',
      '  return ok === "OK";',
      '}',
      '',
    ].join('\n'),
    'utf8'
  );

  const res = runCli(['diff', '--target', 'local', '--root', root, '--json']);
  assert.equal(res.status, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.summary.filesChanged, 2);
  assert.equal(out.todoSlots.todoDatCount, 1);
  assert.equal(out.todoSlots.slotCount, 2);
  assert.deepEqual(out.todoSlots.slots, ['__1__', '__2__']);
  assert.match(out.diffHash, /^[a-f0-9]{64}$/);
});

test('diff guardrails: scopes K-01 ports to Hub only (no lab/setTimeout false positives) and redacts K-04 secrets', (t) => {
  const container = path.join(TMP_BASE, `guardrails-${process.pid}-${Date.now()}`);
  const mainRepo = path.join(container, 'advance-be');
  const hubRepo = path.join(container, 'omnipos-finledger-hub');
  t.after(() => fs.rmSync(container, { recursive: true, force: true }));

  gitInitFixture(mainRepo);
  gitInitFixture(hubRepo);

  // 1) In advance-be labs, Redis 6379, PG 5433, and setTimeout(..., 3000) are legitimate -> 0 violations
  fs.writeFileSync(
    path.join(mainRepo, 'labs', 'lab06.mjs'),
    'const redisUrl = "redis://127.0.0.1:6379";\nconst pgPort = 5433;\nsetTimeout(() => {}, 3000);\n',
    'utf8'
  );
  const localCheck = runCli(['diff', '--target', 'local', '--root', mainRepo, '--json']);
  assert.equal(localCheck.status, 0, localCheck.stderr);
  assert.deepEqual(JSON.parse(localCheck.stdout).violations, []);

  // 2) In omnipos-finledger-hub, setTimeout(..., 3000) + env placeholders are safe,
  //    but port 6379/3000 and real secrets/URLs trigger K-01 & K-04 with strict redaction!
  const rawSecretToken = 'SuperSensitiveJwtSecretValue99!';
  const rawDbPass = 'ProdDbPassw0rd#2026';
  fs.mkdirSync(path.join(hubRepo, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(hubRepo, 'src', 'config.ts'),
    [
      'setTimeout(() => {}, 3000);',
      'const safeEnv = process.env.JWT_SECRET;',
      'const safePlaceholder = "<SECRET_TOKEN>";',
      'const badRedis = "redis://127.0.0.1:6379";',
      'const badPort = { port: 3000 };',
      `const leakedJwt = \`${rawSecretToken}\`;`,
      `const leakedUrl = "postgres://fin_user:${rawDbPass}@localhost:5434/omnipos_hub";`,
      '',
    ].join('\n'),
    'utf8'
  );

  const hubCheck = runCli(['diff', '--target', 'hub', '--root', mainRepo, '--json']);
  assert.equal(hubCheck.status, 1);
  // Raw secrets MUST NEVER appear anywhere in stdout or stderr (RT-01)
  assert.equal(hubCheck.stdout.includes(rawSecretToken), false, 'Plaintext JWT secret leaked to stdout');
  assert.equal(hubCheck.stdout.includes(rawDbPass), false, 'Plaintext DB password leaked to stdout');

  const hubOut = JSON.parse(hubCheck.stdout);
  assert.equal(hubOut.isHubTarget, true);
  assert.equal(hubOut.violations.length, 2);
  assert.deepEqual(
    hubOut.violations.map((v) => v.rule),
    ['K-01', 'K-01']
  );
  assert.equal(hubOut.secrets.length, 2);
  for (const s of hubOut.secrets) {
    assert.equal(s.rule, 'K-04');
    assert.match(s.content, /\*\*\*REDACTED\*\*\*/);
  }
});

test('diff target resolution: graceful missing optional hub vs exit 2 on invalid explicit --target', (t) => {
  const isolated = path.join(TMP_BASE, `isolated-${process.pid}-${Date.now()}`, 'standalone-repo');
  t.after(() => fs.rmSync(path.dirname(isolated), { recursive: true, force: true }));
  gitInitFixture(isolated);

  const missingHub = runCli(['diff', '--target', 'hub', '--root', isolated, '--json']);
  assert.equal(missingHub.status, 0, missingHub.stderr);
  const parsed = JSON.parse(missingHub.stdout);
  assert.equal(parsed.hubExists, false);

  const badExplicit = runCli(['diff', '--target', './non-existent-folder', '--root', isolated]);
  assert.equal(badExplicit.status, 2);

  const flagInjection = runCli(['diff', '--target', '--evil-flag', '--root', isolated]);
  assert.equal(flagInjection.status, 2);
});

test('watch-once: startup pre-check, duplicate suppression, burst debounce, null filename safety, and flag validation', async (t) => {
  const root = makeFixture('watcher');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  // Invalid numeric flags rejected with code 2
  assert.equal(runCli(['watch-once', '--quiet-ms', 'abc', '--root', root]).status, 2);
  assert.equal(runCli(['watch-once', '--quiet-ms', '0', '--root', root]).status, 2);
  assert.equal(runCli(['watch-once', '--timeout-ms', '-10', '--root', root]).status, 2);

  // 1) Startup Pre-Check: modify file BEFORE starting watch-once -> wakes immediately without hanging
  fs.writeFileSync(path.join(root, 'labs', 'step1.js'), '// TODO(Đạt): step 1\n', 'utf8');
  const preCheck = runCli(['watch-once', '--target', 'local', '--quiet-ms', '100', '--timeout-ms', '2000', '--root', root, '--json']);
  assert.equal(preCheck.status, 0, preCheck.stderr);
  const preOut = JSON.parse(preCheck.stdout);
  assert.equal(preOut.event, 'diff_detected');
  assert.ok(preOut.changedFiles.some((f) => f.endsWith('labs/step1.js')));

  // 2) Duplicate Hash Suppression + Clean Timeout when no new diff arrives
  const dupTimeout = runCli(['watch-once', '--target', 'local', '--quiet-ms', '80', '--timeout-ms', '250', '--root', root, '--json']);
  assert.equal(dupTimeout.status, 0, dupTimeout.stderr);
  assert.equal(JSON.parse(dupTimeout.stdout).event, 'timeout');

  // 3) Live Debounced Burst Coalescing (simulating VS Code formatOnSave multiple rapid writes)
  const child = spawn(
    process.execPath,
    [CLI_PATH, 'watch-once', '--target', 'local', '--quiet-ms', '120', '--timeout-ms', '4000', '--root', root, '--json'],
    { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'], shell: false }
  );

  const closePromise = new Promise((resolve) => child.once('close', resolve));
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  // Give fs.watch 120ms to attach, then fire 4 rapid saves 20ms apart + noise in ignored node_modules
  await new Promise((r) => setTimeout(r, 120));
  fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'index.js'), 'ignored\n', 'utf8');

  for (let i = 1; i <= 4; i++) {
    fs.writeFileSync(path.join(root, 'labs', 'step1.js'), `export const attempt = ${i};\n`, 'utf8');
    await new Promise((r) => setTimeout(r, 20));
  }

  const exitCode = await closePromise;
  assert.equal(exitCode, 0, stderr);
  const burstOut = JSON.parse(stdout);
  assert.equal(burstOut.event, 'diff_detected');
  assert.notEqual(burstOut.diffHash, preOut.diffHash);

  // Dynamic import check for Windows null filename guard (RT-09)
  const mod = await import('./teacher.mjs');
  assert.equal(mod.shouldIgnoreWatchPath(null), false);
  assert.equal(mod.shouldIgnoreWatchPath('.git/HEAD'), true);
  assert.equal(mod.shouldIgnoreWatchPath('node_modules/foo/index.js'), true);
  assert.equal(mod.shouldIgnoreWatchPath('labs/redis.lua'), false);
});

test('protocol parity: AGENTS.md and CLAUDE.md share byte-identical Live Coding Pair-Teacher Protocol', () => {
  const agentsText = fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n');
  const claudeText = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8').replace(/\r\n/g, '\n');
  const marker = '## Live Coding Pair-Teacher Protocol';
  const idxA = agentsText.indexOf(marker);
  const idxC = claudeText.indexOf(marker);

  assert.notEqual(idxA, -1, 'AGENTS.md is missing ## Live Coding Pair-Teacher Protocol');
  assert.notEqual(idxC, -1, 'CLAUDE.md is missing ## Live Coding Pair-Teacher Protocol');
  assert.equal(agentsText.slice(idxA), claudeText.slice(idxC));
});
