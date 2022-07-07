/**
 * Created by A on 7/18/17.
 */
"use strict";
const moment = require('moment');

const DepositTransactionAccess = require("../resourceAccess/PaymentDepositTransactionResourceAccess");
const DepositTransactionUserView = require("../resourceAccess/PaymentDepositTransactionUserView");
const UserResource = require("../../AppUsers/resourceAccess/AppUsersResourceAccess");
const DepositFunction = require('../PaymentDepositTransactionFunctions');
const Logger = require('../../../utils/logging');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransactionConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      let paymentCategory = req.payload.paymentCategory;

      if (!appUserId) {
        reject("user is invalid");
        return;
      }

      let user = await UserResource.find({ appUserId: appUserId });
      if (!user || user.length < 1) {
        reject("can not find user");
        return;
      }
      user = user[0];

      let result = await DepositFunction.createDepositTransaction(user, paymentAmount, paymentCategory);
      if (result) {
        resolve(result);
      } else {
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

      if (filter === undefined) {
        filter = {}
      }

      let transactionList = await DepositTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let transactionCount = await DepositTransactionUserView.customCount(filter, startDate, endDate, searchText, order);

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
      console.error(e);
      reject("failed");
    }
  });
};

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let updateResult = await DepositTransactionAccess.updateById(req.payload.id, req.payload.data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        resolve({});
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
      let transactionList = await DepositTransactionUserView.find({ paymentDepositTransactionId: req.payload.id });
      if (transactionList) {
        resolve(transactionList[0]);
      } else {
        resolve({});
      }
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function depositHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (filter === undefined) {
        filter = {}
      }

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        reject("failed");
        return;
      }

      let transactionList = await DepositTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);
      let transactionCount = await DepositTransactionUserView.customCount(filter, startDate, endDate, undefined, order);

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
      console.error(e);
      reject("failed");
    }
  });
};

async function denyDepositTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let denyResult = await DepositFunction.denyDepositTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
      if (denyResult) {
        resolve("success");
      } else {
        console.error("deposit transaction was not denied");
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
}

async function approveDepositTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let approveResult = await DepositFunction.approveDepositTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
      if (approveResult) {
        resolve("success");
      } else {
        console.error("deposit transaction was not approved");
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
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

      let result = await DepositTransactionAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
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

      let result = await DepositTransactionAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function addPointForUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let rewardResult = await DepositFunction.addPointForUser(req.payload.id, req.payload.amount, req.currentUser, req.payload.paymentNote);
      if (rewardResult) {
        resolve("success");
      } else {
        console.error("fail to add reward point for user");
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
}

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

      let transactionList = await DepositTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (!transactionList || transactionList.length <= 0) {
        transactionList = [];
      }
      const columnNames = [
        {"key":"paymentDepositTransactionId", "label":"ID"},
        {"key":"username", "label":"Tài khoản"},
        {"key":"companyName", "label":"Tên tổ chức"},
        {"key":"tennganhang", "label":"Ngân hàng"},
        {"key":"sotaikhoan", "label":"Số tài khoản"},
        {"key":"tentaikhoan", "label":"Tên tài khoản"},
        {"key":"paymentRefAmount", "label":"Số tiền (VND)"},
        {"key":"paymentStatus", "label":"Trạng thái"},
        {"key":"createdAt", "label":"Thời gian"}
      ];

      const fileName = `DepositHistory_${moment().format('YYYYMMDDHHmm')}.xlsx`;
      const ExcelFunction = require('../../../ThirdParty/Excel/excelFunction');
      let filePath = await ExcelFunction.exportExcel(transactionList, columnNames,'Deposit History', fileName);
      let url = `https://${process.env.HOST_NAME}/${filePath}`;
      
      resolve(url);
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  })
}

async function userRequestDeposit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.currentUser.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      let paymentRef = req.payload.paymentRef;
      let paymentCategory = req.payload.paymentCategory;
      if (!appUserId) {
        reject("user is invalid");
        return;
      }

      let user = await UserResource.find({ appUserId: appUserId });
      if (!user || user.length < 1) {
        reject("can not find user");
        return;
      }
      user = user[0];

      let result = await DepositFunction.createDepositTransaction(user, paymentAmount, paymentCategory, paymentRef);
      if (result) {
        resolve(result);
      } else {
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      if (e === "DUPLICATE_TRANSACTION_ID") {
        reject("DUPLICATE_TRANSACTION_ID");
      } else {
        reject("failed");
      }
    }
  });
};

module.exports = {
  insert,
  find,
  updateById,
  findById,
  approveDepositTransaction,
  summaryAll,
  summaryUser,
  denyDepositTransaction,
  userRequestDeposit,
  depositHistory,
  addPointForUser,
  exportData,
};
