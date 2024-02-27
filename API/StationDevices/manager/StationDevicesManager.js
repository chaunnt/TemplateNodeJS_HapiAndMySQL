/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const StationDevicesResourceAccess = require('../resourceAccess/StationDevicesResourceAccess');
const StationDevicesView = require('../resourceAccess/StationDevicesView');
const StationDevicesFunctions = require('../../StationDevices/StationDevicesFunctions');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');
const Logger = require('../../../utils/logging');

const { POPULAR_ERROR, UNKNOWN_ERROR, NO_DATA, NOT_FOUND, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const { STATION_DEVICES_ERRORS } = require('../StationDevicesConstants');

async function checkIsValidDeviceStation(deviceStaion) {
  return new Promise(async (resolve, reject) => {
    try {
      if (deviceStaion.deviceSeri) {
        const existedDevice = await StationDevicesResourceAccess.find({ deviceSeri: deviceStaion.deviceSeri });
        if (existedDevice && existedDevice.length > 0) {
          reject(STATION_DEVICES_ERRORS.DUPLICATE_SERI);
          return STATION_DEVICES_ERRORS.DUPLICATE_SERI;
        }
      }

      resolve();
    } catch (e) {
      Logger.error('error', e);
      Logger.error('error', JSON.stringify(deviceStaion));
      reject(e);
    }
  });
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      if (data.deviceSeri) {
        const existedDevice = await StationDevicesResourceAccess.find({ deviceSeri: data.deviceSeri });
        if (existedDevice && existedDevice.length > 0) {
          return reject(STATION_DEVICES_ERRORS.DUPLICATE_SERI);
        }
      }

      const result = await StationDevicesResourceAccess.insert(data);
      if (result) {
        await _updateTotalInspectionLine(data.stationsId);
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserInsertStationDevice(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      data.stationsId = req.currentUser.stationsId;

      try {
        await checkIsValidDeviceStation(data);
      } catch (diviceError) {
        return reject(diviceError);
      }

      const result = await StationDevicesResourceAccess.insert(data);
      if (result) {
        await _updateTotalInspectionLine(data.stationsId);
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _updateTotalInspectionLine(stationsId) {
  // count number of devices of station
  const totalInspectionLine = await StationDevicesResourceAccess.count({ stationsId: stationsId });
  if (Number.isInteger(totalInspectionLine)) {
    await StationResourceAccess.updateById(stationsId, { totalInspectionLine: totalInspectionLine });
  }
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let deviceList = await StationDevicesView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (deviceList && deviceList.length > 0) {
        let deviceCount = await StationDevicesView.customCount(filter, startDate, endDate, searchText, order);
        if (deviceCount > 0) {
          return resolve({ data: deviceList, total: deviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetListStationDevices(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      const currentStationsId = req.currentUser.stationsId;

      // Chỉ lấy những device của trạm
      filter.stationsId = currentStationsId;

      let deviceList = await StationDevicesResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (deviceList && deviceList.length > 0) {
        let deviceCount = await StationDevicesResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (deviceCount > 0) {
          return resolve({ data: deviceList, total: deviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
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
      const data = req.payload.data;

      const existedDevice = await StationDevicesResourceAccess.findById(id);
      if (existedDevice && existedDevice.deviceSeri === data.deviceSeri) {
        // Seri không thay đổi thì không cập nhật
        delete data.deviceSeri;
      }

      try {
        await checkIsValidDeviceStation(data);
      } catch (diviceError) {
        return reject(diviceError);
      }

      let updateResult = await StationDevicesResourceAccess.updateById(id, data);
      if (updateResult) {
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateStationDeviceById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;
      const currentStationsId = req.currentUser.stationsId;

      //Không cho update stationsID của device
      delete data.stationsId;

      // Kiểm tra device của trạm có chưa
      const deviceExisted = await StationDevicesResourceAccess.findById(id);
      if (!deviceExisted) {
        return reject(NOT_FOUND);
      }

      if (deviceExisted && deviceExisted.deviceSeri === data.deviceSeri) {
        // Seri không thay đổi thì không cập nhật
        delete data.deviceSeri;
      }

      try {
        await checkIsValidDeviceStation(data);
      } catch (diviceError) {
        return reject(diviceError);
      }

      // Không cho phép chỉnh sửa device của trạm khác
      if (deviceExisted.stationsId !== currentStationsId) {
        return reject(MISSING_AUTHORITY);
      }

      let updateResult = await StationDevicesResourceAccess.updateById(id, data);
      if (updateResult) {
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let stationDevice = await StationDevicesResourceAccess.findById(id);

      if (stationDevice) {
        return resolve(stationDevice);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
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

      const previousRecord = await StationDevicesResourceAccess.findById(id);

      if (!previousRecord) {
        return reject(NOT_FOUND);
      }
      let result = await StationDevicesResourceAccess.deleteById(id);
      if (result) {
        await _updateTotalInspectionLine(previousRecord.stationsId);
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserDeleteStationDeviceById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      const currentStationsId = req.currentUser.stationsId;

      const deviceExisted = await StationDevicesResourceAccess.findById(id);

      if (!deviceExisted) {
        return reject(NOT_FOUND);
      }

      // Không cho xóa device của trạm khác
      if (deviceExisted.stationsId !== currentStationsId) {
        return reject(MISSING_AUTHORITY);
      }

      let result = await StationDevicesResourceAccess.deleteById(id);
      if (result) {
        await _updateTotalInspectionLine(deviceExisted.stationsId);
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  advanceUserInsertStationDevice,
  advanceUserUpdateStationDeviceById,
  advanceUserGetListStationDevices,
  advanceUserDeleteStationDeviceById,
};
