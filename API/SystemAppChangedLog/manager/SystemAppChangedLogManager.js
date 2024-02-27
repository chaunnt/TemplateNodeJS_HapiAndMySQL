/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const SystemAppLogResource = require('../resourceAccess/SystemAppChangedLogResourceAccess');
const SystemAppLogAppUserResource = require('../resourceAccess/SystemAppLogAppUserResourceAccess');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemAppLogData = req.payload;
      let result = await SystemAppLogResource.insert(systemAppLogData);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
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

      let systemAppLogs = await SystemAppLogResource.find(filter, skip, limit, order);
      let systemAppLogsCount = await SystemAppLogResource.count(filter, order);
      if (systemAppLogs && systemAppLogsCount) {
        resolve({ data: systemAppLogs, total: systemAppLogsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemAppLogId = req.payload.id;
      let systemAppLogData = req.payload.data;
      let result = await SystemAppLogResource.updateById(systemAppLogId, systemAppLogData);
      if (result) {
        resolve(result);
      }
      reject('failed');
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
async function getAppLogAppUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let data = await SystemAppLogAppUserResource.customSearch(filter, skip, limit);
      let dataCount = await SystemAppLogAppUserResource.customCount(filter);
      if (data && data.length > 0 && dataCount) {
        // data = JSON.parse(JSON.stringify(data))
        data.dataValueBefore = JSON.parse(data[0].dataValueBefore);
        for (let i = 0; i < data.length; i++) {
          console.log('data[i]: ', data[i]);
          data[i].dataValueBefore = JSON.parse(data[i].dataValueBefore);
          data[i].dataValueAfter = JSON.parse(data[i].dataValueAfter);
        }
        console.log('data.dataValueBefore: ', data.dataValueBefore);
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
module.exports = {
  insert,
  find,
  updateById,
  findById,
  getAppLogAppUser,
};
