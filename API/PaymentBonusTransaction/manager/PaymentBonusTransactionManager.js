/**
 * Created by A on 7/18/17.
 */
"use strict";
const moment = require('moment');

const BonusTransactionResource = require("../resourceAccess/PaymentBonusTransactionResourceAccess");
const BonusTransactionUserView = require("../resourceAccess/PaymentBonusTransactionUserView");
const UserResource = require("../../AppUsers/resourceAccess/AppUsersResourceAccess");
const PaymentBonusFunction = require('../PaymentBonusTransactionFunctions');
const BetRecordsFunctions = require('../../BetRecords/BetRecordsFunctions');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let paymentAmount = req.payload.paymentAmount;
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

      let result = await PaymentBonusFunction.createBonusTransactionByUserId(appUserId, paymentAmount);
      if (result) {
        resolve(result);
      } else {
        reject("failed");
      }
    } catch (e) {
      Logger.error(e);
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

      if (filter === undefined) {
        filter = {}
      }

      let transactionList = await BonusTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, order);

      if (transactionList && transactionCount && transactionList.length > 0) {
        let transactionCount = await BonusTransactionUserView.customCount(filter, startDate, endDate, order);

        //hien thi companyName la ten cua nguoi tham chieu, khong phai ten nguoi nhan
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i].companyName = "";
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
      reject("failed");
    }
  });
};

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let updateResult = await BonusTransactionResource.updateById(req.payload.id, req.payload.data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(e);
      reject("failed");
    }
  });
};

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transactionList = await BonusTransactionUserView.find({ paymentBonusTransactionId: req.payload.id });
      if (transactionList) {
        resolve(transactionList[0]);
      } else {
        resolve({});
      }
      resolve("success");
    } catch (e) {
      Logger.error(e);
      reject("failed");
    }
  });
};

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await BonusTransactionResource.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject("failed");
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  });
};

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
        filter = {}
      }

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        reject("failed");
        return;
      }

      let transactionList = await BonusTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, order);
      
      if (transactionList && transactionList.length > 0) {
        let transactionCount = await BonusTransactionUserView.customCount(filter, startDate, endDate, order);

        //hien thi companyName la ten cua nguoi tham chieu, khong phai ten nguoi nhan
        for (let i = 0; i < transactionList.length; i++) {
          transactionList[i].companyName = "";
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
      reject("failed");
    }
  });
};

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
        filter = {}
      }

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        reject("failed");
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
      reject("failed");
    }
  });
};

async function denyBonusTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let denyResult = await PaymentBonusFunction.denyBonusTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
      if (denyResult) {
        resolve("success");
      } else {
        Logger.error("deposit transaction was not denied");
        reject("failed");
      }
    } catch (e) {
      Logger.error(e);
      reject("failed");
    }
  });
}

async function approveBonusTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let approveResult = await PaymentBonusFunction.approveBonusTransaction(req.payload.id, req.currentUser, req.payload.paymentNote);
      if (approveResult) {
        //cap nhat trang thai sau khi da tra hoa hong
        let transaction = await BonusTransactionResource.find({
          paymentBonusTransactionId: req.payload.id
        }, 0, 1);

        if (!transaction || transaction.length < 1) {
          Logger.error("transaction is invalid");
          return undefined;
        }
        transaction = transaction[0];

        resolve(approveResult);
      } else {
        Logger.error("deposit transaction was not approved");
        reject("failed");
      }
    } catch (e) {
      Logger.error(e);
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
      filter.appUserId = req.currentUser.appUserId;

      let result = await BonusTransactionResource.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        reject("failed");
      }
    } catch (e) {
      Logger.error(e);
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

      let result = await BonusTransactionResource.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        reject("failed");
      }
    } catch (e) {
      Logger.error(e);
      reject("failed");
    }
  });
};

async function exportHistoryOfUser(req) {
  return new Promise(async (resolve, reject) => {
    try{
      let appUserId = req.payload.id;
      let history = await BonusTransactionResource.find({appUserId: appUserId});
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
      reject("failed");
    }
  })
}

async function exportSalesToExcel(req) {
  return new Promise(async (resolve, reject) => {
    try{
      let startDate = moment(req.payload.startDate).startOf('month').format('YYYY-MM-DD');
      let endDate = moment(req.payload.endDate).endOf('month').format('YYYY-MM-DD');
      let data = await BonusTransactionResource.customSearch(startDate, endDate)
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
      reject("failed");
    }
  })
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  summaryAll,
  summaryUser,
  denyBonusTransaction,
  approveBonusTransaction,
  exportHistoryOfUser,
  exportSalesToExcel,
  userGetBonusHistory,
  userSummaryBonusByStatus,
};
