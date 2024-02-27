/* Copyright (c) 2023 Reminano */

const AppUserFollowerResourceAccess = require('./resourceAccess/AppUserFollowerResourceAccess');

async function getDetailFollowingInfo(expertId, appUserId) {
  const appUserFollow = await AppUserFollowerResourceAccess.find({ appUserId: expertId, followerId: appUserId }, 0, 1);
  if (appUserFollow && appUserFollow.length > 0) {
    return appUserFollow[0];
  } else {
    return undefined;
  }
}

async function fetchFollowingStatus(appUserId, expertInfo) {
  let _followingInfo = await getDetailFollowingInfo(expertInfo.appUserId, appUserId);
  if (_followingInfo) {
    expertInfo.copyTradeStatus = _followingInfo.copyTradeStatus;
  } else {
    //khong co thong tin follow
    expertInfo.copyTradeStatus = null;
  }
}
module.exports = {
  getDetailFollowingInfo,
  fetchFollowingStatus,
};
