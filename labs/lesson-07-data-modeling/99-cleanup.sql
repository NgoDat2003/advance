-- Bài 07 · Dọn sạch lab: xóa TOÀN BỘ schema lab07_modeling (kể cả bảng bài tập hw_* và bảng tự làm my_* của bạn).
-- Chỉ chạy khi học xong và muốn trả máy về như cũ. Muốn học lại: chạy 00-setup.sql.
-- Extension btree_gist được cài trong lab07_modeling nên cũng bị xóa theo.
DROP SCHEMA IF EXISTS lab07_modeling CASCADE;
