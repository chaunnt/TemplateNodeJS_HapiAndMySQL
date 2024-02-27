/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const StationServicesResourceAccess = require('../resourceAccess/StationServicesResourceAccess');
const { POPULAR_ERROR, NOT_FOUND, UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { STATION_SERVICE_ERRORS } = require('../StationServicesConstants');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let servicesData = req.payload;

      const isExistedService = await StationServicesResourceAccess.find({
        stationsId: servicesData.stationsId,
        serviceType: servicesData.serviceType,
      });
      if (isExistedService && isExistedService.length > 0) {
        return reject(STATION_SERVICE_ERRORS.DUPLICATE_SERVICE);
      }

      const result = await StationServicesResourceAccess.insert(servicesData);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
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

      let serviceList = await StationServicesResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (serviceList && serviceList.length > 0) {
        let serviceCount = await StationServicesResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (serviceCount > 0) {
          return resolve({ data: serviceList, total: serviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      let updateResult = await StationServicesResourceAccess.updateById(id, data);
      if (updateResult) {
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let stationService = await StationServicesResourceAccess.findById(id);

      if (stationService) {
        return resolve(stationService);
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

      let result = await StationServicesResourceAccess.deleteById(id);
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

async function advanceUserInsert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let serviceData = req.payload;
      const userStationsId = req.currentUser.stationsId;
      serviceData.stationsId = userStationsId;

      const isExistedService = await StationServicesResourceAccess.find({ stationsId: userStationsId, serviceType: serviceData.serviceType });
      if (isExistedService && isExistedService.length > 0) {
        return reject(STATION_SERVICE_ERRORS.DUPLICATE_SERVICE);
      }

      const result = await StationServicesResourceAccess.insert(serviceData);
      if (result) {
        // Câp nhật lại mảng trạm phù hợp để nhận lịch tư vấn khi trạm bật dịch vụ
        await CustomerScheduleFunctions.updateAppropriateStation(serviceData.serviceType);

        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserDeleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      const userStationId = req.currentUser.stationsId;

      const targetService = await StationServicesResourceAccess.findById(id);
      if (!targetService || targetService.stationsId !== userStationId) {
        return reject(NOT_FOUND);
      }

      let result = await StationServicesResourceAccess.deleteById(id);
      if (result) {
        // Câp nhật lại mảng trạm phù hợp để nhận lịch tư vấn khi trạm tắt dịch vụ
        await CustomerScheduleFunctions.updateAppropriateStation(targetService.serviceType);

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

async function advanceUserGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      const userStationId = req.currentUser.stationsId;
      filter.stationsId = userStationId;

      let serviceList = await StationServicesResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (serviceList && serviceList.length > 0) {
        let serviceCount = await StationServicesResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (serviceCount > 0) {
          return resolve({ data: serviceList, total: serviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetListStationService(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let serviceList = await StationServicesResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (serviceList && serviceList.length > 0) {
        let serviceCount = await StationServicesResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (serviceCount > 0) {
          return resolve({ data: serviceList, total: serviceCount });
        }
      }
      return resolve({ data: [], total: 0 });
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
  advanceUserInsert,
  advanceUserDeleteById,
  advanceUserGetList,
  userGetListStationService,
};
