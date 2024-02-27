/* Copyright (c) 2022-2023 Reminano */

'use strict';
const LeaderBoardResourAccess = require('../resourceAccess/LeaderBoardResourAccess');
const LeaderBoardViews = require('../resourceAccess/LeaderBoardViews');
const LeaderBoardFunction = require('../LeaderFunction');
const { ROLE_NAME, PERMISSION_NAME } = require('../../StaffRole/StaffRoleConstants');
const Logger = require('../../../utils/logging');
const LeaderBoardDailyView = require('../resourceAccess/LeaderBoardDailyView');
const LeaderBoardDailyResourceAccess = require('../resourceAccess/LeaderBoardDailyResourceAccess');
const moment = require('moment');
const { DATE_DISPLAY_FORMAT, DATE_DBDATA_FORMAT } = require('../LeaderBoardConstant');

async function userGetTopRank(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let order = req.payload.order || {
        key: 'totalPlayAmount',
        value: 'asc',
      };
      let _filter = req.payload.filter;
      let _skip = req.payload.skip;
      let _limit = req.payload.limit;
      let _searchText = req.payload.searchText;
      let result = await LeaderBoardViews.customSearch(_filter, _skip, _limit, _searchText, undefined, undefined, order);
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
async function updateRanKingById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let ranking = req.payload.ranking;
      let totalScore = req.payload.totalScore;

      let result = await LeaderBoardFunction.adminUpdateRanking(appUserId, ranking, totalScore);
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
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          //loc theo dai ly neu khong admin
          filter.staffId = req.currentUser.staffId;
        }
      }

      let result = await LeaderBoardViews.customSearch(filter, skip, limit, searchText, undefined, undefined, order);
      if (result && result.length > 0) {
        let dataCount = await LeaderBoardViews.customCount(filter);
        resolve({ data: result, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function getLeaderBoardDaily(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          //loc theo dai ly neu khong admin
          filter.staffId = req.currentUser.staffId;
        }
      }

      let _startDate = moment(startDate, DATE_DISPLAY_FORMAT).startOf('days');
      let _endDate = moment(endDate, DATE_DISPLAY_FORMAT).endOf('days');
      for (let i = _endDate; i >= _startDate; ) {
        let date = moment(i).format(DATE_DBDATA_FORMAT);
        let _existingRecord = await LeaderBoardDailyResourceAccess.find({ leaderBoardDailyDate: date }, undefined, undefined, {
          key: order.key,
          value: 'desc',
        });

        if (order.key == 'totalProfit' || order.key == 'totalPlayAmount') {
          if (
            !_existingRecord ||
            (_existingRecord && _existingRecord.length > 0 && _existingRecord[0].totalPlayAmount == 0) ||
            _existingRecord.length == 0
          ) {
            await LeaderBoardFunction.updateTotalDailyKLGD(date);
          }
        } else if (order.key == 'totalDepositAmount') {
          if (
            !_existingRecord ||
            (_existingRecord && _existingRecord.length > 0 && _existingRecord[0].totalDepositAmount == 0) ||
            _existingRecord.length == 0
          ) {
            await LeaderBoardFunction.updateTotalDailyDeposit(date);
          }
        } else if (order.key == 'totalWithdrawAmount') {
          if (
            !_existingRecord ||
            (_existingRecord && _existingRecord.length > 0 && _existingRecord[0].totalWithdrawAmount == 0) ||
            _existingRecord.length == 0
          ) {
            await LeaderBoardFunction.updateTotalDailyWithdraw(date);
          }
        }
        i = moment(i).add(-1, 'days');
      }

      let sumField;
      let sumFieldExtra;
      if (order.key == 'totalPlayAmount') {
        sumField = 'totalPlayAmount';
        sumFieldExtra = 'totalPlayCount';
      } else if (order.key == 'totalDepositAmount') {
        sumField = 'totalDepositAmount';
        sumFieldExtra = 'totalDepositCount';
      } else if (order.key == 'totalWithdrawAmount') {
        sumField = 'totalWithdrawAmount';
        sumFieldExtra = 'totalWithdrawCount';
      } else if (order.key == 'totalProfit') {
        sumField = 'totalProfit';
        sumFieldExtra = 'totalPlayCount';
      }
      let result = await LeaderBoardDailyView.customSumForRanking(filter, startDate, endDate, sumField, sumFieldExtra, skip, limit, order);
      if (result && result.length > 0) {
        let dataCount = await LeaderBoardDailyView.customCountForRanking(filter, startDate, endDate, sumField, sumFieldExtra, skip, limit, order);
        resolve({ data: result, total: dataCount.length });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}
module.exports = {
  userGetTopRank,
  updateRanKingById,
  find,
  getLeaderBoardDaily,
};
