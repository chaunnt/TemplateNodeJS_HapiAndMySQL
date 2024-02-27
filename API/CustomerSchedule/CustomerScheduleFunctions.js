/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const {
  SCHEDULE_ERROR,
  SCHEDULE_STATUS,
  SCHEDULE_CACHE_KEYS,
  PERFORMER_TYPE,
  COST_TYPES,
  FOR_BUSINESS,
  LICENSE_PLATE_COLOR,
  VEHICLE_TYPES,
} = require('./CustomerScheduleConstants');
const {
  isNotEmptyStringValue,
  padLeadingZeros,
  checkingValidPlateNumber,
  isNotValidValue,
  makeHashFromData,
  shuffleArrayRandom,
} = require('../ApiUtils/utilFunctions');
const Logger = require('../../utils/logging');

const ScheduleServicesMappingResourceAccess = require('../StationServices/resourceAccess/ScheduleServicesMappingResourceAccess');
const CustomerScheduleResourceAccess = require('./resourceAccess/CustomerScheduleResourceAccess');
const AppUserVehicleResourceAccess = require('../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const StationsWorkScheduleFunctions = require('../StationWorkSchedule/StationWorkScheduleFunctions');
const CustomerRecordResourceAccess = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY, BOOKING_PHONE_STATUS, USER_VERIFY_PHONE_NUMBER_STATUS } = require('../AppUsers/AppUsersConstant');
const CustomerScheduleChangeResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleChangeResourceAccess');
const CustomerScheduleFailedResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleFailedResourceAccess');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');

const { VEHICLE_TYPE, SCHEDULE_TYPE } = require('./CustomerScheduleConstants');
const { CHECKING_STATUS, DATE_DISPLAY_FORMAT, DATE_DB_SORT_FORMAT } = require('../CustomerRecord/CustomerRecordConstants');
const moment = require('moment');
const RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
const CustomerScheduleTrackingResourceAccess = require('./resourceAccess/CustomerScheduleTrackingResourceAccess');
const { NORMAL_USER_ROLE } = require('../AppUserRole/AppUserRoleConstant');
const {
  BOOKING_MIXTURE_SCHEDULE,
  AVAILABLE_STATUS,
  STATION_STATUS,
  AUTO_CONFIRM_SCHEDULE,
  SETTING_STATUS,
} = require('../Stations/StationsConstants');
const { SERVICE_TYPES } = require('../StationServices/StationServicesConstants');
const StationsView = require('../StationServices/resourceAccess/StationsView');
const { STRICT_MODE, VEHICLE_PLATE_TYPE, VEHICLE_SUB_TYPE, VEHICLE_SUB_CATEGORY, CRIMINAL } = require('../AppUserVehicle/AppUserVehicleConstant');
const { BOOKING_STATUS } = require('../Stations/StationsConstants');
const AppUserVehicleFunctions = require('../AppUserVehicle/AppUserVehicleFunctions');
const AppUsersFunctions = require('../AppUsers/AppUsersFunctions');
const CustomerMessageFunctions = require('../CustomerMessage/CustomerMessageFunctions');
const CustomerRecordFunctions = require('../CustomerRecord/CustomerRecordFunctions');
const StationCustomerFunctions = require('../StationCustomer/StationCustomerFunctions');
const OrderFunctions = require('../Order/OrderFunctions');
const FirebaseNotificationFunctions = require('../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const { MESSAGE_TYPE } = require('../MessageCustomerMarketing/MessageCustomerMarketingConstant');
const CustomerCriminalRecordFunctions = require('../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
const CustomerCriminalResourceAccess = require('../CustomerCriminalRecord/resourceAccess/CustomerCriminalRecordResourceAccess');
const CustomerRecordCriminalMapping = require('../CustomerCriminalRecord/resourceAccess/CustomerRecordCriminalMapping');
const CustomerScheduleCriminalMapping = require('../CustomerCriminalRecord/resourceAccess/CustomerScheduleCriminalMapping');
const { reportToTelegram } = require('../../ThirdParty/TelegramBot/TelegramBotFunctions');

// Hàm kiểm tra và thay thế giá trị của scheduleType
function _mapScheduleType(scheduleType) {
  switch (scheduleType) {
    case SCHEDULE_TYPE.CONSULTANT_MAINTENANCE:
      return SERVICE_TYPES.REPAIR_SERVICE;
    case SCHEDULE_TYPE.CONSULTANT_INSURANCE:
      return SERVICE_TYPES.EXTEND_INSURANCE_TNDS;
    case SCHEDULE_TYPE.CONSULTANT_RENOVATION:
      return SERVICE_TYPES.CONSULTATION_IMPROVEMENT;
    default:
      return scheduleType;
  }
}

async function processScheduleInput(scheduleData, stationsData) {
  const isStationAvailable = !stationsData || stationsData.availableStatus !== AVAILABLE_STATUS.UNAVAILABLE;
  const isAutoConfirm = !stationsData || stationsData.enableConfigAutoConfirm !== AUTO_CONFIRM_SCHEDULE.DISABLE;

  //xu ly data input chong hack
  scheduleData.dateSchedule = scheduleData.dateSchedule.trim();

  scheduleData.dateSchedule = moment(scheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DISPLAY_FORMAT);
  if (
    !scheduleData.dateSchedule ||
    scheduleData.dateSchedule === '' ||
    scheduleData.dateSchedule === null ||
    scheduleData.dateSchedule === 'Invalid date'
  ) {
    throw SCHEDULE_ERROR.BOOKING_ON_TODAY;
  }

  if (scheduleData.time) {
    scheduleData.time = scheduleData.time.trim();
  }

  // convert dateSchedule dùng để sort
  if (scheduleData.dateSchedule) {
    scheduleData.daySchedule = moment(scheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
  }

  if (isStationAvailable && isAutoConfirm) {
    scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.CONFIRMED;
  }

  return scheduleData;
}

async function addNewConsultantSchedule(scheduleData, stationsData) {
  scheduleData = await processScheduleInput(scheduleData, stationsData);

  let result = await CustomerScheduleResourceAccess.insert(scheduleData);

  if (result) {
    return result;
  }

  return undefined;
}

// Kiểm tra ngày không hợp lệ - ngày đã ở quá khứ
async function isValidScheduleDate(date) {
  // Sử dụng hàm moment để chuyển đổi ngày thành đối tượng Moment
  const parsedDate = moment(date, 'DD/MM/YYYY', true);

  // Lấy ngày hiện tại
  const currentDate = moment();

  // So sánh ngày đã chuyển đổi với ngày hiện tại
  if (parsedDate.isBefore(currentDate, 'day')) {
    return true; // Ngày đã ở quá khứ
  }

  return false; // Ngày hợp lệ và không ở quá khứ
}

async function addCustomerScheduleFailed(inputsFailed, creator) {
  let dataFailed = JSON.stringify(inputsFailed);

  let scheduleFailed = {
    createdBy: creator,
    inputFail: dataFailed,
  };

  await CustomerScheduleFailedResourceAccess.insert(scheduleFailed);
}

function getLimitVehicleByType(vehicleType, config) {
  let _scheduleLimit = 0;
  switch (vehicleType) {
    case VEHICLE_TYPE.CAR:
      _scheduleLimit = config.limitSmallCar || 0;
      break;
    case VEHICLE_TYPE.RO_MOOC:
      if (config.limitRoMooc) {
        _scheduleLimit = config.limitRoMooc || 0;
      }
      break;
    case VEHICLE_TYPE.OTHER:
      _scheduleLimit = config.limitOtherVehicle || 0;
      break;
  }
  return _scheduleLimit;
}

function getMixtureLimitVehicle(config) {
  const limitCar = Number(config.limitSmallCar) || 0;
  const limitRmooc = Number(config.limitRoMooc) || 0;
  const limitOtherVehicle = Number(config.limitOtherVehicle) || 0;

  return limitCar + limitRmooc + limitOtherVehicle;
}

function _getBookingLimitFromConfig(hourRange, bookingConfig, vehicleType) {
  let _limit = 0;

  if (!vehicleType) {
    vehicleType = VEHICLE_TYPE.OTHER;
  }
  for (let i = 0; i < bookingConfig.length; i++) {
    const _config = bookingConfig[i];
    if (_config.time === hourRange && _config.enableBooking) {
      _limit = getLimitVehicleByType(vehicleType, _config);
    }
  }
  return _limit;
}

function _getMixtureBookingLimit(hourRange, bookingConfig) {
  let limit = 0;

  const targetConfig = bookingConfig.find(config => config.time === hourRange && config.enableBooking);

  if (targetConfig) {
    limit = getMixtureLimitVehicle(targetConfig);
  }

  return limit;
}

async function _countScheduleByStationId(stationId, filter, skip, limit) {
  let _currentConfirmedBookingCount = 0;

  _currentConfirmedBookingCount = await CustomerScheduleResourceAccess.customSearch(
    {
      ...filter,
      stationsId: stationId,
    },
    skip,
    limit,
  );
  if (_currentConfirmedBookingCount && _currentConfirmedBookingCount.length > 0) {
    _currentConfirmedBookingCount = _currentConfirmedBookingCount.length;
  } else {
    _currentConfirmedBookingCount = 0;
  }

  return _currentConfirmedBookingCount;
}

async function _cacheScheduleByPlateNumber(plateNumber, bookingCount) {
  if (process.env.REDIS_ENABLE * 1 === 1) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PLATE_NUMBER}_${plateNumber}`, bookingCount);
  }
}

async function _cacheScheduleByUserId(appUserId, bookingCount) {
  if (process.env.REDIS_ENABLE * 1 === 1) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_USER_ID}_${appUserId}`, bookingCount);
  }
}

