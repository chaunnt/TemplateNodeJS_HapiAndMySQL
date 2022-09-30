/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const ExchangeTransactionResource = require('./resourceAccess/PaymentExchangeTransactionResourceAccess');
const WalletResourceAccess = require('../Wallet/resourceAccess/WalletResourceAccess');
const WalletBalanceUnitView = require('../Wallet/resourceAccess/WalletBalanceUnitView');
const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
const WithdrawTransactionResource = require('../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
const CustomerMessageFunctions = require('../CustomerMessage/CustomerMessageFunctions');
const moment = require('moment');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const PaymentDepositTransactionFunctions = require('../PaymentDepositTransaction/PaymentDepositTransactionFunctions');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const { EXCHANGE_ERROR, EXCHANGE_TRX_STATUS } = require('./PaymentExchangeTransactionConstant');
const {
  WITHDRAW_TRX_CATEGORY,
  WITHDRAW_TRX_STATUS,
} = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const { USER_MEMBER_LEVEL } = require('../AppUsers/AppUserConstant');
const Logger = require('../../utils/logging');
const AppUserFunctions = require('../AppUsers/AppUsersFunctions');
const { USER_ERROR } = require('../AppUsers/AppUserConstant');
async function _acceptExchangeRequest(transaction, staff, receiveWallet) {
  let updatedTransactionData = {
    paymentStatus: EXCHANGE_TRX_STATUS.COMPLETED,
  };

  //update transaction paymentStatus
  if (staff) {
    updatedTransactionData.paymentApproveDate = new Date();
    updatedTransactionData.paymentPICId = staff.staffId;
  }

  //if there is receiving user (wallet), then store their balance
  if (receiveWallet) {
    updatedTransactionData.receiveWalletBalanceBefore = receiveWallet.balance;
    updatedTransactionData.receiveWalletBalanceAfter = receiveWallet.balance * 1 - transaction.receiveAmount * 1;
  }

  let updateResult = await ExchangeTransactionResource.updateById(
    transaction.paymentExchangeTransactionId,
    updatedTransactionData,
  );

  if (updateResult) {
    //find wallet of sender
    let senderWallet = await WalletBalanceUnitView.find({
      appUserId: transaction.appUserId,
      walletType: WALLET_TYPE.USDT,
    });
    if (senderWallet && senderWallet.length > 0) {
      senderWallet = senderWallet[0];
      //add balance to wallet of sender
      let increaseBalanceResult = await WalletResourceAccess.incrementBalance(
        senderWallet.walletId,
        transaction.receiveAmount,
      );
      if (increaseBalanceResult === undefined) {
        Logger.error(
          `staffAcceptExchangeRequest but can not incrementBalance wallet ${senderWallet.walletId} amount ${transaction.receiveAmount}`,
        );
        return undefined;
      }
    }
    return updateResult;
  } else {
    return undefined;
  }
}

async function _denyExchangeRequest(transaction, staff) {
  let transactionRequestId = transaction.paymentExchangeTransactionId;
  if (transaction === undefined) {
    Logger.error(`Can not _denyExchangeRequest ${transactionRequestId}`);
    return undefined;
  }

  if (
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.COMPLETED ||
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.CANCELED ||
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.DELETED
  ) {
    Logger.error(`already _denyExchangeRequest ${transactionRequestId}`);
    return undefined;
  }

  //find sender wallet to rollback balance
  let wallet = await WalletResourceAccess.find({
    walletId: transaction.sendWalletId,
  });

  if (wallet === undefined || wallet.length < 1) {
    Logger.error(`Can not find wallet ${transaction.sendWalletId} for transaction ${transactionRequestId}`);
    return undefined;
  }
  wallet = wallet[0];

  //rollback balance for wallet
  await WalletResourceAccess.incrementBalance(wallet.walletId, transaction.paymentAmount);

  //update transaction paymentStatus
  let updatedTransactionData = {
    paymentStatus: EXCHANGE_TRX_STATUS.CANCELED,
  };
  //update transaction paymentStatus
  if (staff) {
    updatedTransactionData.paymentApproveDate = new Date();
    updatedTransactionData.paymentPICId = staff.staffId;
  }
  let updateResult = await ExchangeTransactionResource.updateById(transactionRequestId, updatedTransactionData);
  if (updateResult) {
    return updateResult;
  } else {
    return undefined;
  }
}

async function _cancelExchangeRequest(transaction, staff) {
  let transactionRequestId = transaction.paymentExchangeTransactionId;
  if (transaction === undefined) {
    Logger.error(`Can not _cancelExchangeRequest ${transactionRequestId}`);
    return undefined;
  }

  if (
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.COMPLETED ||
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.CANCELED ||
    transaction.paymentStatus === EXCHANGE_TRX_STATUS.DELETED
  ) {
    Logger.error(`already _cancelExchangeRequest ${transactionRequestId}`);
    return undefined;
  }

  //find sender wallet to rollback balance
  let wallet = await WalletResourceAccess.find({
    walletId: transaction.sendWalletId,
  });

  if (wallet === undefined || wallet.length < 1) {
    Logger.error(`Can not find wallet ${transaction.sendWalletId} for transaction ${transactionRequestId}`);
    return undefined;
  }
  wallet = wallet[0];

  //rollback balance for wallet
  await WalletResourceAccess.incrementBalance(wallet.walletId, transaction.paymentAmount);

  //update transaction paymentStatus
  let updatedTransactionData = {
    paymentStatus: EXCHANGE_TRX_STATUS.CANCELED,
  };
  //update transaction paymentStatus
  if (staff) {
    updatedTransactionData.paymentApproveDate = new Date();
    updatedTransactionData.paymentPICId = staff.staffId;
  }
  let updateResult = await ExchangeTransactionResource.updateById(transactionRequestId, updatedTransactionData);
  if (updateResult) {
    return updateResult;
  } else {
    return undefined;
  }
}

async function staffAcceptExchangeRequest(transactionRequestId, staff) {
  let transaction = await ExchangeTransactionResource.find({ paymentExchangeTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not staffAcceptExchangeRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];
  // //do not allow staff accept user exchange request to another user
  // if (staff && transaction.receiveWalletId) {
  //   Logger.error(`staffAcceptExchangeRequest do not allow ${transactionRequestId} - transaction.receiveWalletId ${transaction.receiveWalletId}`);
  //   return undefined;
  // }

  if (transaction.paymentStatus !== EXCHANGE_TRX_STATUS.NEW) {
    Logger.error(`staffAcceptExchangeRequest ${transactionRequestId} already processed`);
    return undefined;
  }

  return await _acceptExchangeRequest(transaction, staff);
}

async function userAcceptExchangeRequest(transactionRequestId, user) {
  return new Promise(async (resolve, reject) => {
    let transaction = await ExchangeTransactionResource.find({ paymentExchangeTransactionId: transactionRequestId });
    if (transaction === undefined || transaction.length < 1) {
      Logger.error(`Can not userAcceptExchangeRequest ${transactionRequestId}`);
      resolve(undefined);
      return;
    }
    transaction = transaction[0];

    if (transaction.paymentStatus !== EXCHANGE_TRX_STATUS.NEW) {
      Logger.error(`userAcceptExchangeRequest ${transactionRequestId} already processed`);
      resolve(undefined);
    }

    if (transaction.receiveWalletId && transaction.receiveWalletId !== '' && transaction.receiveWalletId !== null) {
      //find wallet of receiver, to make sure they have enough money to pay for exchanging amount
      let receiverWallet = await WalletBalanceUnitView.find({
        walletId: transaction.receiveWalletId,
        walletType: WALLET_TYPE.USDT,
      });
      if (receiverWallet && receiverWallet.length > 0) {
        receiverWallet = receiverWallet[0];

        //do not allow other user to accept transaction from another user (even staff can not do this)
        //only receiver can accept their transaction
        if (user.appUserId === undefined || user.appUserId !== receiverWallet.appUserId) {
          Logger.error(`receiverWallet ${receiverWallet.walletId} do not have authorized`);
          resolve(undefined);
          return;
        }

        if (receiverWallet.balance < transaction.receiveAmount) {
          Logger.error(`receiverWallet ${receiverWallet.walletId} do not have enough balance`);
          reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
          return;
        }

        //update balance of receiver
        let updateResult = await WalletResourceAccess.decrementBalance(
          receiverWallet.walletId,
          transaction.receiveAmount,
        );
        if (updateResult) {
          let acceptResult = await _acceptExchangeRequest(transaction, undefined, receiverWallet);
          resolve(acceptResult);
          return;
        } else {
          Logger.error(
            `transaction.transactionRequestId ${transactionRequestId} can not decrease balance wallet ${receiverWallet.walletId}`,
          );
          resolve(undefined);
          return;
        }
      } else {
        Logger.error(`transaction.transactionRequestId ${transactionRequestId} do not have receiver`);
        resolve(undefined);
        return;
      }
    } else {
      Logger.error(`transaction.receiveWalletId ${transaction.receiveWalletId} is invalid`);
      resolve(undefined);
      return;
    }
  });
}

async function staffRejectExchangeRequest(transactionRequestId, staff) {
  let transaction = await ExchangeTransactionResource.find({ paymentExchangeTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not staffRejectExchangeRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];
  //do not allow staff accept user exchange request to another user
  if (staff && transaction.receiveWalletId) {
    Logger.error(
      `staffRejectExchangeRequest do not allow ${transactionRequestId} - transaction.receiveWalletId ${transaction.receiveWalletId}`,
    );
    return undefined;
  }

  if (transaction.paymentStatus !== EXCHANGE_TRX_STATUS.NEW) {
    Logger.error(`staffAcceptExchangeRequest ${transactionRequestId} already processed`);
    return undefined;
  }

  return await _denyExchangeRequest(transaction, staff);
}

async function userRejectExchangeRequest(transactionRequestId) {
  return new Promise(async (resolve, reject) => {
    let transaction = await ExchangeTransactionResource.find({ paymentExchangeTransactionId: transactionRequestId });
    if (transaction === undefined || transaction.length < 1) {
      Logger.error(`Can not userRejectExchangeRequest ${transactionRequestId}`);
      resolve(undefined);
      return;
    }
    transaction = transaction[0];

    if (transaction.paymentStatus !== EXCHANGE_TRX_STATUS.NEW) {
      Logger.error(`userRejectExchangeRequest ${transactionRequestId} already processed`);
      resolve(undefined);
    }

    let denyResult = await _denyExchangeRequest(transaction);
    resolve(denyResult);
    return;
  });
}

async function createExchangeRequest(user, exchangeAmount, balanceUnitId) {
  return new Promise(async (resolve, reject) => {
    const MIN_PERSIST_AMOUNT = process.env.MIN_PERSIST_AMOUNT | 0;

    if (user.appUserId === undefined) {
      Logger.error(`createExchangeRequest invalid user`);
      resolve(undefined);
      return;
    }

    //validate if wallet have enough balance
    let originWallet = await WalletBalanceUnitView.find({
      appUserId: user.appUserId,
      walletType: WALLET_TYPE.CRYPTO,
      walletBalanceUnitId: balanceUnitId,
    });

    if (!originWallet || originWallet.length < 1) {
      Logger.error(`user ${user.appUserId} crypto (originWallet) do not have balance for unitId ${balanceUnitId}`);
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    originWallet = originWallet[0];
    if (originWallet.balance < 0 || originWallet.balance - exchangeAmount - MIN_PERSIST_AMOUNT < 0) {
      Logger.error('wallet do not have enough amount');
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }

    let receiveAmount = exchangeAmount * originWallet.userSellPrice;
    if (user.memberLevelName === USER_MEMBER_LEVEL.LV0) {
      //neu day la user agent (dai ly) thi lay theo gia dai ly
      receiveAmount = exchangeAmount * originWallet.agencySellPrice;
    } else {
      //neu day la user binh thuong thi lay theo gia user
      receiveAmount = exchangeAmount * originWallet.userSellPrice;
    }

    let transactionData = {
      appUserId: user.appUserId,
      sendWalletId: originWallet.walletId,
      sendWalletBalanceBefore: originWallet.balance,
      sendWalletBalanceAfter: originWallet.balance - exchangeAmount,
      receiveAmount: receiveAmount,
      paymentAmount: exchangeAmount,
      paymentRewardAmount: 0,
      paymentUnit: `${originWallet.walletBalanceUnitCode}-USD`,
      sendPaymentUnitId: originWallet.walletBalanceUnitId,
      receivePaymentUnitId: 1, // hien tai dang mac dinh luon luon la 1 - don vi la USD
    };

    if (user.referUserId) {
      //store receiver id
      transactionData.referId = user.referUserId;

      //find receiver wallet id
      let receiverWallet = await WalletBalanceUnitView.find({
        appUserId: user.referUserId,
        walletType: WALLET_TYPE.USDT,
      });
      if (!receiverWallet || receiverWallet.length < 1) {
        Logger.error(`user crypto ${user.referUserId} receiverWallet is invalid`);
        resolve(undefined);
        return;
      }
      receiverWallet = receiverWallet[0];

      //store receiver wallet id into transaction
      transactionData.receiveWalletId = receiverWallet.walletId;
    }

    await WalletResourceAccess.decrementBalance(originWallet.walletId, exchangeAmount);

    let result = await ExchangeTransactionResource.insert(transactionData);

    if (result) {
      resolve(result);
      return;
    } else {
      Logger.error('insert exchange trx error');
      resolve(undefined);
      return;
    }
  });
}

async function userCancelExchangeRequest(transactionRequestId) {
  return new Promise(async (resolve, reject) => {
    let transaction = await ExchangeTransactionResource.find({ paymentExchangeTransactionId: transactionRequestId });
    if (transaction === undefined || transaction.length < 1) {
      Logger.error(`Can not userRejectExchangeRequest ${transactionRequestId}`);
      resolve(undefined);
      return;
    }
    transaction = transaction[0];

    if (transaction.paymentStatus !== EXCHANGE_TRX_STATUS.NEW) {
      Logger.error(`userRejectExchangeRequest ${transactionRequestId} already processed`);
      resolve(undefined);
    }

    let cancelResult = await _cancelExchangeRequest(transaction);
    resolve(cancelResult);
    return;
  });
}

async function requestExchangeFACtoUSDT(user, paymentAmount, walletType) {
  return new Promise(async (resolve, reject) => {
    if (user.appUserId === undefined) {
      Logger.error(`createExchangeRequest invalid user`);
      resolve(undefined);
      return;
    }
    //validate if wallet have enough balance
    let originWallet = await WalletBalanceUnitView.find({
      appUserId: user.appUserId,
      walletType: walletType,
    });

    if (!originWallet || originWallet.length < 1) {
      Logger.error(`user ${user.appUserId} crypto (originWallet) do not have balance for unitId ${balanceUnitId}`);
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    originWallet = originWallet[0];
    if (originWallet.balance < 0 || originWallet.balance - paymentAmount < 0) {
      Logger.error('wallet do not have enough amount');
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    //find receiver wallet id
    let receiverWallet = await WalletBalanceUnitView.find({
      appUserId: user.appUserId,
      walletType: WALLET_TYPE.USDT,
    });
    if (!receiverWallet || receiverWallet.length < 1) {
      Logger.error(`user crypto ${user.referUserId} receiverWallet is invalid`);
      resolve(undefined);
      return;
    }
    receiverWallet = receiverWallet[0];
    let transactionData = {
      appUserId: user.appUserId,
      sendWalletId: originWallet.walletId,
      sendWalletBalanceBefore: originWallet.balance,
      sendWalletBalanceAfter: originWallet.balance - paymentAmount,
      paymentAmount: paymentAmount,
      receiveWalletId: receiverWallet.walletId,
    };
    let result = await ExchangeTransactionResource.insert(transactionData);

    if (result) {
      const SystemConfigurationsFunction = require('../SystemConfigurations/SystemConfigurationsFunction');
      let exchangeRate = await SystemConfigurationsFunction.getExchangeRate();
      let receiveAmount = paymentAmount * exchangeRate;
      let updatedTransactionData = {};
      updatedTransactionData.receiveAmount = receiveAmount;
      updatedTransactionData.exchangeRate = exchangeRate;
      updatedTransactionData.receiveWalletBalanceBefore = receiverWallet.balance;
      updatedTransactionData.receiveWalletBalanceAfter = receiverWallet.balance + receiveAmount;

      let updateResult = await ExchangeTransactionResource.updateById(result[0], updatedTransactionData);
      if (updateResult) {
        let resultDecrement = await WalletResourceAccess.decrementBalance(originWallet.walletId, paymentAmount);
        if (!resultDecrement) {
          Logger.error(`failse to decrement`);
          resolve(undefined);
          return;
        }
        let resultIncre = await WalletResourceAccess.incrementBalance(receiverWallet.walletId, receiveAmount);
        if (!resultIncre) {
          Logger.error(`failse to increment`);
          resolve(undefined);
          return;
        }
        resolve(result);
      }
      return;
    } else {
      Logger.error('insert exchange trx error');
      resolve(undefined);
      return;
    }
  });
}

async function requestExchangeBonusToPOINT(user, paymentAmount, walletId) {
  return new Promise(async (resolve, reject) => {
    if (user.appUserId === undefined) {
      Logger.error(`createExchangeRequest invalid user`);
      resolve(undefined);
      return;
    }
    //validate if wallet have enough balance
    let originWallet = await WalletResourceAccess.find({
      appUserId: user.appUserId,
      walletId: walletId,
    });

    if (!originWallet || originWallet.length < 1) {
      Logger.error(`user ${user.appUserId} crypto (originWallet) do not have balance for unitId ${balanceUnitId}`);
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    originWallet = originWallet[0];
    if (originWallet.balance < 0 || originWallet.balance - paymentAmount < 0) {
      Logger.error('wallet do not have enough amount');
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    //find receiver wallet id
    let receiverWallet = await WalletResourceAccess.find({
      appUserId: user.appUserId,
      walletType: WALLET_TYPE.POINT,
    });

    if (!receiverWallet || receiverWallet.length < 1) {
      Logger.error(`user crypto ${user.referUserId} receiverWallet is invalid`);
      resolve(undefined);
      return;
    }
    receiverWallet = receiverWallet[0];
    let receiveWalletBalanceAfter = receiverWallet.balance + paymentAmount;
    let transactionData = {
      appUserId: user.appUserId,
      sendWalletId: originWallet.walletId,
      sendWalletBalanceBefore: originWallet.balance,
      sendWalletBalanceAfter: originWallet.balance - paymentAmount,
      paymentAmount: paymentAmount,
      receiveWalletId: receiverWallet.walletId,
      paymentStatus: EXCHANGE_TRX_STATUS.COMPLETED,
      paymentApproveDate: new Date(),
      receiveWalletBalanceAfter: receiveWalletBalanceAfter,
      receiveWalletBalanceBefore: receiverWallet.balance,
      receiveAmount: paymentAmount,
    };
    let transactionDataWithdraw = {
      appUserId: user.appUserId,
      walletId: originWallet.walletId,
      paymentAmount: paymentAmount,
      balanceBefore: originWallet.balance,
      balanceAfter: originWallet.balance - paymentAmount,
      paymentCategory: WITHDRAW_TRX_CATEGORY.DIRECT_REWARD,
      paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
    };
    // luu lich su chuyen tien
    let result = await ExchangeTransactionResource.insert(transactionData);
    // luu lich su rut tien
    let resultWithdraw = await WithdrawTransactionResource.insert(transactionDataWithdraw);

    if (result && resultWithdraw) {
      let resultDecrement = await WalletResourceAccess.decrementBalance(originWallet.walletId, paymentAmount);
      if (!resultDecrement) {
        Logger.error(`failse to decrement`);
        resolve(undefined);
        return;
      }
      let paymentNote = 'user deposit bonusWallet to pointWallet';
      let createDeposit = await PaymentDepositTransactionFunctions.createDepositTransaction(
        user,
        paymentAmount,
        undefined,
        receiverWallet.walletId,
      );
      if (!createDeposit) {
        Logger.error(`failse to createDeposit`);
        resolve(undefined);
        return;
      }
      let approveDeposit = await PaymentDepositTransactionFunctions.approveDepositTransaction(
        createDeposit[0],
        undefined,
        paymentNote,
      );
      if (!approveDeposit) {
        Logger.error(`failse to approveDeposit`);
        resolve(undefined);
        return;
      }
      paymentAmount = paymentAmount * -1;
      let idTransactionWithdraw = resultWithdraw[0];
      let resultWalletRecord = await WalletRecordFunction.exchangeBonusToPointWalletBalance(
        user.appUserId,
        paymentAmount,
        WALLET_TYPE.BONUS,
        undefined,
        idTransactionWithdraw,
      );
      if (resultWalletRecord) {
        let notifyTitle = 'Rút tiền hoa hồng vào ví chính';
        let approveDate = moment(transactionData.paymentApproveDate).format('YYYY-MM-DD HH:mm:ss');
        let notifyContent = `Bạn đã rút ${
          paymentAmount * -1
        } đồng từ ví hoa hồng sang ví chính thành công vào lúc ${approveDate}`;
        await CustomerMessageFunctions.sendNotificationUser(user.appUserId, notifyTitle, notifyContent);
        resolve(resultWalletRecord);
        return;
      }
    } else {
      Logger.error('insert exchange trx error');
      resolve(undefined);
      return;
    }
  });
}

async function requestExchangeBonusToFAC(user, paymentAmount, walletType) {
  return new Promise(async (resolve, reject) => {
    if (user.appUserId === undefined) {
      Logger.error(`createExchangeRequest invalid user`);
      resolve(undefined);
      return;
    }
    //validate if wallet have enough balance
    let originWallet = await WalletBalanceUnitView.find({
      appUserId: user.appUserId,
      walletType: walletType,
    });

    if (!originWallet || originWallet.length < 1) {
      Logger.error(`user ${user.appUserId} crypto (originWallet) do not have balance for unitId ${balanceUnitId}`);
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    originWallet = originWallet[0];
    if (originWallet.balance < 0 || originWallet.balance - paymentAmount < 0) {
      Logger.error('wallet do not have enough amount');
      //notify to front-end this error
      reject(EXCHANGE_ERROR.NOT_ENOUGH_BALANCE);
      return;
    }
    //find receiver wallet id
    let receiverWallet = await WalletBalanceUnitView.find({
      appUserId: user.appUserId,
      walletType: WALLET_TYPE.FAC,
    });
    if (!receiverWallet || receiverWallet.length < 1) {
      Logger.error(`user crypto ${user.referUserId} receiverWallet is invalid`);
      resolve(undefined);
      return;
    }
    receiverWallet = receiverWallet[0];
    let transactionData = {
      appUserId: user.appUserId,
      sendWalletId: originWallet.walletId,
      sendWalletBalanceBefore: originWallet.balance,
      sendWalletBalanceAfter: originWallet.balance - paymentAmount,
      paymentAmount: paymentAmount,
      receiveWalletId: receiverWallet.walletId,
    };
    let result = await ExchangeTransactionResource.insert(transactionData);

    if (result) {
      let updatedTransactionData = {};
      updatedTransactionData.receiveWalletBalanceBefore = receiverWallet.balance;
      updatedTransactionData.receiveWalletBalanceAfter = receiverWallet.balance + paymentAmount;
      let updateResult = await ExchangeTransactionResource.updateById(result[0], updatedTransactionData);
      if (updateResult) {
        let resultDecrement = await WalletResourceAccess.decrementBalance(originWallet.walletId, paymentAmount);
        if (!resultDecrement) {
          Logger.error(`failse to decrement`);
          resolve(undefined);
          return;
        }
        let resultIncre = await WalletResourceAccess.incrementBalance(receiverWallet.walletId, paymentAmount);
        if (!resultIncre) {
          Logger.error(`failse to increment`);
          resolve(undefined);
          return;
        }
        resolve(result);
      }
      return;
    } else {
      Logger.error('insert exchange trx error');
      resolve(undefined);
      return;
    }
  });
}

module.exports = {
  staffAcceptExchangeRequest,
  userAcceptExchangeRequest,
  staffRejectExchangeRequest,
  userRejectExchangeRequest,
  userCancelExchangeRequest,
  createExchangeRequest,
  requestExchangeFACtoUSDT,
  requestExchangeBonusToFAC,
  requestExchangeBonusToPOINT,
};
