/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const PaymentWithdrawTransactionResourceAccess = require('./resourceAccess/PaymentWithdrawTransactionResourceAccess');
const WalletResourceAccess = require('../Wallet/resourceAccess/WalletResourceAccess');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const { PAYMENT_TYPE } = require('../PaymentMethod/PaymentMethodConstant');
const { WITHDRAW_TRX_STATUS, WITHDRAW_TRX_TYPE, WITHDRAW_TRX_CATEGORY } = require('./PaymentWithdrawTransactionConstant');
const Logger = require('../../utils/logging');
const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
const utilFunctions = require('../ApiUtils/utilFunctions');
const PaymentMethodResourceAccess = require('../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const { USER_ERROR } = require('../AppUsers/AppUserConstant');
const { POPULAR_ERROR, DATETIME_DATA_ISO_FORMAT } = require('../Common/CommonConstant');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserMissionInfoResourceAccess = require('../AppUserMission/resourceAccess/AppUserMissionInfoResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const moment = require('moment');
async function acceptWithdrawRequest(transactionRequestId, paymentNote, staff, paymentRef) {
  let transaction = await PaymentWithdrawTransactionResourceAccess.find({ paymentWithdrawTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not acceptWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];
  if (
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.COMPLETED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.CANCELED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.DELETED
  ) {
    Logger.error(`already acceptWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  //update transaction paymentStatus
  transaction.paymentStatus = WITHDRAW_TRX_STATUS.COMPLETED;
  if (staff) {
    transaction.paymentPICId = staff.staffId;
  }
  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  if (paymentRef) {
    transaction.paymentRef = paymentRef;
  }

  let updateResult = await PaymentWithdrawTransactionResourceAccess.updateById(transactionRequestId, transaction);
  if (updateResult) {
    //tăng số lần rút tiền của user lên
    let _userMission = await AppUserMissionInfoResourceAccess.findById(transaction.appUserId);
    if (_userMission) {
      await AppUserMissionInfoResourceAccess.updateById(transaction.appUserId, {
        withdrawCount: _userMission.withdrawCount + 1,
        lastWithdrawdAt: new Date(),
      });
    } else {
      await AppUserMissionInfoResourceAccess.insert({ appUserId: transaction.appUserId, withdrawCount: 1, lastWithdrawdAt: new Date() });
    }

    return updateResult;
  } else {
    return undefined;
  }
}
async function acceptAndWaitWithdrawRequest(transactionRequestId, paymentNote, staff, paymentRef) {
  let transaction = await PaymentWithdrawTransactionResourceAccess.find({ paymentWithdrawTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not acceptAndWaitWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];
  if (
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.COMPLETED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.CANCELED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.DELETED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.WAITING //trang thai cho cong thanh toan xu ly
  ) {
    Logger.error(`already acceptAndWaitWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  //update transaction paymentStatus
  transaction.paymentStatus = WITHDRAW_TRX_STATUS.WAITING;

  if (staff) {
    transaction.paymentPICId = staff.staffId;
  }
  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  if (paymentRef) {
    transaction.paymentRef = paymentRef;
  }

  let updateResult = await PaymentWithdrawTransactionResourceAccess.updateById(transactionRequestId, transaction);
  if (updateResult) {
    //tăng số lần rút tiền của user lên
    let _userMission = await AppUserMissionInfoResourceAccess.findById(transaction.appUserId);
    if (_userMission) {
      await AppUserMissionInfoResourceAccess.updateById(transaction.appUserId, {
        withdrawCount: _userMission.withdrawCount + 1,
        lastWithdrawdAt: new Date(),
      });
    } else {
      await AppUserMissionInfoResourceAccess.insert({ appUserId: transaction.appUserId, withdrawCount: 1, lastWithdrawdAt: new Date() });
    }

    return updateResult;
  } else {
    return undefined;
  }
}
async function rejectWithdrawRequest(transactionRequestId, staff, paymentNote) {
  let transaction = await PaymentWithdrawTransactionResourceAccess.find({ paymentWithdrawTransactionId: transactionRequestId });
  if (transaction === undefined || transaction.length < 1) {
    Logger.error(`Can not rejectWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  transaction = transaction[0];

  if (
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.COMPLETED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.CANCELED ||
    transaction.paymentStatus === WITHDRAW_TRX_STATUS.DELETED
  ) {
    Logger.error(`already rejectWithdrawRequest ${transactionRequestId}`);
    return undefined;
  }
  let wallet = await WalletResourceAccess.find({ walletId: transaction.walletId });
  if (wallet === undefined || wallet.length < 1) {
    Logger.error(`Can not find wallet ${transaction.walletId} for transaction ${transactionRequestId}`);
    return undefined;
  }
  wallet = wallet[0];

  let amount = transaction.paymentAmount + transaction.paymentFeeAmount;
  //tao giao dich cong tien vao vi
  let updateWalletResult = await WalletRecordFunction.withdrawWalletBalance(
    transaction.appUserId,
    amount,
    WALLET_TYPE.POINT,
    staff,
    transactionRequestId,
  );

  //update transaction paymentStatus
  transaction.paymentStatus = WITHDRAW_TRX_STATUS.CANCELED;

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }
  let updateResult = await PaymentWithdrawTransactionResourceAccess.updateById(transactionRequestId, transaction);
  if (updateResult) {
    return updateResult;
  } else {
    return undefined;
  }
}

async function createWithdrawRequest(appUserId, referUserId, amount, staff, paymentFeeAmount, paymentMethodId, staffId, paymentRefAmount) {
  return new Promise(async (resolve, reject) => {
    const MIN_PERSIST_AMOUNT = process.env.MIN_PERSIST_AMOUNT || 0;
    const paymentMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
    if (!paymentMethod) {
      Logger.error(`user: ${appUserId} payment method not found: ${paymentMethodId}`);
      return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
    }
    //kiem tra so du
    let wallet = await WalletResourceAccess.find({
      appUserId: appUserId,
      walletType: WALLET_TYPE.POINT,
    });
    if (!wallet || wallet.length < 1) {
      Logger.error('user wallet is invalid');
      return reject(USER_ERROR.WALLET_NOT_FOUND);
    }
    wallet = wallet[0];
    if (wallet.balance < 0 || wallet.balance - amount - MIN_PERSIST_AMOUNT < 0) {
      Logger.error('wallet do not have enough amount');
      return reject(USER_ERROR.BALANCE_NOT_ENOUGH);
    }

    let paymentCategory = WITHDRAW_TRX_CATEGORY.BANK;
    let paymentNote = `Đến: ${paymentMethod.paymentMethodName}`;
    paymentNote += ` - ${utilFunctions.replaceCharactersToHide(paymentMethod.paymentMethodReceiverName, 1)}`;
    paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(paymentMethod.paymentMethodIdentityNumber, 0, 3)}`;
    if (paymentMethod.paymentMethodType == PAYMENT_TYPE.CRYPTO) {
      paymentCategory = WITHDRAW_TRX_CATEGORY.USDT;
      paymentNote = `Đến: ${paymentMethod.paymentMethodReceiverName} - ${paymentMethod.paymentMethodIdentityNumber}`;
    }

    let transactionData = {
      appUserId: appUserId,
      walletId: wallet.walletId,
      paymentAmount: amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount,
      paymentRefAmount: paymentRefAmount,
      paymentMethodId: paymentMethodId,
      paymentCategory: paymentCategory,
      paymentNote: paymentNote,
      paymentOwner: paymentMethod.paymentMethodReceiverName,
      paymentOriginSource: paymentMethod.paymentMethodIdentityNumber,
      paymentOriginName: paymentMethod.paymentMethodName,
      paymentStaffId: staffId,
    };

    if (paymentFeeAmount) {
      transactionData.paymentFeeAmount = paymentFeeAmount;
      amount = amount + paymentFeeAmount;
      transactionData.balanceAfter = wallet.balance - amount;
    }

    if (staff) {
      transactionData.paymentApproveDate = new Date();
      transactionData.paymentPICId = staff.staffId;
      transactionData.paymentStatus = WITHDRAW_TRX_STATUS.COMPLETED;
      transactionData.paymentType = WITHDRAW_TRX_TYPE.ADMIN_WITHDRAW;
    }

    if (referUserId) {
      transactionData.referId = referUserId;
    }

    let result = await PaymentWithdrawTransactionResourceAccess.insert(transactionData);

    if (result) {
      //luu tru lai lich su bien dong so du cua Vi
      let paymentAmount = amount * -1 + paymentFeeAmount;
      let updateWalletResult = await WalletRecordFunction.withdrawWalletBalance(appUserId, paymentAmount, WALLET_TYPE.POINT, undefined, result[0]);

      if (!updateWalletResult) {
        Logger.error('Save wallet record  error');
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
      return resolve(result);
    } else {
      Logger.error('insert withdraw trx error');
      return reject(POPULAR_ERROR.INSERT_FAILED);
    }
  });
}

async function addStaffNameInTransactionList(transactionList, storeStaffName = {}) {
  for (let transaction of transactionList) {
    if (transaction.paymentPICId) {
      let staffId = transaction.paymentPICId;
      let staffName = '';
      if (storeStaffName && storeStaffName.hasOwnProperty(staffId)) {
        staffName = storeStaffName[staffId]; // get staffName
        transaction.staffName = staffName;
      } else {
        let staff = await StaffResourceAccess.findById(staffId);
        staffName = `${staff.lastName} ${staff.firstName}`;
        storeStaffName[staffId] = staffName; // set stationName với key là stationId
        transaction.staffName = staffName;
      }
    }
  }
  return transactionList;
}

async function updateLastWithdrawForUser(appUserId, depositAmount) {
  let _allTransaction = await PaymentWithdrawTransactionResourceAccess.find(
    { appUserId: appUserId, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED },
    0,
    1,
    {
      key: 'createdAt',
      value: 'asc',
    },
  );
  let _updateData = {
    lastWithdrawAt: new Date(),
    lastWithdrawAmount: depositAmount,
  };
  if (_allTransaction && _allTransaction.length > 0) {
    _updateData.firstWithdrawAt = _allTransaction[0].createdAt;
    _updateData.firstWithdrawAtTimestamp = moment(_allTransaction[0].createdAt, DATETIME_DATA_ISO_FORMAT).toDate() * 1;
  } else {
    _updateData.firstWithdrawAt = new Date();
    _updateData.firstWithdrawAtTimestamp = new Date() * 1;
  }
  await AppUsersResourceAccess.updateById(appUserId, _updateData);
}

module.exports = {
  acceptWithdrawRequest,
  updateLastWithdrawForUser,
  acceptAndWaitWithdrawRequest,
  rejectWithdrawRequest,
  createWithdrawRequest,
  addStaffNameInTransactionList,
};
