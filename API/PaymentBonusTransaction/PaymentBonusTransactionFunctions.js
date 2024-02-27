/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const PaymentBonusTransactionResourceAccess = require('./resourceAccess/PaymentBonusTransactionResourceAccess');
const PaymentMissionBonusTransactionResourceAccess = require('./resourceAccess/PaymentMissionBonusTransactionResourceAccess');
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const { BONUS_TRX_ERROR, BONUS_PAYMENT_DATE_DISPLAY_FORMAT, BONUS_PAYMENT_DATE_DB_FORMAT } = require('./PaymentBonusTransactionConstant');
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const { isNotValidValue, padLeadingZeros } = require('../ApiUtils/utilFunctions');
const moment = require('moment');
const {
  collectTotalSystemUserPlayMission,
  collectTotalSystemUserMissionInfo,
  getUserMissionInfo,
  countCompletedMissionByUser,
  collectTotalMissionBonusAmount,
  collectTotalSystemMissionBonusAmount,
} = require('../AppUserMission/AppUserMissionFunction');
const BONUS_TRX_STATUS = require('./PaymentBonusTransactionConstant').BONUS_TRX_STATUS;
const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
const Logger = require('../../utils/logging');
async function increaseBonusForUser(appUserId, amount, totalReferAmount, otherData) {
  if (amount > 0 && totalReferAmount > 0) {
    let bonusTransaction = await createBonusTransactionByUserId(appUserId, amount);
    if (bonusTransaction) {
      if (totalReferAmount) {
        await PaymentBonusTransactionResourceAccess.updateById(bonusTransaction, {
          totalReferAmount: totalReferAmount,
          paymentStatus: BONUS_TRX_STATUS.COMPLETED,
          paymentApproveDate: new Date(),
          paymentDate: moment().format('YYYY/MM/DD'),
          ...otherData,
        });
      }
      return bonusTransaction;
    }
    return undefined;
  }
}

//appUserId: id cua user duoc nhan hoa hong
//referUserId: id cua user duoc tham chieu de tinh hoa hong
async function createBonusTransactionByUserId(appUserId, paymentAmount, paymentCategory, paymentMethodId, supervisorId) {
  if (!appUserId || appUserId === null || appUserId === '' || appUserId === 0) {
    Logger.error(`cancel createBonusTransactionByUserId invalid appUserId ${appUserId}`);
    return;
  }

  let transactionData = {
    appUserId: appUserId,
    paymentAmount: paymentAmount,
    paymentCategory: paymentCategory,
    paymentStaffId: supervisorId,
    paymentDate: moment().format('YYYY/MM/DD'),
  };

  if (paymentMethodId) {
    transactionData.paymentMethodId = paymentMethodId;
  }

  const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
  let withdrawResult = await WalletRecordFunction.increaseBalance(appUserId, WALLET_TYPE.BONUS, WALLET_RECORD_TYPE.REFER_BONUS, paymentAmount);
  if (!withdrawResult) {
    return undefined;
  }

  let result = await PaymentBonusTransactionResourceAccess.insert(transactionData);
  if (result) {
    return result[0];
  } else {
    Logger.error('insert bonus transaction error');
    return undefined;
  }
}

//appUserId: id cua user duoc nhan hoa hong
//referUserId: id cua user duoc tham chieu de tinh hoa hong
async function _createMissionBonusTransactionByUserId(appUserId, paymentDate = moment().format(BONUS_PAYMENT_DATE_DB_FORMAT)) {
  if (isNotValidValue(appUserId)) {
    Logger.error(`cancel _createMissionBonusTransactionByUserId invalid appUserId ${appUserId}`);
    return;
  }

  //chống cho việc insert 2 dòng vào DB
  let _paymentIdentifier = paymentDate + '' + padLeadingZeros(appUserId, 20);

  let transactionData = {
    appUserId: appUserId,
    paymentDate: moment(paymentDate, BONUS_PAYMENT_DATE_DB_FORMAT).format(BONUS_PAYMENT_DATE_DB_FORMAT) * 1,
    paymentIdentifier: _paymentIdentifier,
  };

  let _existingTransaction = await PaymentMissionBonusTransactionResourceAccess.find(transactionData);

  if (_existingTransaction && _existingTransaction.length > 0) {
    return _existingTransaction[0];
  }

  let result = await PaymentMissionBonusTransactionResourceAccess.insert(transactionData);
  if (result) {
    let _newTransaction = await PaymentMissionBonusTransactionResourceAccess.findById(result[0]);
    return _newTransaction;
  } else {
    Logger.error('insert bonus transaction error');
    return undefined;
  }
}