async function _cacheScheduleByPhoneNumber(phoneNumber, bookingCount) {
  if (process.env.REDIS_ENABLE * 1 === 1) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PHONE}_${phoneNumber}`, bookingCount);
  }
}

async function _countScheduleByPlateNumber(plateNumber, scheduleType, bookingStatuses = []) {
  let _currentConfirmedBookingCount = 0;

  let _existingBookingList = await CustomerScheduleResourceAccess.customSearch(
    { licensePlates: plateNumber, scheduleType, CustomerScheduleStatus: bookingStatuses },
    0,
    100,
  );
  _currentConfirmedBookingCount += _existingBookingList.length;
  return _currentConfirmedBookingCount;
}

//bookingCount === 1 => tang
//bookingCount === -1 => giam
async function updateBookingCountByDate(customerScheduleId, bookingCount = 1) {
  if (process.env.REDIS_ENABLE * 1 !== 1) {
    return;
  }
  let scheduleData = await CustomerScheduleResourceAccess.findById(customerScheduleId);
  if (scheduleData) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${scheduleData.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleData.dateSchedule}`);
    redisKey = redisKey.replace('{vehicleType}', `${scheduleData.vehicleType}`);

    const cacheData = await RedisInstance.getJson(redisKey);
    let successBookingsCount = 0;
    if (cacheData) {
      successBookingsCount = cacheData.successBookingsCount;
    } else {
      const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];

      successBookingsCount = await CustomerScheduleResourceAccess.customCount({
        stationsId: scheduleData.stationsId,
        dateSchedule: scheduleData.dateSchedule,
        CustomerScheduleStatus: successBookingStatus,
        vehicleType: scheduleData.vehicleType,
      });
    }
    successBookingsCount += bookingCount;

    if (successBookingsCount !== undefined && successBookingsCount !== null) {
      await RedisInstance.setWithExpire(redisKey, JSON.stringify({ successBookingsCount: successBookingsCount * 1 }));
    }
  }
}

async function _checkStationBookingConfig(stationBookingConfig, stationId, dateSchedule, vehicleType) {
  // Kiểm tra trạm có ngưng nhận lịch không
  const allowBooking = stationBookingConfig.some(timeVal => timeVal.enableBooking === 1);

  // Nếu trạm có nhận lịch thì tiến hành kiểm tra trạm có nhận kiểm định loại xe này không
  if (allowBooking) {
    // Lấy cấu hình kiểm định của trạm ở ngày cụ thể
    const stationBookingConfig = await StationsWorkScheduleFunctions.getWorkStatusListByDate(stationId, dateSchedule);
    if (stationBookingConfig) {
      // Kiểm tra loại xe và cấu hình của trạm
      switch (vehicleType) {
        case 1: // Car
          if (stationBookingConfig.enableSmallCar === 0) {
            return false;
          }
          break;
        case 10: // Other Vehicle
          if (stationBookingConfig.enableOtherVehicle === 0) {
            return false;
          }
          break;
        case 20: // RoMooc
          if (stationBookingConfig.enableRoMooc === 0) {
            return false;
          }
          break;
        default:
          // Loại xe không được hỗ trợ hoặc không xác định
          return false;
      }
    }
  }

  // Nếu không có vấn đề gì, trả về true
  return true;
}

async function createNewSchedule(scheduleData, station, appUser) {
  // Đang bật strict mode
  let _isStrictModeEnabled = process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE;

  if (!station || !station.stationsId) {
    console.error(`createNewSchedule INVALID_STATION`);
    console.error(scheduleData);
    console.error(station);
    throw SCHEDULE_ERROR.INVALID_STATION;
  }

  if (!isNotEmptyStringValue(station.stationBookingConfig)) {
    throw SCHEDULE_ERROR.INVALID_BOOKING_CONFIG;
  }
  if (!checkingValidPlateNumber(scheduleData.licensePlates)) {
    throw SCHEDULE_ERROR.INVALID_PLATE_NUMBER;
  }

  // Kiem tra lich co dat vao ngay nghi cua tram hay khong
  await _checkingBookingOnDayOff(scheduleData, station.stationsId);

  let _stationBookingConfig = JSON.parse(station.stationBookingConfig);

  // Kiểm tra trạm có nhận kiểm định loại xe đang đặt lịch không
  const validDate = await _checkStationBookingConfig(_stationBookingConfig, station.stationsId, scheduleData.dateSchedule, scheduleData.vehicleType);
  if (!validDate) {
    throw SCHEDULE_ERROR.STATION_NOT_ACCEPTED_VEHICLE_TYPE;
  }

  //nếu không cho phép đặt quá giới hạn thì sẽ kiểm tra số lượng
  let _overbookingEnable = station.enableConfigAllowBookingOverLimit && station.enableConfigAllowBookingOverLimit * 1 === 1;
  if (!_overbookingEnable) {
    await _countScheduleLimit();
  }

  //nếu cho phép quá giới hạn nhưng người đặt không phải là nhân viên trung tâm
  //thì cũng sẽ kiểm tra số lượng
  let _staffBooking = appUser && appUser.appUserRoleId > NORMAL_USER_ROLE;
  if (_overbookingEnable && !_staffBooking) {
    await _countScheduleLimit();
  }

  // gioi han so luong lich hen cua nguoi dung
  let _notOverLimitPerAccount = {};
  if (_isStrictModeEnabled) {
    _notOverLimitPerAccount = await _checkingLimitSchedule(scheduleData);
  }

  await _addScheduleSerial(scheduleData, station.stationsId);
  _addScheduleCode(scheduleData, station.stationCode);

  let result = await CustomerScheduleResourceAccess.insert(scheduleData);

  if (result && _notOverLimitPerAccount && _notOverLimitPerAccount.length > 0) {
    // update redis count value
    await _cacheScheduleByPlateNumber(scheduleData.licensePlates, _notOverLimitPerAccount.scheduleCountByPlateNumber + 1);
    await _cacheScheduleByUserId(scheduleData.appUserId, _notOverLimitPerAccount.scheduleCountByUserId + 1);
    await _cacheScheduleByPhoneNumber(scheduleData.phone, _notOverLimitPerAccount.scheduleCountByPhoneNumber + 1);
  }
  return result;

  async function _countScheduleLimit() {
    let _bookingLimit = _getBookingLimitFromConfig(scheduleData.time, _stationBookingConfig, scheduleData.vehicleType);

    if (_bookingLimit === 0) {
      // Nếu trạm dừngng nhận lịch và tắt strictmode thì vẫn cho user đặt lịch nhưng trạng thái lịch là đang chờ xác nhận
      if (!_isStrictModeEnabled) {
        scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.NEW;
      } else throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED_BY_CONFIG;
    }

    //khong duoc dat qua so luong gioi han
    let _currentBookingCount = await _countScheduleByStationId(
      scheduleData.stationsId,
      {
        time: scheduleData.time,
        dateSchedule: scheduleData.dateSchedule,
        CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
        vehicleType: scheduleData.vehicleType,
      },
      0,
      _bookingLimit + 1,
    );

    //Kiểm tra số lượng lịch hẹn có vượt quá giới hạn theo từng khung giờ không
    if (_bookingLimit <= _currentBookingCount) {
      // Trạm ngưng nhận lịch <=> tắt tất cả các giờ hẹn
      const stationStopBooking = _stationBookingConfig.every(item => item.enableBooking === SETTING_STATUS.DISABLE);

      // Nếu strictmode tắt và trạm ngưng nhận lịch thì vẫn cho đặt lịch nhưng trạng thái là chưa xác nhận
      if (!_isStrictModeEnabled && stationStopBooking) {
        scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.NEW;
      } else throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED;
    }
  }
}

