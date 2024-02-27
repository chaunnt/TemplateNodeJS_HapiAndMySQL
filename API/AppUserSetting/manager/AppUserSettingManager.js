/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserSettingAccess = require('../resourceAccess/AppUserSettingAccess');
const { NOT_FOUND } = require('../../Common/CommonConstant');
const { addVehicleSetting } = require('../AppUserSettingFunctions');

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const appUserId = req.payload.id;

      // Kiểm tra setting của user đã có chưa
      const userSettingExisted = await AppUserSettingAccess.findById(appUserId);

      // Chưa có thì tạo mới setting cho user với các giá trị mặt định 0
      if (!userSettingExisted) {
        const result = await AppUserSettingAccess.insert({ appUserId });

        if (result) {
          // Lấy setting vừa mới tạo
          const userSetting = await AppUserSettingAccess.findById(appUserId);
          return resolve(userSetting);
        }

        return reject('failed');
      } else {
        return resolve(userSettingExisted);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function userUpdateSettingById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let userSettingData = req.payload.data;

      // Kiểm tra có setting của user trong database không
      const previousRecord = await AppUserSettingAccess.findById(appUserId);

      if (!previousRecord) {
        return reject(NOT_FOUND);
      } else {
        let result = await AppUserSettingAccess.updateById(appUserId, userSettingData);

        if (result) {
          const userSetting = await AppUserSettingAccess.findById(appUserId);

          await addVehicleSetting(appUserId, userSetting);

          return resolve(userSetting);
        }

        return reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

module.exports = {
  userUpdateSettingById,
  findById,
};
