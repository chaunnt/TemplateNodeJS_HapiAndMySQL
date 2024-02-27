/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const CustomerScheduleView = require('../resourceAccess/CustomerScheduleView');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');

async function notifyExpiredVehicle() {
  Logger.info('CHECKING VEHICLE EXPIRATION DATE');
  const notificationPromise = await _splitToBunchOfPromises();

  for (promiseBunch of notificationPromise) {
    await Promise.all(promiseBunch);
  }

  Logger.info('CHECKING VEHICLE EXPIRATION DATE DONE');

  process.exit();
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const scheduleBunch = await CustomerScheduleView.customSearch({ CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED }, skip, limit);
    if (scheduleBunch && scheduleBunch.length > 0) {
      const promiseBunch = scheduleBunch.map(schedule => _notifyToUser(schedule));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _notifyToUser(schedule) {
  const appUserVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates }, 0, 1);
  if (appUserVehicle && appUserVehicle.length > 0) {
    const vehicle = appUserVehicle[0];

    let isEarlyBooking = false;

    const vehicleExpirationDate = vehicle.vehicleExpiryDate;

    if (vehicleExpirationDate) {
      const DATE_LIMIT = 20;
      const differDateCount = moment(vehicleExpirationDate, 'DD/MM/YYYY').diff(moment(schedule.dateSchedule, 'DD/MM/YYYY'), 'days');
      if (differDateCount > DATE_LIMIT) {
        isEarlyBooking = true;
      }
    }
    if (isEarlyBooking) {
      const title = 'Thông báo đặt lịch sớm';
      const message = `Thông tin phương tiện BSX ${vehicle.vehicleIdentity} có ngày hết hạn là ${vehicleExpirationDate}, thời gian hết hạn lớn hơn 20 ngày so với thời gian đăng ký kiểm định.`;
      await CustomerMessageFunctions.addMessageCustomer(
        title,
        undefined,
        message,
        vehicle.vehicleIdentity,
        vehicle.appUserId,
        undefined,
        vehicle.appUserVehicleId,
        undefined,
        schedule.customerScheduleId,
      );
    }
  }
}

notifyExpiredVehicle();

module.exports = {
  notifyExpiredVehicle,
};
