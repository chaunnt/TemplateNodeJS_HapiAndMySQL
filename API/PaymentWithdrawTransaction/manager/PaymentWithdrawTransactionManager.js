/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const UserResouce = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const WithdrawTransactionResourceAccess = require('../resourceAccess/PaymentWithdrawTransactionResourceAccess');
const WithdrawTransactionUserView = require('../resourceAccess/WithdrawTransactionUserView');
const WithdrawTransactionFunction = require('../PaymentWithdrawTransactionFunctions');
const PaymentMethodResourceAccess = require('../../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const AppUserFunctions = require('../../AppUsers/AppUsersFunctions');
const { USER_ERROR, WITHDRAWAL_REQUEST, USER_BLOCK_ACTION } = require('../../AppUsers/AppUserConstant');
const {
  WITHDRAW_TRX_STATUS,
  INVALID,
  WITHDRAW_TRX_QUOTA,
  WITHDRAW_TRX_CATEGORY,
  WITHDRAW_TRX_UNIT,
  WITHDRAW_ERROR,
  MIN_WITHDRAW,
} = require('../PaymentWithdrawTransactionConstant');
const Logger = require('../../../utils/logging');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const ERROR = require('../../Common/CommonConstant');
const moment = require('moment');
const CustomerMessageResourceAccess = require('../../CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
const { MESSAGE_CATEGORY, MESSAGE_TOPIC } = require('../../CustomerMessage/CustomerMessageConstant');

const { ROLE_NAME, PERMISSION_NAME } = require('../../StaffRole/StaffRoleConstants');
const StaffUserResourceAccess = require('../../StaffUser/resourceAccess/StaffUserResourceAccess');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const utilFunctions = require('../../ApiUtils/utilFunctions');
const PaymentDepositTransactionResourceAccess = require('../../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const GamePlayRecordsResourceAccess = require('../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const WalletRecordFunction = require('../../WalletRecord/WalletRecordFunction');
const { PAYMENT_TYPE } = require('../../PaymentMethod/PaymentMethodConstant');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { updateLastDepositForUser } = require('../../PaymentDepositTransaction/PaymentDepositTransactionFunctions');
const { updateTotalWithdrawForUser } = require('../../LeaderBoard/LeaderFunction');
const { reportToTelegram, reportToTelegramByConfig } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const { publishJSONToClient } = require('../../../ThirdParty/SocketIO/SocketIOClient');
const AppUsersSettingResourceAccess = require('../../AppUsers/resourceAccess/AppUsersSettingResourceAccess');
const { checkWithdrawCount } = require('../../AppUsers/AppUserSettingFunction');
const { getUserDeviceFromUserAgent, saveUserDevice } = require('../../AppUserDevices/AppUserDevicesFunctions');
const { ACTION } = require('../../AppUserDevices/AppUserDevicesConstants');
const AppUserDevices = require('../../AppUserDevices/resourceAccess/AppUserDevicesResourceAccess');
const WalletResource = require('../../Wallet/resourceAccess/WalletResourceAccess');
const { createPayoutRequest, getBankCode } = require('../../../ThirdParty/SunpayGateway/SunpayGatewayFunction');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let paymentAmount = req.payload.paymentAmount;
      let paymentOwner = req.payload.paymentOwner;
      let paymentOriginSource = req.payload.paymentOriginSource;
      let paymentOriginName = req.payload.paymentOriginName;
      let walletType = req.payload.walletType;
      let staff = req.currentUser;
      let bankInfomation = {
        paymentOwner: paymentOwner,
        paymentOriginSource: paymentOriginSource,
        paymentOriginName: paymentOriginName,
      };

      let targetUser = await UserResouce.find({ appUserId: appUserId }, 0, 1);
      if (targetUser && targetUser.length > 0) {
        let createResult = await WithdrawTransactionFunction.createWithdrawRequest(
          targetUser[0],
          paymentAmount,
          staff,
          INVALID.INVALID_PAYMENTNOTE,
          walletType,
          INVALID.INVALID_WALLET,
          bankInfomation,
          undefined,
          req.payload.paymentMethodId,
        );

        if (createResult) {
          resolve(createResult);
        } else {
          Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
          reject('can not create withdraw transaction');
        }
      } else {
        Logger.error(`can not WithdrawTransactionFunction.insert invalid user`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction insert `, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter === undefined) {
        filter = {};
      }
      let _permissions = [];
      if (req.currentUser.permissions) {
        _permissions = req.currentUser.permissions.split(',');
      }

      //neu la superadmin thi thay het, nguoc lai cac role khac thi khong, chi thay duoc user cua minh gioi thieu
      if (req.currentUser.staffRoleId !== ROLE_NAME.SUPER_ADMIN) {
        //neu staff co quyen xem tat ca thi tuong tu nhu superadmin
        if (_permissions.length > 0 && !_permissions.includes(PERMISSION_NAME.VIEW_ALL_WITHDRAW)) {
          filter.paymentStaffId = req.currentUser.staffId;
        }
      }

      if (
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_BANK) && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.BANK) ||
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_USDT) && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.USDT)
      ) {
        if (filter.paymentStaffId) {
          delete filter.paymentStaffId;
        }
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      let withdrawAmount = 0;
      if (filter && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.USDT) {
        let _sumWithdrawAmount = await WithdrawTransactionUserView.customSum(
          'paymentRefAmount',
          { ...filter, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED },
          startDate,
          endDate,
          searchText,
        );
        withdrawAmount = _sumWithdrawAmount[0].sumResult;
      }
      if (filter && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.BANK) {
        let _sumWithdrawAmount = await WithdrawTransactionUserView.customSum(
          'paymentAmount',
          { ...filter, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED },
          startDate,
          endDate,
          searchText,
        );
        withdrawAmount = _sumWithdrawAmount[0].sumResult;
      }

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, startDate, endDate, searchText);
        transactionList = await WithdrawTransactionFunction.addStaffNameInTransactionList(transactionList);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
          totalPaymentAmount: withdrawAmount,
        });
      } else {
        resolve({
          data: [],
          total: 0,
          totalPaymentAmount: 0,
        });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newStatus = req.payload.data.status;
      let result = undefined;
      if (newStatus === WITHDRAW_TRX_STATUS.COMPLETED) {
        result = await WithdrawTransactionFunction.acceptWithdrawRequest(req.payload.id);
      } else {
        result = await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id);
      }
      if (result) {
        resolve(result);
      } else {
        Logger.error(`error withdraw transaction updateById with transactionRequestId ${req.payload.id} : update transaction failed`);
        reject('update transaction failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction updateById`, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transactionList = await WithdrawTransactionUserView.find({ paymentWithdrawTransactionId: req.payload.id });
      if (transactionList && transactionList.length > 0) {
        const isAllowed = await verifyStaffUser(transactionList[0].appUserId, req.currentUser);
        //kiem tra yeu cau nap tien co phai cua user minh tao ra hay khong
        if (!isAllowed) {
          //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
          if (
            req.currentUser.permissions &&
            (req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_DEPOSIT) < 0 ||
              req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_WITHDRAW) < 0)
          ) {
            reject(ERROR.NO_PERMISSION);
            return;
          }
        }
        transactionList = await WithdrawTransactionFunction.addStaffNameInTransactionList(transactionList);
        resolve(transactionList[0]);
      } else {
        Logger.error(`WithdrawTransactionUserView can not findById ${req.payload.id}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction findById`, e);
      reject('failed');
    }
  });
}

