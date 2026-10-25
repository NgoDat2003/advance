// Lab 14.05 (slide 12–22): deadlock 40P01 và cách sửa bằng thứ tự khóa. Chạy lần lượt phần A rồi phần B,
// gộp kết quả hai phần thành một JSON cho widget W4 khi chạy với -- --json.
import { emitJson, jsonMode } from './lock-kit.mjs';

if (!jsonMode) console.log('Lab 14.05 — Deadlock 40P01: ai bị hủy, và vì sao ORDER BY id FOR UPDATE xóa được deadlock (slide 12–22)');
const { resultA } = await import('./05-deadlock-ordering-part-a.mjs');
const { resultB } = await import('./05-deadlock-ordering-part-b.mjs');
emitJson({ lab: '05', ...resultA, ...resultB });
