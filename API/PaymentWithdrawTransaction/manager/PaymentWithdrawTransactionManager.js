/**
 * Created by A on 7/18/17.
 */
"use strict";
const moment = require('moment');

const UserResouce = require("../../AppUsers/resourceAccess/AppUsersResourceAccess");
const WithdrawTransactionResourceAccess = require("../resourceAccess/PaymentWithdrawTransactionResourceAccess");
const WithdrawTransactionUserView = require("../resourceAccess/WithdrawTransactionUserView");
const WithdrawTransactionFunction = require('../PaymentWithdrawTransactionFunctions');
const AppUserFunctions = require('../../AppUsers/AppUsersFunctions');
const { USER_ERROR } = require('../../AppUsers/AppUserConstant');
const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransactionConstant');
const Logger = require('../../../utils/logging');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let paymentAmount = req.payload.paymentAmount;
      let walletType =WALLET_TYPE.USDT
      let targetUser = await UserResouce.find({appUserId: appUserId}, 0, 1);
      if (targetUser && targetUser.length > 0) {
        let createResult = await WithdrawTransactionFunction.createWithdrawRequest(targetUser[0], paymentAmount, req.currentUser,undefined,walletType);
        if (createResult) {
          resolve(createResult);
        } else {
          Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
          reject("can not create withdraw transaction");
        }
      } else {
        Logger.error(`can not WithdrawTransactionFunction.insert invalid user`);
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

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
      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let transactionCount = await WithdrawTransactionUserView.customCount(filter, startDate, endDate, searchText, order);

      if (transactionList && transactionCount && transactionList.length > 0) {
        resolve({
          data: transactionList, 
          total: transactionCount[0].count,
        });
      }else{
        resolve({
          data: [], 
          total: 0,
        });
      }
      reject("failed");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newStatus = req.payload.data.status;
      let result = undefined;
      console.log(newStatus);
      if(newStatus === WITHDRAW_TRX_STATUS.COMPLETED){
        result = await WithdrawTransactionFunction.acceptWithdrawRequest(req.payload.id);
      }else{
        result = await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id)
      }

      if(result) {
        resolve(result);
      }else{
        reject("update transaction failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      
      let transactionList = await WithdrawTransactionUserView.find({paymentWithdrawTransactionId: req.payload.id});
      if(transactionList && transactionList.length > 0) {
        resolve(transactionList[0]);
      }else{
        Logger.error(`WithdrawTransactionUserView can not findById ${req.payload.id}`);
        reject("failed");
      }
      
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        reject("failed");
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, startDate, endDate, undefined, order);
        resolve({
          data: transactionList, 
          total: transactionCount[0].count,
        });
      }else{
        resolve({
          data: [], 
          total: 0,
        });
      }
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
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
        reject("failed");
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, startDate, endDate, undefined, order);
        resolve({
          data: transactionList, 
          total: transactionCount[0].count,
        });
      }else{
        resolve({
          data: [], 
          total: 0,
        });
      }
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
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
        reject("failed");
        return;
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WithdrawTransactionUserView.customCount(filter, startDate, endDate, undefined, order);
        resolve({
          data: transactionList, 
          total: transactionCount[0].count,
        });
      }else{
        resolve({
          data: [], 
          total: 0,
        });
      }
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function approveWithdrawTransaction(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staff = req.currentUser;
      let paymentRef = req.paymentRef;
      let result = await WithdrawTransactionFunction.acceptWithdrawRequest(req.payload.id, req.payload.paymentNote,staff,paymentRef);
      if(result) {
        resolve(result);
      }else{
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function denyWithdrawTransaction(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await WithdrawTransactionFunction.rejectWithdrawRequest(req.payload.id, req.payload.paymentNote);
      if(result) {
        resolve(result);
      }else{
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};


async function summaryUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;
      filter.userId = req.currentUser.userId;

      let result = await WithdrawTransactionResourceAccess.customSum(filter, startDate, endDate);
      if(result) {
        resolve(result[0]);
      }else{
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function summaryAll(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;

      let result = await WithdrawTransactionResourceAccess.customSum(filter, startDate, endDate);
      if(result) {
        resolve(result[0]);
      }else{
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function requestWithdrawUSDT(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentAmount = req.payload.paymentAmount;
      let walletType =WALLET_TYPE.USDT

      //if system support for secondary password
      if (req.payload.secondaryPassword) {
        let verifyResult = await AppUserFunctions.verifyUserSecondaryPassword(req.currentUser.username, req.payload.secondaryPassword);
        if (verifyResult === undefined) {
          Logger.error(`${USER_ERROR.NOT_AUTHORIZED} requestWithdraw`);
          reject(USER_ERROR.NOT_AUTHORIZED);
          return;
        }
      }

      let createResult = await WithdrawTransactionFunction.createWithdrawRequest(req.currentUser, paymentAmount, undefined, req.payload.paymentNote, walletType);
      if (createResult) {
        resolve(createResult);
      } else {
        Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
        reject("can not create withdraw transaction");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
async function requestWithdrawBTC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentAmount = req.payload.paymentAmount;
      let walletType = WALLET_TYPE.BTC

      //if system support for secondary password
      if (req.payload.secondaryPassword) {
        let verifyResult = await AppUserFunctions.verifyUserSecondaryPassword(req.currentUser.username, req.payload.secondaryPassword);
        if (verifyResult === undefined) {
          Logger.error(`${USER_ERROR.NOT_AUTHORIZED} requestWithdraw`);
          reject(USER_ERROR.NOT_AUTHORIZED);
          return;
        }
      }

      let createResult = await WithdrawTransactionFunction.createWithdrawRequest(req.currentUser, paymentAmount, undefined, req.payload.paymentNote, walletType);
      if (createResult) {
        resolve(createResult);
      } else {
        Logger.error(`can not WithdrawTransactionFunction.createWithdrawRequest`);
        reject("can not create withdraw transaction");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function exportData(req) {
  return new Promise(async (resolve, reject) => {
    try{
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter === undefined) {
        filter = {}
      }

      let transactionList = await WithdrawTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (!transactionList || transactionList.length <= 0) {
        transactionList = [];
      }
      const columnNames = [
        {"key":"paymentWithdrawTransactionId", "label":"ID"},
        {"key":"username", "label":"Tài khoản"},
        {"key":"companyName", "label":"Tên tổ chức"},
        {"key":"tennganhang", "label":"Ngân hàng"},
        {"key":"sotaikhoan", "label":"Số tài khoản"},
        {"key":"tentaikhoan", "label":"Tên tài khoản"},
        {"key":"paymentRefAmount", "label":"Số tiền (VND)"},
        {"key":"paymentStatus", "label":"Trạng thái"},
        {"key":"createdAt", "label":"Thời gian"}
      ];

      const fileName = `WithdrawHistory_${moment().format('YYYYMMDDHHmm')}.xlsx`;
      const ExcelFunction = require('../../../ThirdParty/Excel/excelFunction');
      let filePath = await ExcelFunction.exportExcel(transactionList, columnNames,'Withdraw History', fileName);
      let url = `https://${process.env.HOST_NAME}/${filePath}`;
      
      resolve(url);
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  })
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  requestWithdrawUSDT,
  getList,
  denyWithdrawTransaction,
  approveWithdrawTransaction,
  summaryAll,
  summaryUser,
  withdrawHistoryUSDT,
  requestWithdrawBTC,
  withdrawHistoryBTC,
  exportData,
};
