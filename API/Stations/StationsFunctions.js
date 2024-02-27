/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const StationsResourceAccess = require('./resourceAccess/StationsResourceAccess');
const StationsDetailModel = require('./model/StationDetailModel');
const StationDetailPublicModel = require('./model/StationDetailPublicModel');
const UtilsFunction = require('../ApiUtils/utilFunctions');
const UploadResource = require('../Upload/resourceAccess/UploadResourceAccess');
const TextToSpeechFunction = require('../../ThirdParty/TextToSpeech/TextToSpeechFunctions');
const SystemHolidayCalendarFunctions = require('../SystemHolidayCalendar/SystemHolidayCalendarFunctions');
const {
  STATION_TYPE,
  BOOKING_ENABLE,
  AREA_PERMISSION,
  TYPE_PERMISSION,
  PAYMENT_TYPES,
  STATION_STATUS,
  BOOKING_STATUS,
  BOOKING_MIXTURE_SCHEDULE,
} = require('./StationsConstants');
const { ALLOW_VEHICLE_TYPE_STATUS } = require('../StationWorkSchedule/StationWorkScheduleConstants');
const { SCHEDULE_STATUS, VEHICLE_TYPE, SCHEDULE_CACHE_KEYS } = require('../CustomerSchedule/CustomerScheduleConstants');
const { WORKING_STATUS } = require('../StationWorkSchedule/StationWorkScheduleConstants');

const { SUPER_ADMIN_ROLE } = require('../Staff/StaffConstant');
const { getDetailWorkingHoursByStationId } = require('../StationWorkingHours/StationWorkingHoursFunction');
const StationWorkScheduleFunctions = require('../StationWorkSchedule/StationWorkScheduleFunctions');
const CustomerScheduleFunctions = require('../CustomerSchedule/CustomerScheduleFunctions');
const CustomerScheduleResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const StationsWorkScheduleResourceAccess = require('../StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess');

let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
}

async function registerNewStation(stationsData) {
  //generate new url based on name
  let stationUrl = UtilsFunction.nonAccentVietnamese(stationsData.stationCode);
  stationUrl = UtilsFunction.convertToURLFormat(stationUrl);

  //extract url name only
  stationUrl = stationUrl.replace('/', '');

  //make new url as a subdomain of CDN
  stationsData.stationUrl = `dangkiem${stationUrl}.${process.env.WEB_HOST_NAME}`;
  stationsData.stationWebhookUrl = `${stationUrl}-webhooks.${process.env.HOST_NAME}`;
  stationsData.stationLandingPageUrl = `dangkiem.${stationUrl}.${process.env.HOST_NAME}`;

  if (!stationsData.stationsEmail || stationsData.stationsEmail === null || stationsData.stationsEmail === '') {
    stationsData.stationsEmail = `${stationsData.stationCode}@kiemdinhoto.vn`;
  }
  let result = await StationsResourceAccess.insert(stationsData);
  return result;
}

async function getStationDetailById(stationId) {
  let result = await StationsResourceAccess.findById(stationId);

  if (result) {
    result = StationsDetailModel.fromData(result);
  }
  return result;
}

async function getStationDetailByUrl(url) {
  // load data from redis
  if (process.env.REDIS_ENABLE * 1 === 1) {
    const redisKey = `STATIONS_URL_${url}`;
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      return cacheData;
    }
  }

  let result = await StationsResourceAccess.find({ stationUrl: url }, 0, 1);

  //retry to find config with
  if (!result || result.length <= 0) {
    result = await StationsResourceAccess.find({ stationLandingPageUrl: url }, 0, 1);
  }

  if (result && result.length > 0) {
    //This model is use to display info of Stations in public.
    //BEWARE !! DO NOT SEND INFO THAT RELATED TO SYSTEM INSIDE MODEL
    result = StationDetailPublicModel.fromData(result[0]);

    // cache data
    if (process.env.REDIS_ENABLE * 1 === 1) {
      const redisKey = `STATIONS_URL_${url}`;
      await RedisInstance.setWithExpire(redisKey, JSON.stringify(result));
    }
  } else {
    result = undefined;
  }

  return result;
}

