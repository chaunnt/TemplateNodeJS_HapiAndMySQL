/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */

const moment = require('moment');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const PaymentMethodResourceAccess = require('../../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const AppUserMissionHistoryResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionHistoryResourceAccess');
const { closeMission, resetUserDailyMissionInfo } = require('../AppUserMissionFunction');
const { createMissionBonusRecordForUser } = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const { MISSION_STATUS, MISSION_DAY_DATA_FORMAT } = require('../AppUserMissionConstant');
const Logger = require('../../../utils/logging');

async function _closeYesterdayMission(appUserId) {
  let _missionRefer = await AppUserMissionHistoryResourceAccess.customSearch({
    appUserId: appUserId,
    missionStartDay: moment().add(-1, 'day').format(MISSION_DAY_DATA_FORMAT),
  });
  if (_missionRefer && _missionRefer.length > 0) {
    for (let i = 0; i < _missionRefer.length; i++) {
      if (_missionRefer[i].missionStatus === MISSION_STATUS.NEW || _missionRefer[i].missionStatus === MISSION_STATUS.IN_PROGRESS) {
        await closeMission(_missionRefer[i].appUserMissionHistoryId, true);
      }
    }
  }
}

async function processDailyMissionForUser(appUserId) {
  Logger.info(`processDailyMissionForUser ${appUserId}`);
  await resetUserDailyMissionInfo(appUserId);
  await createMissionBonusRecordForUser(appUserId);
}

async function updateMissionForAllUser() {
  Logger.info(`START to updateMissionForAllUser ${new Date()}`);
  let limit = 20;
  let skip = 0;
  let userOrder = {
    key: 'createdAt',
    value: 'desc',
  };

  while (true) {
    const users = await AppUsersResourceAccess.find({}, skip, limit, userOrder);
    if (users && users.length > 0) {
      let _promise = [];
      for (let i = 0; i < users.length; i++) {
        await _closeYesterdayMission(users[i].appUserId);
        _promise.push(processDailyMissionForUser(users[i].appUserId));
      }
      await Promise.all(_promise);

      skip += limit;
    } else {
      break;
    }
  }
  Logger.info(`FINISH to updateMissionForAllUser ${new Date()}`);
}

module.exports = {
  updateMissionForAllUser,
};