async function _checkingBookingOnDayOff(scheduleData, stationsId) {
  const isUserBookingOnDayOff = await StationsWorkScheduleFunctions.checkUserBookingOnDayOff(
    scheduleData.dateSchedule,
    scheduleData.time,
    stationsId,
  );
  if (isUserBookingOnDayOff) {
    throw SCHEDULE_ERROR.BOOKING_ON_DAY_OFF;
  }
}

async function createMixtureSchedule(scheduleData, station, appUser) {
  // Đang bật strict mode
  let _isStrictModeEnabled = process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE;

  if (!isNotEmptyStringValue(station.stationBookingConfig)) {
    throw SCHEDULE_ERROR.INVALID_BOOKING_CONFIG;
  }
  if (!checkingValidPlateNumber(scheduleData.licensePlates)) {
    throw SCHEDULE_ERROR.INVALID_PLATE_NUMBER;
  }

  // Kiem tra lich co dat vao ngay nghi cua tram hay khong
  await _checkingBookingOnDayOff(scheduleData, station.stationsId);

  let _stationBookingConfig = JSON.parse(station.stationBookingConfig);

  //nếu không cho phép đặt quá giới hạn thì sẽ kiểm tra số lượng
  let _overbookingEnable = station.enableConfigAllowBookingOverLimit && station.enableConfigAllowBookingOverLimit * 1 === 1;
  if (!_overbookingEnable) {
    await _countMixtureBookingLimit();
  }

  //nếu cho phép quá giới hạn nhưng người đặt không phải là nhân viên trung tâm
  //thì cũng sẽ kiểm tra số lượng
  let _staffBooking = appUser && appUser.appUserRoleId > NORMAL_USER_ROLE;
  if (_overbookingEnable && !_staffBooking) {
    await _countMixtureBookingLimit();
  }

  let _notOverLimitPerAccount = {};
  if (_isStrictModeEnabled) {
    _notOverLimitPerAccount = await _checkingLimitSchedule(scheduleData);
  }

  await _addScheduleSerial(scheduleData, station.stationsId);
  _addScheduleCode(scheduleData, station.stationCode);

  let result = await CustomerScheduleResourceAccess.insert(scheduleData);

  if (result && _notOverLimitPerAccount && _notOverLimitPerAccount.length > 0) {
    // update redis count value
    await _cacheScheduleByPlateNumber(scheduleData.licensePlates, _notOverLimitPerAccount.scheduleCountByPlateNumber + 1);
    await _cacheScheduleByUserId(scheduleData.appUserId, _notOverLimitPerAccount.scheduleCountByUserId + 1);
    await _cacheScheduleByPhoneNumber(scheduleData.phone, _notOverLimitPerAccount.scheduleCountByPhoneNumber + 1);
  }
  return result;

  async function _countMixtureBookingLimit() {
    let _bookingLimit = _getMixtureBookingLimit(scheduleData.time, _stationBookingConfig);

    if (_bookingLimit === 0) {
      // Nếu trạm dừngng nhận lịch và tắt strictmode thì vẫn cho user đặt lịch nhưng trạng thái lịch là đang chờ xác nhận
      if (!_isStrictModeEnabled) {
        scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.NEW;
      } else throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED_BY_CONFIG;
    }

    //khong duoc dat qua so luong gioi han
    let _currentBookingCount = await _countScheduleByStationId(
      scheduleData.stationsId,
      {
        time: scheduleData.time,
        dateSchedule: scheduleData.dateSchedule,
        CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
      },
      0,
      _bookingLimit + 1,
    );

    //Kiểm tra số lượng lịch hẹn có vượt quá giới hạn theo từng khung giờ không
    if (_bookingLimit <= _currentBookingCount) {
      // Trạm ngưng nhận lịch <=> tắt tất cả các giờ hẹn
      const stationStopBooking = _stationBookingConfig.every(item => item.enableBooking === SETTING_STATUS.DISABLE);

      // Nếu strictmode tắt và trạm ngưng nhận lịch thì vẫn cho đặt lịch nhưng trạng thái là chưa xác nhận
      if (!_isStrictModeEnabled && stationStopBooking) {
        scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.NEW;
      } else throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED;
    }
  }
}

async function _addScheduleSerial(scheduleData, stationsId) {
  const dateSchedule = scheduleData.dateSchedule;
  const timeSchedule = scheduleData.time;
  let serialNumber = 1;
  let currentNumberOfBookings = await CustomerScheduleResourceAccess.find(
    { dateSchedule: dateSchedule, time: timeSchedule, stationsId: stationsId },
    0,
    1,
    { key: 'scheduleSerial', value: 'desc' },
  );

  if (currentNumberOfBookings && currentNumberOfBookings.length > 0) {
    serialNumber = currentNumberOfBookings[0].scheduleSerial + 1;
  }

  scheduleData.scheduleSerial = serialNumber;
}

async function _checkingLimitSchedule(scheduleData) {
  let scheduleCountByUserId = 0;
  let scheduleCountByPhoneNumber = 0;
  let scheduleCountByPlateNumber = 0;
  // 1 BSX khong duoc dat lich hen 2 lan
  let _existingNewBooking = await _countScheduleByPlateNumber(scheduleData.licensePlates, scheduleData.scheduleType, [
    SCHEDULE_STATUS.NEW,
    SCHEDULE_STATUS.CONFIRMED,
  ]);
  if (_existingNewBooking && _existingNewBooking > 0) {
    throw SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED;
  }

  // mot tai khoan ca nhan khong dat qua 20 lich hen
  let _appUser = undefined;
  if (scheduleData.appUserId) {
    _appUser = await AppUsersResourceAccess.findById(scheduleData.appUserId);

    //tai khoan ca nhan (khong phai nhan vien trung tam va khong phai tai khoan doanh nghiep)
    //thi bi gioi han khong duoc dat qua 10 lich hen
    if (_appUser && _appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT && _appUser.appUserRoleId <= NORMAL_USER_ROLE) {
      scheduleCountByUserId = await _countScheduleByUserId(scheduleData.appUserId);
      const LIMIT_SCHEDULE_BY_USER = 10;
      if (scheduleCountByUserId >= LIMIT_SCHEDULE_BY_USER) {
        throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_USER;
      }

      // kiem tra so dien thoai khong dat qua 20 lich hen (1 SDT co khi co nhieu tai khoan do xoa tai khoan)
      if (scheduleData.phone) {
        const LIMIT_SCHEDULE_BY_PHONE = 10;
        scheduleCountByPhoneNumber = await _countScheduleByPhone(scheduleData.phone);

        if (scheduleCountByPhoneNumber >= LIMIT_SCHEDULE_BY_PHONE) {
          // update phone status for user
          await AppUsersResourceAccess.updateById(scheduleData.appUserId, { enableBookingStatus: BOOKING_PHONE_STATUS.BLOCK });
          throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_PHONE;
        }
      }
    }

    // 1 biển số xe không được đặt 5 lần
    //   scheduleCountByPlateNumber = await _countScheduleByPlateNumber(scheduleData.licensePlates);
    //   const MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR = 5;
    //   if (scheduleCountByPlateNumber >= MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR) {
    //     throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER;
    //   }
  }

  return {
    scheduleCountByUserId: scheduleCountByUserId,
    scheduleCountByPhoneNumber: scheduleCountByPhoneNumber,
    scheduleCountByPlateNumber: scheduleCountByPlateNumber,
  };
}

async function _countScheduleByUserId(appUserId) {
  const REDIS_KEY = `${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_USER_ID}_${appUserId}`;
  let scheduleCount;

  if (process.env.REDIS_ENABLE * 1 === 1) {
    const cacheValue = await RedisInstance.get(REDIS_KEY);
    if (cacheValue) {
      scheduleCount = Number(cacheValue);
    }
  }

  if (scheduleCount === undefined) {
    scheduleCount = (await CustomerScheduleResourceAccess.count({ appUserId: appUserId })) || 0;
    // cache value
    if (process.env.REDIS_ENABLE * 1 === 1) {
      await _cacheScheduleByUserId(appUserId, scheduleCount);
    }
  }

  return scheduleCount;
}

