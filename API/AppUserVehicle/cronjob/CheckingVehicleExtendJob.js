/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const { VEHICLE_TYPE, VEHICLE_EXTENDS, VERIFICATION_STATUS } = require('../AppUserVehicleConstant');
const { syncVehicleInfo } = require('../../AppUserVehicle/AppUserVehicleFunctions');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { SCHEDULE_STATUS, SCHEDULE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const moment = require('moment');
const { makeHashFromData } = require('../../ApiUtils/utilFunctions');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

async function checkingExtendVehicle() {
  Logger.info(`CHECKING VEHICLE EXTENDS ${new Date()}`);

  let skip = 0;
  let limit = 50;

  while (true) {
    const vehicleBunch = await AppUserVehicleResourceAccess.find(
      {
        vehicleType: VEHICLE_TYPE.CAR,
        vehicleVerifiedInfo: VERIFICATION_STATUS.VERIFIED,
      },
      skip,
      limit,
    );
    if (vehicleBunch && vehicleBunch.length > 0) {
      const promiseBunch = vehicleBunch.map(vehicle => _extendScheduleForVehicle(vehicle));
      await Promise.all(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  Logger.info(`CHECKING VEHICLE EXTENDS DONE ${new Date()}`);
  process.exit();
}

async function _extendScheduleForVehicle(vehicle) {
  console.info(`_extendScheduleForVehicle ${vehicle.vehicleIdentity} - ${vehicle.vehicleExtendLicense}`);
  if (vehicle.vehicleExtendLicense !== null) {
    return;
  }

  const updateData = await syncVehicleInfo(vehicle);

  if (updateData.vehicleExtendLicense === VEHICLE_EXTENDS.HAVE) {
    console.info(`Extend Vehicle ${vehicle.vehicleIdentity}`);
    // co gia han thi gui thong bao
    const title = 'Thông báo gia hạn phương tiện';
    const message = `Phương tiện của bạn được gia hạn đăng kiểm. Vui lòng cập nhật thông tin phương tiện qua ứng dụng TTDK hoặc website (https://ttdk.com.vn) để tra cứu thông tin gia hạn.`;

    await _notifyToUser(title, message, vehicle);

    // kiem tra co lich hen va dat lich moi
    const bookingSchedules = await CustomerScheduleResourceAccess.customSearch(
      {
        licensePlates: vehicle.vehicleIdentity,
        CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW],
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      },
      0,
      1,
    );
    if (bookingSchedules && bookingSchedules.length > 0) {
      const bookingSchedule = bookingSchedules[0];

      // huy lich
      const cancelReason = 'gia hạn lịch hẹn';
      await CustomerScheduleFunctions.cancelUserSchedule(bookingSchedule.appUserId, bookingSchedule.customerScheduleId, cancelReason);

      const newSchedule = await CustomerScheduleFunctions.rescheduleToDate(bookingSchedule);

      if (newSchedule) {
        // thong bao doi lich
        const title = 'Thông báo dời lịch hẹn';
        const message =
          'Lịch hẹn của bạn đã được dời lại do xe của bạn đã được gia hạn đăng kiểm. Vui lòng kiểm tra lại thông tin, nếu bạn cần đăng kiểm thì hãy đặt lại lịch hẹn khác';
        await _notifyToUser(title, message, vehicle);
      }
    }
  }
}

async function _notifyToUser(title, message, vehicle) {
  await CustomerMessageFunctions.addMessageCustomer(
    title,
    undefined,
    message,
    vehicle.vehicleIdentity,
    vehicle.appUserId,
    undefined,
    vehicle.appUserVehicleId,
  );
}

checkingExtendVehicle();

module.exports = {
  checkingExtendVehicle,
};
