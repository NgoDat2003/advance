#!/usr/bin/env node
// Công cụ CLI & Auto-Advisor Watcher không phụ thuộc thư viện ngoài cho chế độ "Thầy Kèm Live Coding".
// Chỉ sử dụng thư viện chuẩn của Node.js (fs, path, child_process, crypto, url).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  defaultLevel: 2,
  defaultRung: 0,
  quietMs: 5000,
  timeoutMs: 0,
  hubPath: '../omnipos-finledger-hub',
  forbiddenHubPorts: [3000, 3001, 5433, 6379],
});

const LEVEL_NAMES = Object.freeze({
  1: 'junior',
  2: 'middle',
  3: 'senior',
});

const LEVEL_ALIASES = Object.freeze({
  '1': 1,
  junior: 1,
  '2': 2,
  middle: 2,
  mid: 2,
  '3': 3,
  senior: 3,
});

const RUNG_NAMES = Object.freeze({
  0: 'Nấc 0 — Phao cú pháp & Luồng 3 bước',
  1: 'Nấc 1 — Nhắc hướng & Chỉ dòng lỗi',
  2: 'Nấc 2 — Khung điền khuyết 70/30',
  3: 'Nấc 3 — Làm mẫu chuẩn phỏng vấn & Gõ lại biến thể',
});

const IGNORED_SEGMENTS = new Set([
  '.git',
  'node_modules',
  '.worktrees',
  '.teacher',
  'dist',
  'build',
  '.next',
  'coverage',
]);

const EMPTY_HASH = crypto.createHash('sha256').update('').digest('hex');

// Kiểm tra đường dẫn sự kiện fs.watch (bảo vệ trường hợp filename === null trên Windows ReadDirectoryChangesW)
export function shouldIgnoreWatchPath(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  const normalized = filename.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized) return false;

  if (
    normalized.endsWith('.tmp') ||
    normalized.endsWith('.temp') ||
    normalized.endsWith('.log') ||
    normalized.endsWith('.swp') ||
    normalized.endsWith('~')
  ) {
    return true;
  }

  if (normalized === 'checks/out' || normalized.startsWith('checks/out/')) {
    return true;
  }

  const segments = normalized.split('/');
  return segments.some((seg) => IGNORED_SEGMENTS.has(seg));
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function parseStrictInt(raw, minVal) {
  if (typeof raw !== 'string' || !/^-?\d+$/.test(raw.trim())) return null;
  const val = Number.parseInt(raw.trim(), 10);
  if (!Number.isSafeInteger(val) || val < minVal) return null;
  return val;
}

export function parseCliArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {
    root: process.cwd(),
    target: 'auto',
    targetExplicit: false,
    quietMs: null,
    timeoutMs: null,
    json: false,
    save: false,
  };
  const positionals = [];

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token === '--json') {
      flags.json = true;
    } else if (token === '--save') {
      flags.save = true;
    } else if (token === '--root') {
      const next = rest[++i];
      if (!next || next.startsWith('-')) return { error: 'Missing or invalid --root path', code: 2 };
      flags.root = path.resolve(next);
    } else if (token === '--target') {
      const next = rest[++i];
      if (!next || next.startsWith('-')) return { error: 'Missing or invalid --target value', code: 2 };
      flags.target = next;
      flags.targetExplicit = true;
    } else if (token === '--quiet-ms') {
      const next = rest[++i];
      const parsed = parseStrictInt(next ?? '', 1);
      if (parsed === null) return { error: 'Invalid --quiet-ms (must be integer >= 1)', code: 2 };
      flags.quietMs = parsed;
    } else if (token === '--timeout-ms') {
      const next = rest[++i];
      const parsed = parseStrictInt(next ?? '', 0);
      if (parsed === null) return { error: 'Invalid --timeout-ms (must be integer >= 0)', code: 2 };
      flags.timeoutMs = parsed;
    } else if (token.startsWith('-')) {
      return { error: `Unknown flag: ${token}`, code: 2 };
    } else {
      positionals.push(token);
    }
  }

  return { command, positionals, flags, code: 0 };
}

