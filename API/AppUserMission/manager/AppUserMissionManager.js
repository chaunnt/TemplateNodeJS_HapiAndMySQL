/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const moment = require('moment');
const AppUserMissionInfoResourceAccess = require('../resourceAccess/AppUserMissionInfoResourceAccess');
const AppUserMissionHistoryResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionHistoryResourceAccess');
const AppUserMissionHistoryView = require('../../AppUserMission/resourceAccess/AppUserMissionHistoryView');
const AppUserMissionPlayResourceAccess = require('../../GamePlayRecords/resourceAccess/AppUserMissionPlayResourceAccess');

const Logger = require('../../../utils/logging');

const { USER_MISSION_ERROR, MISSION_STATUS, MISSION_DAY_DATA_FORMAT } = require('../AppUserMissionConstant');
const { POPULAR_ERROR, UNKNOWN_ERROR, NO_PERMISSION } = require('../../Common/CommonConstant');
const { placeUserMissionBet } = require('../../GamePlayRecords/GamePlayRecordsFunctions');
const { PLACE_RECORD_ERROR, BET_TYPE, BET_RESULT, BET_STATUS } = require('../../GamePlayRecords/GamePlayRecordsConstant');
const {
  fetchPlayRecordOfMission,
  closeMission,
  checkReadyToStartUserMission,
  updateUserMissionInfo,
  resetUserDailyMissionInfo,
} = require('../AppUserMissionFunction');
const { isNotValidValue, isValidValue } = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const { PERMISSION_NAME } = require('../../StaffRole/StaffRoleConstants');
const { logAdminUpdateAppUserData } = require('../../SystemAppChangedLog/SystemAppLogAppUserFunctions');
const { createMissionBonusRecordForUser } = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');

async function userPlayMission(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      let userMission = await AppUserMissionInfoResourceAccess.findById(_currentUser.appUserId);
      if (userMission.enableMissionPlay !== 1) {
        return reject(USER_MISSION_ERROR.MISSION_LOCKED);
      }
      let __existingMissionId = await checkReadyToStartUserMission(req.currentUser.appUserId);

      if (isNotValidValue(__existingMissionId)) {
        Logger.error(`error BetRecord userPlayMission with appUserId ${_currentUser.appUserId}: `);
        return reject(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
      }
      let placeData = req.payload;
      const gameRecordSection = '';
      let placeResult = await placeUserMissionBet(
        _currentUser,
        placeData.betRecordAmountIn,
        placeData.betRecordValue,
        gameRecordSection,
        placeData.betRecordType,
        placeData.betRecordUnit,
        __existingMissionId,
      );

      if (placeResult) {
        return resolve(placeResult);
      } else {
        Logger.error(`error BetRecord userPlayMission with appUserId ${_currentUser.appUserId}: `);
        return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
      }
    } catch (e) {
      Logger.error(`error user Place Bet Record`, e);
      if (e === PLACE_RECORD_ERROR.SELECTION_NAME_INVALID) {
        Logger.error(`error  BetRecord userPlayMission: ${PLACE_RECORD_ERROR.SELECTION_NAME_INVALID}`);
        return reject(PLACE_RECORD_ERROR.SELECTION_NAME_INVALID);
      } else if (Object.keys(USER_MISSION_ERROR).indexOf(e) >= 0) {
        return reject(e);
      } else {
        Logger.error(`error BetRecord userPlayMission: `);
        return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
      }
    }
  });
}
async function lockUserMissionPlay(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      let enableMissionPlay = req.payload.enableMissionPlay;
      let appUserId = req.payload.id;
      const isAllowed = await verifyStaffUser(appUserId, _currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(NO_PERMISSION);
          return;
        }
      }
      let appUserMissionInfo = await AppUserMissionInfoResourceAccess.findById(appUserId);
      let dataBefore = { enableMissionPlay: appUserMissionInfo.enableMissionPlay };
      let updateResult = await AppUserMissionInfoResourceAccess.updateById(appUserId, { enableMissionPlay: enableMissionPlay });

      if (updateResult) {
        await logAdminUpdateAppUserData(dataBefore, { enableMissionPlay: enableMissionPlay }, _currentUser, appUserId);
        resolve('success');
      } else {
        reject('update failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject('failed');
    }
  });
}

async function lockUserMissionBonus(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      let enableAddMissionBonus = req.payload.enableAddMissionBonus;
      let appUserId = req.payload.id;
      const isAllowed = await verifyStaffUser(appUserId, _currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(NO_PERMISSION);
          return;
        }
      }
      let appUserMissionInfo = await AppUserMissionInfoResourceAccess.findById(appUserId);
      let dataBefore = { enableAddMissionBonus: appUserMissionInfo.enableAddMissionBonus };
      let updateResult = await AppUserMissionInfoResourceAccess.updateById(appUserId, { enableAddMissionBonus: enableAddMissionBonus });

      if (updateResult) {
        await logAdminUpdateAppUserData(dataBefore, { enableAddMissionBonus: enableAddMissionBonus }, _currentUser, appUserId);
        resolve('success');
      } else {
        reject('update failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject('failed');
    }
  });
}