async function _countScheduleByPhone(phoneNumber) {
  const REDIS_KEY = `${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PHONE}_${phoneNumber}`;
  let scheduleCount;

  if (process.env.REDIS_ENABLE * 1 === 1) {
    const cacheValue = await RedisInstance.get(REDIS_KEY);
    if (cacheValue) {
      scheduleCount = Number(cacheValue);
    }
  }

  if (scheduleCount === undefined) {
    scheduleCount = (await CustomerScheduleResourceAccess.count({ phone: phoneNumber })) || 0;
    // cache value
    if (process.env.REDIS_ENABLE * 1 === 1) {
      await _cacheScheduleByPhoneNumber(phoneNumber, scheduleCount);
    }
  }

  return scheduleCount;
}

function _addScheduleCode(scheduleData, stationCode) {
  const dateSchedule = scheduleData.dateSchedule;
  const serialNumber = scheduleData.scheduleSerial || 1;

  const separateTime = dateSchedule.split('/');
  const dateFormatDD = separateTime[0];
  const monthFormatMM = separateTime[1];
  const timeFormatHHmm = moment().format('HHmm');

  const scheduleCode = `${stationCode}${dateFormatDD}${monthFormatMM}${timeFormatHHmm}${padLeadingZeros(serialNumber, 3)}`;
  scheduleData.scheduleCode = scheduleCode;
}

async function cancelScheduleList(scheduleList, reason) {
  if (isNotValidValue(scheduleList) || scheduleList.length <= 0) {
    return;
  }
  for (let i = 0; i < scheduleList.length; i++) {
    const _schedule = scheduleList[i];
    await cancelUserSchedule(_schedule.appUserId, _schedule.customerScheduleId, reason);
  }
}

async function cancelAllScheduleByUser(appUserId, reason) {
  const successBookingStatus = [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];
  let _scheduleList = await CustomerScheduleResourceAccess.customSearch({
    appUserId: appUserId,
    CustomerScheduleStatus: successBookingStatus,
  });
  return await cancelScheduleList(_scheduleList, reason);
}

async function cancelUserSchedule(appUserId, customerScheduleId, reason, isStationUserCancel) {
  let _customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
  if (_customerSchedule.appUserId !== appUserId) {
    console.error(`cancelUserSchedule failed appUserId ${appUserId} - customerScheduleId ${customerScheduleId}`);
    return undefined;
  }

  if (_customerSchedule && ![SCHEDULE_STATUS.CANCELED, SCHEDULE_STATUS.CLOSED].includes(_customerSchedule.CustomerScheduleStatus)) {
    let customerScheduleData = {
      CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
    };
    if (reason) {
      let performer = 'TTDK';
      if (!isStationUserCancel) {
        const appUser = await AppUsersResourceAccess.findById(appUserId);
        if (appUser) {
          performer = appUser.username;
        } else {
          performer = _customerSchedule.fullnameSchedule;
        }
      }
      const cancelReason = updateScheduleNote(_customerSchedule.scheduleNote || '', reason, performer);
      customerScheduleData.scheduleNote = cancelReason;
    }
    let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);
    if (result) {
      //huy lich thi xoa record dang kiem
      const likedCustomerRecords = await CustomerRecordResourceAccess.findById(_customerSchedule.customerRecordId);
      if (likedCustomerRecords) {
        await CustomerRecordResourceAccess.deleteById(likedCustomerRecords.customerRecordId);
      }
    }
    return result;
  } else {
    console.error(`already cancel`);
    throw SCHEDULE_ERROR.ALREADY_CANCEL;
  }
}

async function saveBookingScheduleData(data, userId, customerScheduleId) {
  const trackingData = {
    ...data,
    scheduleUserId: userId,
  };

  const existedRecord = await CustomerScheduleTrackingResourceAccess.findById(customerScheduleId);
  if (existedRecord) {
    return CustomerScheduleTrackingResourceAccess.updateById(customerScheduleId, trackingData);
  } else {
    trackingData.customerScheduleId = customerScheduleId;
    return CustomerScheduleTrackingResourceAccess.insert(trackingData);
  }
}

function generateMessageToCancelSchedule(stationCode, licensePlates, reason, hotline) {
  return `TTDK.COM.VN ${stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${licensePlates} đã bị hủy${
    reason ? ' do ' + reason : ''
  } Mọi thắc mắc xin liên hệ CSKH ${hotline} để được hỗ trợ.`;
}

function updateScheduleNote(previousNote, newNote, appUserName = 'TTDK') {
  const currentDate = moment().format('DD/MM/YYYY - HH:mm');
  const noteLabel = appUserName + ' - ' + currentDate;

  let newScheduleNote = '';
  if (previousNote && previousNote !== '') newScheduleNote = previousNote + '\n' + noteLabel + '\n' + newNote;
  else newScheduleNote = noteLabel + '\n' + newNote;

  return newScheduleNote;
}

async function saveCanceledScheduleData(scheduleId, canceledBy, performerType) {
  const data = {
    customerScheduleId: scheduleId,
    canceledBy: canceledBy,
    canceledTime: new Date(),
    canceledPerformerType: performerType,
  };

  return CustomerScheduleChangeResourceAccess.insert(data);
}

async function saveConfirmedScheduleData(scheduleId, confirmedBy, performerType) {
  const data = {
    confirmedBy: confirmedBy,
    confirmedTime: new Date(),
    confirmedPerformerType: performerType,
    customerScheduleId: scheduleId,
  };
  return CustomerScheduleChangeResourceAccess.insert(data);
}

function modifyScheduleTime(scheduleTime) {
  if (scheduleTime === '7h-9h') {
    return '7h30-9h30';
  }

  if (scheduleTime === '15h30-17h30') {
    return '15h-16h30';
  }

  return scheduleTime;
}

// seatsCount  = số chỗ ngồi
// isForBusiness = có kinh doanh vận tải hay không
// vehicleType =  loại xe (ô tô hay xe tải)
// tonnage = trọng tải (tấn)

function calculateInsuranceCost(costType = COST_TYPES.NET_COST, seatsCount, isForBusiness, vehicleType, tonnage) {
  let cost = 0;

  if (vehicleType === VEHICLE_TYPES.CAR) {
    // loai xe khong kinh doanh van tai
    if (isForBusiness === FOR_BUSINESS.NOT_HAVE) {
      if (seatsCount >= 1 && seatsCount < 6) {
        cost = costType === COST_TYPES.NET_COST ? 473000 : _includeVATCost(473000);
      } else if (seatsCount <= 11) {
        cost = costType === COST_TYPES.NET_COST ? 794000 : _includeVATCost(794000);
      } else if (seatsCount <= 24) {
        cost = costType === COST_TYPES.NET_COST ? 1270000 : _includeVATCost(1270000);
      } else {
        cost = costType === COST_TYPES.NET_COST ? 1825000 : _includeVATCost(1825000);
      }
    } else {
      // loai xe co kinh doanh van tai
      if (seatsCount >= 1 && seatsCount < 6) {
        cost = costType === COST_TYPES.NET_COST ? 756000 : _includeVATCost(756000);
      }
      switch (seatsCount) {
        case 6:
          cost = costType === COST_TYPES.NET_COST ? 929000 : _includeVATCost(929000);
          break;
        case 7:
          cost = costType === COST_TYPES.NET_COST ? 1080000 : _includeVATCost(1080000);
          break;
        case 8:
          cost = costType === COST_TYPES.NET_COST ? 1253000 : _includeVATCost(1253000);
          break;
        case 9:
          cost = costType === COST_TYPES.NET_COST ? 1404000 : _includeVATCost(1404000);
          break;
        case 10:
          cost = costType === COST_TYPES.NET_COST ? 1512000 : _includeVATCost(1512000);
          break;
        case 11:
          cost = costType === COST_TYPES.NET_COST ? 1656000 : _includeVATCost(1656000);
          break;
        case 12:
          cost = costType === COST_TYPES.NET_COST ? 1822000 : _includeVATCost(1822000);
          break;
        case 13:
          cost = costType === COST_TYPES.NET_COST ? 2049000 : _includeVATCost(2049000);
          break;
        case 14:
          cost = costType === COST_TYPES.NET_COST ? 2221000 : _includeVATCost(2221000);
          break;
        case 15:
          cost = costType === COST_TYPES.NET_COST ? 2394000 : _includeVATCost(2394000);
          break;
        case 16:
          cost = costType === COST_TYPES.NET_COST ? 3054000 : _includeVATCost(3054000);
          break;
        case 17:
          cost = costType === COST_TYPES.NET_COST ? 2718000 : _includeVATCost(2718000);
          break;
        case 18:
          cost = costType === COST_TYPES.NET_COST ? 2869000 : _includeVATCost(2869000);
          break;
        case 19:
          cost = costType === COST_TYPES.NET_COST ? 3041000 : _includeVATCost(3041000);
          break;
        case 20:
          cost = costType === COST_TYPES.NET_COST ? 3191000 : _includeVATCost(3191000);
          break;
        case 21:
          cost = costType === COST_TYPES.NET_COST ? 3364000 : _includeVATCost(3364000);
          break;
        case 22:
          cost = costType === COST_TYPES.NET_COST ? 3515000 : _includeVATCost(3515000);
          break;
        case 23:
          cost = costType === COST_TYPES.NET_COST ? 3688000 : _includeVATCost(3688000);
          break;
        case 24:
          cost = costType === COST_TYPES.NET_COST ? 4632000 : _includeVATCost(4632000);
          break;
        case 25:
          cost = costType === COST_TYPES.NET_COST ? 4813000 : _includeVATCost(4813000);
          break;
      }

      if (seatsCount > 25) {
        if (costType === COST_TYPES.NET_COST) {
          cost = 4813000 + 30000 * (seatsCount - 25);
        } else if (costType === COST_TYPES.GROSS_COST) {
          cost = 5294300 + 33000 * (seatsCount - 25);
        }
      }
    }
  } else if (vehicleType === VEHICLE_TYPES.TRUCK) {
    if (tonnage < 3) {
      cost = costType === COST_TYPES.NET_COST ? 853000 : _includeVATCost(853000);
    } else if (tonnage <= 8) {
      cost = costType === COST_TYPES.NET_COST ? 1660000 : _includeVATCost(1660000);
    } else if (tonnage <= 15) {
      cost = costType === COST_TYPES.NET_COST ? 2746000 : _includeVATCost(2746000);
    } else {
      cost = costType === COST_TYPES.NET_COST ? 3200000 : _includeVATCost(3200000);
    }
  } else if (vehicleType == VEHICLE_TYPES.MIX) {
    cost = costType === COST_TYPES.NET_COST ? 933000 : _includeVATCost(933000);
  }

  return cost;
}

