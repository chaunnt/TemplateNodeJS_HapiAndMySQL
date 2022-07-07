/**
 * Created by A on 7/18/17.
 */
"use strict";

const WalletResource = require("./resourceAccess/WalletResourceAccess");
const WALLET_TYPE = require("./WalletConstant").WALLET_TYPE;
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const PaymentDepositTransactionResourceAccess = require('./../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const WalletRecordResourAccess = require('../WalletRecord/resourceAccess/WalletRecordResoureAccess');

async function adjustBallanceForUser(user, amount, walletType) {
  let wallet = await UserWallet.find({
      appUserId: user.appUserId,
      walletType: walletType
  });

  if (!wallet || wallet.length < 1) {
      console.error("user wallet is invalid");
      return undefined;
  }
  wallet = wallet[0];
  let historyData = {
      appUserId: user.appUserId,
      walletId: wallet.walletId,
      paymentAmount: amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + amount,
      WalletRecordType: WALLET_RECORD_TYPE.ADMIN_ADJUST
  };
  let resultIncrement = await UserWallet.incrementBalance(wallet.walletId, amount);
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

async function createWalletForUser(userId) {
  let newWalletData = [
    {
      appUserId: userId,
      walletType: WALLET_TYPE.USDT //vi usdt
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.FAC //vi fac
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.BTC //vi btc
    },
    {
      appUserId: userId,
      walletType: WALLET_TYPE.POINT //vi hoa hong
    },
  ];;
  let createdResult = await WalletResource.insert(newWalletData);
  return createdResult;
}

module.exports = {
  createWalletForUser,
  adjustBallanceForUser
};
