/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserWorkInfoResourceAccess = require('./resourceAccess/AppUserWorkInfoResourceAccess');
async function addOrUpdateUserWorkInfo(appUserId, appUserWorkInfo) {
  let _existingWorkInfo = await AppUserWorkInfoResourceAccess.findById(appUserId);
  if (_existingWorkInfo) {
    let result = await AppUserWorkInfoResourceAccess.updateById(appUserId, appUserWorkInfo);
    return result;
  } else {
    appUserWorkInfo.appUserId = appUserId;
    let result = await AppUserWorkInfoResourceAccess.insert(appUserWorkInfo);
    return result;
  }
}
module.exports = {
  addOrUpdateUserWorkInfo,
};
