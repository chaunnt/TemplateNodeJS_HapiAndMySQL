/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserVehicleSettingAccess = require('../resourceAccess/AppUserVehicleSettingAccess');
const { NOT_FOUND, API_FAILED, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

async function userUpdateSettingVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserVehicleId = req.payload.id;
      let userSettingData = req.payload.data;
      const appUserId = req.currentUser.appUserId;

      // Kiểm tra có setting của user trong database không
      const settingExisted = await AppUserVehicleSettingAccess.findById(appUserVehicleId);

      if (!settingExisted) {
        //Chưa có setting thì thêm mới settting
        const settingVehicle = await AppUserVehicleSettingAccess.insert({
          appUserVehicleId: appUserVehicleId,
          ...userSettingData,
        });
        return resolve(settingVehicle);
      }

      // Không cho update setting của người khác
      if (appUserId !== settingExisted.appUserId) {
        return reject(MISSING_AUTHORITY);
      }

      // Không cho update appUserId và vehicleIdentity
      delete userSettingData.appUserId;
      delete userSettingData.vehicleIdentity;

      let result = await AppUserVehicleSettingAccess.updateById(settingExisted.appUserVehicleId, userSettingData);

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
  userUpdateSettingVehicle,
};
