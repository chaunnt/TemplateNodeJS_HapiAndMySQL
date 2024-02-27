/* Copyright (c) 2022-2024 Reminano */

'use strict';
const UserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const ReceiveFunction = require('../WalletRecordFunction');
const WalletRecordView = require('../resourceAccess/WalletRecordView');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const { WALLET_RECORD_TYPE } = require('../WalletRecordConstant');
const { ROLE_NAME } = require('../../StaffRole/StaffRoleConstants');
const moment = require('moment');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const Logger = require('../../../utils/logging');
async function rewardForUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      if (!appUserId) {
        reject('user is invalid');
        return;
      }
      let user = await UserResource.find({ appUserId: appUserId });
      if (!user || user.length < 1) {
        reject('can not find user');
        return;
      }
      user = user[0];

      let result = await ReceiveFunction.rewardForUser(user, paymentAmount, WALLET_TYPE.BTC, req.currentUser);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
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
      if (!filter.WalletRecordType) {
        let _walletRecordType = [];
        let _excludeRecordType = [
          WALLET_RECORD_TYPE.MISSON_COMPLETED,
          WALLET_RECORD_TYPE.MISSON_REFERRAL_COMPLETED,
          WALLET_RECORD_TYPE.PLAY_GAME_MISSION,
          WALLET_RECORD_TYPE.PLAY_MISSION_WIN,
        ];
        for (let i = 0; i < Object.values(WALLET_RECORD_TYPE).length; i++) {
          const _recordType = Object.values(WALLET_RECORD_TYPE)[i];
          if (_excludeRecordType.indexOf(_recordType) < 0) {
            _walletRecordType.push(_recordType);
          }
        }
        filter.WalletRecordType = _walletRecordType;
      }

      if (req.currentUser.staffRoleId === ROLE_NAME.TONG_DAILY) {
        filter.staffId = req.currentUser.staffId;
      }

      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let transactionCount = await WalletRecordView.customCount(filter, startDate, endDate, searchText, order);
      let transactionAmount = await WalletRecordView.customSum('paymentAmount', filter, startDate, endDate, searchText);

      if (transactionList && transactionCount && transactionList.length > 0) {
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
          totalPaymentAmount: transactionAmount[0].sumResult,
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

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let walletRecord = await WalletRecordView.find({ WalletRecordId: req.payload.id }, 0, 1);
      if (walletRecord && walletRecord.length > 0) {
        const isAllowed = await verifyStaffUser(walletRecord[0].appUserId, req.currentUser);
        if (!isAllowed) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
        return resolve(walletRecord[0]);
      } else {
        return resolve({});
      }
    } catch (e) {
      Logger.error(e);
      return reject('failed');
    }
  });
}

async function userViewWalletHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {};
      }

      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        Logger.error(`undefined appUserId userViewWalletHistory`);
        resolve({
          data: [],
          total: 0,
          sumTotal: 0,
        });
        return;
      }
      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let __transactionCount = await WalletRecordView.customCount(filter, startDate, endDate, undefined, order);
        if (__transactionCount && __transactionCount.length > 0) {
          __transactionCount = __transactionCount[0].count;
        } else {
          __transactionCount = 0;
        }
        let __sumAmount = await WalletRecordView.customSum('paymentAmount', filter, startDate, endDate, undefined, order);
        if (__sumAmount && __sumAmount.length > 0) {
          __sumAmount = __sumAmount[0].sumResult;
        } else {
          __sumAmount = 0;
        }
        resolve({
          data: transactionList,
          total: __transactionCount,
          sumTotal: __sumAmount,
        });
      } else {
        resolve({
          data: [],
          total: 0,
          sumTotal: 0,
        });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function summaryByUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {};
      }
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let summaryData = {
        totalDeposit: 0, // tổng nạp
        totalWithdraw: 0, // tổng rut
        totalEarned: 0, // tổng số tiền đã bán
        totalProfit: 0, // tổng lợi nhuận nhận được
      };
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        Logger.error(`undefined appUserId summaryByUser`);
        resolve(summaryData);
        return;
      }
      let listPromise = [];
      let sumTotalDeposit = await ReceiveFunction.summaryUserWalletRecord(
        filter.appUserId,
        WALLET_RECORD_TYPE.DEPOSIT_POINTWALLET,
        startDate,
        endDate,
      );
      listPromise.push(sumTotalDeposit);
      let sumTotalMakePayment = await ReceiveFunction.summaryUserWalletRecord(filter.appUserId, WALLET_RECORD_TYPE.MAKE_PAYMENT, startDate, endDate);
      listPromise.push(sumTotalMakePayment);
      let sumTotalWithdraw = await ReceiveFunction.summaryUserWalletRecord(
        filter.appUserId,
        WALLET_RECORD_TYPE.WITHDRAW_POINTWALLET,
        startDate,
        endDate,
      );
      listPromise.push(sumTotalWithdraw);
      Promise.all(listPromise).then(rs => {
        let totalDeposit = rs[0];
        let totalMakePayment = rs[1];
        let totalWithdraw = rs[2];
        summaryData.totalDeposit = totalDeposit; // so tien nap vao
        summaryData.totalEarned = totalMakePayment * -1; // so tien da ban ra
        // summaryData.totalProfit = totalEarned - totalBuy * -1; // loi nhuan
        summaryData.totalWithdraw = totalWithdraw * -1;
        resolve(summaryData);
      });
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userViewWalletHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      filter.appUserId = req.currentUser.appUserId;
      if (filter === undefined) {
        filter = {};
      }

      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      let transactionCount = await WalletRecordView.customCount(filter, startDate, endDate, searchText, order);
      if (transactionList && transactionCount && transactionList.length > 0) {
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

async function _attachUserInfoForTransaction(appUserId, transactionData) {
  if (!appUserId) {
    transactionData.referUser = null;
  } else {
    let _user = await AppUsersResourceAccess.findById(appUserId);
    if (_user) {
      transactionData.referUser = _user;
    }
  }

  return transactionData;
}
async function summaryRecordBySystemUser(req) {
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
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        filter.staffId = req.currentUser.staffId;
      }

      let _distinctFields = ['appUserId', 'createdDate', 'referUserId'];
      let _order = {
        key: 'createdDate',
        value: 'desc',
      };
      let transactionList = await WalletRecordView.customSumDistinct(
        'paymentAmount',
        _distinctFields,
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        _order,
      );

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WalletRecordView.customCountDistinct(
          'paymentAmount',
          _distinctFields,
          filter,
          startDate,
          endDate,
          searchText,
          _order,
        );
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i] = await _attachUserInfoForTransaction(transactionList[i].referUserId, transactionList[i]);
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

module.exports = {
  find,
  findById,
  userViewWalletHistory,
  summaryByUser,
  userViewWalletHistory,
  summaryRecordBySystemUser,
};
