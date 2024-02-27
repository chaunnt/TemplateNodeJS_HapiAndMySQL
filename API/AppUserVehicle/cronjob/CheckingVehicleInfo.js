/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY } = require('../../AppUsers/AppUsersConstant');
const { NEW_VEHICLE_CERTIFICATE, VERIFICATION_STATUS, VEHICLE_PLATE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');
const VRORGFunctions = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const { NORMAL_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const { syncVehicleInfo } = require('../../AppUserVehicle/AppUserVehicleFunctions');

async function checkingVehicleData() {
  Logger.info('CHECKING USER VEHICLE INFO');
  const vehiclePromise = await _splitToBunchOfPromises();

  for (promiseBunch of vehiclePromise) {
    await Promise.all(promiseBunch);
  }
  Logger.info('CHECKING USER VEHICLE INFO DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const scheduleBunch = await CustomerScheduleResourceAccess.customSearch(
      { CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED] },
      skip,
      limit,
    );
    if (scheduleBunch && scheduleBunch.length > 0) {
      const promiseBunch = scheduleBunch.map(schedule => _updateVehicle(schedule));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _updateVehicle(schedule) {
  // check lich do nhan vien dat lich
  if (schedule.createdBy) {
    const appUser = AppUsersResourceAccess.findById(schedule.createdBy);
    if (appUser && appUser.appUserRoleId > NORMAL_USER_ROLE) {
      return;
    }
  }
  // check lich do tai khoan doanh nghiep dat
  if (schedule.appUserId) {
    const appUser = AppUsersResourceAccess.findById(schedule.appUserId);
    if (appUser && appUser.appUserCategory === APP_USER_CATEGORY.COMPANY_ACCOUNT) {
      return;
    }
  }

  const appUserVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates }, 0, 1);

  if (appUserVehicle && appUserVehicle.length > 0) {
    const vehicle = appUserVehicle[0];

    await syncVehicleInfo(vehicle);
  }
}

checkingVehicleData();

module.exports = {
  checkingVehicleData,
};
