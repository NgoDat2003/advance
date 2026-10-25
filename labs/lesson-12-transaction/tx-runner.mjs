// Bộ điều phối bước chạy tuần tự trên 2 phiên (A, B) kèm phiên quan sát (O).
// Tuyệt đối không chèn câu lệnh phụ vào A hoặc B để không làm dịch chuyển snapshot của REPEATABLE READ.
import { blockersOf, fmtMs, heading, printTable, sessionState, waitUntil } from './tx-kit.mjs';

function summarizeResult(res) {
  if (!res) return 'OK';
  if (res.error) return `ERROR ${res.code}: ${res.message}`;
  const cmd = res.command || 'SQL';
  if (res.rows && res.rows.length > 0) {
    const first = res.rows[0];
    const pairs = Object.entries(first).map(([k, v]) => `${k}=${v === null ? 'null' : v}`);
    const extra = res.rows.length > 1 ? ` (+${res.rows.length - 1} dòng)` : '';
    return `${cmd} (${res.rows.length}): ${pairs.join(', ')}${extra}`;
  }
  if (typeof res.rowCount === 'number' && ['INSERT', 'UPDATE', 'DELETE'].includes(cmd)) {
    return `${cmd} ${res.rowCount}`;
  }
  return cmd;
}

/**
 * Thực thi kịch bản gồm danh sách các bước `[who, sql, flag?]`:
 * - `who`: 'A' | 'B' | 'O'
 * - `sql`: chuỗi SQL, hàm `(ctx) => sql`, hoặc `'await'` để thu hoạch bước đang chờ khóa.
 * - `flag`: `'waits'` nếu bước này bắt buộc phải bị chặn trên khóa; hoặc nhãn lưu vào `by[label]`.
 */
export async function runSteps(lab, steps, { title, silent = false } = {}) {
  if (title && !silent) heading(title);
  const pending = {};
  const by = {};
  const rows = [];
  const ctx = { pid: lab.pid, by };

  for (let i = 0; i < steps.length; i++) {
    const [who, rawSql, flag] = steps[i];
    const client = lab[who];
    if (!client) throw new Error(`Không tìm thấy phiên ${who}`);

    if (rawSql === 'await') {
      const p = pending[who];
      if (!p) throw new Error(`Phiên ${who} không có lệnh đang chờ để await tại bước ${i + 1}`);
      delete pending[who];
      const settled = await p.promise;
      const ms = performance.now() - p.t0;
      const entry = {
        step: i + 1,
        who,
        sql: `(await) ${p.sql}`,
        rows: settled.rows ?? [],
        rowCount: settled.rowCount ?? 0,
        command: settled.command ?? '',
        code: settled.code ?? null,
        message: settled.message ?? null,
        error: Boolean(settled.error),
        waitedFor: p.waitedFor,
        ms,
      };
      entry.summary = summarizeResult(entry);
      if (flag) by[flag] = entry;
      if (p.label) by[p.label] = entry;
      rows.push(entry);
      continue;
    }

    if (pending[who]) {
      throw new Error(`Phiên ${who} vẫn đang có lệnh chờ chưa await tại bước ${i + 1}`);
    }

    const sql = typeof rawSql === 'function' ? rawSql(ctx) : rawSql;
    const expectsWait = flag === 'waits' || (typeof flag === 'string' && flag.startsWith('waits:'));
    const label = expectsWait ? (flag.includes(':') ? flag.split(':')[1] : null) : flag;
    const t0 = performance.now();

    const promise = client.query(sql).then(
      (res) => ({ rows: res.rows, rowCount: res.rowCount, command: res.command, error: false }),
      (err) => ({ error: true, code: err.code ?? 'ERR', message: (err.message || '').split('\n')[0] }),
    );

    if (expectsWait) {
      let stateInfo = null;
      let blockers = [];
      const blocked = await waitUntil(async () => {
        const st = await sessionState(lab.O, lab.pid[who]);
        if (st.wait_event_type === 'Lock') {
          const bl = await blockersOf(lab.O, lab.pid[who], lab.pid);
          if (bl.length > 0) {
            stateInfo = st;
            blockers = bl;
            return true;
          }
        }
        return false;
      }, 3000);

      if (!blocked) {
        const quick = await Promise.race([promise, new Promise((r) => setTimeout(() => r(null), 50))]);
        throw new Error(
          `Bước ${i + 1} (${who}: ${sql}) không bị chặn như khai báo${quick ? ` (kết thúc sớm: ${summarizeResult(quick)})` : ''}`,
        );
      }
      if (blockers.some((b) => b.startsWith('phiên lạ'))) {
        throw new Error(`Bước ${i + 1} bị chặn bởi ${blockers.join(', ')}`);
      }

      pending[who] = { promise, t0, sql, waitedFor: blockers, label };
      const waitEntry = {
        step: i + 1,
        who,
        sql,
        rows: [],
        rowCount: 0,
        command: 'WAIT',
        code: null,
        message: null,
        error: false,
        waitedFor: blockers,
        waitEvent: `${stateInfo.wait_event_type}/${stateInfo.wait_event}`,
        ms: performance.now() - t0,
      };
      waitEntry.summary = `⏳ chờ ${blockers.join(',')} (${waitEntry.waitEvent})`;
      rows.push(waitEntry);
      continue;
    }

    const settled = await promise;
    const ms = performance.now() - t0;
    if (settled.error && settled.code === '55P03') {
      throw new Error(`Bước ${i + 1} (${who}: ${sql}) gặp lock_timeout 55P03 ngoài dự kiến: ${settled.message}`);
    }
    const entry = {
      step: i + 1,
      who,
      sql,
      rows: settled.rows ?? [],
      rowCount: settled.rowCount ?? 0,
      command: settled.command ?? '',
      code: settled.code ?? null,
      message: settled.message ?? null,
      error: Boolean(settled.error),
      waitedFor: [],
      ms,
    };
    entry.summary = summarizeResult(entry);
    if (label) by[label] = entry;
    rows.push(entry);
  }

  if (!silent) {
    printTable(rows, [
      ['#', (r) => r.step, 'right'],
      ['Phiên', (r) => r.who],
      ['SQL', (r) => (r.sql.length > 68 ? `${r.sql.slice(0, 65)}...` : r.sql)],
      ['Kết quả', (r) => r.summary],
      ['ms', (r) => fmtMs(r.ms), 'right'],
    ]);
  }
  return { rows, by };
}
