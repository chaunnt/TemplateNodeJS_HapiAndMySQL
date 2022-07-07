/**
 * Created by A on 7/18/17.
 */
"use strict";
const BetRecordsResourceAccess = require("../resourceAccess/BetRecordsResourceAccess");
const BetRecordsFunction = require('../BetRecordsFunctions');
const UserBetRecordsView = require("../resourceAccess/UserBetRecordsView");
// const GameRecordResource = require('../../GameRecord/resourceAccess/GameRecordResourceAccess');
const PaymentBonusTransaction = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
const PaymentBonusFunction = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
const { BET_STATUS } = require("../BetRecordsConstant");
const { BONUS_TRX_STATUS } = require('../../PaymentBonusTransaction/PaymentBonusTransactionConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    resolve("success");
  })
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

      let betRecordList = await UserBetRecordsView.customSearch(filter, skip, limit, searchText, startDate, endDate, order);
      if (betRecordList && betRecordList.length > 0) {
        let betRecordCount = await UserBetRecordsView.customCount(filter, searchText, startDate, endDate);
        let betRecordSum = await UserBetRecordsView.sum('betRecordAmountIn', filter, order);

        resolve({ data: betRecordList, total: betRecordCount[0].count, totalSum: betRecordSum[0].sumResult });
      } else {
        resolve({ data: [], total: 0, totalSum: 0 });
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
      let updateResult = await BetRecordsResourceAccess.updateById(req.payload.id, req.payload.data);
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
      let betRecordList = await UserBetRecordsView.find({ betRecordId: req.payload.id });
      if (betRecordList && betRecordList.length > 0) {
        resolve(betRecordList[0]);
      } else {
        reject('failed')
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
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      
      //only get record of current user
      filter.appUserId = req.currentUser.appUserId;

      const GameBetRecordsView = require('../resourceAccess/GameBetRecordsView');
      let betRecordList = await GameBetRecordsView.customSearch(filter, skip, limit, undefined, startDate, endDate, order);
      if (betRecordList && betRecordList.length > 0) {
        for (let i = 0; i < betRecordList.length; i++) {
          let _packageTypeTemp = betRecordList[i].packageType.split('');
          _packageTypeTemp[0] = betRecordList[i].packageName.slice(0, 1);
          betRecordList[i].packageType = _packageTypeTemp.join('');
        }
        let betRecordCount = await GameBetRecordsView.customCount(filter, undefined, startDate, endDate);
        resolve({ data: betRecordList, total: betRecordCount[0].count });
      } else {
        resolve({ data: [], total: 0, totalSum: 0 });
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
      filter.appUserId = req.currentUser.appUserId;

      let result = await BetRecordsResourceAccess.sumaryPointAmount(startDate, endDate, filter);
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
async function userSumaryWinLoseAmount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;
      if (!filter) {
        filter = {}
      }
      filter.appUserId = req.currentUser.appUserId;

      let result = await BetRecordsResourceAccess.sumaryWinLoseAmount(startDate, endDate, filter);

      if (result) {
        if (result[0].sumResult === null) {
          result[0].sumResult = 0;
        }
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

      let result = await BetRecordsResourceAccess.sumaryPointAmount(startDate, endDate, filter);
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

async function userPlaceBetRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      let placeData = req.payload;
      let placeResult = await BetRecordsFunction.placeUserBet(_currentUser.appUserId, placeData.betRecordAmountIn, placeData.gameRecordId, placeData.sectionName, placeData.betRecordType);

      if (placeResult) {
        //calculate bonus and store amount bonus for refer user
        if (_currentUser.referUserId && _currentUser.referUserId !== null) {
          //tao ra record de luu hoa hong neu chua co san
          await PaymentBonusFunction.createBonusTransactionByUserId(_currentUser.referUserId, 0);

          if (_currentUser.memberReferIdF1 && _currentUser.memberReferIdF1 !== null && _currentUser.memberReferIdF1 !== "") {
            //tao ra record de luu hoa hong neu chua co san cho F1
            await PaymentBonusFunction.createBonusTransactionByUserId(_currentUser.memberReferIdF1, 0);
          }

          if (_currentUser.memberReferIdF2 && _currentUser.memberReferIdF2 !== null && _currentUser.memberReferIdF2 !== "") {
            //tao ra record de luu hoa hong neu chua co san  cho F2
            await PaymentBonusFunction.createBonusTransactionByUserId(_currentUser.memberReferIdF2, 0);
          }

          if (_currentUser.memberReferIdF3 && _currentUser.memberReferIdF3 !== null && _currentUser.memberReferIdF3 !== "") {
            //tao ra record de luu hoa hong neu chua co san cho F3
            await PaymentBonusFunction.createBonusTransactionByUserId(_currentUser.memberReferIdF3, 0);
          }
        }

        //cap nhat lai gia tri dat cua game
        if (placeData.gameRecordId) {
          await GameRecordResource.increment(placeData.gameRecordId, `gameRecordAmountIn`, placeData.betRecordAmountIn);
        }

        resolve(placeResult);
      } else {
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function getListPublicFeeds(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordList = await UserBetRecordsView.customSearch({
        betRecordStatus: BET_STATUS.COMPLETED
      }, 0, 10);

      if (betRecordList && betRecordList.length > 0) {
        resolve({ data: betRecordList, total: betRecordList.length });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

module.exports = {
  insert,
  find,
  updateById,
  findById,
  getList,
  summaryAll,
  summaryUser,
  userSumaryWinLoseAmount,
  userPlaceBetRecord,
  getListPublicFeeds
};
