// Lab 3.07 — Keys vs indexes, NULLs in UNIQUE, and the special indexes PostgreSQL offers (slides 19, 21, 29, 37).
// The lab is split in two files to stay short; this entry point runs both on one connection:
//   part A (07-constraints-and-special-part-a.mjs): FK without an index and its DELETE cost, NULLs in UNIQUE;
//   part B (07-constraints-and-special-part-b.mjs): partial vs btree for a rare status, BRIN, partial on a mostly-NULL
//   column, an expression index in place of a prefix index, and the btree entry size limit.
// Base tables stay data-read-only: extra indexes and the DELETE live inside BEGIN ... ROLLBACK; writes go to l07_* tables.
import { connect } from './pg-explain-kit.mjs';
import { runConstraints } from './07-constraints-and-special-part-a.mjs';
import { runSpecialIndexes } from './07-constraints-and-special-part-b.mjs';

const client = await connect();
console.log('Lab 3.07 — Khóa ≠ index, NULL trong UNIQUE và các loại index đặc biệt của Postgres (slide 19, 21, 29, 37)');
try {
  await runConstraints(client);
  await runSpecialIndexes(client);
} finally {
  await client.end();
}