async function updateVoiceDataForConfig(stationsConfig) {
  for (let i = 0; i < stationsConfig.length; i++) {
    const configurationData = stationsConfig[i];
    let configVoice = configurationData.stepVoice;
    //delete voice url if voice string is empty
    if (configVoice.trim() === '') {
      stationsConfig[i].stepVoiceUrl = '';
    }
    //or generate new voice url if voice string is not empty
    else {
      //let make new voice url
      let voiceUrl = UtilsFunction.nonAccentVietnamese(configVoice);
      let voiceFilePath = `uploads/voices${UtilsFunction.convertToURLFormat(voiceUrl)}.mp3`;
      voiceUrl = `/${voiceFilePath}`;

      //find if voice url is existed in upload storage or not
      let existedVoice = await UploadResource.find({
        uploadFileName: voiceUrl,
      });
      //if voice file is existed, use it
      if (process.env.GOOGLE_TTS_ENABLE * 1 === 0 && existedVoice && existedVoice.length > 0) {
        existedVoice = existedVoice[0];
        stationsConfig[i].stepVoiceUrl = `https://${process.env.HOST_NAME}${existedVoice.uploadFileName}`;
      }
      //if voice is not existed, make a new one and store it to upload storage
      else {
        let result = await TextToSpeechFunction.createProcessSpeechFile(configVoice, voiceFilePath);
        if (result) {
          stationsConfig[i].stepVoiceUrl = `https://${process.env.HOST_NAME}${voiceUrl}`;
          UploadResource.insert({
            uploadFileName: voiceFilePath,
            uploadFileExtension: 'mp3',
            uploadUnicodeName: configVoice,
            uploadFileSize: 100,
            uploadFileUrl: `https://${process.env.HOST_NAME}${voiceUrl}`,
          });
        } else {
          console.error(`can not make stepVoiceUrl ${configVoice}`);
          //handle error
          stationsConfig[i].stepVoiceUrl = '';
        }
      }
    }
  }
}

async function resetAllDefaultMp3() {
  console.info(`resetAllDefaultMp3 ${new Date().toISOString()}`);
  //Reset all default mp3 to new TTS setting if server required (GOOGLE_TTS_ENABLE = 1)
  if (process.env.GOOGLE_TTS_ENABLE * 1 === 1) {
    await TextToSpeechFunction.resetDefaultSpeechFile();
    let existingMp3Files = await UploadResource.find({
      uploadFileExtension: 'mp3',
    });
    if (existingMp3Files && existingMp3Files.length > 0) {
      for (let i = 0; i < existingMp3Files.length; i++) {
        const mp3File = existingMp3Files[i];
        await TextToSpeechFunction.createProcessSpeechFile(mp3File.uploadUnicodeName, mp3File.uploadFileName);
      }
    }
  }
}

async function sortCheckingConfigStep(config) {
  if (config === undefined || config.length < 0) {
    return;
  }

  for (let i = 0; i < config.length; i++) {
    config[i].stepIndex = i;
  }
}

async function getStationIdListByArea(stationAreas) {
  if (stationAreas) {
    const areaArray = stationAreas.split(',');

    const stationList = await getAllExternalStations();
    const filteredStationList = stationList.filter(station => areaArray.includes(station.stationArea));
    if (filteredStationList && filteredStationList.length > 0) {
      return filteredStationList.map(station => station.stationsId);
    }
  }
  return null;
}

