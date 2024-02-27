/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const { NOT_FOUND, UNKNOWN_ERROR, MISSING_AUTHORITY, API_FAILED } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const SystemApiKeyResourceAccess = require('../resourceAccess/SystemApiKeyResourceAccess');
const SystemApiKeyFunction = require('../SystemApiKeyFunction');
const { APIKEY_ERROR } = require('../SystemApiKeyConstants');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      let result = await SystemApiKeyFunction.createNewApiKey(data);

      if (result) {
        return resolve(result);
      }

      return reject(APIKEY_ERROR.APIKEY_EXISTED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let listApikey = await SystemApiKeyResourceAccess.customSearch(filter, skip, limit, searchText, order);

      if (listApikey && listApikey.length > 0) {
        let recordCount = await SystemApiKeyResourceAccess.customCount(filter, searchText);

        return resolve({ data: listApikey, total: recordCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await SystemApiKeyFunction.findByKey(id);

      if (result) {
        return resolve(result);
      }
      return reject(NOT_FOUND);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let updateData = req.payload.data;

      // Kiểm tra có  apikey chưa
      const apiKeyExisted = await SystemApiKeyResourceAccess.findById(id);

      if (!apiKeyExisted) {
        return reject(NOT_FOUND);
      }

      let result = await SystemApiKeyResourceAccess.updateById(id, updateData);

      if (result) {
        return resolve(result);
      }

      return reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const apiKeyExisted = await SystemApiKeyResourceAccess.findById(id);

      if (!apiKeyExisted) {
        return reject(NOT_FOUND);
      } else {
        const result = await SystemApiKeyResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
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
  findById,
  updateById,
  deleteById,
};
