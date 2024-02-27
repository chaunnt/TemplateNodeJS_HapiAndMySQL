/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const VehicleProfileResourceAccess = require('../resourceAccess/VehicleProfileResourceAccess');
const VehicleProfileFunctions = require('../VehicleProfileFunctions');

const { POPULAR_ERROR, NOT_FOUND, UNKNOWN_ERROR, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const { VEHICLE_PROFILE_ERROR } = require('../VehicleProfileConstants');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const vehicleProfileData = req.payload;

      const result = await VehicleProfileFunctions.addVehicleInfo(vehicleProfileData);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      if (Object.values(VEHICLE_PROFILE_ERROR).includes(e)) {
        return reject(e);
      }
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserInsert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const vehicleProfileData = req.payload;
      const stations = req.currentUser.stationsId;

      vehicleProfileData.stationsId = stations;

      const result = await VehicleProfileFunctions.addVehicleInfo(vehicleProfileData);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      if (Object.values(VEHICLE_PROFILE_ERROR).includes(e)) {
        return reject(e);
      }
      console.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let profileList = await VehicleProfileResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (profileList && profileList.length > 0) {
        let deviceCount = await VehicleProfileResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (deviceCount > 0) {
          profileList = await _attachFileData(profileList);
          profileList = await _attachStationInfoToList(profileList);
          return resolve({ data: profileList, total: deviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserFind(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      if (req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      } else {
        return reject(MISSING_AUTHORITY);
      }

      let profileList = await VehicleProfileResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (profileList && profileList.length > 0) {
        let deviceCount = await VehicleProfileResourceAccess.customCount(filter, startDate, endDate, searchText, order);

        profileList = await _attachFileData(profileList);
        profileList = await _attachStationInfoToList(profileList, req.currentUser.stationsId);

        return resolve({ data: profileList, total: deviceCount });
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserSearch(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let profileList = await VehicleProfileResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (profileList && profileList.length > 0) {
        let deviceCount = await VehicleProfileResourceAccess.customCount(filter, startDate, endDate, searchText, order);

        profileList = await _attachFileData(profileList);
        profileList = await _attachStationInfoToList(profileList);

        return resolve({ data: profileList, total: deviceCount });
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function _attachFileData(vehicleList) {
  const promiseList = vehicleList.map(vehicle => {
    return VehicleProfileFunctions.getDetailVehicleProfile(vehicle.vehicleProfileId);
  });

  return Promise.all(promiseList);
}

async function _attachStationInfo(vehicleInfo) {
  if (vehicleInfo.stationsId) {
    let _station = await StationsResourceAccess.findById(vehicleInfo.stationsId);
    if (_station) {
      vehicleInfo.stationCode = _station.stationCode;
    }
  }
  return vehicleInfo;
}
async function _attachStationInfoToList(vehicleList, stationsId) {
  if (stationsId) {
    let _station = await StationsResourceAccess.findById(stationsId);
    if (_station) {
      vehicleList.forEach(_vehicle => {
        _vehicle.stationCode = _station.stationCode;
      });
    }
    return vehicleList;
  } else {
    const promiseList = vehicleList.map(vehicle => {
      return _attachStationInfo(vehicle);
    });

    return Promise.all(promiseList);
  }
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;
      const fileList = data.fileList;
      delete data.fileList;

      const previousRecord = await VehicleProfileResourceAccess.findById(id);

      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      let updateResult = await VehicleProfileFunctions.updateVehicleInfo(id, data, previousRecord);
      if (updateResult) {
        // update file list
        await VehicleProfileFunctions.updateVehicleFileList(id, fileList);

        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      if (Object.values(VEHICLE_PROFILE_ERROR).includes(e)) {
        return reject(e);
      }
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;
      const stationsId = req.currentUser.stationsId;

      const fileList = data.fileList;
      delete data.fileList;

      const previousRecord = await VehicleProfileResourceAccess.findById(id);

      if (!previousRecord || previousRecord.length <= 0 || (previousRecord && previousRecord.stationsId !== stationsId)) {
        return reject(NOT_FOUND);
      }

      let updateResult = await VehicleProfileFunctions.updateVehicleInfo(id, data, previousRecord);
      if (updateResult) {
        // update file list
        await VehicleProfileFunctions.updateVehicleFileList(id, fileList);
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      if (Object.values(VEHICLE_PROFILE_ERROR).includes(e)) {
        return reject(e);
      }
      console.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let vehicleProfile = await VehicleProfileFunctions.getDetailVehicleProfile(id);

      if (vehicleProfile) {
        return resolve(vehicleProfile);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await VehicleProfileResourceAccess.deleteById(id);
      if (result) {
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
  advanceUserUpdateById,
  advanceUserInsert,
  advanceUserSearch,
  advanceUserFind,
};
