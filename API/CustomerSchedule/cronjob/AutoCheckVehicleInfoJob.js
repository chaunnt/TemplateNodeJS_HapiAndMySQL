/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const VRORGFunctions = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const { updateScheduleNote } = require('../../CustomerSchedule/CustomerScheduleFunctions');
const { compareUserVehicleWithVRData } = require('../../AppUserVehicle/AppUserVehicleFunctions');
const { NORMAL_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const { VERIFICATION_STATUS, NEW_VEHICLE_CERTIFICATE, VEHICLE_PLATE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');
const { fetchVehicleDataFromVrAPI } = require('../../CriminalVRApi/VRAPIFunctions');

async function checkingVehicleInfo() {
  Logger.info('CHECKING VEHICLE INFO');
  const notificationPromise = await _splitToBunchOfPromises();

  for (promiseBunch of notificationPromise) {
    await Promise.all(promiseBunch);
  }

  Logger.info('CHECKING VEHICLE INFO DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const scheduleBunch = await CustomerScheduleResourceAccess.customSearch(
      { CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW] },
      skip,
      limit,
    );
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
  // check lich do nhan vien dat lich
  if (schedule.createdBy) {
    const appUser = AppUsersResourceAccess.findById(schedule.createdBy);
    if (appUser && appUser.appUserRoleId > NORMAL_USER_ROLE) {
      return;
    }
  }

  const appUserVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates }, 0, 1);
  if (appUserVehicle && appUserVehicle.length > 0) {
    const vehicle = appUserVehicle[0];

    let isValidVehicleData = true;

    const regex = /^[A-Z]{2}-\d{7}$/;

    // kiem tra thong tin phuong tien neu chua verified
    if (vehicle.vehicleVerifiedInfo !== VERIFICATION_STATUS.VERIFIED) {
      if (regex.test(vehicle.certificateSeries)) {
        try {
          console.info(`fetchVehicleDataFromVrAPI _notifyToUser ${vehicle.vehicleIdentity}`);
          const _vehicleDataFromVr = await fetchVehicleDataFromVrAPI(vehicle.vehicleIdentity, vehicle.certificateSeries, vehicle.vehiclePlateColor);
          if (_vehicleDataFromVr && _vehicleDataFromVr.certificateExpiration) {
            // ngay het han khong trung khop
            if (_vehicleDataFromVr.certificateExpiration !== vehicle.vehicleExpiryDate) {
              isValidVehicleData = false;
            }

            let compareResult = compareUserVehicleWithVRData(data, _vehicleDataFromVr);
            const NO_ERROR = undefined;
            if (compareResult !== NO_ERROR) {
              // loai phuong tien khong trung khop
              isValidVehicleData = false;
            }
          } else {
            // khong co du lieu -> thong tin phuong tien sai
            isValidVehicleData = false;
          }
        } catch (error) {
          Logger.info('CALL API CHECKING VEHICLE ERROR !', error);
        }
      } else if (vehicle.certificateSeries !== NEW_VEHICLE_CERTIFICATE) {
        // phương tiện có số seri không hợp lệ
        isValidVehicleData = false;
      }
    }

    if (!isValidVehicleData) {
      const isCancelSchedule = await _handleCancelSchedule(schedule.scheduleNote, schedule.customerScheduleId);
      let title, message;

      if (isCancelSchedule) {
        title = 'Hủy lịch do thiếu thông tin xe';
        message = `Lịch hẹn đăng kiểm cho phương tiện ${schedule.licensePlates} của bạn đã bị hủy do không cập nhật thông tin xe.`;
      } else {
        title = 'Cảnh báo hủy lịch do thiếu thông tin xe';
        message = `Vui lòng bổ sung thông tin xe đầy đủ và chính xác, sau 3 ngày nếu không bổ sung đầy đủ thì lịch hẹn sẽ bị hủy.`;
      }

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

async function _handleCancelSchedule(scheduleNote, scheduleId) {
  let daysLeft = 3;

  if (scheduleNote) {
    const noteList = scheduleNote.split('\n');
    noteList.forEach(note => {
      if (note.includes('ngày để cập nhật thông tin xe chính xác')) {
        daysLeft = Number(note.trim().split(' ')[1]);
      }
    });
  }

  if (daysLeft > 0) {
    if (daysLeft !== 3) {
      daysLeft--;
    }
    const updateNote = updateScheduleNote('', _createNoteMessage(daysLeft));
    await CustomerScheduleResourceAccess.updateById(scheduleId, { scheduleNote: updateNote });
  } else {
    // huy lich
    await CustomerScheduleResourceAccess.updateById(scheduleId, { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED });
    return true;
  }
}

const _createNoteMessage = (dayCounter = 3) => `Còn ${dayCounter} ngày để cập nhật thông tin xe chính xác !`;

checkingVehicleInfo();

module.exports = {
  checkingVehicleInfo,
};
