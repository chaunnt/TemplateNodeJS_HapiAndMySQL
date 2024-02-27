/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppUserVehicleSettingAccess = require('../AppUserVehicleSetting/resourceAccess/AppUserVehicleSettingAccess');
const AppUserVehicleResourceAccess = require('../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');

const addVehicleSetting = async (appUserId, userSetting) => {
  const vehicleOfUser = await AppUserVehicleResourceAccess.find({
    appUserId: appUserId,
  });

  vehicleOfUser.map(async vehicle => {
    const vehicleSettingExisted = await AppUserVehicleSettingAccess.findById(vehicle.appUserVehicleId);

    if (vehicleSettingExisted) {
      await AppUserVehicleSettingAccess.updateById(vehicle.appUserVehicleId, {
        enableAutoCheckBHTDS: userSetting.enableAutoCheckBHTDS,
        enableAutoCheckBHTV: userSetting.enableAutoCheckBHTV,
      });
    } else {
      await AppUserVehicleSettingAccess.insert({
        appUserVehicleId: vehicle.appUserVehicleId,
        appUserId: vehicle.appUserId,
        vehicleIdentity: vehicle.vehicleIdentity,
        enableAutoCheckBHTDS: userSetting.enableAutoCheckBHTDS,
        enableAutoCheckBHTV: userSetting.enableAutoCheckBHTV,
      });
    }
  });
};

module.exports = {
  addVehicleSetting,
};
