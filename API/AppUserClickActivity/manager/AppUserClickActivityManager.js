/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserClickActivity = require('../resourceAccess/AppUserClickActivityAccess');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

async function addTotalClick(appUserId, clickTarget) {
  if (clickTarget.targetId > 0 && clickTarget.totalClick > 0)
    // Thêm mới record
    await AppUserClickActivity.insert({
      appUserId: appUserId,
      targetId: clickTarget.targetId,
      totalClick: clickTarget.totalClick,
    });
}

async function userClickActivity(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = null;
      const currentUser = req.currentUser;
      if (currentUser) {
        appUserId = currentUser.appUserId;
      }

      let listClick = req.payload.listClick;

      const promiseBunch = listClick.map(clickTarget => addTotalClick(appUserId, clickTarget));
      await Promise.all(promiseBunch);

      return resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  userClickActivity,
};
