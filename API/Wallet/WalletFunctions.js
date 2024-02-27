/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const WalletResource = require('./resourceAccess/WalletResourceAccess');
const WALLET_TYPE = require('./WalletConstant').WALLET_TYPE;
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const PaymentDepositTransactionResourceAccess = require('./../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const WalletRecordResourAccess = require('../WalletRecord/resourceAccess/WalletRecordResoureAccess');
const Logger = require('../../utils/logging');

async function adjustBallanceForUser(user, amount, walletType) {
  let wallet = await UserWallet.find({
    appUserId: user.appUserId,
    walletType: walletType,
  });

  if (!wallet || wallet.length < 1) {
    Logger.error(`adjustBallanceForUser user wallet is invalid ${user.appUserId}`);
    return undefined;
  }
  wallet = wallet[0];
  let historyData = {
    appUserId: user.appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance + amount,
    WalletRecordType: amount > 0 ? WALLET_RECORD_TYPE.ADMIN_ADJUST_ADD : WALLET_RECORD_TYPE.ADMIN_ADJUST_SUBTRACT,
  };
  let resultIncrement = await UserWallet.incrementBalance(wallet.walletId, amount);
  if (resultIncrement) {
    let result = await WalletRecordResourAccess.insert(historyData);
    if (result) {
      return result;
    } else {
      Logger.error('insert deposit transaction error');
      return undefined;
    }
  } else {
    Logger.error('increment error');
    return undefined;
  }
}

async function createWalletForUser(userId) {
  let newWalletData = [
    {
      appUserId: userId,
      walletType: WALLET_TYPE.BONUS, // ví hoa hồng
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.REWARD, // ví khuyến mãi
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.POINT, // vi tiền chính của user
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.FAKE, // vi ảo
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.USDT, //vi usdt
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.BTC, //vi btc
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.MISSION, // vi nhiem vu
    },
  ];
  let createdResult = await WalletResource.insert(newWalletData);
  return createdResult;
}

async function getWalletByType(appUserId, walletType) {
  let wallet = await WalletResource.find(
    {
      appUserId: appUserId,
      walletType: walletType,
    },
    0,
    1,
  );
  if (wallet && wallet.length > 0) {
    return wallet[0];
  } else {
    return undefined;
  }
}

async function resetMissionWalletBalance(appUserId) {
  await resetWalletBalance(appUserId, WALLET_TYPE.MISSION, 100000000);
}

async function resetWalletBalance(appUserId, walletType, defaultAmount = 0) {
  let _existingWallet = await getWalletByType(appUserId, walletType);

  if (_existingWallet) {
    _existingWallet.balance = defaultAmount;
    await WalletResource.updateBalanceTransaction([_existingWallet]);
  }
}
module.exports = {
  adjustBallanceForUser,
  createWalletForUser,
  getWalletByType,
  resetWalletBalance,
  resetMissionWalletBalance,
};
