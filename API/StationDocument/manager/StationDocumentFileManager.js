/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'user strict';
const StationDocumentFileResourceAccess = require('../resourceAccess/StationDocumentFileResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { notifyNewDocumentToAppUser } = require('../StationDocumentFunctions');
const { publishJson } = require('../../../ThirdParty/MQTTBroker/MQTTBroker');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let res = await StationDocumentFileResourceAccess.insert(data);
      if (res) {
        await notifyNewDocumentToAppUser(data.documentTitle);
        // send new document to user via socket
        await publishJson('GENERAL_STATION', data);
        resolve(res);
      } else {
        reject('failed');
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
      const updateData = req.payload.data;

      const result = await StationDocumentFileResourceAccess.updateById(id, updateData);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
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
      const id = req.payload.id;

      const oldRecord = await StationDocumentFileResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationDocumentFileResourceAccess.deleteById(id);
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
  updateById,
  insert,
  deleteById,
};
