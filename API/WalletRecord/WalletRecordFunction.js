'use strict';

const WalletRecordResourAccess = require('./resourceAccess/WalletRecordResoureAccess')
const { WALLET_RECORD_TYPE } = require('./WalletRecordConstant');

async function _storeWalletRecord(appUserId, amount, walletType, recordType, staff, walletRecordRef) {
  const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
  let wallet = await UserWallet.find({
    appUserId: appUserId,
    walletType: walletType
  }, 0, 1);

  if (!wallet || wallet.length < 1) {
    console.error("user wallet is invalid");
    return undefined;
  }

  wallet = wallet[0];

  let historyData = {
    appUserId: appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance + amount,
    WalletRecordType: recordType,
    WalletRecordRef: walletRecordRef
  };

  if (staff) {
    historyData.staffId = staff.staffId;
  }

  let resultIncrement = UserWallet.incrementBalance(wallet.walletId, amount);
  if (resultIncrement) {
    let result = await WalletRecordResourAccess.insert(historyData);
    if (result) {
      return result;
    } else {
      console.error("insert deposit transaction error");
      return undefined;
    }
  }
  else {
    console.error("increment error");
    return undefined;
  }
}

async function adminRewardForUser(appUserId, amount, walletType, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.ADMIN_BONUS, staff, walletRecordRef)
}

async function adminAdjustBalance(appUserId, amount, walletType, staff) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.ADMIN_ADJUST, staff)
}

async function addReferralBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.REWARD, WALLET_RECORD_TYPE.REFER_BONUS);
}

async function addEventBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.USDT, WALLET_RECORD_TYPE.EVENT_BONUS);
}

module.exports = {
  adminRewardForUser,
  addReferralBonus,
  adminAdjustBalance,
  addEventBonus,
}