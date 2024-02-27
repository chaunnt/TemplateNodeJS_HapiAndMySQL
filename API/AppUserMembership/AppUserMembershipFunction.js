/* Copyright (c) 2022-2023 Reminano */

'use strict';
const AppUserMembershipResourceAccess = require('../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const Logger = require('../../utils/logging');
async function getListMemberShip() {
  let result = await AppUserMembershipResourceAccess.find();
  if (result) {
    let resultCount = await AppUserMembershipResourceAccess.customCount();
    if (resultCount) {
      return { data: result, total: resultCount[0].count };
    } else {
      return { data: result, total: 0 };
    }
  } else {
    return { data: [], total: 0 };
  }
}

function getMaxSystemUserLevelByMembership(appUserMembership) {
  for (let i = 10; i >= 1; i--) {
    if (appUserMembership[`appUserMembershipBonusRateF${i}`] * 1 > 0.000000001) {
      return i;
    }
  }
  return 0;
}

async function getSystemUserLevelByMembershipId(appUserMembershipId) {
  let _membership = await AppUserMembershipResourceAccess.findById(appUserMembershipId);

  //neu user ko co membership thi ko can tinh
  if (!_membership) {
    Logger.error(`getMemberReferObjectByMembershipId invalid appUserMembershipId`);
    return {};
  }

  let _systemLevelCount = getMaxSystemUserLevelByMembership(_membership);
  if (_systemLevelCount < 1) {
    return 0;
  }
  return _systemLevelCount;
}

function getMemberReferObjectForFilterReferral(appUserMembership, appUserId) {
  //lay ra danh sach cap duoi can phai tinh toan (dua theo % chia duoc, chia bao nhieu cap lay bao nhieu cap)
  let _systemLevelCount = getMaxSystemUserLevelByMembership(appUserMembership);
  if (_systemLevelCount < 1) {
    return {};
  }

  let _memberReferObject = {};
  for (let i = 1; i <= _systemLevelCount; i++) {
    _memberReferObject[`memberReferIdF${i}`] = appUserId;
  }

  return _memberReferObject;
}

async function getMemberReferObjectByMembershipId(appUserMembershipId, appUserId) {
  let _membership = await AppUserMembershipResourceAccess.findById(appUserMembershipId);
  //neu user ko co membership thi ko can tinh
  if (!_membership) {
    Logger.error(`getMemberReferObjectByMembershipId invalid appUserMembershipId`);
    return {};
  }

  let _memberReferObject = getMemberReferObjectForFilterReferral(_membership, appUserId);
  return _memberReferObject;
}
module.exports = {
  getListMemberShip,
  getMaxSystemUserLevelByMembership,
  getMemberReferObjectForFilterReferral,
  getMemberReferObjectByMembershipId,
  getSystemUserLevelByMembershipId,
};
