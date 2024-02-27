/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const moment = require('moment');
const AppUsersSettingResourceAccess = require('./resourceAccess/AppUsersSettingResourceAccess');
const { WITHDRAW_TRX_QUOTA } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const { USER_ERROR } = require('./AppUserConstant');

async function checkWithdrawCount(appUserId, trans, count) {
  let userSetting = await AppUsersSettingResourceAccess.findById(appUserId);
  if (userSetting) {
    if (trans && trans.length > 0 && trans[0].count > 0) {
      count = userSetting.withdrawCount;
      if (count >= WITHDRAW_TRX_QUOTA.DAY) {
        throw USER_ERROR.NOT_ALLOWED_WITHDRAW;
      }
    }
  } else {
    await AppUsersSettingResourceAccess.insert({ appUserId: appUserId, withdrawCount: 0 });
  }
  return count;
}

module.exports = {
  checkWithdrawCount,
};