async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);
      if (transactionList && transactionList.length > 0) {
        for (let i = 0; i < transactionList.length; i++) {
          const result = await WithdrawTransactionResourceAccess.findById(transactionList[i].paymentWithdrawTransactionId);
          const paymentMethod = await PaymentMethodResourceAccess.find({
            paymentMethodId: result.paymentMethodId,
          });
          if (paymentMethod && paymentMethod.length > 0) {
            transactionList[i].paymentMethodType = paymentMethod[0].paymentMethodType;
            transactionList[i].paymentMethodName = paymentMethod[0].paymentMethodName;
          } else {
            transactionList[i].paymentMethodType = null;
            transactionList[i].paymentMethodName = null;
          }
        }
        let transactionCount = await WithdrawTransactionUserView.customCount(filter);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
      resolve('success');
    } catch (e) {
      Logger.error(`error withdraw transaction getList`, e);
      reject('failed');
    }
  });
}

async function withdrawHistoryUSDT(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      filter.walletType = WALLET_TYPE.USDT;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        Logger.error(`error withdraw transaction withdrawHistoryUSDT: user invalid`);
        reject('failed');
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate, undefined, order);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
      resolve('success');
    } catch (e) {
      Logger.error(`error withdraw transaction withdrawHistoryUSDT`, e);
      reject('failed');
    }
  });
}

async function withdrawHistoryPOINT(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      filter.walletType = WALLET_TYPE.POINT;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        Logger.error(`error withdraw transaction withdrawHistoryPOINT: user invalid`);
        reject('failed');
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate, undefined, order);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
      resolve('success');
    } catch (e) {
      Logger.error(`error withdraw transaction withdrawHistoryPOINT`, e);
      reject('failed');
    }
  });
}

async function withdrawHistoryBTC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      filter.walletType = WALLET_TYPE.BTC;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        Logger.error(`error withdraw transaction withdrawHistoryBTC: user invalid`);
        reject('failed');
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate, undefined, order);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
      resolve('success');
    } catch (e) {
      Logger.error(`error withdraw transaction withdrawHistoryBTC`, e);
      reject('failed');
    }
  });
}