function _includeVATCost(cost, percent = 10) {
  return cost + Number(Math.round(cost * (percent / 100)));
}

async function rescheduleToDate(bookingSchedule) {
  const scheduleData = {
    licensePlates: bookingSchedule.licensePlates,
    phone: bookingSchedule.phone,
    fullnameSchedule: bookingSchedule.fullnameSchedule,
    email: bookingSchedule.email,
    dateSchedule: moment(bookingSchedule.dateSchedule, DATE_DISPLAY_FORMAT).add(6, 'months').format(DATE_DISPLAY_FORMAT),
    time: bookingSchedule.time,
    notificationMethod: bookingSchedule.notificationMethod,
    vehicleType: bookingSchedule.vehicleType,
    licensePlateColor: bookingSchedule.licensePlateColor,
    stationsId: bookingSchedule.stationsId,
    appUserId: bookingSchedule.appUserId,
    createdBy: bookingSchedule.appUserId,
    appUserVehicleId: bookingSchedule.appUserVehicleId,
    scheduleType: bookingSchedule.scheduleType,
  };
  console.info(`rescheduleToDate ${bookingSchedule.licensePlates} ${bookingSchedule.dateSchedule} ${scheduleData.dateSchedule}`);
  const scheduleHash = makeHashFromData(`${scheduleData.appUserId}_${scheduleData.licensePlates}_${new Date()}`);
  scheduleData.scheduleHash = scheduleHash;

  const station = await StationsResourceAccess.findById(scheduleData.stationsId);
  const appUser = await AppUsersResourceAccess.findById(scheduleData.appUserId);

  if (station && appUser) {
    const newSchedule = await createNewSchedule(scheduleData, station, appUser);
    return newSchedule;
  }
}

//======================Xử lý chọn trạm phù hợp cho đặt lịch tư vấn=================================

let stationMaintenanceArray = []; // Tư vấn bảo dưỡng
let stationInsuranceArray = []; // Tư vấn bảo hiểm
let stationEnovationArray = []; // Tư vấn hoán cải

async function createStationMaintenanceArray() {
  // Lấy  trạm có mở dịch vụ bảo dưỡng
  let listStation = await StationsView.find({
    serviceType: SERVICE_TYPES.REPAIR_SERVICE,
    stationStatus: STATION_STATUS.ACTIVE,
    isDeletedStation: 0,
  });

  shuffleArrayRandom(listStation);

  stationMaintenanceArray = listStation;
}

async function createStationInsuranceArray() {
  // Lấy  trạm có mở dịch vụ bảo hiểm
  let listStation = await StationsView.find({
    serviceType: SERVICE_TYPES.EXTEND_INSURANCE_TNDS,
    stationStatus: STATION_STATUS.ACTIVE,
    isDeletedStation: 0,
  });

  shuffleArrayRandom(listStation);

  stationInsuranceArray = listStation;
}

async function createStationRenovationArray() {
  // Lấy trạm có mở dịch vụ hoán cải
  let listStation = await StationsView.find({
    serviceType: SERVICE_TYPES.CONSULTATION_IMPROVEMENT,
    stationStatus: STATION_STATUS.ACTIVE,
    isDeletedStation: 0,
  });

  shuffleArrayRandom(listStation);

  stationEnovationArray = listStation;
}

async function chooseAppropriateStation(scheduleType) {
  switch (scheduleType) {
    case SCHEDULE_TYPE.CONSULTANT_MAINTENANCE:
      if (stationMaintenanceArray.length <= 0) {
        await createStationMaintenanceArray();
      }
      return stationMaintenanceArray.pop();

    case SCHEDULE_TYPE.CONSULTANT_INSURANCE:
      if (stationInsuranceArray.length <= 0) {
        await createStationInsuranceArray();
      }
      return stationInsuranceArray.pop();

    case SCHEDULE_TYPE.CONSULTANT_RENOVATION:
      if (stationEnovationArray.length <= 0) {
        await createStationRenovationArray();
      }
      return stationEnovationArray.pop();

    default:
      return undefined;
  }
}

async function updateAppropriateStation(serviceType) {
  switch (serviceType) {
    case SERVICE_TYPES.REPAIR_SERVICE:
      await createStationMaintenanceArray();
      break;

    case SERVICE_TYPES.EXTEND_INSURANCE_TNDS:
      await createStationInsuranceArray();
      break;

    case SERVICE_TYPES.CONSULTATION_IMPROVEMENT:
      await createStationRenovationArray();
      break;

    default:
      break;
  }
}

async function getListScheduleTime(selectedStation, targetDate, vehicleType) {
  try {
    const stationBookingConfigs = JSON.parse(selectedStation.stationBookingConfig);

    const scheduleTimeStatusPromiseList = stationBookingConfigs.map(async _bookingConfig => {
      let _scheduleLimit;
      if (selectedStation.enableConfigMixtureSchedule === BOOKING_MIXTURE_SCHEDULE.ENABLE) {
        _scheduleLimit = getMixtureLimitVehicle(_bookingConfig);
      } else {
        _scheduleLimit = getLimitVehicleByType(vehicleType, _bookingConfig);
      }

      const time = _bookingConfig.time;
      let timeStatus = { scheduleTime: time, scheduleTimeStatus: BOOKING_STATUS.AVAILABLE };

      const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];
      const successBookingsCount = await CustomerScheduleResourceAccess.customCount({
        stationsId: selectedStation.stationsId,
        dateSchedule: targetDate,
        time: time,
        vehicleType: vehicleType,
        CustomerScheduleStatus: successBookingStatus,
      });

      if (!_bookingConfig.enableBooking) {
        timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
        timeStatus.totalSchedule = _scheduleLimit;
        timeStatus.totalBookingSchedule = successBookingsCount;
      } else {
        if (_scheduleLimit === 0 || (successBookingsCount && successBookingsCount >= _scheduleLimit)) {
          timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
        }
        timeStatus.totalSchedule = _scheduleLimit;
        timeStatus.totalBookingSchedule = successBookingsCount;
      }

      const isDayOff = await StationsWorkScheduleFunctions.checkUserBookingOnDayOff(targetDate, time, selectedStation.stationsId, vehicleType);
      if (isDayOff) {
        timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
      }

      return timeStatus;
    });

    const scheduleTimeStatusList = await Promise.all(scheduleTimeStatusPromiseList);

    return scheduleTimeStatusList;
  } catch (error) {
    Logger.error(__filename, error);
    return undefined;
  }
}

// ============================ Xử lý lấy mã giảm giá===============================

//
let couponCodeArray = createCouponArray();

