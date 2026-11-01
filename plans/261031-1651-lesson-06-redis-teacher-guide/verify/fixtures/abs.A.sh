# Fixture hai client dạng .sh (A).
# #region a-reset · dựng trạng thái đầu (slide 1)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:barrier:fixsh l06:fixture:abs
# #endregion
# #region a · A nhả barrier (slide 1)
set -u
docker exec advance-be-redis redis-cli RPUSH l06:barrier:fixsh go
docker exec advance-be-redis redis-cli SET l06:fixture:abs A
sleep 1
docker exec advance-be-redis redis-cli UNLINK l06:fixture:abs
# #endregion
