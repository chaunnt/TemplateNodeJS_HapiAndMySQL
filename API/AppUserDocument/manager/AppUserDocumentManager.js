/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserDocumentResourceAccess = require('../resourceAccess/AppUserDocumentResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND, POPULAR_ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const searchText = req.payload.searchText;

      let recordList = await AppUserDocumentResourceAccess.customSearch(filter, skip, limit, searchText, order);
      if (recordList && recordList.length > 0) {
        let recordCount = await AppUserDocumentResourceAccess.customCount(filter, searchText, order);
        if (recordCount > 0) {
          return resolve({ data: recordList, total: recordCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await AppUserDocumentResourceAccess.findById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await AppUserDocumentResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let documentData = req.payload;

      const result = await AppUserDocumentResourceAccess.insert(documentData);
      if (result) {
        resolve(result);
      } else {
        reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserAddDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let documentData = req.payload;

      const result = await AppUserDocumentResourceAccess.insert(documentData);
      if (result) {
        resolve(result);
      } else {
        reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserDeleteDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const appUserId = req.payload.appUserId;
      const appUserDocumentId = req.payload.appUserDocumentId;

      const documentRecord = await AppUserDocumentResourceAccess.find({ appUserDocumentId: appUserDocumentId, appUserId: appUserId }, 0, 1);

      if (!documentRecord || documentRecord.length === 0) {
        return reject(NOT_FOUND);
      }

      let result = await AppUserDocumentResourceAccess.deleteById(appUserDocumentId);

      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      let updateResult = await AppUserDocumentResourceAccess.updateById(id, data);
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

module.exports = {
  find,
  findById,
  deleteById,
  insert,
  updateById,
  advanceUserAddDocument,
  advanceUserDeleteDocument,
};
