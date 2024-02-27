/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserVehicleSetting = require('./AppUserVehicleSettingRoute');

module.exports = [
  { method: 'POST', path: '/AppUserVehicleSetting/user/userUpdateSettingVehicle', config: AppUserVehicleSetting.userUpdateSettingVehicle },
];