async function updatePermissionForFilter(currentUser, filter) {
  if (currentUser.roleId > SUPER_ADMIN_ROLE && !currentUser.stationArea && !currentUser.stationType) {
    return undefined;
  }

  // Nếu tài khoản có phân quyền xem tất cả các loại trạm ở tất cả các khu vực thì không xử lí lọc
  if (
    currentUser.stationArea &&
    currentUser.stationArea === AREA_PERMISSION.ALL_AREA &&
    currentUser.stationType &&
    currentUser.stationType === TYPE_PERMISSION.ALL_STATION_TYPE
  ) {
    return filter;
  }

  let stationList = await StationsResourceAccess.find({});

  // Nếu tài khoản được phân quyền khu vực khác ALL
  if (currentUser.stationArea && currentUser.stationArea !== AREA_PERMISSION.ALL_AREA) {
    const areaArray = currentUser.stationArea.split(',');
    stationList = stationList.filter(station => areaArray.includes(station.stationArea));
  }

  // Nếu tài khoản được phân quyền loại khác ALL
  if (currentUser.stationType && currentUser.stationType !== TYPE_PERMISSION.ALL_STATION_TYPE) {
    const typeArray = currentUser.stationType.split(',').map(Number);
    stationList = stationList.filter(station => typeArray.includes(Number(station.stationType)));
  }

  if (stationList.length > 0) {
    let stationIds = stationList.map(station => station.stationsId);

    // Nếu tài khoản không tìm trạm cụ thể thì gán bằng tất cả các trạm được quyền xem
    if (UtilsFunction.isNotValidValue(filter.stationsId)) {
      filter.stationsId = stationIds;
    } else {
      // Nếu tìm 1 trạm cụ thể thì xét tài khoản này có quyền được xem không
      if (stationIds.indexOf(filter.stationsId) < 0) {
        filter.stationsId = undefined;
      }
    }
  } else {
    // Nếu không có trạm phù hợp với phân quyền cho tài khoản thì undefined
    filter.stationsId = undefined;
  }

  return filter;
}

async function getAllExternalStations(searchText, filter) {
  const MAX_LIMIT_COUNT = 500;
  let order = {
    key: 'enablePriorityMode', // Mặc định sort theo trạm ưu tiên
    value: 'desc',
  };
  let stationsList = [];
  // load data from redis
  if (process.env.REDIS_ENABLE * 1 === 1) {
    const redisKey = `ALL_STATIONS`;
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      stationsList = cacheData;
    }
  }

  if (!stationsList || stationsList.length <= 0) {
    let _dbFilter = {};
    //chi lay thong tin cac tram chua duoc an
    //IMPORTANT !! không filter trực tiếp DB vì việc này sẽ filter trên localhost
    _dbFilter.isHidden = 0;
    _dbFilter.stationType = STATION_TYPE.EXTERNAL;

    if (filter && filter.enablePriorityMode) {
      _dbFilter.enablePriorityMode = filter.enablePriorityMode;
    }

    stationsList = await StationsResourceAccess.customSearch(_dbFilter, undefined, 0, MAX_LIMIT_COUNT, order);
    // cache data
    if (process.env.REDIS_ENABLE * 1 === 1) {
      const redisKey = `ALL_STATIONS`;
      await RedisInstance.setWithExpire(redisKey, JSON.stringify(stationsList));
    }
  }

  if (stationsList && stationsList.length > 0) {
    //neu co search text thi loc lai danh sach cho dung
    if (UtilsFunction.isNotEmptyStringValue(searchText)) {
      stationsList = stationsList.filter(_station => _station.stationArea === searchText);
    }
    if (UtilsFunction.isNotEmptyStringValue(filter && filter.stationArea)) {
      stationsList = stationsList.filter(_station => _station.stationArea === filter.stationArea);
    }
    //!! IMPORTANT !! SECURE !! Mapping model to prevent data leak.
    for (let i = 0; i < stationsList.length; i++) {
      stationsList[i] = {
        stationsId: stationsList[i].stationsId,
        stationsName: stationsList[i].stationsName,
        stationCode: stationsList[i].stationCode,
        stationMapSource: stationsList[i].stationMapSource,
        stationsAddress: stationsList[i].stationsAddress,
        stationStatus: stationsList[i].stationStatus,
        availableStatus: stationsList[i].availableStatus,
        stationArea: stationsList[i].stationArea,
        stationBookingConfig: stationsList[i].stationBookingConfig,
        enablePaymentGateway: stationsList[i].enablePaymentGateway,
        enableAcceptAllVehicle: stationsList[i].enableAcceptAllVehicle,
        enablePriorityMode: stationsList[i].enablePriorityMode,
      };
    }

    return stationsList;
  }

  return [];
}

