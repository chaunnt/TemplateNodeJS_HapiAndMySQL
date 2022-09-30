/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */

const moment = require('moment');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const AppUserMembershipResourceAccess = require('../../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const Logger = require('../../../utils/logging');
const { LEVER_MEMBERSHIP } = require('../../AppUserMembership/AppUserMembershipConstant');

const LEVEL_0 = LEVER_MEMBERSHIP.NONE;
const LEVEL_1 = LEVER_MEMBERSHIP.MEMBER;
const LEVEL_2 = LEVER_MEMBERSHIP.BUSINESS;
const LEVEL_3 = LEVER_MEMBERSHIP.COMPANY;
const LEVEL_4 = LEVER_MEMBERSHIP.ENTERPRISE;
const LEVEL_5 = LEVER_MEMBERSHIP.CORPORATION;
const LEVEL_6 = LEVER_MEMBERSHIP.LV6;
const LEVEL_7 = LEVER_MEMBERSHIP.LV7;
const LEVEL_8 = LEVER_MEMBERSHIP.LV8;
const LEVEL_9 = LEVER_MEMBERSHIP.LV9;
const LEVEL_10 = LEVER_MEMBERSHIP.LV10;

function _getLevelBySystemTotalPayment(totalSystemBet) {
  if (totalSystemBet < 5000) {
    return LEVEL_1;
  }

  if (totalSystemBet < 10000) {
    return LEVEL_2;
  }

  if (totalSystemBet < 30000) {
    return LEVEL_3;
  }

  if (totalSystemBet < 100000) {
    return LEVEL_4;
  }

  if (totalSystemBet >= 100000) {
    return LEVEL_5;
  }

  return LEVEL_0;
}

function _getLevelByUserPayment(totalUserBet) {
  if (totalUserBet < 100) {
    return LEVEL_0;
  }

  if (totalUserBet < 1000) {
    return LEVEL_1;
  }

  if (totalUserBet < 3000) {
    return LEVEL_2;
  }

  if (totalUserBet < 10000) {
    return LEVEL_3;
  }

  if (totalUserBet < 30000) {
    return LEVEL_4;
  }

  if (totalUserBet >= 30000) {
    return LEVEL_5;
  }

  return LEVEL_0;
}

async function _calculateNewMemberLevel(appUserId) {
  let lastWeekStart = moment().subtract(2, 'weeks').endOf('week').add(1, 'day').format();
  let lastWeekEnd = moment().subtract(1, 'weeks').endOf('week').add(1, 'day').format();

  console.info(`start _calculateNewMemberLevel ${lastWeekStart} -- ${lastWeekEnd}`);

  const BetRecordStatisticFunctions = require('../../BetRecords/BetRecordsStatisticFunctions');

  //tinh tong choi cua user
  let _totalUserBetRecordAmountIn = await BetRecordStatisticFunctions.sumTotalUserBetAmountByDate(
    appUserId,
    lastWeekStart,
    lastWeekEnd,
  );
  console.info(`_totalUserBetRecordAmountIn: ${_totalUserBetRecordAmountIn}`);

  let _levelByUserBet = _getLevelByUserPayment(_totalUserBetRecordAmountIn);
  console.info(`_levelByUserBet: ${_levelByUserBet}`);

  //tinh tong choi cua he thong
  let _totalReferBetRecordAmountIn = await BetRecordStatisticFunctions.sumTotalUserSystemBetAmountByDate(
    appUserId,
    lastWeekStart,
    lastWeekEnd,
  );
  console.log(`_totalReferBetRecordAmountIn: ${_totalReferBetRecordAmountIn}`);

  let _levelBySystemPayment = _getLevelBySystemTotalPayment(_totalReferBetRecordAmountIn);
  console.log(`_levelBySystemPayment: ${_levelBySystemPayment}`);

  //thong nhat lay level nho nhat (la level du dieu kien nhat)
  let _finalLevel = Math.min(_levelBySystemPayment, _levelByUserBet);
  console.info(`_finalLevel: ${_finalLevel}`);
  return _finalLevel;
}

async function updateMemberLevelName(appUserId, newLevel) {
  let appUserMemberShip = await AppUserMembershipResourceAccess.findById(newLevel);
  let newLevelName = '';

  if (appUserMemberShip) {
    newLevelName = appUserMemberShip.appUserMembershipTitle;
  }

  await AppUsersResourceAccess.updateById(appUserId, {
    memberLevelName: newLevelName,
  });
}

async function updateAppUserMembershipId(appUserId, newLevel) {
  await AppUsersResourceAccess.updateById(appUserId, {
    appUserMembershipId: newLevel,
  });
}

async function calculateMemberLevelForAllUser() {
  let totalUser = await AppUsersResourceAccess.count({});

  if (totalUser !== undefined && totalUser.length > 0) {
    totalUser = totalUser[0].count;
    for (let i = 0; i < totalUser; i++) {
      const _userOrder = {
        key: 'createdAt',
        value: 'desc',
      };
      let _user = await AppUsersResourceAccess.find({}, i, 1, _userOrder);

      if (_user && _user.length > 0) {
        _user = _user[0];

        let newLevel = await _calculateNewMemberLevel(_user.appUserId);
        console.info(`_user.appUserId: ${_user.appUserId} - appUserMembershipId: ${_user.appUserMembershipId}`);
        console.info(`New Level: ${newLevel}`);

        if (newLevel === 0) {
          newLevel = null;
        }

        await updateMemberLevelName(_user.appUserId, newLevel);
        await updateAppUserMembershipId(_user.appUserId, newLevel);
      }
    }
  }
}

module.exports = {
  calculateMemberLevelForAllUser,
};
