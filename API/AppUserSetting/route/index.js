/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserSetting = require('./AppUserSettingRoute');

module.exports = [
  { method: 'POST', path: '/AppUserSetting/user/update', config: AppUserSetting.userUpdateSettingById },
  { method: 'POST', path: '/AppUserSetting/user/findById', config: AppUserSetting.findById },
];
