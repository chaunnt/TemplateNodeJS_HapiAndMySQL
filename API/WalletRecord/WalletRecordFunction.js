/* Copyright (c) 2022-2023 Reminano */

'use strict';

const { WALLET_TYPE, WALLET_ERROR } = require('../Wallet/WalletConstant');
const WalletRecordResourAccess = require('./resourceAccess/WalletRecordResoureAccess');
const WalletResourceAccess = require('../Wallet/resourceAccess/WalletResourceAccess');
const { WALLET_RECORD_TYPE, PAYMENT_AMOUNT } = require('./WalletRecordConstant');
const WalletRecordView = require('./resourceAccess/WalletRecordView');
const Logger = require('../../utils/logging');

async function _storeWalletRecordByWalletId(walletId, amount, recordType, staff, walletRecordRef, walletRecordRefAmount, betRecordId) {
  let wallet = await WalletResourceAccess.findById(walletId);

  if (!wallet || wallet.length < 1) {
    Logger.error(`_storeWalletRecordByWalletId user wallet is invalid ${walletId}`);
    return undefined;
  }

  let historyData = {};

  historyData = {
    appUserId: wallet.appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance + amount,
    WalletRecordType: recordType,
    WalletRecordRef: walletRecordRef,
    WalletRecordRefAmount: walletRecordRefAmount,
  };

  if (betRecordId) {
    historyData.betRecordId = betRecordId;
  }
  if (amount > 0) {
    historyData.paymentAmountIn = amount;
    historyData.paymentAmountInOut = 10; //CREDIT
  } else {
    historyData.paymentAmountOut = amount;
    historyData.paymentAmountInOut = 0; //DEBIT
  }

  if (staff) {
    historyData.staffId = staff.staffId;
  }

  let result = await WalletRecordResourAccess.insert(historyData);

  if (result) {
    let resultIncrement = WalletResourceAccess.incrementBalance(wallet.walletId, amount);
    if (resultIncrement) {
      return resultIncrement;
    } else {
      Logger.error('insert deposit transaction error');
      return undefined;
    }
  } else {
    Logger.error('increment error');
    return undefined;
  }
}

async function _storeWalletRecord(appUserId, amount, walletType, recordType, staff, walletRecordRef, walletRecordRefAmount, betRecordId) {
  if (!appUserId) {
    Logger.error(`_storeWalletRecord invalid appUserId ${appUserId}`);
    return undefined;
  }
  let wallet = await WalletResourceAccess.find(
    {
      appUserId: appUserId,
      walletType: walletType,
    },
    0,
    1,
  );

  if (!wallet || wallet.length < 1) {
    Logger.error(`_storeWalletRecord user wallet is invalid ${appUserId}`);
    return undefined;
  }

  wallet = wallet[0];
  return _storeWalletRecordByWalletId(wallet.walletId, amount, recordType, staff, walletRecordRef, walletRecordRefAmount, betRecordId);
}

async function adminAdjustBalance(appUserId, amount, walletType, staff) {
  return _storeWalletRecord(
    appUserId,
    amount,
    walletType,
    amount > 0 ? WALLET_RECORD_TYPE.ADMIN_ADJUST_ADD : WALLET_RECORD_TYPE.ADMIN_ADJUST_SUBTRACT,
    staff,
  );
}

async function addReferralBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.BONUS, WALLET_RECORD_TYPE.REFER_BONUS);
}

async function addEventBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.USDT, WALLET_RECORD_TYPE.EVENT_BONUS);
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function rewardMissionBonus(appUserId, amount, appUserMissionHistoryId) {
  Logger.info(`rewardMissionBonus ${appUserId} ${amount} ${appUserMissionHistoryId}`);
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(
    appUserId,
    amount,
    WALLET_TYPE.BONUS,
    WALLET_RECORD_TYPE.MISSON_COMPLETED,
    undefined,
    `MISSION_${appUserMissionHistoryId}`,
  );
}

async function rewardMissionReferralBonus(appUserId, amount, appUserMissionHistoryId) {
  Logger.info(`rewardMissionReferralBonus ${appUserId} ${amount} ${appUserMissionHistoryId}`);
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(
    appUserId,
    amount,
    WALLET_TYPE.BONUS,
    WALLET_RECORD_TYPE.MISSON_REFERRAL_COMPLETED,
    undefined,
    `MISSION_${appUserMissionHistoryId}`,
  );
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function increasePointBalance(appUserId, amount, staff, walletRecordRef) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.POINT, WALLET_RECORD_TYPE.EARNED, staff, walletRecordRef);
}

