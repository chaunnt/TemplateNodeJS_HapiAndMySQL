/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleViewHistory = require('../resourceAccess/CustomerScheduleViewHistory');
const CustomerScheduleView = require('../resourceAccess/CustomerScheduleView');
const ScheduleFunctions = require('../CustomerScheduleFunctions');
const excelFunction = require('../../../ThirdParty/Excel/excelFunction');
const { padLeadingZeros, isNotEmptyStringValue, isValidValue, isNotValidValue } = require('../../ApiUtils/utilFunctions');
const Logger = require('../../../utils/logging');
const CommonFunctions = require('../../Common/CommonFunctions');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const CustomerRecordResourceAccess = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const AppUserDevicesFunctions = require('../../AppUserDevices/AppUserDevicesFunctions');
const CustomerRecordFunctions = require('../../CustomerRecord/CustomerRecordFunctions');
const CustomerCriminalRecordFunctions = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
const CustomerCriminalResourceAccess = require('../../CustomerCriminalRecord/resourceAccess/CustomerCriminalRecordResourceAccess');
const OrderResourceAccess = require('../../Order/resourceAccess/OrderResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { makeHashFromData } = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const { logCustomerScheduleChanged } = require('../../SystemAppLogChangeSchedule/SystemAppLogChangeScheduleFunctions');
const SystemAppLogChangeScheduleResourceAccess = require('../../SystemAppLogChangeSchedule/resourceAccess/SystemAppLogChangeScheduleResourceAccess');
const CustomerScheduleAttachmentResourceAccess = require('../../CustomerScheduleAttachment/resourceAccess/CustomerScheduleAttachmentResourceAccess');
const ScheduleServicesMappingResourceAccess = require('../../StationServices/resourceAccess/ScheduleServicesMappingResourceAccess');
const CustomerScheduleChangeResourceAccess = require('../resourceAccess/CustomerScheduleChangeResourceAccess');
const AppUserVehicleFunctions = require('../../AppUserVehicle/AppUserVehicleFunctions');
const MessageCustomerMarketingFunctions = require('../../MessageCustomerMarketing/MessageCustomerMarketingFunctions');
const { createNewUser } = require('../../AppUsers/AppUsersFunctions');
const {
  SCHEDULE_ERROR,
  SCHEDULE_STATUS,
  VEHICLE_TYPE,
  PERFORMER_TYPE,
  SCHEDULE_TYPE,
  LICENSE_PLATE_COLOR,
  VEHICLE_TYPES,
  SCHEDULE_NOTE,
  SET_HOURS,
  INVALID_PAST_DATE_ERROR,
} = require('../CustomerScheduleConstants');
const { UNKNOWN_ERROR, MISSING_AUTHORITY, NOT_FOUND, POPULAR_ERROR } = require('../../Common/CommonConstant');
const {
  STATION_STATUS,
  AVAILABLE_STATUS,
  AUTO_CONFIRM_SCHEDULE,
  BOOKING_MIXTURE_SCHEDULE,
  SETTING_STATUS,
} = require('../../Stations/StationsConstants');
const {
  VERIFICATION_STATUS,
  USER_VEHICLE_ERROR,
  VEHICLE_PLATE_TYPE,
  NEW_VEHICLE_CERTIFICATE,
  CRIMINAL,
  STRICT_MODE,
} = require('../../AppUserVehicle/AppUserVehicleConstant');
const { BOOKING_PHONE_STATUS, USER_VERIFY_PHONE_NUMBER_STATUS, APP_USER_CATEGORY } = require('../../AppUsers/AppUsersConstant');

const { SERVICE_TYPES } = require('../../StationServices/StationServicesConstants');
const StationServicesResourceAccess = require('../../StationServices/resourceAccess/StationServicesResourceAccess');

const { STATIONS_AREA } = require('../../Stations/data/StationsArea');
const { DATE_DISPLAY_FORMAT, DATE_DB_SORT_FORMAT, CUSTOMER_RECORD_ERROR } = require('../../CustomerRecord/CustomerRecordConstants');
const { STATION_ADMIN_ROLE, NORMAL_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');

const { VR_VEHICLE_TYPE } = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const FirebaseNotificationFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const CustomerScheduleServices = require('../services/CustomerScheduleServices');

const {
  createOrderBySchedule,
  updateOrderStatus,
  getOrderDetail,
  createOrderRoadFeeBySchedule,
  createOrderInspectionFeeBySchedule,
  createOrderInsuranceFeeBySchedule,
} = require('../../Order/OrderFunctions');
const { updatePermissionForFilter } = require('../../Stations/StationsFunctions');
const StationsFunctions = require('../../Stations/StationsFunctions');
const CustomerReceiptResourceAccess = require('../../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const { CUSTOMER_RECEIPT_STATUS } = require('../../CustomerReceipt/CustomerReceiptConstant');
const OrderItemResourceAccess = require('../../Order/resourceAccess/OrderItemResourceAccess');
const { addStationCustomer } = require('../../StationCustomer/StationCustomerFunctions');
const { MESSAGE_TYPE } = require('../../MessageCustomerMarketing/MessageCustomerMarketingConstant');
let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}
const CustomerScheduleCriminalMapping = require('../../CustomerCriminalRecord/resourceAccess/CustomerScheduleCriminalMapping');

async function _attachListCrimeOfSchedule(schedules) {
  for (let schedule of schedules) {
    let listCrime = await CustomerScheduleCriminalMapping.find({ customerScheduleId: schedule.customerScheduleId }, 0, 100);
    let criminalRecordIds = listCrime.map(crime => crime.customerCriminalRecordId);
    schedule.crimeIds = criminalRecordIds;
  }
}

async function _extractUserDeviceInfoFromHeaders(req) {
  // save ip address
  const userAgent = req.headers['user-agent'];
  const userDeviceData = AppUserDevicesFunctions.getUserDeviceFromUserAgent(userAgent);
  const userDeviceInfo = { ...userDeviceData };
  return userDeviceInfo;
}
function handleErrorResponse(error, reject) {
  Logger.error(__filename, error);
  if (Object.keys(SCHEDULE_ERROR).indexOf(error) >= 0) {
    reject(error);
  } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(error) >= 0) {
    reject(error);
  } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(error) >= 0) {
    reject(error);
  } else {
    reject(UNKNOWN_ERROR);
  }
}

async function _notifyConfirmScheduleToCustomer(phone, scheduleData, stationData, scheduleId, appUserVehicleId) {
  const scheduleTime = ScheduleFunctions.modifyScheduleTime(scheduleData.time);
  let message = `TTDK.COM.VN ${stationData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được xác nhận bởi nhân viên trung tâm. Thời gian hẹn của quý khách là ${scheduleTime} ${scheduleData.dateSchedule} và mã lịch hẹn là ${scheduleData.scheduleCode}. Vui lòng đến đúng khung giờ đã hẹn để tránh ùn tắc, cản trở giao thông. Trường hợp quý khách đến muộn thì lịch hẹn sẽ bị hủy mà không báo trước.`;
  await CustomerMessageFunctions.createNewUserMessageByStation(
    phone, //khong gui sms
    stationData.stationsId,
    message,
    scheduleData.licensePlates,
    scheduleData.appUserId,
    scheduleId,
    appUserVehicleId,
  );
}

async function _notifyCancelScheduleToCustomer(existingSchedule, reason) {
  let selectedStation = await StationsResourceAccess.findById(existingSchedule.stationsId);

  let _hotline = selectedStation.stationsHotline ? selectedStation.stationsHotline : '';
  let message = ScheduleFunctions.generateMessageToCancelSchedule(selectedStation.stationCode, existingSchedule.licensePlates, reason, _hotline);

  const NO_PHONE_NUMBER = undefined; //khong can gui SMS
  const title = `Lịch hẹn BSX ${existingSchedule.licensePlates} bị hủy`;
  await CustomerMessageFunctions.createMessageForCustomerOnly(title, message, existingSchedule.appUserId, NO_PHONE_NUMBER, existingSchedule.email, {
    appUserVehicleId: existingSchedule.appUserVehicleId,
    customerScheduleId: existingSchedule.customerScheduleId,
  });
}

async function clearCacheScheduleByUserId(appUserId) {
  const cacheKey = `USER_SCHEDULE_${appUserId}`;
  await RedisInstance.deleteKey(cacheKey);
}

