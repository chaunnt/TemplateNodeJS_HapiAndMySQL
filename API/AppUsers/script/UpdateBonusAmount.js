/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const { userSummaryBonusAmountByDate } = require('../AppUserFunctions_ReferUser');
const Logger = require('../../../utils/logging');

async function updateBonusAmount() {
  Logger.info(`start update user bonus amount`);
  let skip = 0;
  let limit = 10;
  let yesterday = moment().subtract(1, 'days').endOf('days');
  while (true) {
    let users = await AppUsersResourceAccess.find({}, skip, limit);
    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        let startDate = moment(user.createdAt).startOf('days').format();
        await userSummaryBonusAmountByDate(user.appUserId, startDate, yesterday, undefined, undefined);
      }
      skip += limit;
    } else {
      break;
    }
  }
  Logger.info(`update user bonus amount success`);
}
updateBonusAmount();
module.exports = {
  updateBonusAmount,
};
