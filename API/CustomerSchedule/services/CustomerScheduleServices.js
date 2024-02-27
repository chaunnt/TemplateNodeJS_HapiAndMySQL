/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Logger = require('../../../utils/logging');

// ResourceAccess
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
// Functions
const CustomerScheduleFunctions = require('../CustomerScheduleFunctions');
const StationsFunctions = require('../../Stations/StationsFunctions');

// Constants
const { SCHEDULE_ERROR, INVALID_PAST_DATE_ERROR } = require('../CustomerScheduleConstants');
const { CUSTOMER_RECORD_ERROR } = require('../../CustomerRecord/CustomerRecordConstants');
const { USER_VEHICLE_ERROR } = require('../../AppUserVehicle/AppUserVehicleConstant');

async function createNewSchedule(customerScheduleData, currentUser) {
  return new Promise(async (resolve, reject) => {
    try {
      // Lấy danh sách dịch vụ khách hàng đặt của lịch
      let _stationServicesList;
      if (customerScheduleData.stationServicesList) {
        _stationServicesList = customerScheduleData.stationServicesList;
        delete customerScheduleData.stationServicesList;
      }

      // Kiểm tra ngày đặt lịch không hợp lệ
      const isInvalidDate = await CustomerScheduleFunctions.isValidScheduleDate(customerScheduleData.dateSchedule);
      if (isInvalidDate) {
        console.error(INVALID_PAST_DATE_ERROR);
        return reject(INVALID_PAST_DATE_ERROR);
      }

      // Xử lí thêm sửa xóa input data hợp lệ
      await CustomerScheduleFunctions.processDataInputOfCustomerSchedule(customerScheduleData, currentUser);

      // Kiểm tra biển số xe có lịch đang chờ thì không cho đặt nữa
      await CustomerScheduleFunctions.checkExistedVehicleOfUser(customerScheduleData);

      // Kiểm tra trạm người dùng muốn đặt lịch có hợp lệ không
      let selectedStation = await StationsResourceAccess.findById(customerScheduleData.stationsId);
      if (!selectedStation) {
        console.error(`SCHEDULE_ERROR.INVALID_STATION`);
        return reject(SCHEDULE_ERROR.INVALID_STATION);
      }

      // Kiểm tra xem người dùng đã tồn tại=> Chsưa thì tạo mới
      let appUserAccount = await CustomerScheduleFunctions.checkUserExistenceWhenScheduling(customerScheduleData);

      // Thêm người tạo lịch cho lịch hẹn
      if (currentUser) {
        customerScheduleData.createdBy = currentUser.appUserId;
      } else if (appUserAccount) {
        currentUser = appUserAccount;
        customerScheduleData.createdBy = appUserAccount.appUserId;
      }

      // Kiểm tra tài khoản đã có phương tiện chưa => Chưa thì tạo mới
      await CustomerScheduleFunctions.checkUserVehicleExistedAndAttachInfo(customerScheduleData);

      // Xóa cái field không cần thiết để tạo lịch hẹn
      delete customerScheduleData.vehicleSubType;
      delete customerScheduleData.vehicleSubCategory;
      delete customerScheduleData.certificateSeries;

      //Kiểm tra tài khoản người dùng có hợp lệ để đặt lịch không
      await CustomerScheduleFunctions.restrictUserBooking(currentUser, customerScheduleData, selectedStation);

      let result = await CustomerScheduleFunctions.addNewCustomerSchedule(customerScheduleData, selectedStation, currentUser);

      if (result) {
        // auto create customerRecord
        const customerScheduleId = result[0];

        // Tự động tạo customerRecord khi lịch được xác nhận
        await CustomerScheduleFunctions.autoCreateCustomerRecord(customerScheduleId);

        // Lưu danh sách dịch vụ
        await CustomerScheduleFunctions.insertScheduleServices(_stationServicesList, customerScheduleId, selectedStation);

        //Tạo order cho lịch hẹn
        await CustomerScheduleFunctions.createOrderFromSchedule(customerScheduleId, customerScheduleData);

        //Kiểm tra phạt nguội bên CSGT và VR
        await CustomerScheduleFunctions.checkCriminalFromCSGTAndVR(customerScheduleId, selectedStation);

        // Gửi thông báo có khách hàng đặt lịch đến tài khoản nhân viên của trạm
        await CustomerScheduleFunctions.notifyEmployeeAboutCustomerSchedule(customerScheduleData);

        resolve(result);
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await CustomerScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, currentUser.appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = currentUser ? currentUser.appUserId : null;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await CustomerScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject('UNKNOWN_ERROR');
      }
    }
  });
}

module.exports = {
  createNewSchedule,
};
