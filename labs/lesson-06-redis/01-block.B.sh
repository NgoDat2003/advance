# Bài 06 · Chặng 1 — Terminal B (Git Bash), phần tùy chọn: script Lua của A chạy 6 s (slide 13).
# Thứ tự: (1) busy-reset ở A (01-block.A.redis), (2) region busy dưới đây ở B (B đứng chờ BLPOP), (3) busy ở A.
# Mỗi dòng mở một kết nối redis-cli mới: kết nối mới cũng nhận BUSY, chứng tỏ cả server đang bận chứ không riêng phiên A.

# #region busy · B gặp BUSY rồi dừng script của A bằng SCRIPT KILL (slide 13)
docker exec advance-be-redis redis-cli BLPOP l06:barrier:block-busy 5
set -u
sleep 0.5
# --no-raw để redis-cli in "(error) …" giống terminal tương tác. Câu trả lời tới sau khoảng 5 s (busy-reply-threshold).
docker exec advance-be-redis redis-cli --no-raw PING
docker exec advance-be-redis redis-cli --no-raw SCRIPT KILL
# #endregion