function resolveHubDirectory(rootDir, configuredHubPath) {
  const candidates = [
    path.resolve(rootDir, configuredHubPath),
    path.join(rootDir, 'omnipos-finledger-hub'),
  ];

  // Nếu đang chạy bên trong git worktree (.worktrees/<branch>), dò thêm từ thư mục gốc của repo chính
  const commonGit = spawnSync('git', ['rev-parse', '--git-common-dir'], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: false,
  });
  if (commonGit.status === 0 && commonGit.stdout.trim()) {
    const absCommonGit = path.resolve(rootDir, commonGit.stdout.trim());
    const mainRoot = path.dirname(absCommonGit);
    candidates.push(path.resolve(mainRoot, configuredHubPath));
    candidates.push(path.join(mainRoot, 'omnipos-finledger-hub'));
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, '.git'))) {
        return fs.realpathSync(candidate);
      }
    } catch {
      // Bỏ qua đường dẫn lỗi và thử ứng viên kế tiếp
    }
  }
  return null;
}

export function loadTeacherContext(rootDir) {
  const configPath = path.join(rootDir, '.teacher', 'config.json');
  const statePath = path.join(rootDir, '.teacher', 'state.local.json');
  const rawConfig = readJsonSafe(configPath) || {};
  const rawState = readJsonSafe(statePath) || {};

  const config = {
    version: 1,
    defaultLevel: [1, 2, 3].includes(rawConfig.defaultLevel) ? rawConfig.defaultLevel : DEFAULT_CONFIG.defaultLevel,
    defaultRung: [0, 1, 2, 3].includes(rawConfig.defaultRung) ? rawConfig.defaultRung : DEFAULT_CONFIG.defaultRung,
    quietMs: Number.isInteger(rawConfig.quietMs) && rawConfig.quietMs > 0 ? rawConfig.quietMs : DEFAULT_CONFIG.quietMs,
    timeoutMs: Number.isInteger(rawConfig.timeoutMs) && rawConfig.timeoutMs >= 0 ? rawConfig.timeoutMs : DEFAULT_CONFIG.timeoutMs,
    hubPath: typeof rawConfig.hubPath === 'string' && rawConfig.hubPath ? rawConfig.hubPath : DEFAULT_CONFIG.hubPath,
    forbiddenHubPorts: Array.isArray(rawConfig.forbiddenHubPorts)
      ? rawConfig.forbiddenHubPorts
      : DEFAULT_CONFIG.forbiddenHubPorts,
  };

  const hasLocalLevel = [1, 2, 3].includes(rawState.level);
  const hasLocalRung = [0, 1, 2, 3].includes(rawState.currentRung);
  const level = hasLocalLevel ? rawState.level : config.defaultLevel;
  const currentRung = hasLocalRung ? rawState.currentRung : config.defaultRung;
  const resolvedHub = resolveHubDirectory(rootDir, config.hubPath);

  return {
    rootDir,
    configPath,
    statePath,
    config,
    state: rawState,
    level,
    levelName: LEVEL_NAMES[level],
    currentRung,
    rungName: RUNG_NAMES[currentRung],
    isLocalOverride: hasLocalLevel || hasLocalRung,
    resolvedHub,
    hubExists: Boolean(resolvedHub),
  };
}

// Chỉ ghi các khóa cấu hình mặc định an toàn vào .teacher/config.json (RT-01: tuyệt đối không lộ khóa phiên tạm)
function persistTrackedDefaults(ctx, nextLevel, nextRung) {
  const cleanTracked = {
    version: 1,
    defaultLevel: nextLevel,
    defaultRung: nextRung,
    quietMs: ctx.config.quietMs,
    timeoutMs: ctx.config.timeoutMs,
    hubPath: ctx.config.hubPath,
    forbiddenHubPorts: ctx.config.forbiddenHubPorts,
  };
  writeJsonAtomic(ctx.configPath, cleanTracked);
}

