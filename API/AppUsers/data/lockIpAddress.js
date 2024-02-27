/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserLockIpResourceAccess = require('../resourceAccess/AppUserLockIpResourceAccess');
const Logger = require('../../../utils/logging');

let lockIpList = [];

async function reloadNewIpLockListJob() {
  const newLockIpList = await AppUserLockIpResourceAccess.find({}, 0, undefined);
  if (newLockIpList && newLockIpList.length >= 0) {
    lockIpList = newLockIpList.map(ipRecord => ipRecord.ipAddress);
  } else {
    Logger.error('Load ip lock list failed !');
  }
}

function getListLockIp() {
  return lockIpList;
}

module.exports = {
  reloadNewIpLockListJob,
  getListLockIp,
};