async function updateFirstWithdrawForUser(appUserId) {
  let _allTransaction = await WithdrawTransactionResourceAccess.find({ appUserId: appUserId, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED }, 0, 1, {
    key: 'createdAt',
    value: 'asc',
  });

  if (_allTransaction && _allTransaction.length > 0) {
    let _updateData = {};
    _updateData.firstWithdrawAt = _allTransaction[0].createdAt;
    _updateData.firstWithdrawAtTimestamp = moment(_allTransaction[0].createdAt, ERROR.DATETIME_DATA_ISO_FORMAT).toDate() * 1;
    await AppUsersResourceAccess.updateById(appUserId, _updateData);
  }
}
async function approveWithdrawTransaction(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
      let now = moment();
      let timeCreateTransaction = moment(transaction.createdAt);
      let diff = now.diff(timeCreateTransaction, 'seconds');
      if (diff < 5) {
        return reject(WITHDRAW_ERROR.NOT_ENOUGH_TIME);
      }
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        if (transaction) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
            if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.APPROVE_WITHDRAW) < 0) {
              reject(ERROR.NO_PERMISSION);
              return;
            }
          }
        } else {
          Logger.error('error withdraw transaction approveWithdrawTransaction');
          reject('failed');
          return;
        }
      }
      let result = await WithdrawTransactionFunction.acceptWithdrawRequest(req.payload.id, undefined, req.currentUser, req.payload.paymentRef);
      if (result !== undefined) {
        let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
        const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
        let _currency = 'VNĐ';
        await CustomerMessageResourceAccess.insert({
          customerMessageContent: `Bạn đã rút thành công ${amount} ${_currency} vào lúc ${moment().format(ERROR.DATETIME_DISPLAY_FORMAT)}`,
          customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
          customerMessageTopic: MESSAGE_TOPIC.USER,
          customerMessageTitle: `Rút tiền thành công`,
          staffId: req.currentUser.appUserId,
          customerId: transaction.appUserId,
        });
        await WithdrawTransactionFunction.updateLastWithdrawForUser(transaction.appUserId, transaction.paymentAmount);

        //Update leader board
        await updateTotalWithdrawForUser(transaction.appUserId);

        //tao yeu cau rut tien qua cong thanh toan Sunpay
        {
          let _userReceiveMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
          if (_userReceiveMethod) {
            let _sunpayBankCode = getBankCode(_userReceiveMethod.paymentMethodName);
            if (utilFunctions.isNotEmptyStringValue(_sunpayBankCode)) {
              let _payoutResult = await createPayoutRequest(
                `${moment().format('YYYYMMDDHHmmSS')}_${transaction.paymentWithdrawTransactionId}`,
                paymentAmount,
                _sunpayBankCode,
                _userReceiveMethod.paymentMethodIdentityNumber,
                _userReceiveMethod.paymentMethodReceiverName,
              );
              if (_payoutResult && _payoutResult.code === '200') {
                await WithdrawTransactionResourceAccess.updateById(transaction.paymentWithdrawTransactionId, {
                  paymentStatus: WITHDRAW_TRX_STATUS.WAITING,
                });
              }
            } else {
              Logger.error(`requestWithdraw can not getBankCode with name ${_userReceiveMethod.paymentMethodName}`);
            }
          } else {
            Logger.error(`requestWithdraw invalid user paymentMethodId ${paymentMethodId}`);
          }
        }

        resolve(result);
      } else {
        Logger.error(`error withdraw transaction approveWithdrawTransaction with transactionRequestId:${req.payload.id}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction approveWithdrawTransaction`, e);
      reject('failed');
    }
  });
}

