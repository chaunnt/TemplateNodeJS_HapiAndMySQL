/* Copyright (c) 2022-2024 Reminano */

module.exports = {
  USER_MISSION_ERROR: {
    MISSION_ALREADY_FINISHED: 'MISSION_ALREADY_FINISHED', //Nhiệm vụ trong ngày đã hết
    MISSION_ALREADY_HAS_OVER_RECORD: 'MISSION_ALREADY_HAS_OVER_RECORD', //Nhiệm vụ chỉ cho phép đặt 1 cửa
    INVALID_MISSION: 'INVALID_MISSION', //Nhiệm vụ đã hết
    MISSION_LOCKED: 'MISSION_LOCKED', //Tài khoản đã bị khóa nhiệm vụ
  },
  MISSION_STATUS: {
    NEW: 0, //: Not Start, 10: In-progress, 20: Failed, 30: Completed)
    IN_PROGRESS: 10,
    FAILED: 20, //+ 2 lần thua > trạng thái là 20 (Thất bại)
    FAILED_HALF_1: 21, //+ lần 1 thua > trạng thái là 21 (NV1 Thất bại)
    FAILED_HALF_2: 22, //+ lần 2 thua > trạng thái là 22 (NV2 Thất bại)
    WIN_HALF_1: 40, //+ lần 1 thắng > "NV XX hoàn thành"
    WIN_HALF_2: 41, //+ lần 2 thắng > "NV XX hoàn thành"
    COMPLETED: 30,
  },
  MISSION_BONUS_AMOUNT: 10000,
  MISSION_BONUS_HALF_AMOUNT: 3000,
  MISSION_BONUS_PERCENTAGE: 10,
  MISSION_BONUS_REFERAL_AMOUNT: 1000,
  MISSION_DAY_DATA_FORMAT: 'YYYY/MM/DD',
};
