"use strict";
const UserResource = require("../../AppUsers/resourceAccess/AppUsersResourceAccess");
const ReceiveFunction = require('../WalletRecordFunction');
const WalletRecordView = require('../resourceAccess/WalletRecordView');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const { WALLET_RECORD_TYPE } = require('../WalletRecordConstant');
const moment = require('moment');

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
      console.error(e);
      reject("failed");
    }
  });
};
async function userHistoryBTC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {}
      }
      filter.walletType = WALLET_TYPE.BTC
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
      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);
      
      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WalletRecordView.customCount(filter, startDate, endDate);
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
async function userHistoryFAC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {}
      }
      filter.walletType = WALLET_TYPE.FAC
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
      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, startDate, endDate, order);
      let transactionCount = await WalletRecordView.customCount(filter, startDate, endDate, order);

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
async function userHistoryPOINT(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {}
      }
      filter.walletType = WALLET_TYPE.POINT
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

      let transactionList = await WalletRecordView.customSearch(filter, skip, limit, undefined, undefined, undefined, order);

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WalletRecordView.customCount(filter, startDate, endDate, undefined, order);

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

module.exports = {
  find,
  userHistoryBTC,
  userHistoryFAC,
  userHistoryPOINT,
};