async function depositPointWalletBalance(appUserId, amount, staff) {
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.POINT, WALLET_RECORD_TYPE.DEPOSIT_POINTWALLET, staff);
}

async function withdrawWalletBalance(appUserId, amount, walletType, staff, walletRecordRef) {
  let walletRecordType;
  switch (walletType) {
    case WALLET_TYPE.POINT:
      walletRecordType = WALLET_RECORD_TYPE.WITHDRAW_POINTWALLET;
      break;
    case WALLET_TYPE.BONUS:
      walletRecordType = WALLET_RECORD_TYPE.WITHDRAW_BONUSWALLET;
      break;
    case WALLET_TYPE.REWARD:
      walletRecordType = WALLET_RECORD_TYPE.WITHDRAW_REWARDWALLET;
      break;
    case WALLET_TYPE.WIN:
      walletRecordType = WALLET_RECORD_TYPE.WITHDRAW_WINWALLET;
      break;
  }
  let wallet = await WalletResourceAccess.find(
    {
      appUserId: appUserId,
      walletType: walletType,
    },
    0,
    1,
  );
  if (wallet.balance - amount < 0.000000001) {
    throw WALLET_ERROR.NOT_ENOUGH_BALANCE;
  }
  return _storeWalletRecord(appUserId, amount, walletType, walletRecordType, staff, walletRecordRef);
}

async function deduceWithdrawFee(appUserId, amount, walletType, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.WITHDRAW_FEE, staff, walletRecordRef);
}

async function exchangeToPointWallet(appUserId, amount, walletType, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.BONUS_EXCHANGE_POINT, staff, walletRecordRef);
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function increaseBalance(appUserId, walletType, walletRecordType, amount, staff, walletRecordRef, walletRecordRefAmount, betRecordId) {
  return _storeWalletRecord(appUserId, amount, walletType, walletRecordType, staff, walletRecordRef, walletRecordRefAmount, betRecordId);
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function decreaseBalance(appUserId, walletType, walletRecordType, amount, staff, walletRecordRef) {
  if (amount > 0.0000001) {
    return _storeWalletRecord(appUserId, amount * -1, walletType, walletRecordType, staff, walletRecordRef);
  }
}

async function checkSumWalletById(walletId, appUserId) {
  let walletRecordSumPaymentAmountIn = await WalletRecordResourAccess.customSum('PaymentAmountIn', {
    walletId: walletId,
    appUserId: appUserId,
  });
  let walletRecordSumPaymentAmountOut = await WalletRecordResourAccess.customSum('PaymentAmountOut', {
    walletId: walletId,
    appUserId: appUserId,
  });
  if (walletRecordSumPaymentAmountOut && walletRecordSumPaymentAmountOut.length > 0) {
    walletRecordSumPaymentAmountOut = walletRecordSumPaymentAmountOut[0].sumResult;
  } else {
    walletRecordSumPaymentAmountOut = 0;
  }

  if (walletRecordSumPaymentAmountIn && walletRecordSumPaymentAmountIn.length > 0) {
    walletRecordSumPaymentAmountIn = walletRecordSumPaymentAmountIn[0].sumResult;
  } else {
    walletRecordSumPaymentAmountIn = 0;
  }

  return walletRecordSumPaymentAmountOut + walletRecordSumPaymentAmountIn;
}

async function summaryWalletResourceAccessRecord(appUserId, walletType, startDate, endDate) {
  let resultCount = await WalletRecordView.customSum('paymentAmount', { appUserId: appUserId, WalletRecordType: walletType }, startDate, endDate);

  if (resultCount && resultCount.length > 0 && resultCount[0].sumResult !== null) {
    return resultCount[0].sumResult;
  } else {
    return 0;
  }
}

module.exports = {
  addReferralBonus,
  adminAdjustBalance,
  addEventBonus,
  increasePointBalance,
  depositPointWalletBalance,
  increaseBalance,
  decreaseBalance,
  rewardMissionBonus,
  rewardMissionReferralBonus,
  withdrawWalletBalance,
  deduceWithdrawFee,
  exchangeToPointWallet,
  checkSumWalletById,
  summaryWalletResourceAccessRecord,
};
