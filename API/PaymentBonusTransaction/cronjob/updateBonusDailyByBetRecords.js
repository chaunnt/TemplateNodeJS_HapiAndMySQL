const AppUserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const UserBetRecordsView = require('../../BetRecords/resourceAccess/UserBetRecordsView');
const PaymentBonusTransactionFunction = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
const PaymentBonusResource = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess')

const REFERRAL_F1 = "F1";
const REFERRAL_F2 = "F2";
const REFERRAL_F3 = "F3";

async function addBonusForUserByLevel(appUserId, totalBetAmount, referalLevel, referUserId) {
  console.info(`start addBonusForUserByLevel`);
  let _userDetail = await AppUserResource.findById(appUserId);
  if (_userDetail === undefined) {
    console.error(`can not find user ${appUserId} addBonusForUserByLevel`)
    return;
  }

  let bonusAmount = 0;
  if (_userDetail.memberLevelName === "LV1") {
    // * THÀNH VIÊN :
    // - F1 : 10%
    // - F2 : 8%
    // - F3 : 5%
    if (referalLevel === REFERRAL_F1) {
      bonusAmount = totalBetAmount * 10 / 100;
    } else if (referalLevel === REFERRAL_F2) {
      bonusAmount = totalBetAmount * 8 / 100;
    } else if (referalLevel === REFERRAL_F3) {
      bonusAmount = totalBetAmount * 5 / 100;
    }

  } else if (_userDetail.memberLevelName === "LV2") {
    // * HỘ KINH DOANH :
    // - F1 : 15%
    // - F2 : 8%
    // - F3 : 5%
    if (referalLevel === REFERRAL_F1) {
      bonusAmount = totalBetAmount * 15 / 100;
    } else if (referalLevel === REFERRAL_F2) {
      bonusAmount = totalBetAmount * 8 / 100;
    } else if (referalLevel === REFERRAL_F3) {
      bonusAmount = totalBetAmount * 5 / 100;
    }
  } else if (_userDetail.memberLevelName === "LV3") {
    // * CÔNG TY :
    // - F1 : 20%
    // - F2 : 8%
    // - F3 : 5%
    if (referalLevel === REFERRAL_F1) {
      bonusAmount = totalBetAmount * 20 / 100;
    } else if (referalLevel === REFERRAL_F2) {
      bonusAmount = totalBetAmount * 8 / 100;
    } else if (referalLevel === REFERRAL_F3) {
      bonusAmount = totalBetAmount * 5 / 100;
    }
  } else if (_userDetail.memberLevelName === "LV4") {
    // * DOANH NGHIỆP :
    // - F1 : 25%
    // - F2 : 8%
    // - F3 : 5%
    if (referalLevel === REFERRAL_F1) {
      bonusAmount = totalBetAmount * 25 / 100;
    } else if (referalLevel === REFERRAL_F2) {
      bonusAmount = totalBetAmount * 8 / 100;
    } else if (referalLevel === REFERRAL_F3) {
      bonusAmount = totalBetAmount * 5 / 100;
    }
  } else if (_userDetail.memberLevelName === "LV5") {
    // * TẬP ĐOÀN :
    // - F1 : 30%
    // - F2 : 8%
    // - F3 : 5 %
    if (referalLevel === REFERRAL_F1) {
      bonusAmount = totalBetAmount * 30 / 100;
    } else if (referalLevel === REFERRAL_F2) {
      bonusAmount = totalBetAmount * 8 / 100;
    } else if (referalLevel === REFERRAL_F3) {
      bonusAmount = totalBetAmount * 5 / 100;
    }
  }
  let totalReferAmount = totalBetAmount;
  let newBonusTransaction = await PaymentBonusTransactionFunction.increaseBonusForUser(appUserId, bonusAmount, referUserId, totalReferAmount);
  if (newBonusTransaction) {
    await PaymentBonusTransactionFunction.approveBonusTransaction(newBonusTransaction.paymentBonusTransactionId);
  } else {
    console.error(`can not create new bonus for appUser ${appUserId} - amount ${bonusAmount} - referUser ${referUserId}`);
  }
  
}

async function updateBonusDailyForAllUser() {
  const moment = require('moment');
  let lastWeekStart = moment().subtract(2, 'weeks').endOf('week').add(1, 'day').format();
  let lastWeekEnd = moment().subtract(1, 'weeks').endOf('week').add(1, 'day').format();

  console.info(`start updateBonusDailyForAllUser ${lastWeekStart} -- ${lastWeekEnd}`);

  let betRecordSummary = await UserBetRecordsView.sumBetAmountDistinctByAppUserId({}, lastWeekStart, lastWeekEnd);

  if (betRecordSummary && betRecordSummary.length > 0) {
    for (let i = 0; i < betRecordSummary.length; i++) {
      const _userSummary = betRecordSummary[i];

      let _userDetail = await AppUserResource.findById(_userSummary.appUserId);
      if (_userDetail && _userDetail.memberReferIdF1 && _userDetail.memberReferIdF1 !== null) {
        await addBonusForUserByLevel(_userDetail.memberReferIdF1, _userSummary.totalSum, REFERRAL_F1, _userDetail.appUserId);
      }

      if (_userDetail && _userDetail.memberReferIdF2 && _userDetail.memberReferIdF2 !== null) {
        await addBonusForUserByLevel(_userDetail.memberReferIdF2, _userSummary.totalSum, REFERRAL_F2, _userDetail.appUserId);
      }

      if (_userDetail && _userDetail.memberReferIdF3 && _userDetail.memberReferIdF3 !== null) {
        await addBonusForUserByLevel(_userDetail.memberReferIdF3, _userSummary.totalSum, REFERRAL_F3, _userDetail.appUserId);
      }

      // if (_userDetail && _userDetail.memberReferIdF4 && _userDetail.memberReferIdF4 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF4, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF5 && _userDetail.memberReferIdF5 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF5, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF6 && _userDetail.memberReferIdF6 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF6, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF7 && _userDetail.memberReferIdF7 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF7, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF8 && _userDetail.memberReferIdF8 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF8, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF9 && _userDetail.memberReferIdF9 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF9, _userSummary.totalSum);
      // }

      // if (_userDetail && _userDetail.memberReferIdF10 && _userDetail.memberReferIdF10 !== null) {
      //   await addBonusForUserByLevel(_userDetail.memberReferIdF10, _userSummary.totalSum);
      // }
    }
  }
  console.info(`end updateBonusDailyForAllUser`);
}

module.exports = {
  updateBonusDailyForAllUser,
};