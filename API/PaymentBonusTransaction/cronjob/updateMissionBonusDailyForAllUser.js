/* Copyright (c) 2022-2023 Reminano */

const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const PaymentBonusTransactionFunction = require('../PaymentBonusTransactionFunctions');
const Logger = require('../../../utils/logging');

async function updateMissionBonusDailyForAllUser() {
  Logger.info(`START updateMissionBonusDailyForAllUser ${new Date()}`);
  let batchLimit = 3;
  let skip = 0;
  while (true) {
    const users = await AppUsersResourceAccess.find({}, skip, batchLimit);
    if (users && users.length > 0) {
      let _promise = [];
      for (let i = 0; i < users.length; i++) {
        _promise.push(PaymentBonusTransactionFunction.createMissionBonusRecordForUser(users[i].appUserId));
      }
      await Promise.all(_promise);
    } else {
      break;
    }
    skip += batchLimit;
  }
  Logger.info(`FINISH updateMissionBonusDailyForAllUser ${new Date()}`);
}

module.exports = {
  updateMissionBonusDailyForAllUser,
};
