/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const AppUserWorkInfoResourceAccess = require('../resourceAccess/AppUserWorkInfoResourceAccess');
const AppUserResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_WORK_INFO_ERROR } = require('../AppUserWorkInfoConstants');

const { POPULAR_ERROR, NOT_FOUND, UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { addOrUpdateUserWorkInfo } = require('../AppUserWorkInfoFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      const result = await AppUserWorkInfoResourceAccess.insert(data);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let list = await AppUserWorkInfoResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (list && list.length > 0) {
        let count = await AppUserWorkInfoResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (count > 0) {
          return resolve({ data: list, total: count });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      const existedAppUser = await AppUserResourceAccess.findById(id);
      if (!existedAppUser) {
        return reject(NOT_FOUND);
      }

      let result = await addOrUpdateUserWorkInfo(id, data);

      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserUpdate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;
      const userRoleId = req.currentUser.appUserRoleId;
      const userStationId = req.currentUser.stationsId;

      const MANAGER_ROLE = 1;

      if (userRoleId !== MANAGER_ROLE) {
        return reject(APP_USER_WORK_INFO_ERROR.MISSING_PERMISSION);
      }

      const existedAppUser = await AppUserResourceAccess.findById(id);
      if (!existedAppUser) {
        return reject(NOT_FOUND);
      }

      if (existedAppUser.stationsId !== userStationId) {
        return reject(APP_USER_WORK_INFO_ERROR.MISSING_PERMISSION);
      }

      let result = await addOrUpdateUserWorkInfo(id, data);

      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let userInfo = await AppUserWorkInfoResourceAccess.findById(id);

      if (userInfo) {
        return resolve(userInfo);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await AppUserWorkInfoResourceAccess.deleteById(id);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  advanceUserUpdate,
};
