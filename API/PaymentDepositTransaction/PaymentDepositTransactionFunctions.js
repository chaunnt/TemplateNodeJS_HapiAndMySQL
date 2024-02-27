/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const DepositTransactionAccess = require('./resourceAccess/PaymentDepositTransactionResourceAccess');
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const {
  PAYMENT_NOTE,
  DEPOSIT_TRX_TYPE,
  DEPOSIT_TRX_CATEGORY,
  DEPOSIT_TRX_UNIT,
  MINIMUM_DEPOSIT_AMOUNT,
  DEPOSIT_ERROR,
} = require('./PaymentDepositTransactionConstant');
const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const DEPOSIT_TRX_STATUS = require('./PaymentDepositTransactionConstant').DEPOSIT_TRX_STATUS;
const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
const CustomerMessageFunctions = require('../CustomerMessage/CustomerMessageFunctions');
const moment = require('moment');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const utilFunctions = require('../ApiUtils/utilFunctions');
const PaymentMethodResourceAccess = require('../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const AppUserMissionInfoResourceAccess = require('../AppUserMission/resourceAccess/AppUserMissionInfoResourceAccess');
const { DATETIME_DISPLAY_FORMAT, DATETIME_DATA_ISO_FORMAT } = require('../Common/CommonConstant');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const Logger = require('../../utils/logging');
const { ACTION } = require('../AppUserDevices/AppUserDevicesConstants');
const { publishJSONToClient } = require('../../ThirdParty/SocketIO/SocketIOClient');
const { saveUserDevice } = require('../AppUserDevices/AppUserDevicesFunctions');
const { reportToTelegramByConfig } = require('../../ThirdParty/TelegramBot/TelegramBotFunctions');
const ERROR = require('../Common/CommonConstant');
async function createDepositTransaction(
  appUserId,
  amount,
  paymentRef,
  staff,
  paymentSecondaryRef,
  paymentMethodId,
  paymentUnit,
  staffId,
  paymentRefAmount,
  category,
) {
  const filter = {
    appUserId: appUserId,
    walletType: WALLET_TYPE.POINT,
  };

  let wallet = await UserWallet.find(filter);
  if (!wallet || wallet.length < 1) {
    Logger.error(`createDepositTransaction user wallet is invalid ${appUserId}`);
    return undefined;
  }
  wallet = wallet[0];

  let transactionData = {};
  let paymentCategory = DEPOSIT_TRX_CATEGORY.BANK;
  if (paymentMethodId) {
    let paymentMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
    if (!paymentMethod) {
      Logger.error('paymentMethod is invalid');
      return undefined;
    }
    // let paymentCategory = DEPOSIT_TRX_CATEGORY.BANK;
    let paymentNote = `Đến: ${paymentMethod.paymentMethodName}`;
    paymentNote += ` - ${utilFunctions.replaceCharactersToHide(paymentMethod.paymentMethodReceiverName, 1)}`;
    paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(paymentMethod.paymentMethodIdentityNumber, 0, 3)}`;
    if (paymentUnit == DEPOSIT_TRX_UNIT.USDT) {
      paymentCategory = DEPOSIT_TRX_CATEGORY.USDT;
      paymentNote = `Đến: ${paymentMethod.paymentMethodReceiverName} - ${paymentMethod.paymentMethodIdentityNumber}`;
    }
    transactionData = {
      // paymentMethodId: paymentMethodId,
      paymentOwner: paymentMethod.paymentMethodReceiverName,
      paymentOriginSource: paymentMethod.paymentMethodIdentityNumber,
      paymentOriginName: paymentMethod.paymentMethodName,
      paymentNote: paymentNote,
      // paymentCategory: paymentCategory,
    };
  }
  if (category) {
    paymentCategory = category;
  }
  transactionData = {
    ...transactionData,
    appUserId: appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    paymentUnit: paymentUnit,
    paymentStaffId: staffId,
    paymentRefAmount: paymentRefAmount,
    paymentCategory: paymentCategory,
  };

  if (paymentMethodId) {
    transactionData.paymentMethodId = paymentMethodId;
  }

  if (staff) {
    transactionData.paymentType = DEPOSIT_TRX_TYPE.ADMIN_DEPOSIT;
    transactionData.paymentStatus = DEPOSIT_TRX_STATUS.COMPLETED;
    transactionData.paymentPICId = staff.staffId;
  }

  if (paymentRef) {
    transactionData.paymentRef = paymentRef;
    //check existing paymentRef, paymentRef must be unique
    let _existingPaymentRefs = await DepositTransactionAccess.find({
      paymentRef: paymentRef,
    });
    if (_existingPaymentRefs && _existingPaymentRefs.length > 0) {
      for (let i = 0; i < _existingPaymentRefs.length; i++) {
        const _payment = _existingPaymentRefs[i];
        if (_payment.paymentStatus === DEPOSIT_TRX_STATUS.NEW) {
          //khong cho trung transaction Id
          throw 'DUPLICATE_TRANSACTION_ID';
        }
      }
    }
  }

  if (paymentSecondaryRef) {
    transactionData.paymentSecondaryRef = paymentSecondaryRef;
  }

  let result = await DepositTransactionAccess.insert(transactionData);
  if (result) {
    return result;
  } else {
    Logger.error('insert deposit transaction error');
    return undefined;
  }
}

async function approveDepositTransaction(transactionId, staff, paymentNote, paymentMethodId, paymentRef) {
  //get info of transaction
  let transaction = await DepositTransactionAccess.find({
    paymentDepositTransactionId: transactionId,
  });

  if (!transaction || transaction.length < 1) {
    Logger.error('transaction is invalid');
    return undefined;
  }
  transaction = transaction[0];

  // nếu đã COMPLETED hoặc CANCELED thì trả về false
  const isCompletedOrCanceled =
    transaction.paymentStatus === DEPOSIT_TRX_STATUS.COMPLETED || transaction.paymentStatus === DEPOSIT_TRX_STATUS.CANCELED;
  if (isCompletedOrCanceled) {
    Logger.error('deposit transaction was approved or canceled');
    return undefined;
  }

  //get wallet info of user
  let pointWallet = await UserWallet.find({
    appUserId: transaction.appUserId,
    walletType: WALLET_TYPE.POINT,
  });

  if (!pointWallet || pointWallet.length < 1) {
    Logger.error('point wallet is invalid');
    return undefined;
  }
  pointWallet = pointWallet[0];

  //Change payment status and store info of PIC
  transaction.paymentStatus = DEPOSIT_TRX_STATUS.COMPLETED;
  if (staff) {
    transaction.paymentPICId = staff.staffId;
  } else {
    // tien tu hoa hong chuyen vao
    // transaction.paymentCategory = DEPOSIT_TRX_CATEGORY.FROM_BONUS;
    // transaction.paymentType = DEPOSIT_TRX_TYPE.AUTO_DEPOSIT;
  }

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  if (paymentMethodId) {
    transaction.paymentMethodId = paymentMethodId;
  }
  if (paymentRef) {
    transaction.paymentRef = paymentRef;
  }
  transaction.paymentApproveDate = new Date();

  delete transaction.paymentDepositTransactionId;

  //Update payment in DB
  transaction.isUserDeposit = 1; // 0 : no, 1 : yes
  let updateTransactionResult = await DepositTransactionAccess.updateById(transactionId, transaction);
  if (updateTransactionResult) {
    let updateWalletResult = undefined;
    //Update wallet balance and WalletRecord in DB
    updateWalletResult = await WalletRecordFunction.depositPointWalletBalance(transaction.appUserId, transaction.paymentAmount, staff);
    //tăng số lần nạp của user lên
    let _userMission = await AppUserMissionInfoResourceAccess.findById(transaction.appUserId);
    if (_userMission) {
      await AppUserMissionInfoResourceAccess.updateById(transaction.appUserId, {
        depositCount: _userMission.depositCount + 1,
        lastDepositedAt: new Date(),
      });
    } else {
      await AppUserMissionInfoResourceAccess.insert({ appUserId: transaction.appUserId, depositCount: 1, lastDepositedAt: new Date() });
    }
    if (updateWalletResult) {
      const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
      // let _currency = transaction.paymentCategory === DEPOSIT_TRX_CATEGORY.BANK ? 'VNĐ' : 'USDT';
      let _currency = 'VNĐ';
      let notifyTitle = 'Nạp tiền thành công';
      let approveDate = moment(transaction.paymentApproveDate).format(DATETIME_DISPLAY_FORMAT);
      let notifyContent = `Bạn đã nạp ${amount} ${_currency} vào ví chính thành công vào lúc ${approveDate}`;
      let staffId = staff ? staff.staffId : undefined;
      await CustomerMessageFunctions.sendNotificationUser(transaction.appUserId, notifyTitle, notifyContent, staffId);

      return updateWalletResult;
    } else {
      Logger.error(`updateWalletResult error pointWallet.walletId ${pointWallet.walletId} - ${JSON.stringify(transaction)}`);
      return undefined;
    }
  } else {
    Logger.error('approveDepositTransaction error');
    return undefined;
  }
}

async function denyDepositTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await DepositTransactionAccess.find({
    paymentDepositTransactionId: transactionId,
  });

  if (!transaction || transaction.length < 1) {
    Logger.error('transaction is invalid');
    return undefined;
  }
  transaction = transaction[0];

  // nếu đã COMPLETED hoặc CANCELED thì trả về false
  const isCompletedOrCanceled =
    transaction.paymentStatus === DEPOSIT_TRX_STATUS.COMPLETED || transaction.paymentStatus === DEPOSIT_TRX_STATUS.CANCELED;
  if (isCompletedOrCanceled) {
    Logger.error('deposit transaction was approved or canceled');
    return undefined;
  }

  //Change payment status and store info of PIC
  let updatedData = {
    paymentStatus: DEPOSIT_TRX_STATUS.CANCELED,
    paymentApproveDate: new Date(),
  };

  //if transaction was performed by Staff, then store staff Id for later check
  if (staff) {
    updatedData.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    updatedData.paymentNote = paymentNote;
  }

  let updateResult = await DepositTransactionAccess.updateById(transactionId, updatedData);
  if (updateResult) {
    // let _currency = transaction.paymentCategory === DEPOSIT_TRX_CATEGORY.BANK ? 'VNĐ' : 'USDT';
    let _currency = 'VNĐ';
    const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
    let notifyTitle = 'Nạp tiền thất bại';
    let denyDate = moment(updatedData.paymentApproveDate).format(DATETIME_DISPLAY_FORMAT);
    let notifyContent = `Bạn đã bị từ chối nạp ${amount} ${_currency} vào ví chính vào lúc ${denyDate}`;
    let staffId = staff ? staff.staffId : undefined;
    await CustomerMessageFunctions.sendNotificationUser(transaction.appUserId, notifyTitle, notifyContent, staffId);

    return updateResult;
  } else {
    return undefined;
  }
}

async function updateLastDepositForUser(appUserId) {
  let _allTransaction = await DepositTransactionAccess.find({ appUserId: appUserId }, 0, 1, { key: 'paymentDepositTransactionId', value: 'desc' });

  if (_allTransaction && _allTransaction.length > 0) {
    let _updateData = {};
    _updateData.lastDepositAt = _allTransaction[0].createdAt;
    _updateData.lastDepositAtTimestamp = moment(_allTransaction[0].createdAt, DATETIME_DATA_ISO_FORMAT).toDate() * 1;
    _updateData.lastDepositAmount = _allTransaction[0].paymentAmount;

    await AppUsersResourceAccess.updateById(appUserId, _updateData);
  }
}

async function updateFirstDepositForUser(appUserId) {
  let _user = await AppUsersResourceAccess.findById(appUserId);
  if (utilFunctions.isNotEmptyStringValue(_user.firstDepositAt) && utilFunctions.isValidValue(_user.firstDepositAmount)) {
    return;
  }
  let _allTransaction = await DepositTransactionAccess.find({ appUserId: appUserId }, 0, 1, { key: 'paymentDepositTransactionId', value: 'asc' });

  if (_allTransaction && _allTransaction.length > 0) {
    let _updateData = {};
    _updateData.firstDepositAt = _allTransaction[0].createdAt;
    _updateData.firstDepositAtTimestamp = moment(_allTransaction[0].createdAt, DATETIME_DATA_ISO_FORMAT).toDate() * 1;
    _updateData.firstDepositAmount = _allTransaction[0].paymentAmount;

    await AppUsersResourceAccess.updateById(appUserId, _updateData);
  }
}

//Thêm tiền cho user vì 1 số lý do. Ví dụ hoàn tất xác thực thông tin cá nhân
//Nên tạo ra 1 transaction đồng thời lưu lại luôn vào lịch sử để dễ kiểm soát
async function addPointForUser(appUserId, rewardAmount, staff, paymentNote) {
  let rewardWallet = await UserWallet.find({
    appUserId: appUserId,
    walletType: WALLET_TYPE.USDT,
  });

  if (rewardWallet === undefined || rewardWallet.length < 0) {
    Logger.error(`Can not find reward wallet to add point for user id ${appUserId}`);
    return undefined;
  }
  rewardWallet = rewardWallet[0];

  //Tạo 1 transaction mới và tự động complete
  let newRewardTransaction = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
    paymentApproveDate: new Date(),
    appUserId: appUserId,
    walletId: rewardWallet.walletId,
    paymentRewardAmount: rewardAmount,
  };

  //if transaction was performed by Staff, then store staff Id for later check
  if (staff) {
    newRewardTransaction.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    newRewardTransaction.paymentNote = paymentNote;
  }
  let insertResult = await DepositTransactionAccess.insert(newRewardTransaction);

  if (insertResult) {
    // tự động thêm tiền vào ví thưởng của user
    await UserWallet.incrementBalance(rewardWallet.walletId, rewardAmount);
    return insertResult;
  } else {
    Logger.error(`can not create reward point transaction`);
    return undefined;
  }
}

module.exports = {
  createDepositTransaction,
  updateLastDepositForUser,
  updateFirstDepositForUser,
  approveDepositTransaction,
  denyDepositTransaction,
  addPointForUser,
};
