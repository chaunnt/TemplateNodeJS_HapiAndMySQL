/* Copyright (c) 2022-2024 Reminano */

'use strict';
const SystemIPView = require('../resourceAccess/SystemIPView');
const SystemIPResourceAccess = require('../resourceAccess/SystemIPResourceAccess');
const SystemIPFunction = require('../SystemIPFunctions');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let insertData = req.payload;

      let createResult = await SystemIPFunction.insertNewSystemIP(insertData);
      if (createResult) {
        resolve(createResult);
      } else {
        Logger.error(`insert new system ip failed`);
        reject(`failed`);
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
      let searchText = req.payload.searchText;
      let result = await SystemIPView.customSearch(req.payload.filter, req.payload.skip, req.payload.limit, undefined, undefined, searchText);

      if (result && result.length > 0) {
        let resultCount = await SystemIPView.customCount(req.payload.filter, undefined, undefined, searchText);
        resolve({
          data: result,
          total: resultCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let updateId = req.payload.id;
      let updateData = req.payload.data;

      let result = await SystemIPResourceAccess.updateById(updateId, updateData);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`SystemIPResourceAccess.updateById ${updateId} failed`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    let id = req.payload.id;
    let result = await SystemIPResourceAccess.deleteById(id);
    if (result) {
      resolve(result);
    } else {
      reject('failed');
    }
  });
}

async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let searchText = req.payload.searchText;
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let result = await SystemIPResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (result && result.length > 0) {
        let resultCount = await SystemIPResourceAccess.customCount(filter, undefined, undefined, searchText);
        resolve({
          data: result,
          total: resultCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}
module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  getList,
};