async function updateDefaultPaymentConfigsStations(stationsId) {
  await StationsResourceAccess.updateById(stationsId, {
    stationPayments: `${PAYMENT_TYPES.CASH},${PAYMENT_TYPES.BANK_TRANSFER}`,
  });
}

async function getStationsByFilter(filter, searchText, skip, limit, order) {
  let stations = await StationsResourceAccess.customSearch(filter, searchText, skip, limit, order);

  if (stations && stations.length > 0) {
    for (let i = 0; i < stations.length; i++) {
      stations[i] = StationDetailPublicModel.fromData(stations[i]);
      let stationWokingHours = await getDetailWorkingHoursByStationId(stations[i].stationsId);
      stations[i].stationWorkTimeConfig = stationWokingHours;
      stations[i].shareLink = `${process.env.SHARE_HOST_NAME}/AppSharing/Stations/${stations[i].stationCode}`;
    }

    let stationsCount = await StationsResourceAccess.customCount(filter, searchText, order);
    return { data: stations, total: stationsCount };
  }

  return { data: [], total: 0 };
}

// ===================== Cụm hàm xủ lý kiểm tra ngày ngày đặt hẹn hợp lệ của trạm ======================
function getBookingStatusFromBookingConfig(stationBookingConfigs) {
  for (let i = 0; i < stationBookingConfigs.length; i++) {
    const _config = stationBookingConfigs[i];
    if (_config.enableBooking) {
      return BOOKING_STATUS.AVAILABLE;
    }
  }
  return BOOKING_STATUS.FULL;
}

