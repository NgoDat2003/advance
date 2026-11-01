# Fixture: runner KHÔNG đặt MSYS_NO_PATHCONV, nên dòng không có tiền tố bị Git Bash đổi /lab thành D:/Git/lab.
# #region a · fixture đường dẫn (slide 1)
set -u
docker exec advance-be-redis echo /lab/x
MSYS_NO_PATHCONV=1 docker exec advance-be-redis echo /lab/x
# #endregion