async function approveAndPayWithdrawTransaction(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
      let now = moment();
      let timeCreateTransaction = moment(transaction.createdAt);
      let diff = now.diff(timeCreateTransaction, 'seconds');
      if (diff < 5) {
        return reject(WITHDRAW_ERROR.NOT_ENOUGH_TIME);
      }
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        if (transaction) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
            if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.APPROVE_WITHDRAW) < 0) {
              reject(ERROR.NO_PERMISSION);
              return;
            }
          }
        } else {
          Logger.error('error withdraw transaction approveAndPayWithdrawTransaction');
          reject('failed');
          return;
        }
      }

      if (transaction.paymentCategory === WITHDRAW_TRX_CATEGORY.USDT) {
        let result = await WithdrawTransactionFunction.acceptWithdrawRequest(req.payload.id, undefined, req.currentUser, req.payload.paymentRef);
        if (result !== undefined) {
          let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
          const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
          let _currency = 'VNĐ';
          await CustomerMessageResourceAccess.insert({
            customerMessageContent: `Bạn đã rút thành công ${amount} ${_currency} vào lúc ${moment().format(ERROR.DATETIME_DISPLAY_FORMAT)}`,
            customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
            customerMessageTopic: MESSAGE_TOPIC.USER,
            customerMessageTitle: `Rút tiền thành công`,
            staffId: req.currentUser.appUserId,
            customerId: transaction.appUserId,
          });
          await WithdrawTransactionFunction.updateLastWithdrawForUser(transaction.appUserId, transaction.paymentAmount);

          //Update leader board
          await updateTotalWithdrawForUser(transaction.appUserId);

          //tao yeu cau rut tien qua cong thanh toan Sunpay
          // {
          //   let _userReceiveMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
          //   if (_userReceiveMethod) {
          //     let _sunpayBankCode = getBankCode(_userReceiveMethod.paymentMethodName);
          //     if (utilFunctions.isNotEmptyStringValue(_sunpayBankCode)) {
          //       let _payoutResult = await createPayoutRequest(
          //         `${moment().format('YYYYMMDDHHmmSS')}_${transaction.paymentWithdrawTransactionId}`,
          //         paymentAmount,
          //         _sunpayBankCode,
          //         _userReceiveMethod.paymentMethodIdentityNumber,
          //         _userReceiveMethod.paymentMethodReceiverName,
          //       );
          //       if (_payoutResult && _payoutResult.code === '200') {
          //         await WithdrawTransactionResourceAccess.updateById(transaction.paymentWithdrawTransactionId, {
          //           paymentStatus: WITHDRAW_TRX_STATUS.WAITING,
          //         });
          //       }
          //     } else {
          //       Logger.error(`requestWithdraw can not getBankCode with name ${_userReceiveMethod.paymentMethodName}`);
          //     }
          //   } else {
          //     Logger.error(`requestWithdraw invalid user paymentMethodId ${paymentMethodId}`);
          //   }
          // }

          return resolve(result);
        } else {
          Logger.error(`error withdraw transaction approveWithdrawTransaction with transactionRequestId:${req.payload.id}: `);
          return reject('failed');
        }
      } else if (transaction.paymentCategory === WITHDRAW_TRX_CATEGORY.BANK) {
        let result = await WithdrawTransactionFunction.acceptAndWaitWithdrawRequest(
          req.payload.id,
          undefined,
          req.currentUser,
          req.payload.paymentRef,
        );

        if (result !== undefined) {
          let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
          const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
          let _currency = 'VNĐ';
          await CustomerMessageResourceAccess.insert({
            customerMessageContent: `Bạn đã rút thành công ${amount} ${_currency} vào lúc ${moment().format(
              ERROR.DATETIME_DISPLAY_FORMAT,
            )}. Tiền sẽ về tài khoản của bạn trong ít phút nữa`,
            customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
            customerMessageTopic: MESSAGE_TOPIC.USER,
            customerMessageTitle: `Rút tiền thành công`,
            staffId: req.currentUser.appUserId,
            customerId: transaction.appUserId,
          });

          //tao yeu cau rut tien qua cong thanh toan Sunpay
          {
            let paymentMethodId = transaction.paymentMethodId;
            let _userReceiveMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
            if (_userReceiveMethod) {
              let _sunpayBankCode = getBankCode(_userReceiveMethod.paymentMethodName);
              if (utilFunctions.isNotEmptyStringValue(_sunpayBankCode)) {
                let _payoutResult = await createPayoutRequest(
                  `${moment().format('YYYYMMDDHHmmSS')}_${transaction.paymentWithdrawTransactionId}`,
                  transaction.paymentAmount,
                  _sunpayBankCode,
                  _userReceiveMethod.paymentMethodIdentityNumber,
                  _userReceiveMethod.paymentMethodReceiverName,
                );
                if (_payoutResult && _payoutResult.code === '200') {
                  await WithdrawTransactionResourceAccess.updateById(transaction.paymentWithdrawTransactionId, {
                    paymentStatus: WITHDRAW_TRX_STATUS.WAITING,
                  });
                }
              } else {
                let paymentNote = `Đến: ${_userReceiveMethod.paymentMethodName}`;
                paymentNote += ` - ${utilFunctions.replaceCharactersToHide(_userReceiveMethod.paymentMethodReceiverName, 1)}`;
                paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(
                  _userReceiveMethod.paymentMethodIdentityNumber,
                  0,
                  3,
                )} tự động từ chối do ngân hàng nhận không nằm trong danh sách`;

                await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id, req.currentUser, paymentNote);
                Logger.error(`approveAndPayWithdrawTransaction can not getBankCode with name ${_userReceiveMethod.paymentMethodName}`);
              }
            } else {
              let paymentNote = `Đến: ${_userReceiveMethod.paymentMethodName}`;
              paymentNote += ` - ${utilFunctions.replaceCharactersToHide(_userReceiveMethod.paymentMethodReceiverName, 1)}`;
              paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(
                _userReceiveMethod.paymentMethodIdentityNumber,
                0,
                3,
              )} tự động từ chối do ngân hàng nhận không nằm trong danh sách`;

              await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id, req.currentUser, paymentNote);
              Logger.error(`approveAndPayWithdrawTransaction invalid user paymentMethodId ${paymentMethodId}`);
            }
          }

          return resolve(result);
        } else {
          Logger.error(`error withdraw transaction approveAndPayWithdrawTransaction with transactionRequestId:${req.payload.id}: `);
          return reject('failed');
        }
      }
      return reject('failed');
    } catch (e) {
      Logger.error(`error withdraw transaction approveWithdrawTransaction`, e);
      reject('failed');
    }
  });
}