function createCouponArray() {
  const counts = [150, 150, 20, 5];
  const values = [10, 15, 20, 25];
  const couponCodeArr = [];
  for (let i = 0; i < counts.length; i++) {
    couponCodeArr.push(...Array(counts[i]).fill(values[i]));
  }

  for (let i = 0; i < 5; i++) {
    shuffleArrayRandom(couponCodeArr);
  }

  return couponCodeArr;
}

function getDiscountCodeForCustomer() {
  if (couponCodeArray.length <= 100) {
    // Tạo lại mảng, và xáo trộn lại
    couponCodeArray = createCouponArray();
  }
  return couponCodeArray.pop();
}

// ===================Xử lý lấy thông tin đặt lịch từ tin nhắn SMS ===================

function parseSMSContent(smsContent, templateSMS) {
  let dataBookingSchedule = null;
  let scheduleData = smsContent.trim().split(/\s+/);
  if (scheduleData && scheduleData.length > 0) {
    // Convert ngày hẹn ở các dạng về DD/MM/YYYY
    const originalFormats = ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD', 'YYYYMMDD'];
    const dateSchedule = moment(scheduleData[scheduleData.length - 1], originalFormats).format(DATE_DISPLAY_FORMAT);

    // 2004D 59F12345 06/12/2023
    if ((templateSMS = 1 && scheduleData.length === 3)) {
      dataBookingSchedule = {
        stationCode: scheduleData[0],
        licensePlates: scheduleData[1],
        dateSchedule: dateSchedule,
      };
    }

    // TTDK 2004D dat lich 59A12345 06/13/2023
    if ((templateSMS = 2 && scheduleData.length === 6)) {
      dataBookingSchedule = {
        stationCode: scheduleData[1],
        licensePlates: scheduleData[4],
        dateSchedule: dateSchedule,
      };
    }

    //  TTDK_HEN 2004D 59F12345 06/12/2023
    if ((templateSMS = 3 && scheduleData.length === 4)) {
      dataBookingSchedule = {
        stationCode: scheduleData[1],
        licensePlates: scheduleData[2],
        dateSchedule: dateSchedule,
      };
    }
  }

  return dataBookingSchedule;
}

// ================== Các hàm logic xử lý khi đặt lịch ===============================

async function processDataInputOfCustomerSchedule(customerScheduleData, currentUser) {
  // Thêm thông tin người dùng cho lịch hẹn
  if (currentUser) {
    customerScheduleData.createdBy = currentUser.appUserId;
  }

  //Xử lý input data của lịch hẹn để phòng chống hack (Xóa khoảng trắng)
  customerScheduleData.dateSchedule = customerScheduleData.dateSchedule.trim();
  customerScheduleData.dateSchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DISPLAY_FORMAT);
  //Kiểm tra ngày hẹn có đúng format hay không
  if (
    !customerScheduleData.dateSchedule ||
    customerScheduleData.dateSchedule === '' ||
    customerScheduleData.dateSchedule === null ||
    customerScheduleData.dateSchedule === 'Invalid date'
  ) {
    throw SCHEDULE_ERROR.BOOKING_ON_TODAY;
  }

  customerScheduleData.time = customerScheduleData.time.trim();

  // cập nhật ghi chú cho lịch
  if (customerScheduleData.scheduleNote) {
    const scheduleNoteContent = updateScheduleNote('', customerScheduleData.scheduleNote, customerScheduleData.fullnameSchedule);
    customerScheduleData.scheduleNote = scheduleNoteContent;
  }

  // convert dateSchedule dùng để sort
  if (customerScheduleData.dateSchedule) {
    customerScheduleData.daySchedule = moment(customerScheduleData.dateSchedule, DATE_DISPLAY_FORMAT).format(DATE_DB_SORT_FORMAT) * 1;
  }
}

async function checkExistedVehicleOfUser(customerScheduleData) {
  return new Promise(async (resolve, reject) => {
    // Kiểm tra biển số xe có lịch đang chờ thì không cho đặt nữa
    const existedSchedule = await CustomerScheduleResourceAccess.customSearch(
      {
        licensePlates: customerScheduleData.licensePlates,
        phone: customerScheduleData.phone,
        CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
      },
      0,
      1,
    );

    if (existedSchedule && existedSchedule.length > 0) {
      return reject(SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED);
    }

    resolve();
  });
}

async function checkUserVehicleExistedAndAttachInfo(customerScheduleData) {
  const appUserVehicle = await AppUserVehicleResourceAccess.find(
    {
      vehicleIdentity: customerScheduleData.licensePlates,
      appUserId: customerScheduleData.appUserId,
    },
    0,
    1,
  );

  //nếu tài khoản đã có phương tiện thì lấy ra dùng, ngược lại tự đăng ký mới cho user chứ ko báo lỗi
  if (appUserVehicle && appUserVehicle.length > 0) {
  } else {
    // Tạo xe mới cho tài khoản
    const addVehicleResult = await _createVehicleFromSchedule(customerScheduleData);
    if (addVehicleResult && addVehicleResult[0]) {
      customerScheduleData.appUserVehicleId = addVehicleResult[0];
    }
  }
}

