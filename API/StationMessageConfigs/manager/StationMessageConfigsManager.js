/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationMessageConfigsAccess = require('../resourceAccess/StationMessageConfigsAccess');
const { NOT_FOUND, API_FAILED, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { SETTING_STATUS } = require('../StationMessageConfigsConstant');

let defaultData = {
  enableAutoSentNotiBefore30Days: SETTING_STATUS.DISABLE,
  enableAutoSentNotiBefore15Days: SETTING_STATUS.DISABLE,
  enableAutoSentNotiBefore7Days: SETTING_STATUS.DISABLE,
  enableAutoSentNotiBefore3Days: SETTING_STATUS.DISABLE,
  enableAutoSentNotiBefore1Days: SETTING_STATUS.DISABLE,
  enableAutoSentNotiBeforeOtherDays: SETTING_STATUS.DISABLE,
  enableNotiByAPNS: SETTING_STATUS.DISABLE,
  enableNotiBySmsCSKH: SETTING_STATUS.DISABLE,
  enableNotiByZaloCSKH: SETTING_STATUS.DISABLE,
  enableNotiBySMSRetry: SETTING_STATUS.DISABLE,
  enableNotiByAutoCall: SETTING_STATUS.DISABLE,
  messageTemplateAPNS: null,
  messageTemplateSmsCSKH: null,
  messageTemplateZaloCSKH: null,
  messageTemplateSMSRetry: null,
  messageTemplateAutoCall: null,
};

async function advanceUserGetStationMessageConfigs(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationsId = req.currentUser.stationsId;

      // Kiểm tra có setting của trạm có trong database không
      const settingExisted = await StationMessageConfigsAccess.findById(stationsId);

      if (!settingExisted) {
        //Chưa có setting thì thêm mới settting
        const newSetting = await StationMessageConfigsAccess.insert({
          stationsId: stationsId,
          ...defaultData,
        });

        if (newSetting) {
          const settingMsgConfigs = await StationMessageConfigsAccess.findById(newSetting[0]);
          return resolve(settingMsgConfigs);
        }

        return reject(NOT_FOUND);
      }

      return resolve(settingExisted);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateStationMessageConfigs(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let settingData = req.payload.data;
      const stationsId = req.currentUser.stationsId;

      // Kiểm tra có setting của trạm có trong database không
      const settingExisted = await StationMessageConfigsAccess.findById(stationsId);

      if (!settingExisted) {
        return reject(NOT_FOUND);
      }

      // Không cho update setting của trạm khác
      if (stationsId !== settingExisted.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      let result = await StationMessageConfigsAccess.updateById(stationsId, settingData);

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
  advanceUserUpdateStationMessageConfigs,
  advanceUserGetStationMessageConfigs,
};
