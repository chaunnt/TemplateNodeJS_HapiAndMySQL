/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const GroupCustomerMessageResourceAccess = require('../resourceAccess/GroupCustomerMessageResourceAccess');
const Logger = require('../../../utils/logging');
const { MESSAGE_ERROR } = require('../CustomerMessageConstant');
const SystemMessageAutoSend = require('../cronjob/SystemMessageAutoSend');
const { getUserReadStatusForGroupMessage } = require('../CustomerMessageFunctions');
const UserGroupCustomerMessageResourceAccess = require('../resourceAccess/UserGroupCustomerMessageResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageData = req.payload;
      customerMessageData.stationsId = req.currentUser.stationsId;
      customerMessageData.staffId = req.currentUser.staffId;

      let result = await GroupCustomerMessageResourceAccess.insert(customerMessageData);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
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
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let result = await GroupCustomerMessageResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (result && result.length > 0) {
        let count = await GroupCustomerMessageResourceAccess.customCount(filter, startDate, endDate, searchText);
        resolve({ data: result, total: count[0].count });
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
      let customerMessageId = req.payload.id;
      let customerMessageData = req.payload.data;
      let dataBefore = await GroupCustomerMessageResourceAccess.findById(customerMessageId);
      let result = await GroupCustomerMessageResourceAccess.updateById(customerMessageId, customerMessageData);

      if (result) {
        SystemAppLogFunctions.logCustomerRecordChanged(dataBefore, customerMessageData, req.currentUser);
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
      let customerMessageId = req.payload.id;
      let result = await GroupCustomerMessageResourceAccess.findById(customerMessageId);

      if (!result) {
        reject(MESSAGE_ERROR.MESSAGE_NOT_FOUND);
      } else {
        resolve(result);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (e === MESSAGE_ERROR.MESSAGE_NOT_FOUND) {
        reject(MESSAGE_ERROR.MESSAGE_NOT_FOUND);
      } else {
        reject('failed');
      }
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let result = await GroupCustomerMessageResourceAccess.updateById(id, {
        isDeleted: 1,
      });
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetListGroupCustomerMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let result = await GroupCustomerMessageResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (result && result.length > 0) {
        let count = await GroupCustomerMessageResourceAccess.customCount(filter, startDate, endDate, searchText);
        if (req.currentUser && req.currentUser.appUserId) {
          for (let i = 0; i < result.length; i++) {
            result[i].isRead = await getUserReadStatusForGroupMessage(req.currentUser.appUserId, result[i].groupCustomerMessageId);
          }
        }
        resolve({ data: result, total: count[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userReadGroupCustomerMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await UserGroupCustomerMessageResourceAccess.insert({
        appUserId: req.currentUser.appUserId,
        groupCustomerMessageId: req.payload.id,
      });
      if (result) {
        resolve(result);
      } else {
        resolve('OK');
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
  userGetListGroupCustomerMessage,
  userReadGroupCustomerMessage,
  updateById,
  findById,
  deleteById,
};
