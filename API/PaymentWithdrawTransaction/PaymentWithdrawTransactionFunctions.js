/**
 * Created by A on 7/18/17.
 */
'use strict';
const WithdrawTransactionResource = require('./resourceAccess/PaymentWithdrawTransactionResourceAccess');
const WalletResourceAccess = require('../Wallet/resourceAccess/WalletResourceAccess');
const SystemConfigurationsFunction = require('../SystemConfigurations/SystemConfigurationsFunction');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const { WITHDRAW_TRX_STATUS } = require('./PaymentWithdrawTransactionConstant');
const Logger = require('../../utils/logging');
const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');

async function acceptWithdrawRequest(transactionRequestId, paymentNote,staff,paymentRef) {
  let transaction = await WithdrawTransactionResource.find({ paymentWithdrawTransactionId: transactionRequestId });
  let wallet = await WalletResourceAccess.findById({appUserId:transaction.appUserId,walletId:transaction.walletId});
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not acceptWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];

  if (transaction.paymentStatus === WITHDRAW_TRX_STATUS.COMPLETED || transaction.paymentStatus === WITHDRAW_TRX_STATUS.CANCELED || transaction.paymentStatus === WITHDRAW_TRX_STATUS.DELETED) {
    Logger.error(`already acceptWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }

  //update transaction paymentStatus
  transaction.paymentStatus = WITHDRAW_TRX_STATUS.COMPLETED;

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  let updateResult = await WithdrawTransactionResource.updateById(transactionRequestId, transaction);
  if (updateResult) {
    let updateWalletResult =  await WalletRecordFunction.withdrawWalletBalance(
                                    transaction.appUserId,
                                    transaction.paymentAmount,
                                    wallet.walletType,
                                    staff,
                                    paymentRef)
    if(updateWalletResult){
      return updateWalletResult;
    }
  
  } else {
    return undefined;
  }
}

async function rejectWithdrawRequest(transactionRequestId, paymentNote) {
  let transaction = await WithdrawTransactionResource.find({ paymentWithdrawTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not rejectWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];

  if (transaction.paymentStatus === WITHDRAW_TRX_STATUS.COMPLETED || transaction.paymentStatus === WITHDRAW_TRX_STATUS.CANCELED || transaction.paymentStatus === WITHDRAW_TRX_STATUS.DELETED) {
    Logger.error(`already rejectWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  let wallet = await WalletResourceAccess.find({ walletId: transaction.walletId });
  if (wallet === undefined || wallet.length < 1) {
    Logger.error(`Can not find wallet ${transaction.walletId} for transaction ${transactionRequestId}`);
    return undefined;
  }
  wallet = wallet[0];

  await WalletResourceAccess.incrementBalance(wallet.walletId, transaction.paymentAmount);

  //update transaction paymentStatus
  transaction.paymentStatus = WITHDRAW_TRX_STATUS.CANCELED;

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }
  let updateResult = await WithdrawTransactionResource.updateById(transactionRequestId, transaction);
  if (updateResult) {
    return updateResult;
  } else {
    return undefined;
  }
}

async function createWithdrawRequest(user, amount, staff, paymentNote, walletType) {
  const MIN_PERSIST_AMOUNT = process.env.MIN_PERSIST_AMOUNT || 0;
  if (user.appUserId === undefined) {
    Logger.error(`createWithdrawRequest invalid user`);
    return undefined;
  }
  let wallet = await WalletResourceAccess.find({ 
    appUserId: user.appUserId,
    walletType: walletType
  });
  if (!wallet || wallet.length < 1) {
    Logger.error("user wallet is invalid");
    return undefined;
  }
  wallet = wallet[0];

  if (wallet.balance < 0 || wallet.balance - amount - MIN_PERSIST_AMOUNT < 0) {
    Logger.error("wallet do not have enough amount");
    return undefined;
  }

  let transactionData = {
    appUserId: user.appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance - amount
  };

  let _configs = await SystemConfigurationsFunction.getSystemConfig();
  let _convertedPrice = _configs.exchangeVNDPrice || 1;
  transactionData.paymentRefAmount = amount * _convertedPrice;

  if (staff) {
    transactionData.paymentApproveDate = new Date();
    transactionData.paymentPICId = staff.staffId;
    transactionData.paymentStatus = WITHDRAW_TRX_STATUS.COMPLETED;
  }

  if (paymentNote) {
    transactionData.paymentNote = paymentNote;
  }
  
  if (user.referUserId) {
    transactionData.referId = user.referUserId;
  }

  if (walletType === WALLET_TYPE.USDT && user.diachiviUSDT) {
    transactionData.paymentRef = user.diachiviUSDT;
  } else if (walletType === WALLET_TYPE.BTC && user.diachiviBTC) {
    transactionData.paymentRef = user.diachiviBTC;
  }
  
  await WalletResourceAccess.incrementBalance(wallet.walletId, amount * -1);
  let result = await WithdrawTransactionResource.insert(transactionData);

  if (result) {
    return result;
  } else {
    Logger.error("insert withdraw trx error");
    return undefined;
  }

}
module.exports = {
  acceptWithdrawRequest,
  rejectWithdrawRequest,
  createWithdrawRequest
}