async function approveBonusTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await PaymentBonusTransactionResourceAccess.find({
    paymentBonusTransactionId: transactionId,
  });

  if (!transaction || transaction.length < 1) {
    Logger.error('transaction is invalid');
    return undefined;
  }
  transaction = transaction[0];

  if (
    !(
      transaction.paymentStatus === BONUS_TRX_STATUS.NEW ||
      transaction.paymentStatus === BONUS_TRX_STATUS.WAITING ||
      transaction.paymentStatus === BONUS_TRX_STATUS.PENDING
    )
  ) {
    Logger.error('bonus transaction was approved or canceled');
    return undefined;
  }

  //Change payment status and store info of PIC
  transaction.paymentStatus = BONUS_TRX_STATUS.COMPLETED;
  if (staff) {
    transaction.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  transaction.paymentApproveDate = new Date();

  delete transaction.paymentBonusTransactionId;

  //Update payment in DB
  let updateTransactionResult = await PaymentBonusTransactionResourceAccess.updateById(transactionId, transaction);
  if (updateTransactionResult) {
    //tra tien thuong vao vi hoa hong cho user
    const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
    let addBonusResult = await WalletRecordFunction.addReferralBonus(transaction.appUserId, transaction.paymentAmount);

    if (!addBonusResult) {
      // //send message
      // const template = Handlebars.compile(JSON.stringify(APPROVED_PAYMENT));
      // const data = {
      //   "paymentId": transactionId,
      //   "promotionMoney": transaction.paymentRewardAmount,
      //   "totalMoney": parseFloat(pointWallet.balance) + parseFloat(transaction.paymentRewardAmount)
      // };
      // const message = JSON.parse(template(data));
      // await handleSendMessage(transaction.appUserId, message, {
      //   paymentBonusTransactionId: transactionId
      // }, MESSAGE_TYPE.USER);

      Logger.error(`approveBonusTransaction > addReferralBonus failed for transactionId ${transactionId}`);
      return undefined;
    }
    return addBonusResult;
  } else {
    Logger.error('approveBonusTransaction error');
    return undefined;
  }
}

async function denyBonusTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await PaymentBonusTransactionResourceAccess.find({
    paymentBonusTransactionId: transactionId,
  });

  if (!transaction || transaction.length < 1) {
    Logger.error('transaction is invalid');
    return undefined;
  }
  transaction = transaction[0];

  //Nếu không phải giao dịch "ĐANG CHỜ" (PENDING / WAITING) hoặc "MỚI TẠO" (NEW) thì không xử lý
  if (
    !(
      transaction.paymentStatus === BONUS_TRX_STATUS.NEW ||
      transaction.paymentStatus === BONUS_TRX_STATUS.WAITING ||
      transaction.paymentStatus !== BONUS_TRX_STATUS.PENDING
    )
  ) {
    Logger.error('bonus transaction was approved or canceled');
    return undefined;
  }

  //Change payment status and store info of PIC
  let updatedData = {
    paymentStatus: BONUS_TRX_STATUS.CANCELED,
    paymentApproveDate: new Date(),
  };

  //if transaction was performed by Staff, then store staff Id for later check
  if (staff) {
    updatedData.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    updatedData.paymentNote = paymentNote;
  }

  let updateResult = await PaymentBonusTransactionResourceAccess.updateById(transactionId, updatedData);
  return updateResult;
}

async function approveWithdrawBonusTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await PaymentBonusTransactionResourceAccess.findById(transactionId);

  if (!transaction) {
    throw BONUS_TRX_ERROR.INVALID_TRANSACTION;
  }

  if (
    !(
      transaction.paymentStatus === BONUS_TRX_STATUS.NEW ||
      transaction.paymentStatus === BONUS_TRX_STATUS.WAITING ||
      transaction.paymentStatus === BONUS_TRX_STATUS.PENDING
    )
  ) {
    throw BONUS_TRX_ERROR.TRANSACTION_ALREADY_PROCESSED;
  }

  let _updatePaymentData = {
    //Change payment status and store info of PIC
    paymentStatus: BONUS_TRX_STATUS.COMPLETED,
  };

  if (staff) {
    _updatePaymentData.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    _updatePaymentData.paymentNote = paymentNote;
  }

  _updatePaymentData.paymentApproveDate = new Date();

  delete transaction.paymentBonusTransactionId;

  //Update payment in DB
  let updateTransactionResult = await PaymentBonusTransactionResourceAccess.updateById(transactionId, _updatePaymentData);
  if (updateTransactionResult) {
    return updateTransactionResult;
  } else {
    Logger.error('approveWithdrawBonusTransaction error');
    throw BONUS_TRX_ERROR.TRANSACTION_FAILED;
  }
}

