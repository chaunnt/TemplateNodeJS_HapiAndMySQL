/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const SystemAppLogChangeReceiptResourceAccess = require('../SystemAppLogChangeReceipt/resourceAccess/SystemAppLogChangeReceiptResourceAccess');

const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

async function logCustomerReceiptChanged(dataBefore, dataAfter, picUser, customerReceiptId) {
  let beforeObjKeys = Object.keys(dataBefore);
  let afterObjKeys = Object.keys(dataAfter);
  if (afterObjKeys.length <= 0 || beforeObjKeys.length <= 0) {
    return;
  }
  let changeLogs = [];
  for (let i = 0; i < beforeObjKeys.length; i++) {
    const key = beforeObjKeys[i];
    if (dataAfter[key] && dataAfter[key] !== dataBefore[key]) {
      let changedData = {
        dataValueBefore: dataBefore[key],
        dataValueAfter: dataAfter[key],
        dataFieldName: key,
      };

      if (customerReceiptId) {
        changedData.customerReceiptId = customerReceiptId;
      }

      if (picUser.staffId) {
        changedData.dataPICName = picUser.username;
        changedData.dataPICId = picUser.staffId;
        changedData.dataPICTable = StaffResource.modelName;
      } else if (picUser.appUserId) {
        changedData.dataPICName = picUser.username;
        changedData.dataPICId = picUser.appUserId;
        changedData.dataPICTable = AppUserResource.modelName;
      }

      changeLogs.push(changedData);
    }
  }

  if (changeLogs.length > 0) {
    await SystemAppLogChangeReceiptResourceAccess.insert(changeLogs);
  }
}

module.exports = {
  logCustomerReceiptChanged,
};
