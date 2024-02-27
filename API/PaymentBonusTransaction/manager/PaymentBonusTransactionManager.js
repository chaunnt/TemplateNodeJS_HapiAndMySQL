/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');

const PaymentBonusTransactionResourceAccess = require('../resourceAccess/PaymentBonusTransactionResourceAccess');
const BonusTransactionUserView = require('../resourceAccess/PaymentBonusTransactionUserView');
const PaymentMissionBonusTransactionResourceAccess = require('../resourceAccess/PaymentMissionBonusTransactionResourceAccess');
const WithdrawTransactionResourceAccess = require('../../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
const PaymentMethodResourceAccess = require('../../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const UserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const PaymentBonusFunction = require('../PaymentBonusTransactionFunctions');
const { WALLET_TYPE, WALLET_ERROR } = require('../../Wallet/WalletConstant');
const { UNKNOWN_ERROR, POPULAR_ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { BONUS_TRX_CATEGORY } = require('../PaymentBonusTransactionConstant');
const { exchangeToPointWallet, decreaseBalance, increasePointBalance, increaseBalance } = require('../../WalletRecord/WalletRecordFunction');
const { WALLET_RECORD_TYPE } = require('../../WalletRecord/WalletRecordConstant');
const { createMessageToUser, createMessageToUserById } = require('../../CustomerMessage/CustomerMessageFunctions');
const ERROR = require('../../Common/CommonConstant');
const { ROLE_NAME } = require('../../StaffRole/StaffRoleConstants');
const StaffUserResourceAccess = require('../../StaffUser/resourceAccess/StaffUserResourceAccess');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const { BONUS_TRX_STATUS } = require('../PaymentBonusTransactionConstant');
const { USER_ERROR } = require('../../AppUsers/AppUserConstant');
const WalletResourceAccess = require('../../Wallet/resourceAccess/WalletResourceAccess');
const PaymentBonusTransactionReferUserView = require('../resourceAccess/PaymentBonusTransactionReferUserView');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      if (!appUserId) {
        reject('user is invalid');
        return;
      }

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        reject(ERROR.NO_PERMISSION);
        return;
      }

      let user = await UserResource.find({ appUserId: appUserId });
      if (!user || user.length < 1) {
        reject('can not find user');
        return;
      }
      user = user[0];
      return resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser.staffRoleId === ROLE_NAME.TONG_DAILY) {
        filter.paymentStaffId = req.currentUser.staffId;
      }

      let transactionList = await BonusTransactionUserView.customSearch(filter, skip, limit, searchText, startDate, endDate, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await BonusTransactionUserView.customCount(filter, searchText, startDate, endDate, order);

        //hien thi companyName la ten cua nguoi tham chieu, khong phai ten nguoi nhan
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i].companyName = '';
          let _referUser = await UserResource.findById(transactionList[i].referUserId);
          if (_referUser) {
            transactionList[i].companyName = _referUser.companyName;
            transactionList[i].memberReferIdF1 = _referUser.memberReferIdF1;
            transactionList[i].memberReferIdF2 = _referUser.memberReferIdF2;
            transactionList[i].memberReferIdF3 = _referUser.memberReferIdF3;
          }
        }

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
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function getReferredBonusOfUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order || { key: 'paymentDate', value: 'desc' };
      let startDate = req.payload.startDate ? moment(req.payload.startDate).format('YYYY/MM/DD') : undefined;
      let endDate = req.payload.endDate ? moment(req.payload.endDate).format('YYYY/MM/DD') : undefined;
      let searchText = req.payload.searchText;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser.staffRoleId === ROLE_NAME.TONG_DAILY) {
        filter.staffId = req.currentUser.staffId;
      }

      let _displayField = [
        `appUserId`,
        `firstName`,
        `lastName`,
        `memberReferIdF1`,
        `memberReferIdF2`,
        `memberReferIdF3`,
        `memberReferIdF4`,
        `memberReferIdF5`,
        `memberReferIdF6`,
        `memberReferIdF7`,
        `memberReferIdF8`,
        `memberReferIdF9`,
        `memberReferIdF10`,
        `createdDate`,
      ];

      let transactionList = await PaymentBonusTransactionReferUserView.customSearch(
        filter,
        skip,
        limit,
        searchText,
        startDate,
        endDate,
        order,
        _displayField,
      );

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await PaymentBonusTransactionReferUserView.customCount(filter, searchText, startDate, endDate, order);
        //hien thi companyName la ten cua nguoi tham chieu, khong phai ten nguoi nhan
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i].companyName = '';
          let _referUser = await UserResource.findById(transactionList[i].referUserId);
          if (_referUser) {
            transactionList[i].companyName = _referUser.companyName;
            transactionList[i].username = _referUser.username;
            transactionList[i].firstName = _referUser.firstName;
            transactionList[i].lastName = _referUser.lastName;
            transactionList[i].memberReferIdF1 = _referUser.memberReferIdF1;
            transactionList[i].memberReferIdF2 = _referUser.memberReferIdF2;
            transactionList[i].memberReferIdF3 = _referUser.memberReferIdF3;
            transactionList[i].memberReferIdF4 = _referUser.memberReferIdF4;
            transactionList[i].memberReferIdF5 = _referUser.memberReferIdF5;
            transactionList[i].memberReferIdF6 = _referUser.memberReferIdF6;
          }
        }

        resolve({
          data: transactionList,
          total: transactionCount[0][`count(*)`],
        });
      } else {
        resolve({
          data: [],
          total: 0,
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
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        let _transaction = await PaymentBonusTransactionResourceAccess.findById(req.payload.id);
        if (_transaction) {
          const isAllowed = await verifyStaffUser(_transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            reject(ERROR.NO_PERMISSION);
            return;
          }
        }
      }
      let updateResult = await PaymentBonusTransactionResourceAccess.updateById(req.payload.id, req.payload.data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await BonusTransactionUserView.find({ paymentBonusTransactionId: req.payload.id });
      if (transaction && transaction.length > 0) {
        const isAllowed = await verifyStaffUser(transaction[0].appUserId, req.currentUser);
        if (!isAllowed) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
        resolve(transaction[0]);
      } else {
        resolve({});
      }
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        let transaction = await PaymentBonusTransactionResourceAccess.findById(req.payload.id);
        if (transaction) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            reject(ERROR.NO_PERMISSION);
            return;
          }
        }
      }
      let result = await PaymentBonusTransactionResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetBonusHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser && req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      }

      let transactionList = await BonusTransactionUserView.customSearch(filter, skip, limit, undefined, startDate, endDate, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await BonusTransactionUserView.customCount(filter, undefined, startDate, endDate, order);

        //hien thi companyName la ten cua nguoi tham chieu, khong phai ten nguoi nhan
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i].companyName = '';
          let _referUser = await UserResource.findById(transactionList[i].referUserId);
          if (_referUser) {
            transactionList[i].companyName = _referUser.companyName;
            transactionList[i].memberReferIdF1 = _referUser.memberReferIdF1;
            transactionList[i].memberReferIdF2 = _referUser.memberReferIdF2;
            transactionList[i].memberReferIdF3 = _referUser.memberReferIdF3;
          }
        }
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
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userGetMissionBonusHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser && req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      }

      if (moment().format('H') * 1 >= 0 && moment().format('m') >= 5) {
        await PaymentBonusFunction.createMissionBonusRecordForUser(req.currentUser.appUserId);
      }

      let transactionList = await PaymentMissionBonusTransactionResourceAccess.customSearch(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        undefined,
        order,
      );

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await PaymentMissionBonusTransactionResourceAccess.customCount(filter, startDate, endDate);
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
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userSummaryBonusByStatus(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        reject('failed');
        return;
      }

      let transactionList = await BonusTransactionUserView.sumAmountDistinctByStatus(filter, skip, limit, startDate, endDate, order);

      if (transactionList && transactionList.length > 0) {
        resolve({
          data: transactionList,
          total: transactionList.length,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function denyBonusTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let _transactionId = req.payload.id;
      let _transaction = await PaymentBonusTransactionResourceAccess.findById(_transactionId);
      if (_transaction) {
        const isAllowed = await verifyStaffUser(_transaction.appUserId, req.currentUser);
        if (!isAllowed) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
        let denyResult = await PaymentBonusFunction.denyBonusTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
        if (denyResult) {
          // vì hoàn tiền (số tiền âm trong db) nên phải nhân *-1 để lấy lại giá trị duong
          await increaseBalance(
            _transaction.appUserId,
            WALLET_TYPE.BONUS,
            WALLET_RECORD_TYPE.REFUND,
            _transaction.paymentAmount * -1,
            req.currentUser,
            `REFUND BONUS ${_transactionId}`,
          );
          await createMessageToUserById(
            _transaction.appUserId,
            `Từ chối rút hoa hồng`,
            `Giao dịch rút hoa hồng của bạn đã bị từ chối. Liên hệ CSKH để được hỗ trợ`,
          );
          resolve('success');
        } else {
          Logger.error('deposit transaction was not denied');
          reject('failed');
        }
      } else {
        reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function approveBonusTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let _transactionId = req.payload.id;
      let _transaction = await PaymentBonusTransactionResourceAccess.findById(_transactionId);
      if (_transaction) {
        const isAllowed = await verifyStaffUser(_transaction.appUserId, req.currentUser);
        if (!isAllowed) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
        let approveResult = await PaymentBonusFunction.approveWithdrawBonusTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
        if (approveResult) {
          await createMessageToUserById(_transaction.appUserId, `Rút hoa hồng thành công`, `Giao dịch rút hoa hồng của bạn đã hoàn tất.`);
          resolve(approveResult);
        } else {
          Logger.error('deposit transaction was not approved');
          reject('failed');
        }
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(e);
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
      filter.appUserId = req.currentUser.appUserId;

      let result = await PaymentBonusTransactionResourceAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
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

      let result = await PaymentBonusTransactionResourceAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function exportHistoryOfUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let history = await PaymentBonusTransactionResourceAccess.find({ appUserId: appUserId });
      if (history && history.length > 0) {
        const fileName = 'userRewardHistory' + (new Date() - 1).toString();
        let filePath = await ExcelFunction.renderExcelFile(fileName, history, 'User Reward History');
        let url = `https://${process.env.HOST_NAME}/${filePath}`;
        resolve(url);
      } else {
        resolve('Not have data');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function exportSalesToExcel(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = moment(req.payload.startDate).startOf('month').format('YYYY-MM-DD');
      let endDate = moment(req.payload.endDate).endOf('month').format('YYYY-MM-DD');
      let data = await PaymentBonusTransactionResourceAccess.customSearch(startDate, endDate);
      if (data && data.length > 0) {
        const fileName = 'SalesHistory' + (new Date() - 1).toString();
        let filePath = await ExcelFunction.renderExcelFile(fileName, data, 'Sales History');
        let url = `https://${process.env.HOST_NAME}/${filePath}`;
        resolve(url);
      } else {
        resolve('Not have data');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userRequestWithdraw(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transactionData = req.payload;
      let appUserId = req.currentUser.appUserId;
      let paymentAmount = transactionData.paymentAmount;

      let _existingBonusWallet = await WalletResourceAccess.findWalletByUserId(appUserId, WALLET_TYPE.BONUS);
      if (_existingBonusWallet) {
        _existingBonusWallet = _existingBonusWallet[0];

        if (_existingBonusWallet.balance * 1 >= paymentAmount * 1) {
          const decreaseResult = await decreaseBalance(appUserId, WALLET_TYPE.BONUS, WALLET_RECORD_TYPE.WITHDRAW_BONUSWALLET, paymentAmount);
          if (decreaseResult) {
            await exchangeToPointWallet(appUserId, paymentAmount, WALLET_TYPE.POINT, undefined, `TRX_WITHDRAW_BONUS_${decreaseResult}`);
            await createMessageToUserById(appUserId, `Rút hoa hồng thành công`, `Giao dịch rút hoa hồng về ví chính của bạn đã hoàn tất.`);
            return resolve(decreaseResult);
          }
        } else {
          return reject(WALLET_ERROR.NOT_ENOUGH_BALANCE);
        }
      }
      return reject(POPULAR_ERROR.UPDATE_FAILED);
    } catch (e) {
      Logger.error(e);
      reject(UNKNOWN_ERROR);
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
        paymentStatus: BONUS_TRX_STATUS.NEW,
      };
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        filter.paymentStaffId = req.currentUser.staffId;
      }
      let _transaction = await PaymentBonusTransactionResourceAccess.count(filter);
      if (_transaction && _transaction.length > 0) {
        resolve(_transaction[0].count);
      } else {
        resolve(0);
      }
    } catch (e) {
      Logger.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  getReferredBonusOfUser,
  updateById,
  findById,
  deleteById,
  summaryAll,
  summaryUser,
  userRequestWithdraw,
  denyBonusTransaction,
  approveBonusTransaction,
  exportHistoryOfUser,
  exportSalesToExcel,
  userGetBonusHistory,
  userGetMissionBonusHistory,
  userSummaryBonusByStatus,
  getWaitingApproveCount,
};
