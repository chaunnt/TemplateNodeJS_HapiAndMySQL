/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppLogResource = require('./resourceAccess/SystemAppChangedLogResourceAccess');
const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const SystemAppLogAppUserResource = require('./resourceAccess/SystemAppLogAppUserResourceAccess');
const Logger = require('../../utils/logging');
const moment = require('moment');
async function logAppDataChanged(dataBefore, dataAfter, picUser, tableName) {
  console.log('dataAfter: ', dataAfter);
  console.log('dataBefore: ', dataBefore);
  if (dataBefore.gameConfigWinRate || dataAfter.gameConfigWinRate) {
    let changedData = {
      dataValueBefore: dataBefore,
      dataValueAfter: dataAfter,
      dataTableName: tableName,
      dataFieldName: 'gameConfigWinRate',
    };
    if (picUser.staffId) {
      changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
      changedData.dataPICId = picUser.staffId;
      changedData.dataPICTable = StaffResource.modelName;
    } else if (picUser.appUserId) {
      changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
      changedData.dataPICId = picUser.appUserId;
      changedData.dataPICTable = AppUserResource.modelName;
    }
    await AppLogResource.insert(changedData);
  } else {
    let beforeObjKeys = Object.keys(dataBefore);
    console.log('beforeObjKeys: ', beforeObjKeys);
    let afterObjKeys = Object.keys(dataAfter);
    console.log('afterObjKeys: ', afterObjKeys);
    if (afterObjKeys.length <= 0 || beforeObjKeys.length <= 0) {
      Logger.info(`Can not logAppDataChanged afterObjKeys ${afterObjKeys.length} - beforeObjKeys ${beforeObjKeys}`);
      return;
    }
    let changeLogs = [];
    for (let i = 0; i < beforeObjKeys.length; i++) {
      const key = beforeObjKeys[i];
      if (dataAfter[key] && dataAfter[key] !== dataBefore[key]) {
        let changedData = {
          dataValueBefore: dataBefore[key],
          dataValueAfter: dataAfter[key],
          dataTableName: tableName,
          dataFieldName: key,
        };

        if (picUser.staffId) {
          changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
          changedData.dataPICId = picUser.staffId;
          changedData.dataPICTable = StaffResource.modelName;
        } else if (picUser.appUserId) {
          changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
          changedData.dataPICId = picUser.appUserId;
          changedData.dataPICTable = AppUserResource.modelName;
        }

        changeLogs.push(changedData);
      }
    }
    if (changeLogs.length > 0) {
      await AppLogResource.insert(changeLogs);
    }
  }
}

async function logCustomerRecordChanged(dataBefore, dataAfter, picUser) {
  await logAppDataChanged(dataBefore, dataAfter, picUser, CustomerRecordResource.modelName);
}

async function logAppUserMembershipChanged(dataBefore, dataAfter, picUser) {
  await logAppDataChanged(dataBefore, dataAfter, picUser, AppUserResource.modelName);
}

module.exports = {
  logCustomerRecordChanged,
  logAppDataChanged,
  logAppUserMembershipChanged,
};