async function denyWithdrawTransaction(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
        if (transaction) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
            if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.APPROVE_WITHDRAW) < 0) {
              reject(ERROR.NO_PERMISSION);
              return;
            }
          }
        } else {
          Logger.error('error withdraw transaction denyWithdrawTransaction');
          reject('failed');
          return;
        }
      }
      let result = await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id, req.currentUser, undefined);
      if (result) {
        let transaction = await WithdrawTransactionResourceAccess.findById(req.payload.id);
        const amount = utilFunctions.formatCurrency(transaction.paymentAmount);
        let _currency = 'VNĐ';
        await CustomerMessageResourceAccess.insert({
          customerMessageContent: `Yêu cầu rút tiền ${amount} ${_currency} của bạn đã bị từ chối vào lúc ${moment().format(
            ERROR.DATETIME_DISPLAY_FORMAT,
          )}`,
          customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
          customerMessageTopic: MESSAGE_TOPIC.USER,
          customerMessageTitle: `Rút tiền thất bại`,
          staffId: req.currentUser.appUserId,
          customerId: transaction.appUserId,
        });
        let userSetting = await AppUsersSettingResourceAccess.findById(transaction.appUserId);
        if (userSetting) {
          let count = userSetting.withdrawCount;
          count -= 1;
          await AppUsersSettingResourceAccess.updateById(transaction.appUserId, { withdrawCount: count });
        }
        resolve(result);
      } else {
        Logger.error(`error withdraw transaction denyWithdrawTransaction with transactionRequestId:${req.payload.id}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction denyWithdrawTransaction`, e);
      reject('failed');
    }
  });
}

async function summaryUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;
      filter.userId = req.currentUser.userId;

      let result = await WithdrawTransactionResourceAccess.customSum('paymentAmount', filter, undefined, undefined, startDate, endDate);
      if (result) {
        resolve(result[0]);
      } else {
        Logger.error(`error withdraw transaction summaryUser with sumField paymentAmount: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction summaryUser`, e);
      reject('failed');
    }
  });
}

async function summaryAll(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;

      let result = await WithdrawTransactionResourceAccess.customSum('paymentAmount', filter, undefined, undefined, startDate, endDate);
      if (result) {
        resolve(result[0]);
      } else {
        Logger.error(`error withdraw transaction summaryAll with sumField paymentAmount: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction summaryAll`, e);
      reject('failed');
    }
  });
}

