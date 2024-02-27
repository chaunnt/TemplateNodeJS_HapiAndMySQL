/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppUserExpertInfoView = require('../resourceAccess/AppUserExpertInfoView');
const AppUserExpertInfoResourceAccess = require('../resourceAccess/AppUserExpertInfoResourceAccess');
const AppUserFollowerResourceAccess = require('../resourceAccess/AppUserFollowerResourceAccess');
const AppUserFollowerView = require('../resourceAccess/AppUserFollowerView');
const { COPY_TRADE_STATUS, COPY_TRADE_ERROR } = require('../AppUserExpertConstants');
const Logger = require('../../../utils/logging');
const { NOT_ENOUGH_AUTHORITY, POPULAR_ERROR, UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { fetchFollowingStatus } = require('../AppUserExpertFunctions');

async function userGetAllExperts(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (!user) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }
      let filter = { isActive: 1 };
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let _expertsList = await AppUserExpertInfoView.customSearch(filter, skip, limit, null, null, searchText, order);

      if (_expertsList && _expertsList.length > 0) {
        let expertCount = _expertsList.length;
        if (_expertsList.length >= limit) {
          expertCount = await AppUserExpertInfoView.customCount(filter, null, null, searchText, order);
          expertCount = expertCount[0].count;
        }

        let _promiseList = [];

        for (let index = 0; index < _expertsList.length; index++) {
          _promiseList.push(fetchFollowingStatus(user.appUserId, _expertsList[index]));
        }

        await Promise.all(_promiseList);

        resolve({ data: _expertsList, total: expertCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userGetFollowingExperts(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (!user) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }

      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      filter.followerId = user.appUserId;
      let _expertsList = await AppUserFollowerView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (_expertsList && _expertsList.length > 0) {
        let expertCount = _expertsList.length;
        if (_expertsList.length >= limit) {
          expertCount = await AppUserFollowerView.customCount(filter, undefined, undefined, searchText);
        }
        resolve({ data: _expertsList, total: expertCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function followExpert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (!user) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }

      const copyTradeData = req.payload;
      const expertId = copyTradeData.expertId;
      let _existingExpert = await AppUserExpertInfoResourceAccess.find({ appUserId: expertId }, 0, 1);
      if (_existingExpert) {
        return resolve(COPY_TRADE_ERROR.INVALID_EXPERT);
      }

      const filter = {
        appUserId: expertId,
        followerId: user.appUserId,
      };
      let _existingFollower = await AppUserFollowerResourceAccess.find(filter, 0, 1);
      if (_existingFollower && _existingFollower.length > 0) {
        return resolve(COPY_TRADE_ERROR.ALREADY_FOLLOWED);
      }

      //chua follow expert
      let _insertData = {
        appUserId: copyTradeData.expertId,
        followerId: user.appUserId,
        investingAmount: copyTradeData.investingAmount,
        minimumInvestmentAmount: copyTradeData.minimumInvestmentAmount,
        maximumInvestmentAmount: copyTradeData.maximumInvestmentAmount,
        stopLossRate: copyTradeData.stopLossRate,
        profitRate: copyTradeData.profitRate,
        copyTradeStatus: COPY_TRADE_STATUS.RUNNING,
      };
      const insertResult = await AppUserFollowerResourceAccess.insert(_insertData);
      if (insertResult) {
        resolve(insertResult);
      } else {
        resolve(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userUpdateFollowInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      const copyTradeData = req.payload;
      const _appUserFollowerId = copyTradeData.id;
      let _existingExpert = await AppUserExpertInfoResourceAccess.findById(_appUserFollowerId);
      if (!_existingExpert) {
        return reject(COPY_TRADE_ERROR.INVALID_COPY_TRADE_ID);
      }

      if (_existingExpert.appUserId !== _currentUser.appUserId) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }

      // da follow expert
      let _updateData = {
        investingAmount: copyTradeData.investingAmount,
        minimumInvestmentAmount: copyTradeData.minimumInvestmentAmount,
        maximumInvestmentAmount: copyTradeData.maximumInvestmentAmount,
        stopLossRate: copyTradeData.stopLossRate,
        profitRate: copyTradeData.profitRate,
      };
      const updateResult = await AppUserFollowerResourceAccess.updateById(_existingFollower[0].appUserFollowerId, _updateData);
      if (updateResult !== undefined) {
        resolve(updateResult);
      } else {
        reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}
async function stopCopyTrade(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (!user) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }
      const appUserFollowerId = req.payload.appUserFollowerId;
      let _existingFollower = await AppUserFollowerResourceAccess.findById(appUserFollowerId);
      if (!_existingFollower) {
        return reject(COPY_TRADE_ERROR.INVALID_COPY_TRADE_ID);
      }
      const updateResult = await AppUserFollowerResourceAccess.updateById(appUserFollowerId, {
        copyTradeStatus: COPY_TRADE_STATUS.PENDING,
      });
      if (updateResult !== undefined) {
        resolve(updateResult);
      } else {
        reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function unfollowExpert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (!user) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }
      const appUserFollowerId = req.payload.appUserFollowerId;
      let _existingFollower = await AppUserFollowerResourceAccess.findById(appUserFollowerId);
      if (!_existingFollower) {
        return reject(COPY_TRADE_ERROR.INVALID_COPY_TRADE_ID);
      }

      const updateResult = await AppUserFollowerResourceAccess.updateById(appUserFollowerId, {
        copyTradeStatus: COPY_TRADE_STATUS.UNFOLLOW,
      });
      if (updateResult !== undefined) {
        resolve(updateResult);
      } else {
        reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userGetExpertById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const expertId = req.payload.expertId;
      let foundExpert = await AppUserExpertInfoView.findById(expertId);

      if (foundExpert) {
        // lay thong tin giao dich
        resolve(foundExpert);
      } else {
        reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(COPY_TRADE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

module.exports = {
  userGetAllExperts,
  userGetFollowingExperts,
  followExpert,
  userUpdateFollowInfo,
  stopCopyTrade,
  unfollowExpert,
  userGetExpertById,
};
