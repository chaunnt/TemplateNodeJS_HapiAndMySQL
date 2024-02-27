/* Copyright (c) 2022-2023 Reminano */

const moment = require('moment');
const { isValidValue, isNotValidValue } = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const PaymentBonusTransactionFunction = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
const AppUserMembershipResourceAccess = require('../../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const { fetchSystemUserList } = require('../../AppUsers/AppUserFunctions_ReferUser');
const { sumTotalPlayAmountUserId } = require('../../GamePlayRecords/GamePlayRecordsStatisticFunctions');
const Logger = require('../../../utils/logging');

async function _addPaymenBonusForUser(appUserId, totalBonus, totalPlayAmount, otherData) {
  let newBonusTransaction = await PaymentBonusTransactionFunction.increaseBonusForUser(appUserId, totalBonus, totalPlayAmount, otherData);
  if (!newBonusTransaction && totalBonus > 0) {
    Logger.error(`ERROR can not create new bonus for appUser ${appUserId} - amount ${totalBonus}`);
  }
}

async function _collectSystemPlayAmount(appUserId, childLevel = 1) {
  let startDate = moment().add(-1, 'day').startOf('day').format();
  let endDate = moment().add(-1, 'day').endOf('day').format();
  let _totalSystemPlayAmount = 0;
  let batchLimit = 100;
  let counter = 0;
  while (true) {
    let _systemUserList = await fetchSystemUserList(appUserId, childLevel, counter, batchLimit);
    counter += batchLimit;
    if (_systemUserList && _systemUserList.length > 0) {
      for (let i = 0; i < _systemUserList.length; i++) {
        _totalSystemPlayAmount += await sumTotalPlayAmountUserId(_systemUserList[i].appUserId, startDate, endDate);
      }
    } else {
      break;
    }
  }
  return _totalSystemPlayAmount;
}
async function _paySystemBonusForUser(user) {
  let _membership = null;
  if (isValidValue(user.appUserMembershipId)) {
    _membership = await AppUserMembershipResourceAccess.findById(user.appUserMembershipId);
    if (isNotValidValue(_membership)) {
      return;
    }
  }

  let _bonusAmount = 0;
  let _totalPlayAmount = 0;
  let otherData = {
    paymentAmountF1: 0,
    paymentAmountF2: 0,
    paymentAmountF3: 0,
    paymentAmountF4: 0,
    paymentAmountF5: 0,
    paymentAmountF6: 0,
    paymentAmountF7: 0,
    paymentAmountF8: 0,
    paymentAmountF9: 0,
    paymentAmountF10: 0,
  };
  if (_membership.appUserMembershipBonusRateF1 > 0) {
    let _totalPlayAmountF1 = await _collectSystemPlayAmount(user.appUserId, 1);
    let _totalBonusF1 = (_totalPlayAmountF1 * _membership.appUserMembershipBonusRateF1) / 100;
    _totalPlayAmount += _totalPlayAmountF1;
    _bonusAmount += _totalBonusF1;
    otherData.paymentAmountF1 = _totalBonusF1;
  }
  if (_membership.appUserMembershipBonusRateF2 > 0) {
    let _totalPlayAmountF2 = await _collectSystemPlayAmount(user.appUserId, 2);
    let _totalBonusF2 = (_totalPlayAmountF2 * _membership.appUserMembershipBonusRateF2) / 100;
    _totalPlayAmount += _totalPlayAmountF2;
    _bonusAmount += _totalBonusF2;
    otherData.paymentAmountF2 = _totalBonusF2;
  }
  if (_membership.appUserMembershipBonusRateF3 > 0) {
    let _totalPlayAmountF3 = await _collectSystemPlayAmount(user.appUserId, 3);
    let _totalBonusF3 = (_totalPlayAmountF3 * _membership.appUserMembershipBonusRateF3) / 100;
    _totalPlayAmount += _totalPlayAmountF3;
    _bonusAmount += _totalBonusF3;
    otherData.paymentAmountF3 = _totalBonusF3;
  }
  if (_membership.appUserMembershipBonusRateF4 > 0) {
    let _totalPlayAmountF4 = await _collectSystemPlayAmount(user.appUserId, 4);
    let _totalBonusF4 = (_totalPlayAmountF4 * _membership.appUserMembershipBonusRateF4) / 100;
    _totalPlayAmount += _totalPlayAmountF4;
    _bonusAmount += _totalBonusF4;
    otherData.paymentAmountF4 = _totalBonusF4;
  }
  if (_membership.appUserMembershipBonusRateF5 > 0) {
    let _totalPlayAmountF5 = await _collectSystemPlayAmount(user.appUserId, 5);
    let _totalBonusF5 = (_totalPlayAmountF5 * _membership.appUserMembershipBonusRateF5) / 100;
    _totalPlayAmount += _totalPlayAmountF5;
    _bonusAmount += _totalBonusF5;
    otherData.paymentAmountF5 = _totalBonusF5;
  }
  if (_membership.appUserMembershipBonusRateF6 > 0) {
    let _totalPlayAmountF6 = await _collectSystemPlayAmount(user.appUserId, 6);
    let _totalBonusF6 = (_totalPlayAmountF6 * _membership.appUserMembershipBonusRateF6) / 100;
    _totalPlayAmount += _totalPlayAmountF6;
    _bonusAmount += _totalBonusF6;
    otherData.paymentAmountF6 = _totalBonusF6;
  }

  await _addPaymenBonusForUser(user.appUserId, _bonusAmount, _totalPlayAmount, otherData);
}

async function updateBonusDailyForAllUser() {
  const moment = require('moment');
  let yesterdayStart = moment().add(-1, 'day').startOf('day').format();
  let yesterdayEnd = moment().add(-1, 'day').endOf('day').format();

  Logger.info(`START updateBonusDailyForAllUser ${yesterdayStart} -- ${yesterdayEnd} at ${new Date()}`);
  let batchLimit = 20;
  let skip = 0;
  while (true) {
    const users = await AppUsersResourceAccess.find({}, skip, batchLimit, { key: 'createdAt', value: 'desc' });

    if (users && users.length > 0) {
      let _promise = [];
      for (let i = 0; i < users.length; i++) {
        _promise.push(_paySystemBonusForUser(users[i]));
      }
      await Promise.all(_promise);
      skip += batchLimit;
    } else {
      break;
    }
  }
  Logger.info(`FINISH updateBonusDsailyForAllUser ${yesterdayStart} -- ${yesterdayEnd} at ${new Date()}`);
}

module.exports = {
  updateBonusDailyForAllUser,
};