async function _isAllowedWithdrawNoFee(appUserId) {
  await updateLastDepositForUser(appUserId);

  //check so luot rut trong ngay - 3 lan
  const startDay = moment().startOf('days').format();
  const endDay = moment().endOf('days').format();
  const filter = {
    appUserId: appUserId,
    paymentStatus: [WITHDRAW_TRX_STATUS.NEW, WITHDRAW_TRX_STATUS.COMPLETED],
  };
  const trans = await WithdrawTransactionUserView.customCount(filter, startDay, endDay);

  if (trans && trans.length > 0 && trans[0].count >= WITHDRAW_TRX_QUOTA.DAY) {
    return false;
  }

  //check dieu kien tong choi > 0 (tru 5%)
  const totalPlayAmount = await GamePlayRecordsResourceAccess.customSum('betRecordAmountIn', { appUserId: appUserId });

  if (!totalPlayAmount || totalPlayAmount.length <= 0 || !totalPlayAmount[0].sumResult || totalPlayAmount[0].sumResult <= 0) {
    Logger.info(`check dieu kien tong choi > 0 (tru 5%)`);
    return false;
  }

  const totalDepositAmount = await PaymentDepositTransactionResourceAccess.customSum('paymentAmount', {
    appUserId: appUserId,
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  });

  if (!totalDepositAmount || totalDepositAmount.length <= 0 || !totalDepositAmount[0].sumResult || totalDepositAmount[0].sumResult <= 0) {
    Logger.info(`check dieu kien tong nap bi sai`);
    return false;
  }

  //check dieu kien tong choi < tong nap (tru 5%)
  if (totalDepositAmount[0].sumResult > totalPlayAmount[0].sumResult) {
    Logger.info(`check dieu kien tong choi ${totalPlayAmount[0].sumResult} < tong nap ${totalDepositAmount[0].sumResult} (tru 5%)`);
    return false;
  }

  //tổng chơi vòng cuối phải lớn hơn tiền nạp vòng cuối
  let _existingUser = await AppUsersResourceAccess.findById(appUserId);
  if (_existingUser) {
    let _lastDepositAmount = (_existingUser.lastDepositAmount || 0) * 1;
    let _totalPlayFromLastDeposit = 0;
    let _sumPlayFromLastDeposit = await GamePlayRecordsResourceAccess.customSum(
      'betRecordAmountIn',
      { appUserId: appUserId },
      _existingUser.lastDepositAt,
    );
    if (_sumPlayFromLastDeposit && _sumPlayFromLastDeposit.length > 0) {
      _totalPlayFromLastDeposit = _sumPlayFromLastDeposit[0].sumResult;
    }

    if (_lastDepositAmount > _totalPlayFromLastDeposit) {
      Logger.info(`tổng chơi vòng cuối phải lớn hơn tiền nạp vòng cuối`);
      return false;
    }
  }

  return true;
}
async function requestWithdrawUSDT(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }

      let startDate = moment().startOf('days').format();
      let endDate = moment().endOf('days').format();
      const trans = await WithdrawTransactionUserView.customCount(
        {
          appUserId: req.currentUser.appUserId,
          paymentStatus: [WITHDRAW_TRX_STATUS.NEW, WITHDRAW_TRX_STATUS.COMPLETED, WITHDRAW_TRX_STATUS.PENDING],
        },
        startDate,
        endDate,
      );
      let count = 0;
      count = await checkWithdrawCount(req.currentUser.appUserId, trans, count);
      let paymentAmount = req.payload.paymentAmount;
      let confirmWithdraw = req.payload.confirmWithdraw;
      let paymentMethodId = req.payload.paymentMethodId;
      let secondaryPassword = req.payload.secondaryPassword;
      let appUserId = req.currentUser.appUserId;

      //if system support for secondary password
      if (secondaryPassword || req.currentUser.secondaryPassword != null) {
        //check so lan sai mat khau
        const user = await UserResouce.findById(appUserId);
        if (user && user.blockedWithdrawCrypto + user.blockedWithdrawBank >= USER_BLOCK_ACTION.BLOCK) {
          Logger.error(`RequestWithdrawUSDT_BLOCKED: ${req.currentUser.username} | ${USER_ERROR.USER_BLOCKED_WITHDRAW_CRYPTO}`);
          return reject(USER_ERROR.USER_BLOCKED_WITHDRAW_CRYPTO);
        }
        let verifyResult = await AppUserFunctions.verifyUserSecondaryPassword(req.currentUser.username, req.payload.secondaryPassword);
        if (verifyResult === undefined) {
          //tang so lan sai mat khau
          const currentFail = req.currentUser.blockedWithdrawCrypto + 1;
          const totalFailCount = currentFail + req.currentUser.blockedWithdrawBank;
          await UserResouce.updateById(appUserId, { blockedWithdrawCrypto: currentFail });
          Logger.error(`RequestWithdrawUSDT: ${req.currentUser.username} | ${USER_ERROR.NOT_AUTHORIZED} | ${currentFail}`);
          return reject(`${USER_ERROR.NOT_AUTHORIZED}_${totalFailCount}`);
        }
        await UserResouce.updateById(appUserId, { blockedWithdrawCrypto: USER_BLOCK_ACTION.UNBLOCK });
      }

      if (req.currentUser.isAllowedWithdraw == WITHDRAWAL_REQUEST.NOT_ALLOWED) {
        reject(USER_ERROR.BLOCKED_WITHDRAW);
        return;
      }

      //check dieu kien tong choi < tong nap (tru 5%)
      let hasFee = false;
      if ((await _isAllowedWithdrawNoFee(req.currentUser.appUserId)) === false) {
        hasFee = true;
      }

      if (confirmWithdraw === 0 && hasFee) {
        reject(USER_ERROR.WITHDRAW_AND_FEE);
        return;
      }

      //tru phi neu co
      let fee = 0;
      let paymentFeeAmount = 0;
      let paymentRefAmount = paymentAmount;

      if (hasFee) {
        fee = hasFee ? parseInt(paymentAmount * 0.05) : 0;
        paymentFeeAmount += fee;
        paymentAmount = paymentAmount - fee;
        let feePaymentReft = paymentRefAmount * 0.05;
        paymentRefAmount = paymentRefAmount - feePaymentReft;
      }

      //chuyen doi USDT qua VND
      const SystemConfigurationsResourceAccess = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
      let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
      if (config && config.length > 0) {
        paymentAmount = Math.round(paymentAmount * config[0].exchangeVNDPrice);
      }
      let userWallet = await WalletResource.find({ appUserId: appUserId, walletType: WALLET_TYPE.POINT });
      if (userWallet) {
        userWallet = userWallet[0];
        if (paymentAmount > userWallet.balance || paymentAmount * 1 < MIN_WITHDRAW.POINT_USDT) {
          reject(WITHDRAW_ERROR.LIMIT_MIN_OR_MAX_WITHDRAW);
        }
      }

      let createResult = await WithdrawTransactionFunction.createWithdrawRequest(
        appUserId,
        req.currentUser.referUserId,
        paymentAmount,
        undefined,
        paymentFeeAmount,
        paymentMethodId,
        req.currentUser.staffId,
        paymentRefAmount,
      );
      if (createResult) {
        let transaction = await WithdrawTransactionResourceAccess.findById(createResult[0]);
        if (hasFee) {
          //tru phi trong vi luon
          let updateWalletResult = await WalletRecordFunction.deduceWithdrawFee(appUserId, -fee, WALLET_TYPE.POINT, undefined, createResult[0]);
        }
        publishJSONToClient('USER_WITHDRAW', transaction);
        count += 1;
        await AppUsersSettingResourceAccess.updateById(req.currentUser.appUserId, { withdrawCount: count });
        let user = await AppUsersResourceAccess.findById(appUserId);
        const userAgent = req.headers['user-agent'];
        await saveUserDevice(appUserId, userAgent, ACTION.WITHDRAW);
        reportToTelegramByConfig(
          `Có yêu cầu rút tiền số USDT từ Tài khoản: ${user.username}, Số tiền: ${paymentAmount}`,
          process.env.TELEGRAM_BOT_DEPOSIT_TOKEN || '6010252793:AAFB8g3Vmc8lW-XiD5OEwY9pI6E1lbgq-7k',
          process.env.TELEGRAM_CHAT_ID_DEPOSIT_NOTIFICATION || '@okeda_naptienbot',
        );
        resolve(createResult);
      } else {
        Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
        reject('can not create withdraw transaction');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction requestWithdrawUSDT`);
      Logger.error(__filename, e);
      if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}

async function requestWithdraw(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }
      // đếm số lượt rút trong ngày
      let startDate = moment().startOf('days').format();
      let endDate = moment().endOf('days').format();
      const trans = await WithdrawTransactionUserView.customCount(
        {
          appUserId: req.currentUser.appUserId,
          paymentStatus: [WITHDRAW_TRX_STATUS.NEW, WITHDRAW_TRX_STATUS.COMPLETED, WITHDRAW_TRX_STATUS.PENDING],
        },
        startDate,
        endDate,
      );
      let count = 0;
      count = await checkWithdrawCount(req.currentUser.appUserId, trans, count);

      let confirmWithdraw = req.payload.confirmWithdraw;
      let paymentAmount = req.payload.paymentAmount;
      let paymentMethodId = req.payload.paymentMethodId;
      let secondaryPassword = req.payload.secondaryPassword;
      let appUserId = req.currentUser.appUserId;
      let userWallet = await WalletResource.find({ appUserId: appUserId, walletType: 'PointWallet' });
      if (userWallet) {
        userWallet = userWallet[0];
        if (paymentAmount > userWallet.balance || paymentAmount * 1 < MIN_WITHDRAW.POINT_VND) {
          reject(WITHDRAW_ERROR.LIMIT_MIN_OR_MAX_WITHDRAW);
        }
      }
      let paymentFeeAmount = req.payload.paymentFeeAmount || req.payload.paymentFeeAmount > 0 ? req.payload.paymentFeeAmount : 0;
      //if system support for secondary password
      if (secondaryPassword || secondaryPassword != null || secondaryPassword != undefined) {
        //check so lan sai mat khau
        const user = await UserResouce.findById(appUserId);
        if (user && user.blockedWithdrawBank + user.blockedWithdrawCrypto >= USER_BLOCK_ACTION.BLOCK) {
          Logger.error(`RequestWithdrawBank_Blocked: ${req.currentUser.username} | ${USER_ERROR.USER_BLOCKED_WITHDRAW_BANK}`);
          return reject(USER_ERROR.USER_BLOCKED_WITHDRAW_BANK);
        }
        let verifyResult = await AppUserFunctions.verifyUserSecondaryPassword(req.currentUser.username, secondaryPassword);
        if (verifyResult === undefined) {
          //tang so lan sai mat khau
          const currentFail = req.currentUser.blockedWithdrawBank + 1;
          const totalFailCount = currentFail + req.currentUser.blockedWithdrawCrypto;
          await UserResouce.updateById(appUserId, { blockedWithdrawBank: currentFail });
          Logger.error(`RequestWithdrawBank: ${req.currentUser.username} | ${USER_ERROR.NOT_AUTHORIZED} | ${currentFail}`);
          return reject(`${USER_ERROR.NOT_AUTHORIZED}_${totalFailCount}`);
        }
        await UserResouce.updateById(appUserId, { blockedWithdrawBank: USER_BLOCK_ACTION.UNBLOCK });
      }

      if (req.currentUser.isAllowedWithdraw == WITHDRAWAL_REQUEST.NOT_ALLOWED) {
        reject(USER_ERROR.BLOCKED_WITHDRAW);
        return;
      }

      let hasFee = false;
      if ((await _isAllowedWithdrawNoFee(req.currentUser.appUserId)) === false) {
        hasFee = true;
      }

      if (confirmWithdraw === 0 && hasFee) {
        reject(USER_ERROR.WITHDRAW_AND_FEE);
        return;
      }

      //tru phi neu co
      let fee = 0;
      if (hasFee) {
        fee = hasFee ? parseInt(paymentAmount * 0.05) : 0;
        paymentFeeAmount += fee;
        paymentAmount = paymentAmount - fee;
      }

      let createResult = await WithdrawTransactionFunction.createWithdrawRequest(
        appUserId,
        req.currentUser.referUserId,
        paymentAmount,
        undefined,
        paymentFeeAmount,
        paymentMethodId,
        req.currentUser.staffId,
        paymentAmount,
      );
      if (createResult) {
        let transaction = await WithdrawTransactionResourceAccess.findById(createResult[0]);
        if (hasFee) {
          //tru phi trong vi luon
          let updateWalletResult = await WalletRecordFunction.deduceWithdrawFee(appUserId, -fee, WALLET_TYPE.POINT, undefined, createResult[0]);
        }
        publishJSONToClient('USER_WITHDRAW', transaction);
        let user = await AppUsersResourceAccess.findById(appUserId);
        const userAgent = req.headers['user-agent'];
        await saveUserDevice(appUserId, userAgent, ACTION.WITHDRAW);
        reportToTelegramByConfig(
          `Có yêu cầu rút tiền qua ngân hàng từ Tài khoản: ${user.username}, Số tiền: ${paymentAmount}`,
          process.env.TELEGRAM_BOT_DEPOSIT_TOKEN || '6010252793:AAFB8g3Vmc8lW-XiD5OEwY9pI6E1lbgq-7k',
          process.env.TELEGRAM_CHAT_ID_DEPOSIT_NOTIFICATION || '@okeda_naptienbot',
        );
        count += 1;
        await AppUsersSettingResourceAccess.updateById(req.currentUser.appUserId, { withdrawCount: count });

        // //tao yeu cau rut tien qua cong thanh toan Sunpay
        // {
        //   let _userReceiveMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
        //   if (_userReceiveMethod) {
        //     let _sunpayBankCode = getBankCode(_userReceiveMethod.paymentMethodName);
        //     if (utilFunctions.isNotEmptyStringValue(_sunpayBankCode)) {
        //       let _payoutResult = await createPayoutRequest(
        //         `${moment().format('YYYYMMDDHHmmSS')}_${transaction.paymentWithdrawTransactionId}`,
        //         paymentAmount,
        //         _sunpayBankCode,
        //         _userReceiveMethod.paymentMethodIdentityNumber,
        //         _userReceiveMethod.paymentMethodReceiverName,
        //       );
        //       if (_payoutResult && _payoutResult.code === "200") {
        //         await WithdrawTransactionResourceAccess.updateById(transaction.paymentWithdrawTransactionId, {
        //           paymentStatus: WITHDRAW_TRX_STATUS.WAITING,
        //         })
        //       }
        //     } else {
        //       Logger.error(`requestWithdraw can not getBankCode with name ${_userReceiveMethod.paymentMethodName}`);
        //     }
        //   } else {
        //     Logger.error(`requestWithdraw invalid user paymentMethodId ${paymentMethodId}`);
        //   }
        // }

        resolve(createResult);
      } else {
        Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
        reject('can not create withdraw transaction');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction requestWithdraw`, e);
      Logger.error(__filename, e);
      if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}

