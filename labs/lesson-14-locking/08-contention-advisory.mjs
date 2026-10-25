// Lab 14.08 — điểm vào: phần a (dòng nóng vs dòng trải đều) rồi phần b (advisory lock), gộp JSON cho widget W5.
import { jsonMode, emitJson } from './lock-kit.mjs';
import { runPartA } from './08-contention-advisory-part-a.mjs';
import { runPartB } from './08-contention-advisory-part-b.mjs';

if (!jsonMode) console.log('Lab 14.08 — Dòng nóng bắt mọi người xếp hàng, dòng trải đều thì không; advisory lock xact vs session (slide 12–22)');
const a = await runPartA();
const b = await runPartB();
emitJson({ lab: '14.08', contention: a.payload, advisory: b.payload });
process.exitCode = a.ok && b.ok ? 0 : 1;
