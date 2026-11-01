# Cook report: phase 06, delegate D1 (stages 1–3, widgets W1–W4), 2026-11-01

All acceptance checks pass. No lab, run, shell, assembler, verifier or contract file was edited. I ran no docker or Redis command and no git command.

## Files

| File | Size | Content |
|---|---|---|
| `assembly/fragments/stage-01.html` | 33.4 KB built | Slides 4, 5, 10–14 (sl-05, sl-12, sl-14). Covers threads/epoll, the A/B `DEBUG SLEEP` walk and timeline, SLOWLOG, the optional busy Lua fold (R03 narrated as "≈ 5 s", host ms vs container clock), and pipeline/size/MGET benchmarks. The challenge is `DEBUG POPULATE 200000 l06:my:pop`, comparing KEYS with SCAN while B runs `--latency-history`. |
| `assembly/fragments/stage-02.html` | ~35 KB built | Slides 15, 16, 29–31 (sl-30). Covers string, hash and set/zset/list thresholds, the slide-30 memory/ops runs with a C1/C2/C3 table, and the JSON lost-update walk and timeline. The challenge models a menu item three ways and asks for the encodings to be predicted first. |
| `assembly/fragments/stage-03.html` | 35.3 KB built | Slides 17–23 (sl-19, sl-20, sl-21, sl-23). Covers the expire dict, passive and active expiry, and five eviction policies on `-evict`. The challenge is `volatile-lru` on `-evict`, built with `sed` from region `volatile-ttl`; the block prints `→ advance-be-redis-evict` first and restores the defaults. |
| `stage-0{1,2,3}.quiz.json` | 4 items each | Every `why` cites a run id, and every 4+-digit or decimal number appears in a run. |
| `assembly/widgets/w1.js` | | Event-loop lanes from `run-w1`, with real-time replay, step mode, and a SLOWLOG toggle that shows a static `b.m` block in the fragment. |
| `assembly/widgets/w2.js` | | Encoding predictor. It uses the 7.2 default thresholds as constants and checks them ✔/✘ against the recorded `run-w2` rows. List is shown as byte-based and is not predicted. |
| `assembly/widgets/w3.js` | | Active-expiry sampler: 20 keys per loop, with a toggle between 25 % (slide) and 10 % (7.2). The CPU cap is modelled as at most 25 loops per cycle, labelled as a model assumption. The recorded before/after values come from `run-w3`. |
| `assembly/widgets/w4.js` | | Policy picker with survival bars, `evicted_keys`, the OOM pill and BASE/MAX from `run-w4`. |

All widgets build their DOM with `el()` and `textContent`, use no `innerHTML`, guard against missing data, and use only `wN-` ids. Each widget wrapper is a `div.widget`, as contract v1.1 requires.

## Checks (run from the plan folder)

| Check | Result |
|---|---|
| `node verify/verify-guide.mjs --fragment assembly/fragments/stage-0{1,2,3}.html` | ✔ ×3 |
| `node --check assembly/widgets/w{1,2,3,4}.js` | OK ×4 |
| Negative probe (changed one `b.m`, one code line and one run line in a scratch copy) | V05, V06 and V07 caught all three |
| `node assembly/assemble.mjs --allow-stubs` + `node verify/verify-guide.mjs` (full) | 466 KB, ✔ no errors |
| `node verify/widget-smoke.mjs` | ✔ no exceptions; W1–W4 have content after every control is clicked |

## Notes for the controller

- Code blocks were filled from the labs with the assembler's own rule (`displayText` + escaping), so V05 passes on each fragment by itself. The assembler re-copies them anyway.
- To reduce size, three eviction regions (`allkeys-lfu`, `allkeys-random` and the optional `volatile-ttl`) are no longer pasted into the page. Each one gets a `sed -n '/#region …/,/#endregion/p' labs/lesson-06-redis/03-eviction.sh` line that prints the region straight from the lab file. I checked with `diff` that LFU and random differ from LRU only in the title comment and the policy name. `noeviction` and `allkeys-lru` are still shown byte-exact.
- The 25 % / 10 % / 20-key figures for slides 20 and 21 come from addendum item 2 (`src/expire.c`), not from a run, and the text says so. The "10 lần/giây" claim cites `hz:10` from `01-why-fast.threads`.
- No contract issue is open.