async function requestWithdrawBTC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }

      let paymentAmount = req.payload.paymentAmount;
      let walletType = WALLET_TYPE.BTC;

      //check so luot rut trong ngay - 3 lan
      const startDay = moment().startOf('days').format();
      const endDay = moment().endOf('days').format();
      const trans = await WithdrawTransactionUserView.customCount({ appUserId: req.currentUser.appUserId, walletType: walletType }, startDay, endDay);
      if (trans && trans.length > 0 && trans[0].count >= WITHDRAW_TRX_QUOTA.DAY) {
        reject(USER_ERROR.NOT_ALLOWED_WITHDRAW);
        return;
      }

      //if system support for secondary password
      if (req.payload.secondaryPassword) {
        let verifyResult = await AppUserFunctions.verifyUserSecondaryPassword(req.currentUser.username, req.payload.secondaryPassword);
        if (verifyResult === undefined) {
          Logger.error(`${USER_ERROR.NOT_AUTHORIZED} requestWithdraw`);
          reject(USER_ERROR.NOT_AUTHORIZED);
          return;
        }
      }

      let createResult = await WithdrawTransactionFunction.createWithdrawRequest(
        req.currentUser,
        paymentAmount,
        undefined,
        undefined,
        walletType,
        undefined,
        undefined,
        undefined,
        req.payload.paymentMethodId,
      );
      if (createResult) {
        resolve(createResult);
      } else {
        Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
        reject('can not create withdraw transaction');
      }
    } catch (e) {
      Logger.error(`error withdraw transaction requestWithdrawBTC`, e);
      reject('failed');
    }
  });
}

