/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationSetting = require('./StationSettingRoute');

module.exports = [
  { method: 'POST', path: '/StationSetting/advanceUser/findById', config: StationSetting.advanceUserFindById },
  { method: 'POST', path: '/StationSetting/advanceUser/updateById', config: StationSetting.advanceUserUpdateById },
];