function persistLocalState(ctx, patch) {
  const nextState = {
    ...ctx.state,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(ctx.statePath, nextState);
  return nextState;
}

function resolveTargets(ctx, flags) {
  const spec = flags.target;
  if (spec === 'local' || spec === '.') {
    return {
      code: 0,
      targetLabel: 'local',
      isHubTarget: false,
      targets: [{ dir: ctx.rootDir, isHub: false }],
    };
  }
  if (spec === 'hub') {
    if (!ctx.resolvedHub) {
      return {
        code: 0,
        targetLabel: ctx.config.hubPath,
        isHubTarget: true,
        targets: [],
      };
    }
    return {
      code: 0,
      targetLabel: 'hub',
      isHubTarget: true,
      targets: [{ dir: ctx.resolvedHub, isHub: true }],
    };
  }
  if (spec === 'auto') {
    const targets = [{ dir: ctx.rootDir, isHub: false }];
    if (ctx.resolvedHub && path.resolve(ctx.resolvedHub) !== path.resolve(ctx.rootDir)) {
      targets.push({ dir: ctx.resolvedHub, isHub: true });
    }
    return {
      code: 0,
      targetLabel: 'auto',
      isHubTarget: Boolean(ctx.resolvedHub),
      targets,
    };
  }

  // Đường dẫn tùy chỉnh do người dùng truyền qua --target <dir>
  const resolvedCustom = path.resolve(ctx.rootDir, spec);
  if (!fs.existsSync(resolvedCustom) || !fs.statSync(resolvedCustom).isDirectory()) {
    return {
      code: 2,
      error: `Target directory does not exist: ${spec}`,
      targets: [],
    };
  }
  const realCustom = fs.realpathSync(resolvedCustom);
  const isHub =
    (ctx.resolvedHub && realCustom === ctx.resolvedHub) ||
    path.basename(realCustom).toLowerCase().includes('omnipos-finledger-hub');

  return {
    code: 0,
    targetLabel: spec,
    isHubTarget: isHub,
    targets: [{ dir: realCustom, isHub }],
  };
}

function parseUnifiedDiffAddedLines(diffText, prefixLabel = '') {
  const addedLines = [];
  const changedFiles = new Set();
  let insertions = 0;
  let deletions = 0;
  let currentFile = null;
  let currentNewLine = 0;

  for (const rawLine of diffText.split(/\r?\n/)) {
    if (rawLine.startsWith('diff --git ')) {
      currentFile = null;
      continue;
    }
    if (rawLine.startsWith('--- a/')) {
      const rel = rawLine.slice(6).trim();
      currentFile = prefixLabel ? `${prefixLabel}/${rel}` : rel;
      changedFiles.add(currentFile);
      continue;
    }
    if (rawLine.startsWith('+++ b/')) {
      const rel = rawLine.slice(6).trim();
      currentFile = prefixLabel ? `${prefixLabel}/${rel}` : rel;
      changedFiles.add(currentFile);
      continue;
    }
    if (rawLine.startsWith('--- ') || rawLine.startsWith('+++ ')) {
      continue;
    }
    const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentNewLine = Number.parseInt(hunkMatch[1], 10);
      continue;
    }
    if (!currentFile) continue;

    if (rawLine.startsWith('+')) {
      insertions += 1;
      addedLines.push({
        file: currentFile,
        line: currentNewLine,
        text: rawLine.slice(1),
      });
      currentNewLine += 1;
    } else if (rawLine.startsWith('-')) {
      deletions += 1;
    } else if (rawLine.startsWith(' ')) {
      currentNewLine += 1;
    }
  }

  return { addedLines, changedFiles, insertions, deletions };
}

