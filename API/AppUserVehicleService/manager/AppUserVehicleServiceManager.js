/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserVehicleServiceResourceAccess = require('../resourceAccess/AppUserVehicleServiceResourceAccess');
const { POPULAR_ERROR, UNKNOWN_ERROR } = require('../../Common/CommonConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      const result = await AppUserVehicleServiceResourceAccess.insert(data);
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

      let serviceList = await AppUserVehicleServiceResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (serviceList && serviceList.length > 0) {
        let vehicleCount = await AppUserVehicleServiceResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (vehicleCount > 0) {
          return resolve({ data: serviceList, total: vehicleCount });
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

      let updateResult = await AppUserVehicleServiceResourceAccess.updateById(id, data);
      if (updateResult) {
        return resolve(updateResult);
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

      let userVehicle = await AppUserVehicleServiceResourceAccess.findById(id);

      if (userVehicle) {
        return resolve(userVehicle);
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

      let result = await AppUserVehicleServiceResourceAccess.deleteById(id);
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
};
