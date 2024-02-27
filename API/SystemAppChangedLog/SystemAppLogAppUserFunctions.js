/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppLogResource = require('./resourceAccess/SystemAppChangedLogResourceAccess');
const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const SystemAppLogAppUserResource = require('./resourceAccess/SystemAppLogAppUserResourceAccess');
const Logger = require('../../utils/logging');
const moment = require('moment');

async function logAdminUpdateAppUserData(dataBefore, dataAfter, staffUser, userId) {
  let now = moment().format();
  let data = {
    userUpdate: staffUser.username,
    timeUpdate: now,
    dataValueBefore: {},
    dataValueAfter: {},
    userId: userId,
    staffId: staffUser.staffId,
    isStaffChange: 1,
  };
  let beforeObjKeys = Object.keys(dataBefore);
  let isChange = false;
  for (let i = 0; i < beforeObjKeys.length; i++) {
    const key = beforeObjKeys[i];
    if (dataAfter[key] && dataAfter[key] !== dataBefore[key]) {
      data.dataValueBefore[key] = dataBefore[key];
      data.dataValueAfter[key] = dataAfter[key];
      isChange = true;
    }
  }
  if (isChange) {
    let insertResult = await SystemAppLogAppUserResource.insert(data);
    if (insertResult) {
      return insertResult;
    }
  }
}

async function logUserUpdateAppUserData(dataBefore, dataAfter, userId, currentUser) {
  let now = moment().format();
  let data = {
    userUpdate: currentUser.username,
    timeUpdate: now,
    dataValueBefore: {},
    dataValueAfter: {},
    userId: userId,
  };
  let beforeObjKeys = Object.keys(dataBefore);
  let isChange = false;
  for (let i = 0; i < beforeObjKeys.length; i++) {
    const key = beforeObjKeys[i];
    if (dataAfter[key] && dataAfter[key] !== dataBefore[key]) {
      data.dataValueBefore[key] = dataBefore[key];
      data.dataValueAfter[key] = dataAfter[key];
      isChange = true;
    }
  }
  if (isChange) {
    let insertResult = await SystemAppLogAppUserResource.insert(data);
    if (insertResult) {
      return insertResult;
    }
  }
}
module.exports = {
  logAdminUpdateAppUserData,
  logUserUpdateAppUserData,
};
