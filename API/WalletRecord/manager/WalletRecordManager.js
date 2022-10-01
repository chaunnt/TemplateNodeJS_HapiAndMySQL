/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const UserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const WalletRecordFunctions = require('../WalletRecordFunction');
const WalletRecordView = require('../resourceAccess/WalletRecordView');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const { WALLET_RECORD_TYPE } = require('../WalletRecordConstant');
const moment = require('moment');
const { ERROR } = require('../../Common/CommonConstant');
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

      let transactionList = await WalletRecordView.customSearch(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        order,
      );
      let transactionCount = await WalletRecordView.customCount(
        filter,
        undefined,
        undefined,
        startDate,
        endDate,
        searchText,
        order,
      );

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
      console.error(`error Wallet Record find`, e);
      reject('failed');
    }
  });
}
async function userHistoryBTC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {};
      }
      filter.walletType = WALLET_TYPE.BTC;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        console.error(`error Wallet Record userHistoryBTC: user invalid`);
        reject('failed');
        return;
      }
      let transactionList = await WalletRecordView.customSearch(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        undefined,
        order,
      );

      if (transactionList && transactionList.length > 0) {
        let transactionCount = await WalletRecordView.customCount(filter, undefined, undefined, startDate, endDate);
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
      console.error(`error Wallet Record userHistoryBTC`, e);
      reject('failed');
    }
  });
}
async function userHistoryFAC(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      if (filter === undefined) {
        filter = {};
      }
      filter.walletType = WALLET_TYPE.FAC;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      } else {
        console.error(`error Wallet Record userHistoryFAC: user invalid`);
        reject('failed');
        return;
      }
      let transactionList = await WalletRecordView.customSearch(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        undefined,
        order,
      );
      let transactionCount = await WalletRecordView.customCount(
        filter,
        undefined,
        undefined,
        startDate,
        endDate,
        undefined,
        order,
      );

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
      console.error(`error Wallet Record userHistoryFAC`, e);
      reject('failed');
    }
  });
}
async function userHistory(req) {
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
        console.error(`error Wallet Record userHistory: user invalid`);
        reject('failed');
        return;
      }
      let transactionList = await WalletRecordView.customSearch(
        filter,
        skip,
        limit,
        undefined,
        undefined,
        undefined,
        order,
      );
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
      console.error(`error Wallet Record userHistory`, e);
      reject('failed');
    }
  });
}

module.exports = {
  find,
  userHistoryBTC,
  userHistoryFAC,
  userHistory,
};