async function _createVehicleFromSchedule(customerScheduleData) {
  // user not found -> cannot create vehicle
  if (!customerScheduleData.appUserId) return;

  // convert schedule plate color
  let vehiclePlateColor = VEHICLE_PLATE_TYPE.WHITE;

  switch (customerScheduleData.licensePlateColor) {
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

  let vehicleData = {
    vehicleIdentity: customerScheduleData.licensePlates,
    vehicleType: customerScheduleData.vehicleType,
    appUserId: customerScheduleData.appUserId,
    vehiclePlateColor: vehiclePlateColor,
    certificateSeries: customerScheduleData.certificateSeries || null,
  };

  if (customerScheduleData.vehicleSubType) {
    vehicleData.vehicleSubType = customerScheduleData.vehicleSubType;
  }

  if (customerScheduleData.vehicleSubCategory) {
    vehicleData.vehicleSubCategory = customerScheduleData.vehicleSubCategory;
  }

  const isValidVehicle = AppUserVehicleFunctions.checkValidVehicleIdentity(
    vehicleData.vehicleIdentity,
    vehicleData.vehicleType,
    vehicleData.vehiclePlateColor,
  );

  if (isValidVehicle) {
    const vehicleHash = makeHashFromData(`${customerScheduleData.appUserId}_${customerScheduleData.licensePlates}_${new Date()}`);
    vehicleData.vehicleHash = vehicleHash;

    const SKIP_CHECK_DUPLICATE_VEHICLE = true;

    const insertResult = await AppUserVehicleFunctions.addNewUserVehicle(vehicleData, SKIP_CHECK_DUPLICATE_VEHICLE);

    return insertResult;
  } else {
    throw SCHEDULE_ERROR.INVALID_PLATE_NUMBER;
  }
}

async function _createAccountFromSchedule(customerScheduleData) {
  const userData = {};
  const phoneNumber = customerScheduleData.phone;

  if (phoneNumber) {
    userData.username = phoneNumber;
    userData.password = phoneNumber;
    userData.firstName = customerScheduleData.fullnameSchedule;
    userData.phoneNumber = phoneNumber;

    if (customerScheduleData.email) {
      userData.email = customerScheduleData.email;
    }

    if (customerScheduleData.partnerName) {
      userData.partnerName = customerScheduleData.partnerName;
    }

    userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.NOT_VERIFIED;

    const newAppUserId = await AppUsersFunctions.createNewUser(userData);

    return newAppUserId;
  }
}

async function _createNotifyForUserAfterCreateSchedule(customerScheduleData, stationsData, customerScheduleId, isStationAvailable) {
  const scheduleTime = modifyScheduleTime(customerScheduleData.time);

  let message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${customerScheduleData.licensePlates} đã đặt thành công, vui lòng chờ trạm xác nhận.`;

  if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
    message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${customerScheduleData.licensePlates} đã được xác nhận. Thời gian hẹn của quý khách là ${scheduleTime} ngày ${customerScheduleData.dateSchedule} và mã lịch hẹn là ${customerScheduleData.scheduleCode}. Vui lòng đến đúng khung giờ đã hẹn để tránh ùn tắc, cản trở giao thông. Trường hợp quý khách đến muộn thì lịch hẹn sẽ bị hủy mà không báo trước.`;
  }

  // Thông báo cho người dùng khi đặt lịch vào trung tâm đang quá tải
  if (!isStationAvailable) {
    message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${customerScheduleData.licensePlates} đã được ghi nhận nhưng tạm thời chưa thể xác nhận vì trạm đang trong tình trạng quá tải. Chúng tôi sẽ thông báo cho bạn ngày khi tình trạng này được khắc phục, xin cảm ơn.`;
  }

  let _title = `TTDK.COM.VN ${stationsData.stationCode} xác nhận lịch hẹn BSX ${customerScheduleData.licensePlates}`;

  const NO_PHONE_NUMBER = undefined; //Không cần gửi SMS
  await CustomerMessageFunctions.createMessageForCustomerOnly(
    _title,
    message,
    customerScheduleData.appUserId,
    NO_PHONE_NUMBER,
    customerScheduleData.email,
    {
      appUserVehicleId: customerScheduleData.appUserVehicleId,
      customerScheduleId: customerScheduleId,
    },
  );
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

async function checkUserExistenceWhenScheduling(customerScheduleData) {
  let appUserAccount = await AppUsersResourceAccess.find({ username: customerScheduleData.phone }, 0, 1);

  if (appUserAccount && appUserAccount.length > 0) {
    appUserAccount = appUserAccount[0];
    _fillCustomerDataToSchedule(customerScheduleData, appUserAccount);
  } else {
    const newUserAccountId = await _createAccountFromSchedule(customerScheduleData);
    if (newUserAccountId) {
      appUserAccount = await AppUsersResourceAccess.findById(newUserAccountId);
      customerScheduleData.appUserId = newUserAccountId;
    } else {
      Logger.error('CREATE USER FAIL!');
    }
  }

  return appUserAccount;
}

//Một số ràng buộc đặt biệt liên quan đến user khi đặt lịch
async function restrictUserBooking(appUserData, scheduleData, stationsData) {
  // Kiểm tra tài khoản có bị khóa đặt lịch hay không
  if (appUserData && appUserData.appUserRoleId === NORMAL_USER_ROLE && appUserData.enableBookingStatus === BOOKING_PHONE_STATUS.BLOCK) {
    throw SCHEDULE_ERROR.BLOCK_BOOKING_BY_PHONE;
  }

  // Tìm xe hợp lệ appUserVehicle cho lịch
  const appUserVehicle = await AppUserVehicleResourceAccess.find(
    {
      vehicleIdentity: scheduleData.licensePlates,
      appUserId: appUserData.appUserId,
    },
    0,
    1,
  );
  if (appUserVehicle && appUserVehicle.length > 0) {
    const userVehicle = appUserVehicle[0];

    //Lưu thông tin phương tiện theo lịch hẹn
    scheduleData.appUserVehicleId = userVehicle.appUserVehicleId;

    // Bắt buộc user phải đặt lịch hẹn sớm hơn 10 ngày so với hạn GCN. Không được đặt sớm hơn
    // if (userVehicle.vehicleVerifiedInfo === VERIFICATION_STATUS.VERIFIED && userVehicle.vehicleExpiryDate) {
    // if (scheduleData.scheduleType === SCHEDULE_TYPE.VEHICLE_INSPECTION) {
    // const DATE_LIMIT = 10;
    // const differDateCount = moment(userVehicle.vehicleExpiryDate, 'DD/MM/YYYY').diff(moment(scheduleData.dateSchedule, 'DD/MM/YYYY'), 'days');
    // if (differDateCount > DATE_LIMIT) {
    //   throw SCHEDULE_ERROR.EARLY_BOOKING;
    // }
    // }
    // }

    // // Kiểm tra số seri GCN có hợp lệ hay không
    // if (scheduleData.scheduleType === SCHEDULE_TYPE.VEHICLE_INSPECTION || scheduleData.scheduleType === SCHEDULE_TYPE.CHANGE_REGISTATION) {
    //   if (userVehicle.certificateSeries === '-') {
    //     throw USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE;
    //   }
    // }

    // Riêng trạm 5005VCN1 thì không nhận xe lớn. chỉ nhận ô tô con và xe <= 16 chỗ

    checkValidVehicleForStation5005VCN1(stationsData, userVehicle);
  }

  // Không cho user đặt lịch quá giới hạn số ngày trạm quy định
  if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE) {
    const stationLimitSchedule = stationsData.limitSchedule || 30;
    const bookingDifferDateCount = moment(scheduleData.dateSchedule, DATE_DISPLAY_FORMAT).diff(moment(), 'days');
    if (bookingDifferDateCount > stationLimitSchedule) {
      throw SCHEDULE_ERROR.INVALID_DATE;
    }
  }
}

function checkValidVehicleForStation5005VCN1(stationsData, userVehicle) {
  if (userVehicle.vehicleVerifiedInfo === 1) {
    if (stationsData && stationsData.stationCode === '5005VCN1') {
      if (!validVehicleForStation5005VCN1(userVehicle)) throw SCHEDULE_ERROR.STATION_NOT_ACCEPT_VEHICLE;
    }
  }
}

function validVehicleForStation5005VCN1(vehicle) {
  // Trường hợp xe hợp lệ để đăng kiểm ở trạm 5005VCN1

  if (
    // Từ xe 4 chỗ đến xe 16 chỗ
    vehicle.vehicleSubCategory >= VEHICLE_SUB_CATEGORY.OTO_4CHO &&
    vehicle.vehicleSubCategory <= VEHICLE_SUB_CATEGORY.OTO_16CHO
  ) {
    return true;
  } else if (
    // Xe bán tải và xe dưới 1 tấn
    vehicle.vehicleSubCategory >= VEHICLE_SUB_CATEGORY.XE_BAN_TAI &&
    vehicle.vehicleSubCategory <= VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_2TAN
  ) {
    return true;
  } else if (
    // Xe chuyên dụng, Xe bốn bánh có động cơ ,Xe cứu thương
    vehicle.vehicleSubCategory === VEHICLE_SUB_CATEGORY.XE_CHUYENDUNG ||
    vehicle.vehicleSubCategory === VEHICLE_SUB_CATEGORY.XE_BONBANH_CO_DONG_CO ||
    vehicle.vehicleSubCategory === VEHICLE_SUB_CATEGORY.XE_CUU_THUONG
  ) {
    return true;
  } else {
    return false;
  }
}

async function addNewCustomerSchedule(scheduleData, stationsData, appUser) {
  const isAutoConfirm = !stationsData || stationsData.enableConfigAutoConfirm !== AUTO_CONFIRM_SCHEDULE.DISABLE;

  //Kiểm tra xem trung tâm có mở "Tự động duyệt lịch hẹn" không
  const isStationAvailable = !stationsData || stationsData.availableStatus !== AVAILABLE_STATUS.UNAVAILABLE;
  if (isStationAvailable && (process.env.STRICT_BOOKING_MODE_ENABLED * 1 !== STRICT_MODE.ENABLE || isAutoConfirm)) {
    scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.CONFIRMED;
  } else {
    //Bổ sung ghi chú vào lịch hẹn
    const updatedScheduleNote = updateScheduleNote(scheduleData.scheduleNote || '', 'Vui lòng chờ xác nhận lịch hẹn từ trung tâm.');
    scheduleData.scheduleNote = updatedScheduleNote;
  }

  // create schedule Hash
  const scheduleHash = makeHashFromData(`${scheduleData.appUserId}_${scheduleData.licensePlates}_${new Date()}`);
  scheduleData.scheduleHash = scheduleHash;

  let result;

  // Kiểm tra trung tâm có phân loại lịch hẹn theo từng loại phương tiện hay không
  if (stationsData && stationsData.enableConfigMixtureSchedule === BOOKING_MIXTURE_SCHEDULE.ENABLE) {
    result = await createMixtureSchedule(scheduleData, stationsData, appUser);
  } else {
    result = await createNewSchedule(scheduleData, stationsData, appUser);
  }

  if (result) {
    let _newScheduleId = result[0];

    await updateBookingCountByDate(_newScheduleId);

    // Gửi thông báo đến khách hàng khi đặt lịch thành công
    await _createNotifyForUserAfterCreateSchedule(scheduleData, stationsData, _newScheduleId, isStationAvailable);
  } else {
    console.error(`CAN NOT CREATE NEW SCHEDULE`);
  }
  return result;
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

async function autoCreateCustomerRecord(customerScheduleId) {
  // Tự động tạo customerRecord
  const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

  if (customerSchedule.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
    // Tạo customerRecord mới
    await _createCustomerRecordFromSchedule(customerSchedule);
  }

  // Thêm khách hàng vào danh sách khách hàng của trạm StationCustomer
  await StationCustomerFunctions.addStationCustomer(customerSchedule.appUserId, customerSchedule.stationsId, customerSchedule.appUserVehicleId);
}

async function createOrderFromSchedule(customerScheduleId, customerScheduleData) {
  // Tạo mới order để thanh toán cho lịch hẹn
  const vehicleData = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);
  if (!vehicleData) {
    return;
  }

  const _newOrderData = {
    customerScheduleId: customerScheduleId,
    appUserId: customerScheduleData.appUserId,
    appUserVehicleId: customerScheduleData.appUserVehicleId,
    stationsId: customerScheduleData.stationsId,
  };
  const isForBusiness = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
  await OrderFunctions.createOrderBySchedule(_newOrderData, vehicleData, isForBusiness);
}

async function insertScheduleServices(_stationServicesList, customerScheduleId, selectedStation) {
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
      Logger.error('INSERT SCHEDULE SERVICES FAIL !');
    }
  }
}

async function sendPromotionalNotification(appUserId, email, licensePlates) {
  // Lấy mã khuyễn mãi
  const discountCode = getDiscountCodeForCustomer();

  let messageTitle = `Quà tặng cảm ơn gửi đến khách hàng đặt lịch.`;

  let message = `Chúc mừng quý khách đã nhận được mã voucher mua bảo hiểm TNDS thông qua đối tác của chúng tôi. Mã voucher là: TTDK${discountCode}(hỗ trợ ${discountCode}%). Quý khách vui lòng truy cập trang chủ -> mục Gia hạn BH TNDS -> điền thông tin và nhập mã voucher vào ô "Voucher" để được áp dụng. TTDK cám ơn khách hàng.`;

  // Tạo thông báo khuyến mãi khi khách hàng đặt lịch thành công
  let messageType = MESSAGE_TYPE.PROMOTIONAL_NOTIFICATION;
  await CustomerMessageFunctions.addMessageCustomer(
    messageTitle,
    0,
    message,
    licensePlates,
    appUserId,
    email,
    undefined,
    undefined,
    undefined,
    messageType,
  );
}

async function checkCriminalFromCSGTAndVR(customerScheduleId, selectedStation) {
  const customerScheduleData = await CustomerScheduleResourceAccess.findById(customerScheduleId);

  if (customerScheduleData) {
    //"Tạm đóng do vấn đề xử lý sai record"
    // // Kiểm tra phạt nguội bên giaothongvietnam
    // await _checkingCustomerViolations(customerScheduleData, selectedStation);

    // Kiểm tra phạt nguội bên VR
    await _checkCriminalFromVR(customerScheduleData, selectedStation);
  }
}

// Kiểm tra phạt nguội bên giaothongvietnam
async function _checkingCustomerViolations(customerScheduleData, selectedStation) {
  const customerViolations = await CustomerCriminalRecordFunctions.crawlCriminalRecord(customerScheduleData.licensePlates, 1);

  for (let crime of customerViolations) {
    const crimeTime = moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate();
    const previousData = await CustomerCriminalResourceAccess.find(
      { customerRecordPlatenumber: customerScheduleData.licensePlates, crimeRecordTime: crimeTime },
      0,
      1,
    );

    let criminalRecord = undefined;

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

      const newCriminal = await CustomerCriminalResourceAccess.insert(data);
      criminalRecord = newCriminal[0];
    }

    criminalRecord = previousData[0].customerCriminalRecordId;

    // notify violation to customer
    if (crime.status === 'Chưa xử phạt') {
      const messageTitle = `Thông báo hệ thống từ ${selectedStation.stationsName}`;
      let message = `TTDK ${selectedStation.stationCode} thông báo: phương tiện biển số ${customerScheduleData.licensePlates} của quý khách được phát hiện có vi phạm: ${crime.behavior} lúc ${crime.violationTime} tại ${crime.violationAddress}. Vui lòng kiểm tra xử lý phạt nguội trước khi đăng kiểm. Chi tiết xem thêm tại website CSGT.VN.`;
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

      if (criminalRecord) {
        // Lịch đã xác nhận thì mới có record để lưu
        if (customerScheduleData.customerRecordId) {
          await CustomerRecordCriminalMapping.insert({
            customerRecordId: customerScheduleData.customerRecordId,
            customerCriminalRecordId: criminalRecord,
          });
        }

        await CustomerScheduleCriminalMapping.insert({
          customerScheduleId: customerScheduleData.customerScheduleId,
          customerCriminalRecordId: criminalRecord,
        });
      }
    }
  }
}

// Kiểm tra phạt nguội bên VR
async function _checkCriminalFromVR(customerScheduleData, selectedStation) {
  // Kiểm tra phạt nguội
  if (customerScheduleData.scheduleType === SCHEDULE_TYPE.VEHICLE_INSPECTION) {
    // lấy thông tin xe để kiểm tra phạt nguội
    const appUserVehicle = await AppUserVehicleResourceAccess.findById(customerScheduleData.appUserVehicleId);

    if (isNotEmptyStringValue(appUserVehicle.certificateSeries)) {
      let appUserVehicleData = {
        licensePlates: customerScheduleData.licensePlates,
        certificateSeries: appUserVehicle.certificateSeries,
        licensePlateColor: customerScheduleData.licensePlateColor,
      };

      let checkCrime = await AppUserVehicleFunctions.checkCriminal(appUserVehicleData);

      if (checkCrime === CRIMINAL.YES) {
        // Thông báo xe có phạt nguội đến tài khoản khách hàng
        await CustomerMessageFunctions.addWarningTicketMessageCustomer(
          customerScheduleData.licensePlates,
          customerScheduleData.appUserId,
          customerScheduleData.email,
        );

        let messageContent = `Biển số xe ${customerScheduleData.licensePlates} có cảnh báo phạt nguội. Vui lòng truy cập ứng dụng TTDK để tra cứu thông tin phạt nguội và xử lý trước khi đi đăng kiểm.`;
        // Lưu thông tin phạt nguội vào bảng CustomerCriminalRecord
        const criminalData = {
          customerRecordPlatenumber: customerScheduleData.licensePlates,
          crimeRecordContent: messageContent,
          crimeRecordStatus: `Chưa xử phạt`,
          crimeRecordPIC: 'Cảnh báo từ cục đăng kiểm',
          crimeRecordLocation: null,
          crimeRecordContact: selectedStation.stationsHotline,
          crimeRecordTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        };

        const criminalRecord = await CustomerCriminalResourceAccess.insert(criminalData);

        if (criminalRecord && criminalRecord.length > 0) {
          // Lịch đã xác nhận thì mới có record để lưu
          if (customerScheduleData.customerRecordId) {
            await CustomerRecordCriminalMapping.insert({
              customerRecordId: customerScheduleData.customerRecordId,
              customerCriminalRecordId: criminalRecord[0],
            });
          }

          await CustomerScheduleCriminalMapping.insert({
            customerScheduleId: customerScheduleData.customerScheduleId,
            customerCriminalRecordId: criminalRecord[0],
          });
        }
      }
    }
  }
}

// Gửi thông báo có khách hàng đặt lịch đến tài khoản nhân viên của trạm
async function notifyEmployeeAboutCustomerSchedule(customerScheduleData) {
  let notifyTitle = `Thông Báo Có Khách Hàng Đặt Lịch Mới`;
  let notifyContent = `TTDK.COM.VN thông báo: Có khách hàng đặt lịch ở trung tâm với BSX ${customerScheduleData.licensePlates} vào ngày ${customerScheduleData.dateSchedule}`;
  await FirebaseNotificationFunctions.pushNotificationByTopic(`STATION_${customerScheduleData.stationsId}`, notifyTitle, notifyContent);
}

module.exports = {
  createNewSchedule,
  cancelUserSchedule,
  updateBookingCountByDate,
  generateMessageToCancelSchedule,
  getLimitVehicleByType,
  getMixtureLimitVehicle,
  updateScheduleNote,
  saveCanceledScheduleData,
  saveConfirmedScheduleData,
  saveBookingScheduleData,
  modifyScheduleTime,
  createMixtureSchedule,
  cancelAllScheduleByUser,
  cancelScheduleList,
  calculateInsuranceCost,
  rescheduleToDate,
  addCustomerScheduleFailed,
  isValidScheduleDate,
  chooseAppropriateStation,
  addNewConsultantSchedule,
  getDiscountCodeForCustomer,
  updateAppropriateStation,
  getListScheduleTime,
  parseSMSContent,
  checkExistedVehicleOfUser,
  checkUserVehicleExistedAndAttachInfo,
  processDataInputOfCustomerSchedule,
  checkUserExistenceWhenScheduling,
  restrictUserBooking,
  addNewCustomerSchedule,
  autoCreateCustomerRecord,
  createOrderFromSchedule,
  insertScheduleServices,
  sendPromotionalNotification,
  checkCriminalFromCSGTAndVR,
  notifyEmployeeAboutCustomerSchedule,
};
