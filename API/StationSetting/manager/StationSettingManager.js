/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationSettingResourceAccess = require('../resourceAccess/StationSettingResourceAccess');
const { NOT_FOUND, API_FAILED } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { getSettingByStationId } = require('../StationSettingFunction');

async function advanceUserFindById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentStation = req.currentUser.stationsId;

      const stationSetting = await getSettingByStationId(currentStation);

      return resolve(stationSetting);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentStationId = req.currentUser.stationsId;
      let updateData = req.payload.data;

      // Kiểm tra có setting không
      const settingExisted = await StationSettingResourceAccess.findById(currentStationId);

      if (!settingExisted) {
        return reject(NOT_FOUND);
      }

      let result = await StationSettingResourceAccess.updateById(currentStationId, updateData);

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

module.exports = {
  advanceUserUpdateById,
  advanceUserFindById,
};
