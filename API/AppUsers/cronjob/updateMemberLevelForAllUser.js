/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */

const moment = require('moment');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const GamePlayRecordsStatisticFunctions = require('../../GamePlayRecords/GamePlayRecordsStatisticFunctions');
const AppUserMembershipResourceAccess = require('../../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');

const { isValidValue } = require('../../ApiUtils/utilFunctions');
const { LEVER_MEMBERSHIP, LEVEL_MEMBERSHIP_NAME } = require('../../AppUserMembership/AppUserMembershipConstant');

async function _calculateNewMemberLevel(appUserId) {
  //Start week on Monday:
  let lastWeekStart = moment().add(-1, 'week').startOf('isoWeek').format();
  let lastWeekEnd = moment().add(-1, 'week').endOf('isoWeek').format();

  //Logger.info(`start _calculateNewMemberLevel ${appUserId} | ${lastWeekStart} -- ${lastWeekEnd}`);

  // Tổng giao dịch của F1
  let limit = 100;
  let skip = 0;
  let userOrder = {
    key: 'createdAt',
    value: 'desc',
  };
  let total = 0;

  while (true) {
    const listF1 = await AppUsersResourceAccess.find(
      {
        referUserId: appUserId,
      },
      skip,
      limit,
      userOrder,
    );

    if (listF1 && listF1.length > 0) {
      for (let i = 0; i < listF1.length; i++) {
        const _totalBetAmount = await GamePlayRecordsStatisticFunctions.sumTotalUserBetAmountByDate(listF1[i].appUserId, lastWeekStart, lastWeekEnd);
        if (_totalBetAmount) {
          total += _totalBetAmount;
        }
      }
      skip += limit;
    } else {
      break;
    }
  }
  //Logger.info(`totalBetAmount_ReferUser: ${appUserId} | ${total} | ${lastWeekStart} -- ${lastWeekEnd}`);

  let _membershipList = await AppUserMembershipResourceAccess.find({}, undefined, undefined, {
    key: 'appUserMembershipAssetF1Required',
    value: 'desc',
  });

  if (_membershipList && _membershipList.length > 0) {
    // Tính vipLevel dựa trên tổng giao dịch của F1
    for (let i = 0; i < _membershipList.length; i++) {
      if (total >= _membershipList[i].appUserMembershipAssetF1Required) {
        return _membershipList[i];
      }
    }
  }

  return null;
}

async function _updateAppUserMembershipId(appUserId, newMemberShip) {
  if (isValidValue(newMemberShip)) {
    await AppUsersResourceAccess.updateById(appUserId, {
      appUserMembershipId: newMemberShip.appUserMembershipId,
      memberLevelName: newMemberShip.appUserMembershipTitle,
    });
  } else {
    await AppUsersResourceAccess.updateById(appUserId, {
      appUserMembershipId: LEVER_MEMBERSHIP.MEMBER,
      memberLevelName: LEVEL_MEMBERSHIP_NAME.VIP0,
    });
  }
}

async function calculateMemberLevelForUser(user) {
  let _newMemberLevel = await _calculateNewMemberLevel(user.appUserId);
  await _updateAppUserMembershipId(user.appUserId, _newMemberLevel);
}

async function calculateMemberLevelForAllUser() {
  //Logger.info(`START to calculateMemberLevelForAllUser ${new Date()}`);

  let limit = 20;
  let skip = 0;
  let userOrder = {
    key: 'createdAt',
    value: 'desc',
  };

  let _membershipList = await AppUserMembershipResourceAccess.find({}, undefined, undefined, {
    key: 'appUserMembershipAssetF1Required',
    value: 'desc',
  });
  if (_membershipList && _membershipList.length > 0) {
    while (true) {
      const users = await AppUsersResourceAccess.find({}, skip, limit, userOrder);

      if (users && users.length > 0) {
        let _promise = [];
        for (let i = 0; i < users.length; i++) {
          _promise.push(calculateMemberLevelForUser(users[i]));
        }
        await Promise.all(_promise);
        skip += limit;
      } else {
        break;
      }
    }
    //Logger.info(`FINISH to calculateMemberLevelForAllUser ${new Date()}`);
  } else {
    //Logger.error(`ERROR!! Can not find AppUserMembershipResourceAccess to calculateMemberLevelForUser ${new Date()}`);
  }
}

module.exports = {
  calculateMemberLevelForAllUser,
};
