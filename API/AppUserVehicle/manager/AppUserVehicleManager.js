/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moment = require('moment');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const AppUserVehicleFunctions = require('../AppUserVehicleFunctions');
const AppUserVehicleView = require('../resourceAccess/AppUserVehicleView');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');
const { logVehicleChanged } = require('../../SystemAppLogChangeVehicle/SystemAppLogChangeVehicleFunctions');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const FirebaseNotificationFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');

const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const {
  USER_VEHICLE_ERROR,
  VEHICLE_PLATE_TYPE,
  VERIFICATION_STATUS,
  NEW_VEHICLE_CERTIFICATE,
  VEHICLE_TYPE,
  CRIMINAL,
  STRICT_MODE,
} = require('../AppUserVehicleConstant');
const Logger = require('../../../utils/logging');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const VRORGFunctions = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const { makeHashFromData, isValidValue } = require('../../ApiUtils/utilFunctions');
const { DATE_DB_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const { fetchVehicleDataFromVrAPI } = require('../../CriminalVRApi/VRAPIFunctions');
let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

function compareUserVehicleWeightWithVRData(vrData) {
  if (vrData.xeNho) {
    return VRORGFunctions.XE_NHO_HON_16_CHO_HOAC_1_TAN;
  } else {
    return undefined;
  }
}

async function clearCacheVehicleByUserId(appUserId) {
  const cacheKey = `USER_VEHICLE_${appUserId}`;
  await RedisInstance.deleteKey(cacheKey);
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let recordList = await AppUserVehicleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      let result = { data: [], total: 0 };

      if (recordList && recordList.length > 0) {
        let recordCount = await AppUserVehicleView.customCount(filter, undefined, undefined, searchText);
        if (recordCount) {
          result = { data: recordList, total: recordCount };
        }
      }

      return resolve(result);
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function count(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let total = 0;

      // Lấy data từ redis
      if (process.env.REDIS_ENABLE * 1 === 1) {
        const redisKey = `TOTAL_VEHICLE_${JSON.stringify(filter)}_${searchText}`;
        const cacheData = await RedisInstance.getJson(redisKey);
        if (cacheData) {
          return resolve(cacheData);
        }
      }

      let recordList = await AppUserVehicleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (recordList && recordList.length > 0) {
        total = await AppUserVehicleView.customCount(filter, undefined, undefined, searchText);

        //Lưu lại data mới cho redis
        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `TOTAL_VEHICLE_${JSON.stringify(filter)}_${searchText}`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(total));
        }
      }

      return resolve(total);
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await AppUserVehicleResourceAccess.findById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updatedData = req.payload.data;

      const previousData = await AppUserVehicleResourceAccess.findById(id);
      if (!previousData) {
        return reject(NOT_FOUND);
      }

      let updateResult = await AppUserVehicleResourceAccess.updateById(id, updatedData);

      if (updateResult) {
        await logVehicleChanged(previousData, updatedData, req.currentUser, id);
        resolve(updateResult);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await AppUserVehicleResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userDeleteVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let _existingVehicle = await AppUserVehicleResourceAccess.findById(id);
      if (_existingVehicle && _existingVehicle.appUserId === req.currentUser.appUserId) {
        let result = await AppUserVehicleResourceAccess.deleteById(id);
        if (result) {
          // cancel schedule of deleted vehicle
          const licensePlates = _existingVehicle.vehicleIdentity;

          const newSchedules = await CustomerScheduleResourceAccess.customSearch(
            { licensePlates: licensePlates, CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED] },
            0,
            20,
          );

          if (newSchedules && newSchedules.length > 0) {
            for (let schedule of newSchedules) {
              const reason = 'Người dùng xóa phương tiện.';

              const cancelResult = await CustomerScheduleFunctions.cancelUserSchedule(req.currentUser.appUserId, schedule.customerScheduleId, reason);

              if (cancelResult) {
                // notify cancel schedule to user
                const station = await StationsResourceAccess.findById(schedule.stationsId);

                const notifyContent = CustomerScheduleFunctions.generateMessageToCancelSchedule(
                  station.stationCode,
                  schedule.licensePlates,
                  reason,
                  station.stationsHotline,
                );
                const notifyTitle = `Lịch hẹn BSX ${schedule.licensePlates} bị hủy`;
                await CustomerMessageFunctions.addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, schedule.appUserId);
              } else {
                Logger.error('Cancel schedule of vehicle failed !');
              }
            }
          }

          return resolve(result);
        }
      }
      reject(UNKNOWN_ERROR);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      const currentAppUserId = req.currentUser.appUserId;
      filter.appUserId = currentAppUserId || 0;

      let recordList = await AppUserVehicleView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (recordList && recordList.length > 0) {
        let recordCount = await AppUserVehicleView.customCount(filter, startDate, endDate, searchText, order);
        if (recordCount) {
          return resolve({ data: recordList, total: recordCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const currentUserId = req.currentUser.appUserId;
      const result = await AppUserVehicleResourceAccess.findById(id);

      if (result && result.appUserId === currentUserId) {
        return resolve(result);
      } else {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userRegisterVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (req.currentUser.appUserId) {
        data.appUserId = req.currentUser.appUserId;
      }

      if (data.vehicleSubType) {
        data.vehicleType = AppUserVehicleFunctions.getVehicleTypeFromVehicleSubType(data.vehicleSubType);
      }

      const isValidVehicle = AppUserVehicleFunctions.checkValidVehicleIdentity(data.vehicleIdentity, data.vehicleType, data.vehiclePlateColor);
      if (!isValidVehicle) {
        return reject(USER_VEHICLE_ERROR.INVALID_PLATE_NUMBER);
      }

      let _existingVehicle = await AppUserVehicleResourceAccess.find(
        {
          vehicleIdentity: data.vehicleIdentity,
          appUserId: req.currentUser.appUserId,
        },
        0,
        1,
      );
      if (_existingVehicle && _existingVehicle.length > 0) {
        return reject(USER_VEHICLE_ERROR.DUPLICATE_VEHICLE);
      }

      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE) {
        //Kiểm tra biển số xe đã được đăng ký (biển số đẫ được người khác đăng ký)
        let _existingIdentity = await AppUserVehicleResourceAccess.find({ vehicleIdentity: data.vehicleIdentity }, 0, 1);
        if (
          _existingIdentity &&
          _existingIdentity.length > 0 && // trùng BSX
          data.certificateSeries &&
          data.certificateSeries !== NEW_VEHICLE_CERTIFICATE && // có GCN
          _existingIdentity[0].vehicleVerifiedInfo !== VERIFICATION_STATUS.VERIFIED // Chưa verify
        ) {
          return reject(USER_VEHICLE_ERROR.DUPLICATE_IDENTITY);
        }
      }

      // checking vehicle expiration date
      if (data.vehicleExpiryDate) {
        data.vehicleExpiryDay = moment(data.vehicleExpiryDate, DATE_DB_FORMAT).format('YYYYMMDD') * 1;
      }
      let checkCrime = CRIMINAL.NO;
      if (data.certificateSeries) {
        if (data.certificateSeries !== NEW_VEHICLE_CERTIFICATE) {
          try {
            console.info(`fetchVehicleDataFromVrAPI userRegisterVehicle ${req.currentUser.appUserId} - ${data.vehicleIdentity}`);
            const _vehicleDataFromVr = await fetchVehicleDataFromVrAPI(data.vehicleIdentity, data.certificateSeries, data.vehiclePlateColor);
            if (_vehicleDataFromVr && _vehicleDataFromVr.criminal === CRIMINAL.YES) {
              checkCrime = CRIMINAL.YES;
              await CustomerMessageFunctions.addWarningTicketMessageCustomer(data.vehicleIdentity, req.currentUser.appUserId);
            }
            if (_vehicleDataFromVr && _vehicleDataFromVr.certificateExpiration) {
              data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED;
              data.vehicleExpiryDate = _vehicleDataFromVr.certificateExpiration;
              data.vehicleSmall = _vehicleDataFromVr.xeNho;
              let compareResult = AppUserVehicleFunctions.compareUserVehicleWithVRData(data, _vehicleDataFromVr);
              const NO_ERROR = undefined;
              if (compareResult !== NO_ERROR) {
                return reject(compareResult);
              }
            } else {
              // return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE);
              data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_NO_DATA;
            }
          } catch (error) {
            data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_ERROR;
            console.error(`VERIFICATION_STATUS.VERIFIED_BUT_ERROR`);
            console.error(error);
            // return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE);
          }
        } else {
          data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_NO_DATA;
        }
      } else {
        console.error(`VERIFICATION_STATUS.VERIFIED_BUT_ERROR`);
        data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_ERROR;
        // return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE);
      }

      const vehicleHash = makeHashFromData(`${data.appUserId}_${data.vehicleIdentity}_${new Date()}`);
      data.vehicleHash = vehicleHash;

      // const SKIP_CHECK_DUPLICATE_VEHICLE = data.vehicleVerifiedInfo === VERIFICATION_STATUS.VERIFIED;

      const result = await AppUserVehicleFunctions.addNewUserVehicle(data);

      if (result) {
        // await clearCacheVehicleByUserId(req.currentUser.appUserId);
        let _newVehicleId = result[0];
        let _newVehicle = await AppUserVehicleResourceAccess.findById(_newVehicleId);

        _newVehicle.crime = checkCrime;
        return resolve(_newVehicle);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userUpdateVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      let updatedData = req.payload.data;

      //khong cho cap nhat bien so xe
      if (updatedData.vehicleIdentity) {
        delete updatedData.vehicleIdentity;
      }

      let _existingVehicle = await AppUserVehicleResourceAccess.findById(id);

      if (!_existingVehicle) {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }

      if (_existingVehicle.appUserId !== req.currentUser.appUserId) {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }

      // Kiểm tra ngày vehicleExpiryDate cập nhật (hợp lệ) của xe đã VERIFIED
      // VERIFIED => chắn chắn đã có ngày hết hạn (_existingVehicle.vehicleExpiryDate)
      if (process.env.STRICT_BOOKING_MODE_ENABLED * 1 === STRICT_MODE.ENABLE) {
        if (updatedData.vehicleExpiryDate && _existingVehicle.vehicleVerifiedInfo === VERIFICATION_STATUS.VERIFIED) {
          const diffCount = moment(updatedData.vehicleExpiryDate, DATE_DB_FORMAT).diff(moment(_existingVehicle.vehicleExpiryDate, DATE_DB_FORMAT));

          // Dữ liệu vehicleExpiryDate cập nhật là ngày trước ngày hết hạn cũ => Lỗi
          if (diffCount < 0) return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_EXPIRATION_DATE);

          updatedData.vehicleExpiryDay = moment(updatedData.vehicleExpiryDate, DATE_DB_FORMAT).format('YYYYMMDD') * 1;
        }
      }

      let data = {
        ..._existingVehicle,
        ...updatedData,
      };

      if (data.vehicleSubType) {
        data.vehicleType = AppUserVehicleFunctions.getVehicleTypeFromVehicleSubType(data.vehicleSubType);
      }

      // Chưa kiểm tra số seri bên cục (VERIFIED)
      if (data.vehicleVerifiedInfo !== VERIFICATION_STATUS.VERIFIED && data.certificateSeries) {
        if (data.certificateSeries !== NEW_VEHICLE_CERTIFICATE) {
          try {
            console.info(`fetchVehicleDataFromVrAPI userUpdateVehicle ${req.currentUser.appUserId} - ${data.vehicleIdentity}`);
            // So sánh dữ liệu bên cục
            const _vehicleDataFromVr = await fetchVehicleDataFromVrAPI(data.vehicleIdentity, data.certificateSeries, data.vehiclePlateColor);
            if (_vehicleDataFromVr && _vehicleDataFromVr.certificateExpiration) {
              updatedData.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED;
              updatedData.vehicleExpiryDate = _vehicleDataFromVr.certificateExpiration;
              updatedData.vehicleSmall = _vehicleDataFromVr.xeNho;
              let compareResult = AppUserVehicleFunctions.compareUserVehicleWithVRData(data, _vehicleDataFromVr);
              const NO_ERROR = undefined;
              if (compareResult !== NO_ERROR) {
                return reject(compareResult);
              }
            } else {
              updatedData.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_NO_DATA;
              // return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE);
            }
          } catch (error) {
            console.error(error);
            data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_ERROR;
            console.error(`VERIFICATION_STATUS.VERIFIED_BUT_ERROR`);
            // return reject(USER_VEHICLE_ERROR.INVALID_VEHICLE_CERTIFICATE);
          }
        } else {
          data.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_NO_DATA;
        }
      }

      if (updatedData.vehicleSubType) {
        updatedData.vehicleType = AppUserVehicleFunctions.getVehicleTypeFromVehicleSubType(updatedData.vehicleSubType);
      }

      if (updatedData.vehicleSubCategory) {
        let _submittingVehicleCategory = AppUserVehicleFunctions.getVehicleCategoryFromVehicleSubCategory(updatedData.vehicleSubCategory);
        if (
          (_existingVehicle.vehicleCategory && _existingVehicle.vehicleCategory !== _submittingVehicleCategory) ||
          !_existingVehicle.vehicleCategory
        ) {
          updatedData.vehicleCategory = _submittingVehicleCategory;
        }

        let _seatLimit = AppUserVehicleFunctions.getSeatCountBySubCategory(updatedData.vehicleSubCategory);
        if (isValidValue(_seatLimit)) {
          updatedData.vehicleSeatsLimit = _seatLimit;
        }

        let _totalWeight = AppUserVehicleFunctions.getVehicleTotalWeightBySubCategory(updatedData.vehicleSubCategory);
        if (isValidValue(_totalWeight)) {
          if (updatedData.vehicleTotalWeight && updatedData.vehicleTotalWeight < _totalWeight.min) {
            updatedData.vehicleTotalWeight = _totalWeight.min;
          } else if (updatedData.vehicleTotalWeight && updatedData.vehicleTotalWeight > _totalWeight.max) {
            updatedData.vehicleTotalWeight = _totalWeight.max;
          }
        }
      }

      // Nếu đã kiểm tra số seri bên cục (VERIFIED)
      if (data.vehicleVerifiedInfo === VERIFICATION_STATUS.VERIFIED && data.certificateSeries) {
        // Số seri cập nhật phải khác với số seri đã lưu trước đó
        if (updatedData.certificateSeries && _existingVehicle.certificateSeries !== updatedData.certificateSeries)
          await AppUserVehicleFunctions.saveStampChangeHistory(
            _existingVehicle.appUserVehicleId,
            _existingVehicle.certificateSeries,
            _existingVehicle.vehicleExpiryDate,
            _existingVehicle.vehicleIdentity,
          );
      }

      let updateResult = await AppUserVehicleResourceAccess.updateById(id, updatedData);

      if (updateResult) {
        await logVehicleChanged(_existingVehicle, updatedData, req.currentUser, id);
        const vehicleAfterUpdate = await AppUserVehicleResourceAccess.findById(id);
        resolve(vehicleAfterUpdate);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userCheckLicensePlate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let licensePlates = req.payload.licensePlates;
      const vehiclePlateColor = req.payload.vehiclePlateColor;
      const certificateSeries = req.payload.certificateSeries;

      fetchVehicleDataFromVrAPI(licensePlates, certificateSeries, vehiclePlateColor)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getVehicleInfoByHash(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const vehicleHash = req.payload.vehicleHash;

      const vehicles = await AppUserVehicleView.find({ vehicleHash: vehicleHash }, 0, 1);

      if (vehicles && vehicles.length > 0) {
        return resolve(vehicles[0]);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  find,
  updateById,
  findById,
  deleteById,
  userDeleteVehicle,
  userGetList,
  userGetDetail,
  userRegisterVehicle,
  userUpdateVehicle,
  userCheckLicensePlate,
  getVehicleInfoByHash,
  count,
};