async function getWaitingApproveCount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      let filter = {
        paymentStatus: WITHDRAW_TRX_STATUS.NEW,
        paymentCategory: req.payload.paymentCategory,
      };
      let _permissions = [];
      if (req.currentUser.permissions) {
        _permissions = req.currentUser.permissions.split(',');
      }

      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        //neu staff co quyen xem tat ca thi tuong tu nhu superadmin
        if (_permissions.length > 0 && !_permissions.includes(PERMISSION_NAME.VIEW_ALL_WITHDRAW)) {
          filter.paymentStaffId = req.currentUser.staffId;
        }
      }

      if (
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_BANK) && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.BANK) ||
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_USDT) && filter.paymentCategory == WITHDRAW_TRX_CATEGORY.USDT)
      ) {
        if (filter.paymentStaffId) {
          delete filter.paymentStaffId;
        }
      }

      let _transaction = await WithdrawTransactionResourceAccess.count(filter);
      if (_transaction && _transaction.length > 0) {
        resolve(_transaction[0].count);
      } else {
        resolve(0);
      }
    } catch (e) {
      Logger.error(e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  updateFirstWithdrawForUser,
  requestWithdrawUSDT,
  getList,
  denyWithdrawTransaction,
  approveWithdrawTransaction,
  approveAndPayWithdrawTransaction,
  summaryAll,
  summaryUser,
  withdrawHistoryUSDT,
  requestWithdrawBTC,
  withdrawHistoryBTC,
  requestWithdraw,
  withdrawHistoryPOINT,
  getWaitingApproveCount,
};