//"Web chơi > Lịch sử > Thêm tab ""Nhiệm vụ""
// 1. Thời gian
// 2. Cặp tiền
// 3. Giao dịch
// 4. Số tiền
// 5. Kết quả
// 6. Nhiệm vụ(Khi hết lệnh thứ 2 của 1 nhiệm vụ(NV)(nếu hòa thì không tính) nếu kết quả thắng cả 2 lệnh liên tiếp thì ghi cột này là ""NV1 thành công""(cho màu xanh), nếu đó là NV 1, còn nếu thành công ở nv 2, thì ghi NV2 thành công,...Trường hợp 1 trong 2 lệnh thua, thì hết lệnh thứ 2 sẽ hiện ""NV1 thất bại"" màu đỏ)
// 7. Bonus (Nếu thành công thì nhảy $10 màu xanh, thất bại thì $0 màu đỏ)"
async function fetchDetailMissionPlay(appUserMissionHistoryId) {
  let _playRecordOfMission = await fetchPlayRecordOfMission(appUserMissionHistoryId);

  if (_playRecordOfMission && _playRecordOfMission.length > 0) {
    return _playRecordOfMission;
  } else {
    return [];
  }
}

async function userGetMissionHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      filter.appUserId = req.currentUser.appUserId;
      let _startDate = req.payload.startDate;
      let _endDate = req.payload.endDate;
      filter.missionStatus = [
        MISSION_STATUS.IN_PROGRESS,
        MISSION_STATUS.COMPLETED,
        MISSION_STATUS.FAILED,
        MISSION_STATUS.FAILED_HALF_1,
        MISSION_STATUS.FAILED_HALF_2,
        MISSION_STATUS.WIN_HALF_1,
        MISSION_STATUS.WIN_HALF_2,
      ];
      let data = await AppUserMissionHistoryResourceAccess.customSearch(filter, skip, limit, _startDate, _endDate, undefined, order);

      if (data && data.length > 0) {
        let _needToReload = false;
        for (let i = 0; i < data.length; i++) {
          if (data[i].missionStatus !== MISSION_STATUS.NEW) {
            data[i].missonPlays = await fetchDetailMissionPlay(data[i].appUserMissionHistoryId);
          } else {
            data[i].missonPlays = [];
          }
          if (data[i].missonPlays.length === 0 && data[i].missionStatus === MISSION_STATUS.IN_PROGRESS) {
            data[i].missionStatus = MISSION_STATUS.NEW;
          }
          // if (data[i].missonPlays && data[i].missonPlays.length >= 2 && data[i].missionStatus === MISSION_STATUS.IN_PROGRESS) {
          //   if (data[i].missonPlays[0].betRecordStatus === BET_STATUS.COMPLETED && data[i].missonPlays[1].betRecordStatus === BET_STATUS.COMPLETED) {
          //     await closeMission(data[i].appUserMissionHistoryId);
          //     _needToReload = true;
          //   }
          // }
          // if (_needToReload) {
          //   data = await AppUserMissionHistoryResourceAccess.customSearch(filter, skip, limit, _startDate, _endDate, undefined, order);
          //   for (let i = 0; i < data.length; i++) {
          //     if (data[i].missionStatus !== MISSION_STATUS.NEW) {
          //       data[i].missonPlays = await fetchDetailMissionPlay(data[i].appUserMissionHistoryId);
          //     } else {
          //       data[i].missonPlays = [];
          //     }
          //   }
          // }
        }

        // await updateUserMissionInfo(req.currentUser.appUserId);

        let dataCount = await AppUserMissionHistoryResourceAccess.customCount(filter, _startDate, _endDate);

        return resolve({ data: data, total: dataCount[0].count });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      let _startDate = req.payload.startDate;
      let _endDate = req.payload.endDate;
      let data = await AppUserMissionHistoryView.customSearch(filter, skip, limit, _startDate, _endDate, undefined, order);

      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].missionStatus !== MISSION_STATUS.NEW) {
            data[i].missonPlays = await fetchDetailMissionPlay(data[i].appUserMissionHistoryId);
          } else {
            data[i].missonPlays = [];
          }
        }
        let dataCount = await AppUserMissionHistoryView.customCount(filter, _startDate, _endDate);
        return resolve({ data: data, total: dataCount[0].count });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject('failed');
    }
  });
}

async function resetMissionByUserId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      Logger.info(`processDailyMissionForUser ${appUserId}`);
      await resetUserDailyMissionInfo(appUserId);
      await createMissionBonusRecordForUser(appUserId);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      return reject('failed');
    }
  });
}

module.exports = {
  userPlayMission,
  userGetMissionHistory,
  find,
  lockUserMissionPlay,
  lockUserMissionBonus,
  resetMissionByUserId,
};