function collectSingleRepoSnapshot(repoDir, isHub, prefixLabel = '') {
  // 1. Lấy toàn bộ thay đổi đã stage + chưa stage so với HEAD (shell: false chống injection)
  let diffRes = spawnSync('git', ['diff', 'HEAD', '--unified=0', '--no-color', '--'], {
    cwd: repoDir,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
  });

  // Dự phòng khi repo mới khởi tạo chưa có commit HEAD đầu tiên
  if (diffRes.status !== 0) {
    const cached = spawnSync('git', ['diff', '--cached', '--unified=0', '--no-color', '--'], {
      cwd: repoDir,
      encoding: 'utf8',
      shell: false,
    });
    const working = spawnSync('git', ['diff', '--unified=0', '--no-color', '--'], {
      cwd: repoDir,
      encoding: 'utf8',
      shell: false,
    });
    diffRes = { stdout: `${cached.stdout || ''}\n${working.stdout || ''}` };
  }

  const parsed = parseUnifiedDiffAddedLines(diffRes.stdout || '', prefixLabel);
  const hashChunks = [ (diffRes.stdout || '').replace(/\r\n/g, '\n').trim() ];

  // 2. Bổ sung các file mới tạo chưa git add (untracked, tôn trọng .gitignore) — RT-03
  const untrackedRes = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: repoDir,
    encoding: 'utf8',
    shell: false,
  });

  if (untrackedRes.status === 0 && untrackedRes.stdout) {
    const relFiles = untrackedRes.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !shouldIgnoreWatchPath(s))
      .sort();

    for (const rel of relFiles) {
      const fullPath = path.join(repoDir, rel);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile() || stat.size > 512 * 1024) continue;
        const buf = fs.readFileSync(fullPath);
        if (buf.subarray(0, 4096).includes(0)) continue; // Bỏ qua file nhị phân

        const content = buf.toString('utf8');
        const displayFile = prefixLabel ? `${prefixLabel}/${rel}` : rel;
        parsed.changedFiles.add(displayFile);
        hashChunks.push(`UNTRACKED:${displayFile}\n${content.replace(/\r\n/g, '\n')}`);

        const lines = content.split(/\r?\n/);
        // Không tính dòng rỗng cuối file nếu kết thúc bằng \n
        const effectiveLen = lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
        for (let idx = 0; idx < effectiveLen; idx++) {
          parsed.insertions += 1;
          parsed.addedLines.push({
            file: displayFile,
            line: idx + 1,
            text: lines[idx],
          });
        }
      } catch {
        // File vừa bị xóa giữa chừng khi đang quét -> bỏ qua an toàn
      }
    }
  }

  return {
    isHub,
    addedLines: parsed.addedLines,
    changedFiles: Array.from(parsed.changedFiles),
    insertions: parsed.insertions,
    deletions: parsed.deletions,
    rawFingerprint: hashChunks.filter(Boolean).join('\n---\n'),
  };
}

function isSafePlaceholder(val) {
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (/^(?:<[^>]+>|__[A-Z0-9_]+__|YOUR_[A-Z0-9_]*|CHANGE_?ME|EXAMPLE[_A-Z0-9]*|PLACEHOLDER|\*+|xxx+)$/i.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith('process.env.') || trimmed.startsWith('${process.env.')) {
    return true;
  }
  return false;
}