async function _summaryMissionForUser(appUserId, paymentDate = moment().format(BONUS_PAYMENT_DATE_DB_FORMAT)) {
  let startDate = moment(paymentDate, BONUS_PAYMENT_DATE_DB_FORMAT).startOf('day').format();
  let endDate = moment(paymentDate, BONUS_PAYMENT_DATE_DB_FORMAT).endOf('day').format();
  let { totalSystemUserCount, totalSystemUserCompletedMission } = await collectTotalSystemUserPlayMission(appUserId, startDate, endDate);
  let totalSystemUserMissionCount = await collectTotalSystemUserMissionInfo(appUserId);
  let totalUserMissionCount = await getUserMissionInfo(appUserId);
  let { totalUserCompletedMission } = await countCompletedMissionByUser(appUserId, startDate, endDate);
  if (totalUserMissionCount) {
    totalUserMissionCount = totalUserMissionCount.maxMissionCount;
  } else {
    totalUserMissionCount = 0;
  }

  let _totalReferAmount = 0;
  _totalReferAmount += await collectTotalMissionBonusAmount(appUserId, startDate, endDate);
  _totalReferAmount += await collectTotalSystemMissionBonusAmount(appUserId, startDate, endDate);

  return {
    totalSystemUserCount: totalSystemUserCount,
    totalSystemUserCompletedMission: totalSystemUserCompletedMission,
    totalSystemUserMissionCount: totalSystemUserMissionCount,
    totalUserMissionCount: totalUserMissionCount,
    totalUserCompletedMission: totalUserCompletedMission,
    totalReferAmount: _totalReferAmount,
  };
}

async function createMissionBonusRecordForUser(appUserId, paymentDate = moment().format(BONUS_PAYMENT_DATE_DB_FORMAT)) {
  if (!paymentDate) {
    paymentDate = moment().format(BONUS_PAYMENT_DATE_DB_FORMAT);
  }
  let _userBonusTransaction = await _createMissionBonusTransactionByUserId(appUserId, paymentDate);

  if (_userBonusTransaction) {
    let _summaryResult = await _summaryMissionForUser(appUserId, paymentDate);

    if (paymentDate === moment().format(BONUS_PAYMENT_DATE_DB_FORMAT)) {
      let updateData = {};

      if (_userBonusTransaction.totalJoinedF1 < _summaryResult.totalSystemUserCount) {
        updateData.totalJoinedF1 = _summaryResult.totalSystemUserCount;
      }
      if (_userBonusTransaction.totalMissionF1 < _summaryResult.totalSystemUserMissionCount) {
        updateData.totalMissionF1 = _summaryResult.totalSystemUserMissionCount;
      }
      if (_userBonusTransaction.totalCompletedMissionF1 < _summaryResult.totalSystemUserCompletedMission) {
        updateData.totalCompletedMissionF1 = _summaryResult.totalSystemUserCompletedMission;
      }
      // if (_userBonusTransaction.totalMission < _summaryResult.totalUserMissionCount) {
      updateData.totalMission = _summaryResult.totalUserMissionCount;
      // }
      if (_userBonusTransaction.totalCompletedMission < _summaryResult.totalUserCompletedMission) {
        updateData.totalCompletedMission = _summaryResult.totalUserCompletedMission;
      }
      if (_userBonusTransaction.totalReferAmount < _summaryResult.totalReferAmount) {
        updateData.totalReferAmount = _summaryResult.totalReferAmount;
      }
      if (_userBonusTransaction.paymentAmount < _summaryResult.totalReferAmount) {
        updateData.paymentAmount = _summaryResult.totalReferAmount;
      }

      if (Object.values(updateData).length > 0) {
        await PaymentMissionBonusTransactionResourceAccess.updateById(_userBonusTransaction.paymentMissionBonusTransactionId, updateData);
      }
    }
  }
}

module.exports = {
  createBonusTransactionByUserId,
  createMissionBonusRecordForUser,
  approveBonusTransaction,
  approveWithdrawBonusTransaction,
  denyBonusTransaction,
  increaseBonusForUser,
};
