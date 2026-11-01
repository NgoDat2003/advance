# Fixture hai client dạng .sh (B).
# #region a · B chờ barrier (slide 1)
set -u
docker exec advance-be-redis redis-cli BLPOP l06:barrier:fixsh 5
sleep 0.5
docker exec advance-be-redis redis-cli GET l06:fixture:abs
# #endregion