function redactSecretsInLine(lineText) {
  let redacted = lineText;
  let matched = false;

  // Mẫu 1: Chuỗi kết nối DB/Redis/Broker có chứa user:password@host
  const urlRe = /\b((?:postgres(?:ql)?|mysql|redis(?:s)?|mongodb(?:\+srv)?|amqp(?:s)?):\/\/[^:\s'"`]+:)([^@\s'"`]{4,})(@)/gi;
  redacted = redacted.replace(urlRe, (full, prefix, pass, suffix) => {
    if (isSafePlaceholder(pass)) return full;
    matched = true;
    return `${prefix}***REDACTED***${suffix}`;
  });

  // Mẫu 2: Header Authorization: Bearer <token>
  const bearerRe = /(\bBearer\s+)([A-Za-z0-9._\-+/=]{8,})/g;
  redacted = redacted.replace(bearerRe, (full, prefix, token) => {
    if (isSafePlaceholder(token)) return full;
    matched = true;
    return `${prefix}***REDACTED***`;
  });

  // Mẫu 3: Biến / thuộc tính nhạy cảm gán chuỗi cứng ('...', "...", `...`)
  const assignRe =
    /((?:api[_-]?key|secret|password|passwd|pwd|jwt|private[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)[A-Za-z0-9_]*\s*[:=]\s*(['"`]))([^'"`\r\n]{8,})(\2)/gi;
  redacted = redacted.replace(assignRe, (full, prefix, _quote, secretVal, closingQuote) => {
    if (isSafePlaceholder(secretVal)) return full;
    matched = true;
    return `${prefix}***REDACTED***${closingQuote}`;
  });

  return { matched, redacted };
}

function analyzeSnapshots(snapshots, forbiddenPorts) {
  const portGroup = forbiddenPorts.map((p) => String(p)).join('|');
  const portRe = portGroup
    ? new RegExp(
        `(?::\\/\\/[^/\\s'"]+:|(?:\\blocalhost|\\b127\\.0\\.0\\.1|\\b0\\.0\\.0\\.0):|\\b(?:port|PORT|REDIS_PORT|PG_PORT|DB_PORT|APP_PORT)\\s*[:=]\\s*['"\`]?)(${portGroup})\\b`
      )
    : null;

  const violations = [];
  const secrets = [];
  const slotSet = new Set();
  const slotLocations = [];
  let todoDatCount = 0;
  let totalInsertions = 0;
  let totalDeletions = 0;
  const allChangedFiles = [];
  const fingerprints = [];

  for (const snap of snapshots) {
    totalInsertions += snap.insertions;
    totalDeletions += snap.deletions;
    allChangedFiles.push(...snap.changedFiles);
    if (snap.rawFingerprint) fingerprints.push(snap.rawFingerprint);

    for (const entry of snap.addedLines) {
      const { matched: hasSecret, redacted: safeLine } = redactSecretsInLine(entry.text);

      // K-01: Chỉ kiểm tra cổng cấm trên mục tiêu OmniPOS Hub (tránh báo giả trên lab Redis 6379 / PG 5433 của advance-be)
      if (snap.isHub && portRe) {
        const pm = safeLine.match(portRe);
        if (pm) {
          violations.push({
            rule: 'K-01',
            file: entry.file,
            line: entry.line,
            content: safeLine.trim(),
            message: `Forbidden Hub port ${pm[1]} detected in added line`,
          });
        }
      }

      // K-04: Phát hiện secret gán cứng và luôn che bằng ***REDACTED*** (RT-01)
      if (hasSecret) {
        secrets.push({
          rule: 'K-04',
          file: entry.file,
          line: entry.line,
          content: safeLine.trim(),
          message: 'Potential hardcoded secret or credential detected (redacted)',
        });
      }

      // Đếm mốc bài tập TODO(Đạt) và các ô điền khuyết __1__..__9__
      const todoMatches = entry.text.match(/TODO\s*\(\s*(?:Đạt|Dat)\s*\)/gi);
      if (todoMatches) {
        todoDatCount += todoMatches.length;
      }

      const slotRe = /__([1-9])__/g;
      let sm;
      while ((sm = slotRe.exec(entry.text)) !== null) {
        const token = `__${sm[1]}__`;
        slotSet.add(token);
        slotLocations.push({
          file: entry.file,
          line: entry.line,
          slot: token,
        });
      }
    }
  }

  const combinedText = fingerprints.join('\n===\n');
  const diffHash = combinedText
    ? crypto.createHash('sha256').update(combinedText).digest('hex')
    : EMPTY_HASH;

  return {
    changedFiles: Array.from(new Set(allChangedFiles)),
    summary: {
      filesChanged: new Set(allChangedFiles).size,
      insertions: totalInsertions,
      deletions: totalDeletions,
    },
    violations,
    secrets,
    todoSlots: {
      todoDatCount,
      slotCount: slotSet.size,
      slots: Array.from(slotSet).sort(),
      locations: slotLocations,
    },
    diffHash,
  };
}

function buildStatusPayload(ctx) {
  return {
    level: ctx.level,
    levelName: ctx.levelName,
    currentRung: ctx.currentRung,
    rungName: ctx.rungName,
    isLocalOverride: ctx.isLocalOverride,
    hubPath: ctx.config.hubPath,
    hubExists: ctx.hubExists,
    configPath: '.teacher/config.json',
    statePath: '.teacher/state.local.json',
  };
}

function printOutput(payload, asJson, humanLines) {
  if (asJson) {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else {
    process.stdout.write(humanLines.join('\n') + '\n');
  }
}

export function handleStatus(ctx, flags) {
  if (flags.save) {
    persistTrackedDefaults(ctx, ctx.level, ctx.currentRung);
  }
  const payload = buildStatusPayload(ctx);
  printOutput(payload, flags.json, [
    `[Thầy Kèm Live Coding] Trạng thái hiện tại:`,
    `  - Cấp độ (Level): ${payload.level} (${payload.levelName})${payload.isLocalOverride ? ' [local session]' : ' [repo default]'}`,
    `  - Lưới đỡ gợi ý: ${payload.rungName}`,
    `  - Liên kết OmniPOS Hub: ${payload.hubExists ? 'Đã kết nối' : 'Chưa tìm thấy (chỉ theo dõi repo hiện tại)'}`,
  ]);
  return 0;
}

export function handleLevel(ctx, positionals, flags) {
  const raw = (positionals[0] || '').trim().toLowerCase();
  if (!raw || !(raw in LEVEL_ALIASES)) {
    process.stderr.write(
      `Invalid level "${positionals[0] || ''}". Expected: 1|2|3|junior|middle|senior\n`
    );
    return 2;
  }
  const nextLevel = LEVEL_ALIASES[raw];
  persistLocalState(ctx, { level: nextLevel });
  if (flags.save) {
    persistTrackedDefaults(ctx, nextLevel, ctx.currentRung);
  }
  const refreshed = loadTeacherContext(ctx.rootDir);
  const payload = buildStatusPayload(refreshed);
  printOutput(payload, flags.json, [
    `Đã chuyển cấp độ kèm học sang Level ${payload.level} (${payload.levelName}).`,
  ]);
  return 0;
}

export function handleRungOrHint(command, ctx, positionals, flags) {
  const raw = (positionals[0] ?? '').trim().toLowerCase();
  let nextRung = ctx.currentRung;
  let shouldMutate = false;

  if (raw === '') {
    if (command === 'hint') {
      nextRung = Math.min(3, ctx.currentRung + 1);
      shouldMutate = true;
    }
  } else if (raw === 'next') {
    nextRung = Math.min(3, ctx.currentRung + 1);
    shouldMutate = true;
  } else if (/^[0-3]$/.test(raw)) {
    nextRung = Number.parseInt(raw, 10);
    shouldMutate = true;
  } else {
    process.stderr.write(`Invalid rung/hint "${positionals[0]}". Expected: 0|1|2|3|next\n`);
    return 2;
  }

  if (shouldMutate) {
    persistLocalState(ctx, { currentRung: nextRung });
    if (flags.save) {
      persistTrackedDefaults(ctx, ctx.level, nextRung);
    }
  }

  const refreshed = loadTeacherContext(ctx.rootDir);
  const payload = buildStatusPayload(refreshed);
  printOutput(payload, flags.json, [
    `Lưới đỡ hiện tại: ${payload.rungName} (rung=${payload.currentRung}).`,
  ]);
  return 0;
}

function computeDiffForTargets(ctx, targetInfo) {
  const multi = targetInfo.targets.length > 1;
  const snapshots = targetInfo.targets.map((t) =>
    collectSingleRepoSnapshot(t.dir, t.isHub, multi ? (t.isHub ? 'hub' : 'local') : '')
  );
  return analyzeSnapshots(snapshots, ctx.config.forbiddenHubPorts);
}

export function handleDiff(ctx, flags) {
  const targetInfo = resolveTargets(ctx, flags);
  if (targetInfo.code !== 0) {
    process.stderr.write(`${targetInfo.error}\n`);
    return targetInfo.code;
  }

  if (targetInfo.targets.length === 0) {
    const emptyPayload = {
      target: targetInfo.targetLabel,
      isHubTarget: targetInfo.isHubTarget,
      hubExists: false,
      summary: null,
      violations: [],
      secrets: [],
      todoSlots: { todoDatCount: 0, slotCount: 0, slots: [], locations: [] },
      diffHash: EMPTY_HASH,
    };
    printOutput(emptyPayload, flags.json, [
      `Không tìm thấy thư mục Hub (${targetInfo.targetLabel}) — bỏ qua kiểm tra an toàn.`,
    ]);
    return 0;
  }

  const analysis = computeDiffForTargets(ctx, targetInfo);
  const payload = {
    target: targetInfo.targetLabel,
    isHubTarget: targetInfo.isHubTarget,
    hubExists: ctx.hubExists,
    summary: analysis.summary,
    changedFiles: analysis.changedFiles,
    violations: analysis.violations,
    secrets: analysis.secrets,
    todoSlots: analysis.todoSlots,
    diffHash: analysis.diffHash,
  };

  printOutput(payload, flags.json, [
    `[Diff] Thay đổi: ${analysis.summary.filesChanged} file (+${analysis.summary.insertions}/-${analysis.summary.deletions})`,
    `  - Cổng cấm K-01: ${analysis.violations.length} vi phạm`,
    `  - Rò rỉ K-04: ${analysis.secrets.length} cảnh báo`,
    `  - Ô bài tập còn lại: ${analysis.todoSlots.todoDatCount} TODO(Đạt), ${analysis.todoSlots.slotCount} ô điền khuyết (${analysis.todoSlots.slots.join(', ') || 'không'})`,
  ]);

  return analysis.violations.length > 0 || analysis.secrets.length > 0 ? 1 : 0;
}

export async function handleWatchOnce(ctx, flags) {
  const targetInfo = resolveTargets(ctx, flags);
  if (targetInfo.code !== 0) {
    process.stderr.write(`${targetInfo.error}\n`);
    return targetInfo.code;
  }
  if (targetInfo.targets.length === 0) {
    const payload = {
      event: 'no_target',
      hubExists: false,
      message: `Target ${targetInfo.targetLabel} not present`,
    };
    printOutput(payload, flags.json, [payload.message]);
    return 0;
  }

  const quietMs = flags.quietMs ?? ctx.config.quietMs;
  const timeoutMs = flags.timeoutMs ?? ctx.config.timeoutMs;
  const lastHash = ctx.state.lastReviewedHash || EMPTY_HASH;

  // Bước 1: Kiểm tra ngay lúc khởi động (chống mất sự kiện nếu Đạt bấm Ctrl+S lúc AI đang trả lời — RT-07)
  const initial = computeDiffForTargets(ctx, targetInfo);
  if (initial.summary.filesChanged > 0 && initial.diffHash !== lastHash) {
    persistLocalState(ctx, { lastReviewedHash: initial.diffHash });
    const wakeupPayload = {
      event: 'diff_detected',
      level: ctx.level,
      currentRung: ctx.currentRung,
      changedFiles: initial.changedFiles,
      summary: initial.summary,
      violationsCount: initial.violations.length + initial.secrets.length,
      violations: initial.violations,
      secrets: initial.secrets,
      todoSlotsCount: initial.todoSlots.todoDatCount + initial.todoSlots.slotCount,
      todoSlots: initial.todoSlots,
      diffHash: initial.diffHash,
    };
    printOutput(wakeupPayload, flags.json, [
      `[Auto-Advisor] Phát hiện thay đổi mới (${initial.changedFiles.join(', ')}) — đánh thức Thầy Kèm.`,
    ]);
    return 0;
  }

  const baselineHash = initial.diffHash;

  // Bước 2: Lắng nghe sự kiện lưu file có gộp nhịp (debounce) và lọc thư mục nhiễu
  return new Promise((resolve) => {
    const watchers = [];
    let debounceTimer = null;
    let timeoutTimer = null;
    let settled = false;

    const cleanup = () => {
      clearTimeout(debounceTimer);
      clearTimeout(timeoutTimer);
      for (const w of watchers) {
        try {
          w.close();
        } catch {
          // Bỏ qua lỗi đóng watcher trên Windows
        }
      }
    };

    const finish = (payload, humanMsg) => {
      if (settled) return;
      settled = true;
      cleanup();
      printOutput(payload, flags.json, [humanMsg]);
      resolve(0);
    };

    const evaluateAfterQuiet = () => {
      if (settled) return;
      const snap = computeDiffForTargets(ctx, targetInfo);
      if (snap.diffHash !== baselineHash && snap.diffHash !== lastHash) {
        persistLocalState(ctx, { lastReviewedHash: snap.diffHash });
        finish(
          {
            event: 'diff_detected',
            level: ctx.level,
            currentRung: ctx.currentRung,
            changedFiles: snap.changedFiles,
            summary: snap.summary,
            violationsCount: snap.violations.length + snap.secrets.length,
            violations: snap.violations,
            secrets: snap.secrets,
            todoSlotsCount: snap.todoSlots.todoDatCount + snap.todoSlots.slotCount,
            todoSlots: snap.todoSlots,
            diffHash: snap.diffHash,
          },
          `[Auto-Advisor] Đạt vừa lưu code (${snap.changedFiles.join(', ')}) — đánh thức Thầy Kèm.`
        );
      }
    };

    const onFsEvent = (_eventType, filename) => {
      if (settled) return;
      if (shouldIgnoreWatchPath(filename)) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(evaluateAfterQuiet, quietMs);
    };

    for (const t of targetInfo.targets) {
      try {
        const watcher = fs.watch(t.dir, { recursive: true }, onFsEvent);
        watcher.on('error', () => {
          // Giữ tiến trình ổn định nếu một nhánh con tạm thời bị khóa trên Windows
        });
        watchers.push(watcher);
      } catch (err) {
        cleanup();
        process.stderr.write(`Failed to watch ${t.dir}: ${err.message}\n`);
        resolve(1);
        return;
      }
    }

    if (timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        finish(
          {
            event: 'timeout',
            diffHash: baselineHash,
            message: `No new diff detected within ${timeoutMs}ms`,
          },
          `[Auto-Advisor] Hết thời gian chờ (${timeoutMs}ms) không có thay đổi mới.`
        );
      }, timeoutMs);
    }
  });
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseCliArgs(argv);
  if (parsed.code !== 0) {
    process.stderr.write(`${parsed.error}\n`);
    return parsed.code;
  }

  const { command, positionals, flags } = parsed;
  if (!command) {
    process.stderr.write(
      'Usage: node scripts/teacher.mjs <status|level|rung|hint|diff|watch-once> [options]\n'
    );
    return 2;
  }

  const ctx = loadTeacherContext(flags.root);

  switch (command) {
    case 'status':
      return handleStatus(ctx, flags);
    case 'level':
      return handleLevel(ctx, positionals, flags);
    case 'rung':
    case 'hint':
      return handleRungOrHint(command, ctx, positionals, flags);
    case 'diff':
      return handleDiff(ctx, flags);
    case 'watch-once':
      return handleWatchOnce(ctx, flags);
    default:
      process.stderr.write(
        `Unknown command "${command}". Expected: status|level|rung|hint|diff|watch-once\n`
      );
      return 2;
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  main().then((code) => {
    process.exitCode = code;
  });
}