async function _addNewCustomerSchedule(scheduleData, stationsData, appUser) {
  const isAutoConfirm = !stationsData || stationsData.enableConfigAutoConfirm !== AUTO_CONFIRM_SCHEDULE.DISABLE;

  //Xử lý input data của lịch hẹn để phòng chống hack (Xóa khoảng trắng)
  scheduleData.dateSchedule = scheduleData.dateSchedule.trim();
  scheduleData.time = scheduleData.time.trim();

  scheduleData.dateSchedule = moment(scheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DISPLAY_FORMAT);

  //Kiểm tra ngày hẹn có đúng format hay không
  if (
    !scheduleData.dateSchedule ||
    scheduleData.dateSchedule === '' ||
    scheduleData.dateSchedule === null ||
    scheduleData.dateSchedule === 'Invalid date'
  ) {
    throw SCHEDULE_ERROR.BOOKING_ON_TODAY;
  }

  //Kiểm tra xem trung tâm có mở "Tự động duyệt lịch hẹn" không
  const isStationAvailable = !stationsData || stationsData.availableStatus !== AVAILABLE_STATUS.UNAVAILABLE;
  if (isStationAvailable && (process.env.STRICT_BOOKING_MODE_ENABLED * 1 !== STRICT_MODE.ENABLE || isAutoConfirm)) {
    scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.CONFIRMED;
  } else {
    //Bổ sung ghi chú vào lịch hẹn
    //TODO: Need optimize
    const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(scheduleData.scheduleNote || '', 'Vui lòng chờ xác nhận lịch hẹn từ trung tâm.');
    scheduleData.scheduleNote = updatedScheduleNote;
  }

  // find appUserVehicle for this schedule
  const appUserVehicle = await AppUserVehicleResourceAccess.find(
    {
      vehicleIdentity: scheduleData.licensePlates,
      appUserId: scheduleData.appUserId,
    },
    0,
    1,
  );
  let appUserVehicleId = undefined;
  //nếu tài khoản đã có phương tiện thì lấy ra dùng, ngược lại tự đăng ký mới cho user chứ ko báo lỗi
  //TODO: Need optimize
  if (appUserVehicle && appUserVehicle.length > 0) {
  } else {
    // create new vehicle for user
    const addVehicleResult = await _createVehicleFromSchedule(scheduleData);

    if (addVehicleResult && addVehicleResult[0]) {
      scheduleData.appUserVehicleId = addVehicleResult[0];
    }
  }

  // create schedule Hash
  const scheduleHash = makeHashFromData(`${scheduleData.appUserId}_${scheduleData.licensePlates}_${new Date()}`);
  scheduleData.scheduleHash = scheduleHash;

  let result;

  // Kiểm tra trung tâm có phân loại lịch hẹn theo từng loại phương tiện hay không
  if (stationsData && stationsData.enableConfigMixtureSchedule === BOOKING_MIXTURE_SCHEDULE.ENABLE) {
    result = await ScheduleFunctions.createMixtureSchedule(scheduleData, stationsData, appUser);
  } else {
    result = await ScheduleFunctions.createNewSchedule(scheduleData, stationsData, appUser);
  }

  if (result) {
    let _newScheduleId = result[0];

    await ScheduleFunctions.updateBookingCountByDate(_newScheduleId);
    const scheduleTime = ScheduleFunctions.modifyScheduleTime(scheduleData.time);
    let message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã đặt thành công, vui lòng chờ trạm xác nhận.`;

    if (scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
      message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được xác nhận. Thời gian hẹn của quý khách là ${scheduleTime} ngày ${scheduleData.dateSchedule} và mã lịch hẹn là ${scheduleData.scheduleCode}. Vui lòng đến đúng khung giờ đã hẹn để tránh ùn tắc, cản trở giao thông. Trường hợp quý khách đến muộn thì lịch hẹn sẽ bị hủy mà không báo trước.`;
    }

    // thông báo cho người dùng khi đặt lịch vào trung tâm đang quá tải
    if (!isStationAvailable) {
      message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được ghi nhận nhưng tạm thời chưa thể xác nhận vì trạm đang trong tình trạng quá tải. Chúng tôi sẽ thông báo cho bạn ngày khi tình trạng này được khắc phục, xin cảm ơn.`;
    }

    let _title = `TTDK.COM.VN ${stationsData.stationCode} xác nhận lịch hẹn BSX ${scheduleData.licensePlates}`;

    const NO_PHONE_NUMBER = undefined; //khong can gui SMS
    await CustomerMessageFunctions.createMessageForCustomerOnly(_title, message, scheduleData.appUserId, NO_PHONE_NUMBER, scheduleData.email, {
      appUserVehicleId: appUserVehicleId,
      customerScheduleId: _newScheduleId,
    });
  } else {
    console.error(`can not add new schedule`);
  }
  return result;
}

async function _createVehicleFromSchedule(scheduleData) {
  // user not found -> cannot create vehicle
  if (!scheduleData.appUserId) return;

  // convert schedule plate color
  let vehiclePlateColor = VEHICLE_PLATE_TYPE.WHITE;

  switch (scheduleData.licensePlateColor) {
    case LICENSE_PLATE_COLOR.BLUE:
      vehiclePlateColor = VEHICLE_PLATE_TYPE.BLUE;
      break;
    case LICENSE_PLATE_COLOR.YELLOW:
      vehiclePlateColor = VEHICLE_PLATE_TYPE.YELLOW;
      break;
    case LICENSE_PLATE_COLOR.RED:
      vehiclePlateColor = VEHICLE_PLATE_TYPE.RED;
      break;
  }

  const vehicleData = {
    vehicleIdentity: scheduleData.licensePlates,
    vehicleType: scheduleData.vehicleType,
    appUserId: scheduleData.appUserId,
    vehiclePlateColor: vehiclePlateColor,
  };

  const isValidVehicle = AppUserVehicleFunctions.checkValidVehicleIdentity(
    vehicleData.vehicleIdentity,
    vehicleData.vehicleType,
    vehicleData.vehiclePlateColor,
  );

  if (isValidVehicle) {
    const vehicleHash = makeHashFromData(`${scheduleData.appUserId}_${scheduleData.licensePlates}_${new Date()}`);
    vehicleData.vehicleHash = vehicleHash;

    const SKIP_CHECK_DUPLICATE_VEHICLE = true;

    const insertResult = await AppUserVehicleFunctions.addNewUserVehicle(vehicleData, SKIP_CHECK_DUPLICATE_VEHICLE);

    return insertResult;
  } else {
    // throw exception
    throw SCHEDULE_ERROR.INVALID_PLATE_NUMBER;
  }
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      customerScheduleData.createdBy = req.currentUser.staffId;
      //chua cho phep admin dat lich hen
      // let result = await _addNewCustomerSchedule(customerScheduleData, undefined, req.currentUser);
      // if (result) {
      //   resolve(result);
      // } else {
      //   reject('failed');
      // }
      reject('failed');
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let endDate = req.payload.endDate;
      let startDate = req.payload.startDate;
      let currentUser = req.currentUser;
      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      }

      if (startDate && endDate) {
        const startDateMoment = moment(startDate, 'DD/MM/YYYY');
        const endDateMoment = moment(endDate, 'DD/MM/YYYY');
        const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

        if (diffDateCount < 0 || diffDateCount > 30) {
          return reject(SCHEDULE_ERROR.INVALID_SCHEDULE_FILTER_DATE);
        }

        const scheduleDateList = [];
        for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
          const scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');
          scheduleDateList.push(scheduleDate);
        }
        filter.dateSchedule = scheduleDateList;
      }

      const _staffPermission = await updatePermissionForFilter(currentUser, filter);
      if (!_staffPermission) {
        return resolve({ data: [], total: 0 });
      }

      let customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        const customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        if (customerScheduleCount > 0) {
          await _attachCompanyData(customerScheduleList);
          await _attachInfoForSchedule(customerScheduleList);
          await _attachOrderData(customerScheduleList);
          await _attachListCrimeOfSchedule(customerScheduleList);
          _convertScheduleSerial(customerScheduleList);
          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _attachOrderData(schedules) {
  for (let schedule of schedules) {
    let orderData = await OrderResourceAccess.find(
      {
        customerScheduleId: schedule.customerScheduleId,
      },
      0,
      1,
    );
    if (orderData && orderData.length > 0) {
      orderData = orderData[0];
      schedule.approveDate = orderData.approveDate;
      schedule.cancelDate = orderData.cancelDate;
      schedule.closedDate = orderData.closedDate;
      schedule.paymentStatus = orderData.paymentStatus;
    } else {
      schedule.approveDate = null;
      schedule.cancelDate = null;
      schedule.closedDate = null;
      schedule.paymentStatus = null;
    }
  }
}

async function _attachCompanyData(schedules) {
  for (let schedule of schedules) {
    if (schedule.appUserId) {
      const appUser = await AppUsersResourceAccess.findById(schedule.appUserId);
      if (appUser) {
        schedule.companyName = appUser.companyName;
        schedule.companyStatus = appUser.companyStatus;
      } else {
        schedule.companyName = null;
        schedule.companyStatus = null;
      }
    }
  }
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let customerScheduleData = req.payload.data;

      const previousRecord = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      if (customerScheduleData.scheduleNote) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(previousRecord.scheduleNote || '', customerScheduleData.scheduleNote);
        customerScheduleData.scheduleNote = updatedScheduleNote;
      }

      if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
        await ScheduleFunctions.cancelUserSchedule(previousRecord.appUserId, customerScheduleId);
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = 'nhân viên đã hủy';
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
      }

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);
      if (result) {
        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
          let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          let selectedStation = await StationsResourceAccess.findById(_existingSchedule.stationsId);
          await _notifyConfirmScheduleToCustomer(_existingSchedule.phone, _existingSchedule, selectedStation, customerScheduleId);
        }

        // save data changes
        await logCustomerScheduleChanged(previousRecord, customerScheduleData, req.currentUser, customerScheduleId);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _createCustomerRecordFromSchedule(customerSchedule) {
  const createCustomerRecordResult = await CustomerRecordFunctions.insertCustomerRecordFromSchedule(customerSchedule);
  if (!createCustomerRecordResult) {
    console.error('create customerRecord from bookingSchedule failed !');
  } else {
    const customerRecordId = createCustomerRecordResult;
    await CustomerScheduleResourceAccess.updateById(customerSchedule.customerScheduleId, { customerRecordId: customerRecordId });
  }
}
async function advanceUserUpdateSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let customerScheduleData = req.payload.data;

      const previousRecord = await CustomerScheduleView.findById(customerScheduleId);
      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      if (customerScheduleData.scheduleNote) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(previousRecord.scheduleNote || '', customerScheduleData.scheduleNote);
        customerScheduleData.scheduleNote = updatedScheduleNote;
      }

      if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
        await ScheduleFunctions.cancelUserSchedule(previousRecord.appUserId, customerScheduleId);
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = 'nhân viên trung tâm đăng kiểm đã hủy';
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
        await updateOrderStatus(customerScheduleId, SCHEDULE_STATUS.CANCELED);
      }

      // tram xac nhan thi bo sung ghi chu khong dc huy lich
      if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(
          customerScheduleData.scheduleNote || previousRecord.scheduleNote || '',
          'không được hủy lịch',
        );
        customerScheduleData.scheduleNote = updatedScheduleNote;

        await Promise.all([
          //cap nhat trang thai don hang
          updateOrderStatus(customerScheduleId, SCHEDULE_STATUS.CONFIRMED),

          //tao record dang kiem
          _createCustomerRecordFromSchedule(previousRecord),
        ]);
      }

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);

      if (result) {
        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
          let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          let selectedStation = await StationsResourceAccess.findById(_existingSchedule.stationsId);
          await _notifyConfirmScheduleToCustomer(_existingSchedule.phone, _existingSchedule, selectedStation, customerScheduleId);

          // save confirmed schedule data
          await ScheduleFunctions.saveConfirmedScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        }

        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
          // save confirmed schedule data
          await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        }

        // save data changes
        await logCustomerScheduleChanged(previousRecord, customerScheduleData, req.currentUser, customerScheduleId);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _updateRecordOfAppointmentChange(customerScheduleId) {
  const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

  if (customerSchedule.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
    const existedRecord = await CustomerRecordResourceAccess.findById(customerSchedule.customerRecordId);
    if (existedRecord) {
      // Xóa record cũ
      await CustomerRecordResourceAccess.deleteById(existedRecord.customerRecordId);
    }

    // Tạo customerRecord mới
    await _createCustomerRecordFromSchedule(customerSchedule);
  }

  // Thêm khách hàng vào danh sách khách hàng của trạm StationCustomer
  await addStationCustomer(customerSchedule.appUserId, customerSchedule.stationsId, customerSchedule.appUserVehicleId);
}

async function _notifyUserOfAppointmentChange(previousSchedule, customerScheduleData, stationDataUpdate) {
  let messageTitle = `Thông Báo Thay Đổi Lịch Hẹn BSX ${previousSchedule.licensePlates}`;
  let messageContent = `Lịch hẹn cho BSX ${previousSchedule.licensePlates}, thời gian ${previousSchedule.time}, ngày ${previousSchedule.dateSchedule} đã được thay đổi sang `;

  if (customerScheduleData.stationsId) {
    messageContent = messageContent + `trạm ${stationDataUpdate.stationsName} `;
  }

  if (customerScheduleData.time) {
    messageContent = messageContent + `, thời gian ${customerScheduleData.time} `;
  } else {
    messageContent = messageContent + `, thời gian ${previousSchedule.time} `;
  }

  if (customerScheduleData.dateSchedule) {
    messageContent = messageContent + `, ngày ${customerScheduleData.dateSchedule} `;
  } else {
    messageContent = messageContent + `, ngày ${previousSchedule.dateSchedule} `;
  }

  await CustomerMessageFunctions.createMessageForCustomerOnly(
    messageTitle,
    messageContent,
    previousSchedule.appUserId,
    previousSchedule.phone,
    previousSchedule.email,
    {
      appUserVehicleId: previousSchedule.appUserVehicleId,
      customerScheduleId: previousSchedule.customerScheduleId,
    },
  );
}

async function _updateOrderOfAppointmentChange(customerScheduleId, customerScheduleData) {
  if (customerScheduleData.stationsId) {
    const orderRecord = await OrderResourceAccess.find(
      {
        customerScheduleId: customerScheduleId,
      },
      0,
      1,
    );
    if (orderRecord && orderRecord.length > 0) {
      await OrderResourceAccess.updateById(orderRecord[0].orderId, {
        stationsId: customerScheduleData.stationsId,
      });
    }
  }
}

async function _updateScheduleServicesOfAppointmentChange(customerScheduleId, customerScheduleData) {
  if (customerScheduleData.stationsId) {
    const listScheduleServices = await ScheduleServicesMappingResourceAccess.find({
      customerScheduleId: customerScheduleId,
    });
    if (listScheduleServices && listScheduleServices.length > 0) {
      for (let i = 0; i < listScheduleServices.length; i++) {
        const scheduleService = listScheduleServices[i];
        await ScheduleServicesMappingResourceAccess.updateById(scheduleService.scheduleServicesMappingId, {
          stationsId: customerScheduleData.stationsId,
        });
      }
    }
  }
}

async function adminUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.id;
      let customerScheduleData = req.payload.data;

      const previousRecord = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      if (customerScheduleData.scheduleNote) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(previousRecord.scheduleNote || '', customerScheduleData.scheduleNote);
        customerScheduleData.scheduleNote = updatedScheduleNote;
      }

      let existedStation = undefined;
      if (customerScheduleData.stationsId) {
        existedStation = await StationsResourceAccess.findById(customerScheduleData.stationsId);
        if (!existedStation) {
          return reject(SCHEDULE_ERROR.INVALID_STATION);
        }
      }

      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      // Tạo mới schedule hash
      const scheduleHash = makeHashFromData(`${previousRecord.appUserId}_${previousRecord.licensePlates}_${new Date()} `);
      customerScheduleData.scheduleHash = scheduleHash;

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);

      if (result) {
        // Cập nhật lại CustomerRecord = Xóa record cũ, tạo record mới
        await _updateRecordOfAppointmentChange(customerScheduleId);

        // Cập nhật lại order
        await _updateOrderOfAppointmentChange(customerScheduleId, customerScheduleData);

        // Cập nhật lại các dịch vụ đính kèm lịch hẹn
        await _updateScheduleServicesOfAppointmentChange(customerScheduleId, customerScheduleData);

        // Thông báo thay đổi lịch hẹn đến người dùng đặt lịch
        await _notifyUserOfAppointmentChange(previousRecord, customerScheduleData, existedStation);

        // Lưu log lịch hẹn cũ đã thay đổi
        await logCustomerScheduleChanged(previousRecord, customerScheduleData, req.currentUser, customerScheduleId);

        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.id;
      let result = await CustomerScheduleView.findById(customerScheduleId);
      if (result) {
        _convertScheduleSerial([result]);
        await _attachStationServiceToSchedule(result);
        await _attachScheduleAttachmentToSchedule(result);
        await _attachHistoryData(result);
        await _attachOrderData([result]);
        await _attachListCrimeOfSchedule([result]);

        resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _attachHistoryData(schedule) {
  let changeHistory = await SystemAppLogChangeScheduleResourceAccess.find({ customerScheduleId: schedule.customerScheduleId });
  if (changeHistory && changeHistory.length > 0) {
    changeHistory.forEach(history => {
      history.createdAt = moment(history.createdAt).format(DATE_DISPLAY_FORMAT);
    });
  }
  schedule.changeHistory = changeHistory || [];
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      const reason = req.payload.reason;

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, {
        CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
      });
      if (result) {
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = reason || `${req.currentUser.staffId} - nhân viên của trung tâm đã hủy`;
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function advanceUserInsertSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      const currentUser = req.currentUser;

      if (!currentUser.stationsId || !currentUser.appUserId || currentUser.appUserRoleId < STATION_ADMIN_ROLE) {
        return reject(MISSING_AUTHORITY);
      }

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'ADD_SCHEDULE'], currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      // Kiểm tra ngày đặt lịch không hợp lệ
      const isInvalidDate = await ScheduleFunctions.isValidScheduleDate(customerScheduleData.dateSchedule);
      if (isInvalidDate) {
        console.error(INVALID_PAST_DATE_ERROR);
        return reject(INVALID_PAST_DATE_ERROR);
      }

      // convert dateSchedule dùng để sort
      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      customerScheduleData.createdBy = currentUser.appUserId;

      let selectedStation = await StationsResourceAccess.findById(currentUser.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;

        // Kiểm tra xem người dùng đã tồn tại=> Chưa thì tạo mới
        await ScheduleFunctions.checkUserExistenceWhenScheduling(customerScheduleData);

        // Kiểm tra biển số xe có lịch đang chờ thì không cho đặt nữa
        const existedSchedule = await CustomerScheduleResourceAccess.customSearch(
          {
            licensePlates: customerScheduleData.licensePlates,
            appUserId: customerScheduleData.appUserId,
            CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
          },
          0,
          1,
        );
        if (existedSchedule && existedSchedule.length > 0) {
          //Có lịch hẹn chưa được xác nhận, không được đặt thêm
          return reject(SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED);
        }

        let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);

        if (result) {
          // auto create customerRecord
          const customerScheduleId = result[0];
          const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

          //tao record dang kiem
          await _createCustomerRecordFromSchedule(customerSchedule);

          _convertScheduleSerial([customerSchedule]);

          // save ip address
          const requestIp = require('request-ip');
          const clientIp = requestIp.getClientIp(req);
          const userId = req.currentUser.appUserId || req.currentUser.staffId;
          await ScheduleFunctions.saveBookingScheduleData(
            {
              scheduleIpAddress: clientIp,
            },
            userId,
            customerScheduleId,
          );

          resolve(customerSchedule);

          // Thêm khách hàng vào danh sách khách hàng của trạm StationCustomer
          await addStationCustomer(customerSchedule.appUserId, selectedStation.stationsId, customerSchedule.appUserVehicleId);

          // notify customer violations
          await _checkingCustomerViolations(customerScheduleData, selectedStation);
        }
      } else {
        console.error(`can not find station for advanceUserInsertSchedule`);
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, currentUser.appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = req.currentUser.appUserId;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

// User tạo từ partner momo
async function _createAccountPartnerFromSchedule(scheduleData, partnerName) {
  const userData = {};
  const phoneNumber = scheduleData.phone;

  // Nhận biết account của partner
  userData.partnerName = partnerName;

  if (phoneNumber) {
    userData.username = phoneNumber;
    userData.password = phoneNumber;
    userData.firstName = scheduleData.fullnameSchedule;
    userData.phoneNumber = phoneNumber;

    if (scheduleData.email) {
      userData.email = scheduleData.email;
    }

    // Mặc định đã verify để partner khi đăng nhập vào app k cần xác nhận otp nứa
    userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED;

    const newAppUserId = await createNewUser(userData);

    return newAppUserId;
  }
}

async function _checkingCustomerViolations(customerScheduleData, selectedStation) {
  const customerViolations = await CustomerCriminalRecordFunctions.crawlCriminalRecord(customerScheduleData.licensePlates, 1);
  for (let crime of customerViolations) {
    const crimeTime = moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate();
    const previousData = await CustomerCriminalResourceAccess.find(
      { customerRecordPlatenumber: customerScheduleData.licensePlates, crimeRecordTime: crimeTime },
      0,
      1,
    );

    if (!previousData || previousData.length <= 0) {
      const data = {
        customerRecordPlatenumber: customerScheduleData.licensePlates,
        crimeRecordContent: crime.behavior,
        crimeRecordStatus: crime.status,
        crimeRecordTime: moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate(),
        crimeRecordPIC: crime.provider,
        crimeRecordLocation: crime.violationAddress,
        crimeRecordContact: crime.contactPhone,
      };

      await CustomerCriminalResourceAccess.insert(data);
    }

    // notify violation to customer
    if (crime.status === 'Chưa xử phạt') {
      const messageTitle = `Thông báo hệ thống từ ${selectedStation.stationsName} `;
      let message = `TTDK ${selectedStation.stationCode} thông báo: phương tiện biển số ${customerScheduleData.licensePlates} của quý khách được phát hiện có vi phạm: ${crime.behavior} lúc ${crime.violationTime} tại ${crime.violationAddress}. Vui lòng kiểm tra xử lý phạt nguội trước khi đăng kiểm.Chi tiết xem thêm tại website CSGT.VN.`;
      let messageType = MESSAGE_TYPE.VR_VEHICLE_CRIMINAL_WARNING;
      await CustomerMessageFunctions.addMessageCustomer(
        messageTitle,
        selectedStation.stationsId,
        message,
        customerScheduleData.licensePlates,
        customerScheduleData.appUserId,
        customerScheduleData.email,
        undefined,
        undefined,
        undefined,
        messageType,
      );
    }
  }
}

async function userCreateConsultant(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let consultantRequest = req.payload.consultantRequest;
      let appUserId = req.currentUser.appUserId;
      let customerScheduleData = {};
      let currentUser = await AppUsersResourceAccess.findById(appUserId);
      let phoneNumber = currentUser.phoneNumber;

      // Kiểm tra lịch trùng thì không cho đặt nữa
      const existedSchedule = await CustomerScheduleResourceAccess.customSearch(
        {
          appUserId: appUserId,
          CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
          scheduleType: req.payload.scheduleType,
        },
        0,
        1,
      );
      if (existedSchedule && existedSchedule.length > 0) {
        //Có lịch hẹn chưa được xác nhận, không được đặt thêm
        return reject(SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED);
      }

      // checking ip address
      const scheduleIpAddress = requestIp.getClientIp(req);
      const userId = req.currentUser.appUserId || req.currentUser.staffId;

      customerScheduleData.scheduleType = req.payload.scheduleType;
      customerScheduleData.scheduleNote = consultantRequest;

      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE) _checkingIpAddress(scheduleIpAddress, phoneNumber, undefined, userId);

      if (req.currentUser && req.currentUser.appUserId) {
        _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
        customerScheduleData.createdBy = req.currentUser.appUserId;
      }
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      if (currentHour >= SET_HOURS.MID_DAY) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      let date = moment(currentDate).format('DD/MM/YYYY');
      customerScheduleData.dateSchedule = date;

      //Xử lý tìm trạm phù hợp cho lịch tư vấn
      const station = await ScheduleFunctions.chooseAppropriateStation(customerScheduleData.scheduleType);

      if (station) {
        customerScheduleData.stationsId = station.stationsId;

        let result = await ScheduleFunctions.addNewConsultantSchedule(customerScheduleData, station);

        if (result) {
          const customerScheduleId = result[0];

          // save user device
          const userDeviceInfo = _extractUserDeviceInfoFromHeaders(req);
          await ScheduleFunctions.saveBookingScheduleData(userDeviceInfo, userId, customerScheduleId);

          return resolve(result);
        }

        return reject('failed');
      }

      return reject(SCHEDULE_ERROR.NO_SERVICE_STATION);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
async function userCreateSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      const appUserId = req.currentUser.appUserId;
      let certificateSeries = req.payload.certificateSeries;

      const attachmentList = customerScheduleData.attachmentList;
      if (attachmentList) {
        delete customerScheduleData.attachmentList;
      }
      delete customerScheduleData.certificateSeries;

      // Kiểm tra ngày đặt lịch không hợp lệ
      const isInvalidDate = await ScheduleFunctions.isValidScheduleDate(customerScheduleData.dateSchedule);
      if (isInvalidDate) {
        console.error(INVALID_PAST_DATE_ERROR);
        return reject(INVALID_PAST_DATE_ERROR);
      }

      // Kiểm tra biển số xe có lịch đang chờ thì không cho đặt nữa
      const existedSchedule = await CustomerScheduleResourceAccess.customSearch(
        {
          licensePlates: customerScheduleData.licensePlates,
          appUserId: appUserId,
          CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
        },
        0,
        1,
      );
      if (existedSchedule && existedSchedule.length > 0) {
        //Có lịch hẹn đang chờ thì không cho đặt nữa
        return reject(SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED);
      }

      // convert dateSchedule dùng để sort
      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      let _stationServicesList = customerScheduleData.stationServicesList;
      if (_stationServicesList) {
        delete customerScheduleData.stationServicesList;
      }

      const userId = req.currentUser.appUserId || req.currentUser.staffId;

      //Chặn IP nước ngoài được đặt lịch
      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE) {
        // checking ip address
        const scheduleIpAddress = requestIp.getClientIp(req);
        _checkingIpAddress(scheduleIpAddress, customerScheduleData.phone, customerScheduleData.licensePlates, userId);
      }

      // Lưu thông tin thiết bị mà user dùng để đặt lịch
      const userAgent = req.headers['user-agent'];
      //TODO recheck later
      // await AppUserDevicesFunctions.saveUserDevice(appUserId, userAgent);

      let selectedStation = await StationsResourceAccess.findById(req.payload.stationsId);
      if (!selectedStation) {
        console.error(`can not find station for userCreateSchedule`);
        return reject(SCHEDULE_ERROR.INVALID_STATION);
      }

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;

        if (customerScheduleData.scheduleNote) {
          const scheduleNoteContent = ScheduleFunctions.updateScheduleNote(
            '',
            customerScheduleData.scheduleNote,
            req.currentUser.username || customerScheduleData.fullnameSchedule,
          );
          customerScheduleData.scheduleNote = scheduleNoteContent;
        }

        if (req.currentUser && req.currentUser.appUserId) {
          _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
          customerScheduleData.createdBy = req.currentUser.appUserId;
        }

        await ScheduleFunctions.restrictUserBooking(req.currentUser, customerScheduleData, selectedStation);

        let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
        // await clearCacheScheduleByUserId(req.currentUser.appUserId);
        if (result) {
          // auto create customerRecord
          const customerScheduleId = result[0];

          // Tự động tạo customerRecord khi lịch được xác nhận
          await _autoCreateCustomerRecord(customerScheduleId);

          // save user device
          const userDeviceInfo = _extractUserDeviceInfoFromHeaders(req);
          await ScheduleFunctions.saveBookingScheduleData(userDeviceInfo, userId, customerScheduleId);

          // insert schedule attachments
          if (attachmentList && attachmentList.length > 0) {
            attachmentList.forEach(attachment => {
              attachment.customerScheduleId = customerScheduleId;
            });

            const insertResult = await CustomerScheduleAttachmentResourceAccess.insert(attachmentList);
            if (!insertResult) {
              Logger.error('Insert schedule attachment failed !');
            }
          }

          //insert schedule services
          if (_stationServicesList && _stationServicesList.length > 0) {
            _stationServicesList = _stationServicesList.map(_selectingServicesId => {
              return {
                customerScheduleId: customerScheduleId,
                stationServicesId: _selectingServicesId,
                stationsId: selectedStation.stationsId,
              };
            });

            const _addServiceResult = await ScheduleServicesMappingResourceAccess.insert(_stationServicesList);
            if (!_addServiceResult) {
              Logger.error('Insert schedule services failed !');
            }
          }

          // create order
          const vehicleData = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);
          if (!vehicleData) {
            reject('failed');
            return;
          }

          const _newOrderData = {
            customerScheduleId: result[0],
            appUserId: appUserId,
            appUserVehicleId: customerScheduleData.appUserVehicleId,
            stationsId: req.payload.stationsId,
          };
          const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
          await createOrderBySchedule(_newOrderData, vehicleData, isForBusiness);

          //Kiểm tra phạt nguội bên CSGT và VR
          await ScheduleFunctions.checkCriminalFromCSGTAndVR(customerScheduleId, selectedStation);

          // Gửi thông báo có khách hàng đặt lịch đến tài khoản nhân viên của trạm
          await ScheduleFunctions.notifyEmployeeAboutCustomerSchedule(customerScheduleData);

          resolve(result);
        }
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = req.currentUser.appUserId;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function _checkVehicleViolations(customerScheduleData, vehicleIdentity, stationsId, currentUser) {
  if (customerScheduleData.scheduleType === SCHEDULE_TYPE.VEHICLE_INSPECTION) {
    let checkCrime = await AppUserVehicleFunctions.checkCriminal(customerScheduleData);
    if (checkCrime === CRIMINAL.YES) {
      await CustomerMessageFunctions.addWarningTicketMessageCustomer(
        customerScheduleData.licensePlates,
        currentUser.appUserId,
        customerScheduleData.email,
      );
    }
  }
}

async function _insertScheduleServices(_stationServicesList, customerScheduleId, selectedStation) {
  if (_stationServicesList && _stationServicesList.length > 0) {
    _stationServicesList = _stationServicesList.map(_selectingServicesId => {
      return {
        customerScheduleId: customerScheduleId,
        stationServicesId: _selectingServicesId,
        stationsId: selectedStation.stationsId,
      };
    });

    const _addServiceResult = await ScheduleServicesMappingResourceAccess.insert(_stationServicesList);
    if (!_addServiceResult) {
      Logger.error('Insert schedule services failed !');
    }
  }
}

async function _insertScheduleAttachments(attachmentList, customerScheduleId) {
  if (attachmentList && attachmentList.length > 0) {
    attachmentList.forEach(attachment => {
      attachment.customerScheduleId = customerScheduleId;
    });

    const insertResult = await CustomerScheduleAttachmentResourceAccess.insert(attachmentList);
    if (!insertResult) {
      Logger.error('Insert schedule attachment failed !');
    }
  }
}

async function _createOrder(customerScheduleId, currentUser, customerScheduleData, stationsId, vehicleData) {
  const _newOrderData = {
    customerScheduleId: customerScheduleId,
    appUserId: currentUser.appUserId,
    appUserVehicleId: customerScheduleData.appUserVehicleId,
    stationsId: stationsId,
  };
  const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
  await createOrderBySchedule(_newOrderData, vehicleData, isForBusiness);
}

async function partnerCreateSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let currentUser = null;
      const partner = req.currentPartner;
      let customerScheduleData = req.payload;

      // Lưu tên của partner khi partner đặt lịch
      if (partner) {
        customerScheduleData.partnerName = partner.partnerName;
      }

      // checking ip address
      const scheduleIpAddress = requestIp.getClientIp(req);
      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE)
        _checkingIpAddress(scheduleIpAddress, customerScheduleData.phone, customerScheduleData.licensePlates, partner.partnerName);

      // Tiến hành tạo lịch hẹn
      let result = await CustomerScheduleServices.createNewSchedule(customerScheduleData, currentUser);

      if (result) {
        resolve(result);
      }

      reject('failed');
    } catch (e) {
      const appUserId = null;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userCreateRoadFeeSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      customerScheduleData.scheduleNote = SCHEDULE_NOTE.ROAD_FEE;
      customerScheduleData.scheduleType = SCHEDULE_TYPE.PAY_ROAD_FEE;
      // checking ip address
      const scheduleIpAddress = requestIp.getClientIp(req);
      const userId = req.currentUser.appUserId || req.currentUser.staffId;

      // convert dateSchedule dùng để sort
      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE)
        _checkingIpAddress(scheduleIpAddress, customerScheduleData.phone, customerScheduleData.licensePlates, userId);

      // save user devices
      const appUserId = req.currentUser.appUserId;
      const userAgent = req.headers['user-agent'];

      let selectedStation = await StationsResourceAccess.findById(req.payload.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;
      }

      if (req.currentUser && req.currentUser.appUserId) {
        _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
        customerScheduleData.createdBy = req.currentUser.appUserId;
      }
      await ScheduleFunctions.restrictUserBooking(req.currentUser, customerScheduleData, selectedStation);
      let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
      if (result) {
        const customerScheduleId = result[0];

        // save ip address
        const userDeviceInfo = _extractUserDeviceInfoFromHeaders(req);
        await ScheduleFunctions.saveBookingScheduleData(userDeviceInfo, userId, customerScheduleId);

        // create order
        const vehicleData = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);
        if (!vehicleData) {
          reject('failed');
          return;
        }

        const _newOrderData = {
          customerScheduleId: result[0],
          appUserId: appUserId,
          appUserVehicleId: customerScheduleData.appUserVehicleId,
          stationsId: req.payload.stationsId,
        };
        const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
        let orderId = await createOrderRoadFeeBySchedule(_newOrderData, vehicleData, isForBusiness);

        let orderData = await OrderResourceAccess.findById(orderId);
        let resultReceipt = await _createCustomerReceipt(orderData, req.currentUser, 'Thanh toán phí đường bộ');
        const orderItem = await OrderItemResourceAccess.find({ orderId: orderData.orderId });
        let receiptRoadFee = {
          customerScheduleId: result[0],
          customerReceiptId: resultReceipt[0],
          payment: orderData.total,
          totalPayment: orderData.totalPayment,
          totalVAT: orderData.taxAmount,
          order: {
            orderId: orderId[0],
            orderItem: orderItem,
          },
        };
        resolve(receiptRoadFee);
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = req.currentUser.appUserId;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userCreateInspectionFeeSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      customerScheduleData.scheduleNote = SCHEDULE_NOTE.INSPECTION_FEE;
      customerScheduleData.scheduleType = SCHEDULE_TYPE.VEHICLE_INSPECTION;

      // convert dateSchedule dùng để sort
      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      // checking ip address
      const scheduleIpAddress = requestIp.getClientIp(req);
      const userId = req.currentUser.appUserId || req.currentUser.staffId;

      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE)
        _checkingIpAddress(scheduleIpAddress, customerScheduleData.phone, customerScheduleData.licensePlates, userId);

      // save user devices
      const appUserId = req.currentUser.appUserId;
      const userAgent = req.headers['user-agent'];

      customerScheduleData.scheduleType = SCHEDULE_TYPE.PAY_ROAD_FEE;

      let selectedStation = await StationsResourceAccess.findById(req.payload.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;
      }

      if (req.currentUser && req.currentUser.appUserId) {
        _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
        customerScheduleData.createdBy = req.currentUser.appUserId;
      }

      await ScheduleFunctions.restrictUserBooking(req.currentUser, customerScheduleData, selectedStation);

      let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
      if (result) {
        const customerScheduleId = result[0];
        // save ip address
        const userDeviceInfo = _extractUserDeviceInfoFromHeaders(req);
        await ScheduleFunctions.saveBookingScheduleData(userDeviceInfo, userId, customerScheduleId);

        // create order
        const vehicleData = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);
        if (!vehicleData) {
          reject('failed');
          return;
        }

        const _newOrderData = {
          customerScheduleId: result[0],
          appUserId: appUserId,
          appUserVehicleId: customerScheduleData.appUserVehicleId,
          stationsId: req.payload.stationsId,
        };
        const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
        let orderId = await createOrderInspectionFeeBySchedule(_newOrderData, vehicleData, isForBusiness);

        let orderData = await OrderResourceAccess.findById(orderId);
        let resultReceipt = await _createCustomerReceipt(orderData, req.currentUser, 'Thanh toán phí đăng kiểm');
        const orderItem = await OrderItemResourceAccess.find({ orderId: orderData.orderId });
        let receiptInspectionAllFee = {
          customerScheduleId: result[0],
          customerReceiptId: resultReceipt[0],
          payment: orderData.total,
          totalPayment: orderData.totalPayment,
          totalVAT: orderData.taxAmount,
          order: {
            orderId: orderId[0],
            orderItem: orderItem,
          },
        };
        resolve(receiptInspectionAllFee);
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = req.currentUser.appUserId;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userCreateInsuranceFeeSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      customerScheduleData.scheduleNote = SCHEDULE_NOTE.INSURANCE_FEE;
      customerScheduleData.scheduleType = SCHEDULE_TYPE.PAY_INSURRANCE_FEE;

      // convert dateSchedule dùng để sort
      if (customerScheduleData.dateSchedule) {
        customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
      }

      // checking ip address
      const scheduleIpAddress = requestIp.getClientIp(req);
      const userId = req.currentUser.appUserId || req.currentUser.staffId;

      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE)
        _checkingIpAddress(scheduleIpAddress, customerScheduleData.phone, customerScheduleData.licensePlates, userId);

      // save user devices
      const appUserId = req.currentUser.appUserId;
      const userAgent = req.headers['user-agent'];

      let selectedStation = await StationsResourceAccess.findById(req.payload.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;
      }

      if (req.currentUser && req.currentUser.appUserId) {
        _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
        customerScheduleData.createdBy = req.currentUser.appUserId;
      }

      await ScheduleFunctions.restrictUserBooking(req.currentUser, customerScheduleData, selectedStation);

      let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
      if (result) {
        const customerScheduleId = result[0];
        // save ip address
        const userDeviceInfo = _extractUserDeviceInfoFromHeaders(req);
        await ScheduleFunctions.saveBookingScheduleData(userDeviceInfo, userId, customerScheduleId);

        // create order
        const vehicleData = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);
        if (!vehicleData) {
          reject('failed');
          return;
        }

        const _newOrderData = {
          customerScheduleId: result[0],
          appUserId: appUserId,
          appUserVehicleId: customerScheduleData.appUserVehicleId,
          stationsId: req.payload.stationsId,
        };
        const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
        let orderId = await createOrderInsuranceFeeBySchedule(_newOrderData, vehicleData, isForBusiness);

        let orderData = await OrderResourceAccess.findById(orderId);
        let resultReceipt = await _createCustomerReceipt(
          orderData,
          req.currentUser,
          `Thanh toán phí bảo hiểm TNDS cho BSX ${customerScheduleData.licensePlates} `,
        );
        const orderItem = await OrderItemResourceAccess.find({ orderId: orderData.orderId });
        let receiptInsuranceAllFee = {
          customerScheduleId: result[0],
          customerReceiptId: resultReceipt[0],
          payment: orderData.total,
          totalPayment: orderData.totalPayment,
          totalVAT: orderData.taxAmount,
          order: {
            orderId: orderId[0],
            orderItem: orderItem,
          },
        };
        resolve(receiptInsuranceAllFee);
      }

      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      reject('failed');
    } catch (e) {
      const appUserId = req.currentUser.appUserId;
      let customerScheduleData = req.payload;
      //Luu lai toan bo thong tin user dat lich that bai vao DB de tracking fix bug
      await ScheduleFunctions.addCustomerScheduleFailed(customerScheduleData, appUserId);

      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function _createCustomerReceipt(orderData, currentUser, receiptContent) {
  let data = {
    appUserId: currentUser.appUserId,
    total: orderData.totalPayment,
    fee: orderData.taxAmount,
    customerReceiptAmount: orderData.total,
    customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.PENDING,
    customerReceiptName: currentUser.firstName,
    customerReceiptEmail: currentUser.email,
    customerReceiptPhone: currentUser.phoneNumber,
    customerReceiptContent: receiptContent,
    orderId: orderData.orderId,
  };
  let resultReceipt = await CustomerReceiptResourceAccess.insert(data);
  return resultReceipt;
}

//Chặn IP nước ngoài được đặt lịch
function _checkingIpAddress(ipAddress, phone, bsx, userId) {
  const geo = geoip.lookup(ipAddress);
  if (geo && geo.country !== 'VN') {
    reportToTelegram('Booking schedule from foreign' + JSON.stringify({ phone, bsx, userId }));
    throw SCHEDULE_ERROR.IP_ADDRESS_NOT_ALLOWED;
  }
}

function _fillCustomerDataToSchedule(customerScheduleData, appUserAccount) {
  customerScheduleData.appUserId = appUserAccount.appUserId;

  if (appUserAccount.phoneNumber) {
    customerScheduleData.phone = appUserAccount.phoneNumber;
  }
  if (appUserAccount.firstName) {
    customerScheduleData.fullnameSchedule = appUserAccount.firstName;
  }
  if (appUserAccount.email) {
    customerScheduleData.email = appUserAccount.email;
  }
}

async function _attachScheduleAttachmentToSchedule(schedule) {
  const scheduleId = schedule.customerScheduleId;
  const attachmentList = await CustomerScheduleAttachmentResourceAccess.find({ customerScheduleId: scheduleId }, 0, 20);
  if (attachmentList && attachmentList.length > 0) {
    schedule.attachmentList = attachmentList;
  } else {
    schedule.attachmentList = [];
  }
}

async function _attachCustomerRecordToSchedule(existingSchedule) {
  if (!existingSchedule.customerRecordId) {
    return;
  }
  let _existingCustomerRecord = await CustomerRecordResourceAccess.findById(existingSchedule.customerRecordId);
  if (_existingCustomerRecord) {
    existingSchedule.customerRecord = {
      customerRecordCheckStatus: _existingCustomerRecord.customerRecordCheckStatus,
    };
  }
}

async function _attachStationDataToSchedule(existingSchedule) {
  if (!existingSchedule.stationsId) {
    return;
  }
  let _existingStation = await StationsResourceAccess.findById(existingSchedule.stationsId);
  if (_existingStation) {
    existingSchedule.station = {
      stationsName: _existingStation.stationsName,
      stationCode: _existingStation.stationCode,
      stationsAddress: _existingStation.stationsAddress,
      stationWorkTimeConfig: _existingStation.stationWorkTimeConfig,
      enablePaymentGateway: _existingStation.enablePaymentGateway,
      stationPayments: _existingStation.stationPayments,
    };
  }
}

async function _attachUserVehicleDataToSchedule(existingSchedule) {
  if (!existingSchedule.appUserVehicleId) {
    return;
  }
  let _existingVehicle = await AppUserVehicleResourceAccess.findById(existingSchedule.appUserVehicleId);
  if (_existingVehicle) {
    existingSchedule.appUserVehicle = _existingVehicle;
  }
}

async function userGetDetailSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let _existingSchedule = await CustomerScheduleView.findById(customerScheduleId);
      if (_existingSchedule) {
        if (_existingSchedule.appUserId !== req.currentUser.appUserId) {
          return reject(MISSING_AUTHORITY);
        }

        _convertScheduleSerial([_existingSchedule]);
        await _attachListCrimeOfSchedule([_existingSchedule]);

        await Promise.all([
          _attachStationDataToSchedule(_existingSchedule),
          _attachCustomerRecordToSchedule(_existingSchedule),
          _attachStationServiceToSchedule(_existingSchedule),
          _attachScheduleAttachmentToSchedule(_existingSchedule),
          _attachUserVehicleDataToSchedule(_existingSchedule),
        ]);

        // attach order detail
        const _scheduleData = {
          customerScheduleId: _existingSchedule.customerScheduleId,
          appUserVehicleId: _existingSchedule.appUserVehicleId,
          appUserId: _existingSchedule.appUserId,
          stationsId: _existingSchedule.stationsId,
        };
        const orderData = await getOrderDetail(_scheduleData);
        _existingSchedule.order = orderData;

        resolve(_existingSchedule);
      }
      reject('failed');
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function userPartnerGetDetailSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let partner = req.currentPartner;

      let customerScheduleId = req.payload.customerScheduleId;

      let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      if (!_existingSchedule) {
        return reject(NOT_FOUND);
      }

      // Kiểm tra lịch có phải được tạo từ đối tấc đang gọi không
      if (_existingSchedule.partnerName !== partner.partnerName) {
        return reject(MISSING_AUTHORITY);
      }

      _convertScheduleSerial([_existingSchedule]);

      let _existingStation = await StationsResourceAccess.findById(_existingSchedule.stationsId);
      if (_existingStation) {
        _existingSchedule.station = {
          stationsName: _existingStation.stationsName,
          stationCode: _existingStation.stationCode,
          stationsAddress: _existingStation.stationsAddress,
        };
      }

      resolve(_existingSchedule);
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function advanceUserGetDetailSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const appUserId = req.currentUser.appUserId;

      let customerScheduleId = req.payload.customerScheduleId;
      let _existingSchedule = await CustomerScheduleView.findById(customerScheduleId);
      if (_existingSchedule) {
        // save app user view detail schedule
        await CustomerScheduleViewHistory.insert({ customerScheduleId: customerScheduleId, appUserId: appUserId });

        _convertScheduleSerial([_existingSchedule]);
        let _existingStation = await StationsResourceAccess.findById(_existingSchedule.stationsId);
        if (_existingStation) {
          _existingSchedule.station = {
            stationsName: _existingStation.stationsName,
            stationCode: _existingStation.stationCode,
            stationsAddress: _existingStation.stationsAddress,
            stationWorkTimeConfig: _existingStation.stationWorkTimeConfig,
          };
        }

        let _existingCustomerRecord = await CustomerRecordResourceAccess.findById(_existingSchedule.customerRecordId);
        if (_existingCustomerRecord) {
          _existingSchedule.customerRecord = {
            customerRecordCheckStatus: _existingCustomerRecord.customerRecordCheckStatus,
          };
        }

        await _attachHistoryData(_existingSchedule);
        await _attachOrderData([_existingSchedule]);

        await _attachScheduleAttachmentToSchedule(_existingSchedule);
        await _attachStationServiceToSchedule(_existingSchedule);
        await _attachListCrimeOfSchedule([_existingSchedule]);

        resolve(_existingSchedule);
      }
      reject('failed');
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function userGetListSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      // let order = req.payload.order;
      // let endDate = req.payload.endDate;
      // let startDate = req.payload.startDate;

      // //only get data of current station
      // if (filter && req.currentUser.stationsId) {
      //   filter.stationsId = req.currentUser.stationsId;
      // }
      filter.appUserId = req.currentUser.appUserId;
      let responseBody = { data: [], total: 0 };
      // if (process.env.REDIS_ENABLE * 1 === 1) {
      //   responseBody = await RedisInstance.getJson(`USER_SCHEDULE_${ req.currentUser.appUserId } `);
      //   if (responseBody) {
      //     return resolve(responseBody);
      //   }
      // }

      let customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (customerScheduleList && customerScheduleList.length > 0) {
        _convertScheduleSerial(customerScheduleList);
        _attachListCrimeOfSchedule(customerScheduleList);
        for (let i = 0; i < customerScheduleList.length; i++) {
          await _attachStationServiceToSchedule(customerScheduleList[i]);
          await _attachStationSettingToSchedule(customerScheduleList[i]);
        }

        //TODO recheck performance later
        let customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText);
        let responseBody = { data: customerScheduleList, total: customerScheduleCount };
        // await RedisInstance.setWithExpire(`USER_SCHEDULE_${ req.currentUser.appUserId } `, JSON.stringify(responseBody));
        resolve(responseBody);
      } else {
        resolve(responseBody);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _attachStationSettingToSchedule(schedule) {
  const StationSettingFunction = require('../../StationSetting/StationSettingFunction');
  const stationSetting = await StationSettingFunction.getSettingByStationId(schedule.stationsId);
  schedule.chatLinkEmployeeToUser = stationSetting.chatLinkEmployeeToUser;
  schedule.chatLinkUserToEmployee = stationSetting.chatLinkUserToEmployee;
}

async function userPartnerGetListSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let partner = req.currentPartner;
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      // Chỉ lấy lịch hẹn đặt từ sđt đặt qua partner tương ứng
      filter.partnerName = partner.partnerName;

      let responseBody = { data: [], total: 0 };

      let customerScheduleList = await CustomerScheduleResourceAccess.customSearch(filter, skip, limit, undefined, undefined);

      if (customerScheduleList && customerScheduleList.length > 0) {
        _convertScheduleSerial(customerScheduleList);

        for (let i = 0; i < customerScheduleList.length; i++) {
          delete customerScheduleList[i].scheduleHash;

          let _existingStation = await StationsResourceAccess.findById(customerScheduleList[i].stationsId);
          if (_existingStation) {
            customerScheduleList[i].station = {
              stationsName: _existingStation.stationsName,
              stationCode: _existingStation.stationCode,
              stationsAddress: _existingStation.stationsAddress,
            };
          }
        }

        //TODO recheck performance later
        let customerScheduleCount = await CustomerScheduleResourceAccess.customCount(filter, undefined, undefined);
        let responseBody = { data: customerScheduleList, total: customerScheduleCount };
        resolve(responseBody);
      } else {
        resolve(responseBody);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _attachStationServiceToSchedule(schedule) {
  // station service
  const ScheduleServicesMappingView = require('../../StationServices/resourceAccess/ScheduleServicesMappingView');
  const _scheduleServices = await ScheduleServicesMappingView.find({ customerScheduleId: schedule.customerScheduleId });
  schedule.stationServices = _scheduleServices;
}
async function _attachScheduleAttachmentToSchedule(schedule) {
  const scheduleId = schedule.customerScheduleId;
  const attachmentList = await CustomerScheduleAttachmentResourceAccess.find({ customerScheduleId: scheduleId }, 0, 20);
  if (attachmentList && attachmentList.length > 0) {
    schedule.attachmentList = attachmentList;
  } else {
    schedule.attachmentList = [];
  }
}

function _convertScheduleSerial(scheduleList) {
  scheduleList.forEach(schedule => {
    const serialNumber = schedule.scheduleSerial;
    schedule.scheduleSerial = padLeadingZeros(serialNumber, 4);
  });
}

async function userCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      let reason = 'Người dùng đã xác nhận hủy ';
      if (isNotEmptyStringValue(req.payload.reason)) {
        reason += `với lý do: ${req.payload.reason}`;
      }

      // Trạm duyệt thì không được hủy
      // const confirmByStaffStationRecord = await CustomerScheduleChangeResourceAccess.find(
      //   { customerScheduleId: customerScheduleId, confirmedPerformerType: PERFORMER_TYPE.STATION_STAFF },
      //   0,
      //   1,
      // );

      // if (confirmByStaffStationRecord && confirmByStaffStationRecord.length > 0) {
      //   return reject(SCHEDULE_ERROR.CONFIRMED_BY_STATION_STAFF);
      // }

      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      const result = await ScheduleFunctions.cancelUserSchedule(req.currentUser.appUserId, customerScheduleId, reason);
      // await clearCacheScheduleByUserId(req.currentUser.appUserId);
      if (result) {
        // save canceled schedule change
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.CUSTOMER);

        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);
        await logCustomerScheduleChanged(
          _existingSchedule,
          { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED },
          req.currentUser,
          customerScheduleId,
        );
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function userPartnerMomoCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      const partner = req.currentPartner;

      let reason = 'Người dùng đã xác nhận hủy ';
      if (isNotEmptyStringValue(req.payload.reason)) {
        reason += `với lý do: ${req.payload.reason}`;
      }

      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      if (!_existingSchedule) {
        return reject(NOT_FOUND);
      }

      //Không cho hủy lịch của người dùng khác không phải là người dùng momo
      if (!_existingSchedule.partnerName || _existingSchedule.partnerName !== partner.partnerName) {
        return reject(MISSING_AUTHORITY);
      }

      const result = await ScheduleFunctions.cancelUserSchedule(_existingSchedule.appUserId, customerScheduleId, reason);

      if (result) {
        // save canceled schedule change
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, _existingSchedule.appUserId, PERFORMER_TYPE.CUSTOMER);

        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);

        const picUser = await AppUsersResourceAccess.findById(_existingSchedule.appUserId);

        await logCustomerScheduleChanged(_existingSchedule, { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED }, picUser, customerScheduleId);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function exportExcelCustomerSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const searchText = req.payload.searchText;

      //only export for current station, do not export data of other station
      if (!req.currentUser.stationsId) {
        return reject(MISSING_AUTHORITY);
      }
      filter.stationsId = req.currentUser.stationsId;

      let station = await StationsResourceAccess.findById(req.currentUser.stationsId);

      const _fileName = 'DSLH_' + moment().format('YYYYMMDDHHmm') + '.xlsx';
      const _filepath = 'uploads/exportExcel/' + _fileName;

      const scheduleList = [];
      let skip = 0;
      while (true) {
        let customerSchedule = await CustomerScheduleResourceAccess.customSearch(filter, skip, 50, undefined, undefined, searchText);
        if (customerSchedule && customerSchedule.length > 0) {
          scheduleList.push(...customerSchedule);
        } else {
          break;
        }
        skip += 50;
      }

      await _attachInfoForSchedule(scheduleList);

      let exportStatus = await _exportScheduleToExcel(scheduleList, station, _filepath);
      if (exportStatus) {
        let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + _filepath;
        resolve(newExcelUrl);
      } else {
        reject('false');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _exportScheduleToExcel(records, station, filepath) {
  const workSheetName = 'Danh sách lịch hẹn';
  const dataRows = [];

  //worksheet title
  const workSheetTitle = [
    'Trung tâm đăng kiểm',
    '', //break 1 columns
    '', //break 1 columns
    'Danh sách lịch hẹn đăng kiểm',
  ];
  dataRows.push(workSheetTitle);

  const stationCode = station ? `Mã: ${station.stationsName} ` : '';
  let reportTime = `Danh sách lịch hẹn ngày ${moment().format('DD/MM/YYYY')} `;

  const workSheetInfo = [
    `${stationCode} `,
    '', //break 1 columns
    '', //break 1 columns
    reportTime,
  ];
  dataRows.push(workSheetInfo);
  dataRows.push(['']); //break 1 rows

  //table headers
  const workSheetColumnNames = [
    'Số TT',
    'Biển số xe',
    'Chủ phương tiện',
    'Số điện thoại',
    'Ngày đặt lịch đăng kiểm',
    'Giờ đặt lịch đăng kiểm',
    'Trạng thái lịch hẹn',
    'Ngày hết hạn',
    'Loại phương tiện',
  ];
  dataRows.push(workSheetColumnNames);

  //Table data
  records.forEach((record, index) => {
    let scheduleStatus = 'Lịch hẹn mới';
    switch (record.CustomerScheduleStatus) {
      case SCHEDULE_STATUS.CLOSED:
        scheduleStatus = 'Đã kết thúc';
        break;
      case SCHEDULE_STATUS.CONFIRMED:
        scheduleStatus = 'Đã xác nhận';
        break;
      case SCHEDULE_STATUS.CANCELED:
        scheduleStatus = 'Đã hủy';
        break;
    }

    let vehicleType = 'Ô tô con';
    switch (record.vehicleType) {
      case VEHICLE_TYPE.RO_MOOC:
        vehicleType = 'Xe rơ mooc, đầu kéo';
        break;
      case VEHICLE_TYPE.OTHER:
        vehicleType = 'Xe bán tải, phương tiện khác';
        break;
    }

    dataRows.push([
      index + 1,
      record.licensePlates,
      record.fullnameSchedule,
      record.phone,
      record.dateSchedule,
      record.time,
      scheduleStatus,
      record.vehicleExpiryDate || '',
      vehicleType,
    ]);
  });

  excelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

async function reportTotalByDay(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const filter = req.payload.filter || {};
      // checking is valid date
      const startDateMoment = moment(startDate, 'DD/MM/YYYY');
      const endDateMoment = moment(endDate, 'DD/MM/YYYY');
      const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

      const bookingQuantityData = [];

      for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
        const _scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');

        const bookingCount = await CustomerScheduleView.customCount({
          ...filter,
          dateSchedule: _scheduleDate,
        });

        bookingQuantityData.push({
          date: _scheduleDate,
          quantity: bookingCount || 0,
        });
      }

      return resolve({ data: bookingQuantityData, total: bookingQuantityData.length });
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function reportTotalScheduleByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (startDate) {
        startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
      }
      if (endDate) {
        endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
      }

      const MAX_COUNT = 500;
      const allStations = await StationsResourceAccess.find({ stationStatus: STATION_STATUS.ACTIVE, ...filter }, 0, MAX_COUNT);
      let stationBookingList = [];

      if (allStations && allStations.length > 0) {
        const promiseList = allStations.map(station => _countStationBooking(station, startDate, endDate));

        stationBookingList = await Promise.all(promiseList);
      }
      const result = _getLargestStationBookings(stationBookingList, 10);

      return resolve({ data: result, total: result.length });
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _countStationBooking(station, startDate, endDate) {
  const stationBookingCount = await CustomerScheduleResourceAccess.customCount({ stationsId: station.stationsId }, startDate, endDate);

  return {
    stationsId: station.stationsId,
    stationName: station.stationsName,
    stationCode: station.stationCode,
    stationArea: station.stationArea,
    totalScheduleCount: stationBookingCount || 0,
  };
}

function _getLargestStationBookings(stationBookings, quantity = 10) {
  stationBookings.sort((a, b) => (a.totalScheduleCount < b.totalScheduleCount ? 1 : a.totalScheduleCount > b.totalScheduleCount ? -1 : 0));
  return stationBookings.slice(0, quantity);
}

async function reportTotalScheduleByStationArea(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const promiseList = STATIONS_AREA.map(area => _calculateStationScheduleCount(area.value, startDate, endDate));

      const stationScheduleCountByArea = await Promise.all(promiseList);

      if (stationScheduleCountByArea) {
        _sortScheduleCountByArea(stationScheduleCountByArea);
        return resolve({ data: stationScheduleCountByArea, total: stationScheduleCountByArea.length });
      }

      return resolve({ data: [], total: 0 });
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _calculateStationScheduleCount(stationArea, startDate, endDate) {
  const scheduleCount = await _filterScheduleByStartDateAndEndDate({ stationArea: stationArea }, startDate, endDate);

  return {
    stationArea: stationArea,
    totalScheduleCount: scheduleCount || 0,
  };
}

async function _filterScheduleByStartDateAndEndDate(filter, startDate, endDate, searchText, order) {
  if (startDate && endDate) {
    const startDateMoment = moment(startDate, 'DD/MM/YYYY');
    const endDateMoment = moment(endDate, 'DD/MM/YYYY');
    const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

    if (diffDateCount <= 0 || diffDateCount > 31) {
      console.error(`INVALID START DATE AND END DATE`);
      return 0;
    }

    const schedulePromiseList = [];
    for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
      const _dateSchedule = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');

      const scheduleCount = CustomerScheduleView.customCount({ ...filter, dateSchedule: _dateSchedule }, undefined, undefined, searchText, order);

      schedulePromiseList.push(scheduleCount);
    }

    const scheduleCountResult = await Promise.all(schedulePromiseList);

    return scheduleCountResult.reduce((acc, scheduleCount) => {
      return acc + scheduleCount || 0;
    }, 0);
  } else {
    return await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
  }
}

function _sortScheduleCountByArea(stationBookingCountList) {
  stationBookingCountList.sort((a, b) => (a.totalScheduleCount < b.totalScheduleCount ? 1 : a.totalScheduleCount > b.totalScheduleCount ? -1 : 0));
}

async function advanceUserGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'VIEW_SCHEDULE'], req.currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      // get schedule of current station
      filter.stationsId = req.currentUser.stationsId;

      if (startDate && endDate) {
        const startDateMoment = moment(startDate, 'DD/MM/YYYY');
        const endDateMoment = moment(endDate, 'DD/MM/YYYY');
        const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

        if (diffDateCount < 0 || diffDateCount > 30) {
          return reject(SCHEDULE_ERROR.INVALID_SCHEDULE_FILTER_DATE);
        }

        const scheduleDateList = [];
        for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
          const scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');
          scheduleDateList.push(scheduleDate);
        }
        filter.dateSchedule = scheduleDateList;
      }

      let customerScheduleList, customerScheduleCount;
      customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        if (customerScheduleCount === undefined) {
          customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        }

        if (customerScheduleCount > 0) {
          _convertScheduleSerial(customerScheduleList);

          await _attachInfoForSchedule(customerScheduleList);
          await _attachOrderData(customerScheduleList);
          await _attachListCrimeOfSchedule(customerScheduleList);

          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function _attachInfoForSchedule(scheduleList) {
  for (let schedule of scheduleList) {
    let vehicleExpiryDate = null;
    let username = null;
    let vehicleSubCategory = null;
    let vehicleSubType = null;

    if (schedule.appUserId) {
      const vehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates, appUserId: schedule.appUserId }, 0, 1);
      if (vehicle && vehicle.length > 0) {
        vehicleExpiryDate = vehicle[0].vehicleExpiryDate;
        vehicleSubCategory = vehicle[0].vehicleSubCategory;
        vehicleSubType = vehicle[0].vehicleSubType;
      }
    }

    if (schedule.createdBy) {
      const appUser = await AppUsersResourceAccess.findById(schedule.createdBy);
      if (appUser) {
        username = appUser.username;
      }
    }

    schedule.vehicleExpiryDate = vehicleExpiryDate;
    schedule.vehicleSubCategory = vehicleSubCategory;
    schedule.vehicleSubType = vehicleSubType;
    schedule.username = username;
    await _attachStationServiceToSchedule(schedule);
  }
}

async function advanceUserCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      let reason = 'nhân viên trạm đã hủy ';
      if (isNotEmptyStringValue(req.payload.reason)) {
        reason += `với lý do ${req.payload.reason}`;
      }
      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      if (!_existingSchedule || _existingSchedule.stationsId !== req.currentUser.stationsId) {
        return reject(NOT_FOUND);
      }
      const STATION_USER_CANCEL = true;
      let result = await ScheduleFunctions.cancelUserSchedule(_existingSchedule.appUserId, customerScheduleId, reason, STATION_USER_CANCEL);

      if (result) {
        // save cancel schedule data
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        // notify cancel to customer
        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);
        await logCustomerScheduleChanged(
          _existingSchedule,
          { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED },
          req.currentUser,
          customerScheduleId,
        );
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function staffCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      let reason = 'hệ thống đã hủy';
      if (req.payload.reason) {
        reason += ' với lý do ' + req.payload.reaso;
      }
      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      if (!_existingSchedule) {
        return reject(NOT_FOUND);
      }

      let result = await ScheduleFunctions.cancelUserSchedule(_existingSchedule.appUserId, customerScheduleId, reason, true);

      if (result) {
        // save cancel schedule data
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.staffId, PERFORMER_TYPE.ADMIN);
        // notify cancel to customer
        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);
        await logCustomerScheduleChanged(
          _existingSchedule,
          { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED },
          req.currentUser,
          customerScheduleId,
        );
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function advanceUserSearchSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      if (isNotValidValue(searchText) || (isValidValue(searchText) && searchText.length < 4)) {
        return resolve({ data: [], total: 0 });
      }

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'VIEW_SCHEDULE'], req.currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      const customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        const customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        if (customerScheduleCount > 0) {
          _convertScheduleSerial(customerScheduleList);
          await _attachInfoForSchedule(customerScheduleList);
          await _attachListCrimeOfSchedule(customerScheduleList);
          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function getScheduleByHash(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const scheduleHash = req.payload.scheduleHash;
      let schedules = undefined;

      schedules = await CustomerScheduleView.find({ scheduleHash: scheduleHash }, 0, 1);

      await _attachUserVehicleDataToSchedule(schedules[0]);

      if (schedules && schedules.length > 0) {
        await _attachListCrimeOfSchedule(schedules);
        return resolve(schedules[0]);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function calculateInsurance(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const costType = req.payload.costType;
      // const isForBusiness = req.payload.isForBusiness;
      // const vehicleType = req.payload.vehicleType;
      // const seatsCount = req.payload.seatsCount;
      // const tonnage = req.payload.tonnage;

      const vehicleId = req.payload.vehicleId;

      const vehicle = await AppUserVehicleResourceAccess.findById(vehicleId);

      if (!vehicle) {
        return reject(NOT_FOUND);
      }

      if (!Number.isInteger(vehicle.vehicleCategory) || !Number.isInteger(vehicle.vehicleForBusiness)) {
        return reject(SCHEDULE_ERROR.MISSING_VEHICLE_INFO);
      }

      const totalSeatCount = vehicle.vehicleSeatsLimit + vehicle.vehicleBerthLimit;
      const tonnage = vehicle.vehicleTotalWeight;
      let vehicleType;
      const isForBusiness = vehicle.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;

      if ([VR_VEHICLE_TYPE.XE_CHO_NGUOI, VR_VEHICLE_TYPE.XE_CHUYEN_DUNG, VR_VEHICLE_TYPE.XE_CO_DONG_CO].includes(vehicle.vehicleCategory)) {
        vehicleType = VEHICLE_TYPES.CAR;
      }

      if ([VR_VEHICLE_TYPE.XE_CHO_HANG, VR_VEHICLE_TYPE.XE_DAU_KEO, VR_VEHICLE_TYPE.RO_MOOC].includes(vehicle.vehicleCategory)) {
        vehicleType = VEHICLE_TYPES.TRUCK;
      }

      //  nếu là xe chở người mà không có thông tin về số chỗ ngồi thì báo lỗi
      if (vehicle.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && !totalSeatCount) {
        return reject(SCHEDULE_ERROR.MISSING_VEHICLE_INFO);
      }

      //  nếu là xe chở hàng mà không có thông tin về trọng tải thì báo lỗi
      if ([VR_VEHICLE_TYPE.XE_CHO_HANG, VR_VEHICLE_TYPE.RO_MOOC].includes(vehicle.vehicleCategory) && !tonnage) {
        return reject(SCHEDULE_ERROR.MISSING_VEHICLE_INFO);
      }

      const cost = ScheduleFunctions.calculateInsuranceCost(costType, seatsCount, isForBusiness, vehicleType, tonnage);

      return resolve(cost);
    } catch (e) {
      handleErrorResponse(e, reject);
    }
  });
}

async function reportCustomerSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const startMonth = moment().startOf('month').format();
      const startWeek = moment().startOf('isoWeek').format();

      const report = await Promise.all([
        // Lịch hẹn mới trong tháng
        CustomerScheduleResourceAccess.customCount({}, startMonth),

        // Lịch hẹn mới trong tuần
        CustomerScheduleResourceAccess.customCount({}, startWeek),
      ])
        .then(res => {
          resolve({
            totalNewScheduleThisMonth: res[0],
            totalNewScheduleThisWeek: res[1],
          });
        })
        .catch(error => {
          Logger.error(__filename, error);
          reject('failed');
        });
    } catch (error) {
      Logger.error(__filename, error);
      reject('failed');
    }
  });
}

async function _autoCreateCustomerRecord(customerScheduleId) {
  // Tự động tạo customerRecord
  const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

  if (customerSchedule.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
    // Tạo customerRecord
    await _createCustomerRecordFromSchedule(customerSchedule);
  }

  // Thêm khách hàng vào danh sách khách hàng của trạm StationCustomer
  await addStationCustomer(customerSchedule.appUserId, customerSchedule.stationsId, customerSchedule.appUserVehicleId);
}

function findBestScheduleTime(data) {
  let bestScheduleTime = null;

  for (const item of data) {
    if (item.scheduleTimeStatus === 1 && item.totalBookingSchedule <= item.totalSchedule) {
      if (bestScheduleTime === null || item.totalBookingSchedule < bestScheduleTime.totalBookingSchedule) {
        bestScheduleTime = item;

        // Dừng ngay sau khi tìm thấy phần tử thỏa mãn điều kiện
        if (item.totalBookingSchedule === 0) {
          break;
        }
      }
    }
  }

  return bestScheduleTime;
}

function parseSMSContent(smsContent) {
  let scheduleData = smsContent.trim().split(/\s+/);
  if (!scheduleData || scheduleData.length < 3) {
    console.log('INVALID_SCHEDULE_DATA');
    return null;
  }

  // Convert ngày hẹn ở các dạng về DD/MM/YYYY
  const originalFormats = ['DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'YYYYMMDD'];
  const dateSchedule = moment(scheduleData[2], originalFormats).format(DATE_DISPLAY_FORMAT);

  console.log(dateSchedule);

  return {
    stationCode: scheduleData[0],
    licensePlates: scheduleData[1],
    dateSchedule: dateSchedule,
  };
}

module.exports = {
  userPartnerGetListSchedule,
  insert,
  find,
  updateById,
  findById,
  deleteById,
  userCreateSchedule,
  userGetDetailSchedule,
  userGetListSchedule,
  userCancelSchedule,
  exportExcelCustomerSchedule,
  reportTotalByDay,
  reportTotalScheduleByStation,
  reportTotalScheduleByStationArea,
  advanceUserInsertSchedule,
  advanceUserGetList,
  advanceUserCancelSchedule,
  advanceUserSearchSchedule,
  advanceUserUpdateSchedule,
  getScheduleByHash,
  staffCancelSchedule,
  advanceUserGetDetailSchedule,
  calculateInsurance,
  userCreateRoadFeeSchedule,
  userCreateInspectionFeeSchedule,
  userCreateInsuranceFeeSchedule,
  partnerCreateSchedule,
  userCreateConsultant,
  userPartnerMomoCancelSchedule,
  userPartnerGetDetailSchedule,
  reportCustomerSchedule,
  adminUpdateById,
};