function _calculateMaxBookingCount(stationBookingConfigs, vehicleType, workStatus, enableConfigMixtureSchedule) {
  switch (vehicleType) {
    case VEHICLE_TYPE.CAR:
      if (workStatus.enableSmallCar === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
    case VEHICLE_TYPE.OTHER:
      if (workStatus.enableOtherVehicle === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
    case VEHICLE_TYPE.RO_MOOC:
      if (workStatus.enableRoMooc === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
  }

  const maxBookingsCount = stationBookingConfigs.reduce((acc, config) => {
    let _scheduleLimit = 0;
    if (config.enableBooking && !workStatus.timeOffList.includes(config.time)) {
      if (enableConfigMixtureSchedule === BOOKING_MIXTURE_SCHEDULE.ENABLE) {
        _scheduleLimit = CustomerScheduleFunctions.getMixtureLimitVehicle(config);
      } else {
        _scheduleLimit = CustomerScheduleFunctions.getLimitVehicleByType(vehicleType, config);
      }
    }
    return acc + _scheduleLimit;
  }, 0);

  return maxBookingsCount;
}

async function _checkBookingStatusByDate(selectedStation, scheduleDate, vehicleType) {
  // Bỏ qua ngày nghỉ hệ thống
  const nationalHolidays = await SystemHolidayCalendarFunctions.getListSystemHolidayCalendar();
  if (nationalHolidays.indexOf(scheduleDate) >= 0) {
    return undefined;
  }

  const stationBookingConfigs = JSON.parse(selectedStation.stationBookingConfig || '{}');

  let _bookingDate = { scheduleDate: scheduleDate, scheduleDateStatus: BOOKING_STATUS.AVAILABLE };

  const workStatus = await StationWorkScheduleFunctions.getWorkStatusListByDate(selectedStation.stationsId, scheduleDate);

  // Trạm không bật nhận tất cả các loại xe thì ẩn ngày đi không cho user đặt
  if (
    workStatus.enableOtherVehicle === ALLOW_VEHICLE_TYPE_STATUS.DISABLE &&
    workStatus.enableRoMooc === ALLOW_VEHICLE_TYPE_STATUS.DISABLE &&
    workStatus.enableSmallCar === ALLOW_VEHICLE_TYPE_STATUS.DISABLE
  ) {
    return undefined;
  }

  const maxBookingsCount = _calculateMaxBookingCount(stationBookingConfigs, vehicleType, workStatus, selectedStation.enableConfigMixtureSchedule);

  const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];

  let successBookingsCount = undefined;

  if (process.env.REDIS_ENABLE * 1 === 1) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${selectedStation.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleDate}`);
    redisKey = redisKey.replace('{vehicleType}', `${vehicleType}`);
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      successBookingsCount = cacheData.successBookingsCount;
    }
  }

  let selectingVehicleType = vehicleType;

  if (successBookingsCount === undefined) {
    // Lấy thời gian phù hợp cho lịch hẹn
    if (selectedStation.enableConfigMixtureSchedule === BOOKING_MIXTURE_SCHEDULE.ENABLE) {
      successBookingsCount = await CustomerScheduleResourceAccess.customCount({
        stationsId: selectedStation.stationsId,
        dateSchedule: scheduleDate,
        CustomerScheduleStatus: successBookingStatus,
      });
    } else {
      successBookingsCount = await CustomerScheduleResourceAccess.customCount({
        stationsId: selectedStation.stationsId,
        dateSchedule: scheduleDate,
        CustomerScheduleStatus: successBookingStatus,
        vehicleType: selectingVehicleType,
      });
    }
  }

  if (process.env.REDIS_ENABLE * 1 === 1) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${selectedStation.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleDate}`);
    redisKey = redisKey.replace('{vehicleType}', `${vehicleType}`);
    if (successBookingsCount !== undefined && successBookingsCount !== null) {
      await RedisInstance.setWithExpire(redisKey, JSON.stringify({ successBookingsCount: successBookingsCount * 1 }));
    }
  }

  if (successBookingsCount !== undefined && successBookingsCount >= maxBookingsCount) {
    _bookingDate.scheduleDateStatus = BOOKING_STATUS.FULL;
  } else {
    _bookingDate.scheduleDateStatus = getBookingStatusFromBookingConfig(stationBookingConfigs);
  }

  _bookingDate.totalSchedule = maxBookingsCount;
  _bookingDate.totalBookingSchedule = successBookingsCount;

  const scheduleDayOff = await StationsWorkScheduleResourceAccess.find({ scheduleDayOff: scheduleDate, stationsId: selectedStation.stationsId });
  if (scheduleDayOff && scheduleDayOff.length > 0) {
    const timeList = JSON.parse(scheduleDayOff[0].scheduleTime);
    const isFullDayOff = timeList.every(timeVal => timeVal.isWorking === WORKING_STATUS.NOT_ACTIVE);
    if (isFullDayOff) {
      // Xóa ngày nghỉ
      return undefined;
    }
  }

  return _bookingDate;
}

// Logic kiểm tra ngày đặt lịch hợp lệ
async function getInfoBookingScheduleDate(selectedStation, bookingDate, vehicleType) {
  const isVaidDate = await _checkBookingStatusByDate(selectedStation, bookingDate, vehicleType);

  if (!isVaidDate || isVaidDate.scheduleDateStatus === 0 || isVaidDate.totalSchedule === isVaidDate.totalBookingSchedule) {
    return undefined;
  }

  return isVaidDate;
}

module.exports = {
  registerNewStation,
  getStationDetailById,
  getStationDetailByUrl,
  updateVoiceDataForConfig,
  resetAllDefaultMp3,
  sortCheckingConfigStep,
  getStationIdListByArea,
  updateDefaultPaymentConfigsStations,
  updatePermissionForFilter,
  getAllExternalStations,
  getStationsByFilter,
  getInfoBookingScheduleDate,
};
