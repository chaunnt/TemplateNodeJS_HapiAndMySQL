/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const OrderResourceAccess = require('../resourceAccess/OrderResourceAccess');
const OrderFunctions = require('../OrderFunctions');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const VehicleFeeCalculationModel = require('../model/VehicleFeeCalculationModel');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { PRODUCT_DATA } = require('../OrderConstant');
const { VEHICLE_PLATE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await OrderResourceAccess.insert(req.payload);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let data = await OrderResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (data && data.length > 0) {
        let count = await OrderResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        resolve({ data: data, total: count });
      } else {
        resolve({ data: [], total: 0 });
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
      let id = req.payload.id;
      let result = await OrderResourceAccess.findById(id);

      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      let result = await OrderResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
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

      let result = await OrderResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getOrderByRef(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await OrderResourceAccess.find({
        orderRef: req.payload.orderRef,
      });

      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getInspectionFee(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserVehicleId = req.payload.appUserVehicleId;
      let vehicleData = await AppUserVehicleResourceAccess.findById(appUserVehicleId);
      if (!vehicleData) {
        reject('failed');
        return;
      }
      vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, PRODUCT_DATA.ACCREDITATION_FEE.id);
      if (!vehicleData) {
        reject('failed');
        return;
      }

      let totalInspectionFee = await OrderFunctions.calculateVehicleInspectionFee(
        vehicleData.vehicleCategory,
        vehicleData.totalPerson,
        vehicleData.vehicleGoodsWeight,
      );
      let totalCertificateFee = await OrderFunctions.calculateCertificateFee(vehicleData.totalPerson);
      let payment = totalInspectionFee + totalCertificateFee;
      let totalVAT = Math.round(payment * 0.1);
      let totalPayment = payment + totalVAT;
      let result = {
        totalInspectionFee,
        totalCertificateFee,
        payment,
        totalVAT,
        totalPayment,
      };

      resolve(result);
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function getRoadFee(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserVehicleId = req.payload.appUserVehicleId;
      let vehicleData = await AppUserVehicleResourceAccess.findById(appUserVehicleId);
      if (!vehicleData) {
        reject('failed');
        return;
      }

      const IS_FOR_BUSINESS = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
      vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, PRODUCT_DATA.ROAD_FEE.id);
      if (!vehicleData) {
        reject('failed');
        return;
      }

      let totalRoadFee = await OrderFunctions.calculateRoadFee(
        vehicleData.vehicleCategory,
        vehicleData.totalPerson,
        vehicleData.vehicleTotalWeight,
        IS_FOR_BUSINESS,
      );

      let totalCertificateFee = await OrderFunctions.calculateCertificateFee(vehicleData.totalPerson);
      let payment = totalRoadFee + totalCertificateFee;
      let totalVAT = Math.round(payment * 0.1);
      let totalPayment = payment + totalVAT;

      let result = {
        totalRoadFee,
        totalCertificateFee,
        payment,
        totalVAT,
        totalPayment,
      };
      resolve(result);
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function getInsuranceFee(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserVehicleId = req.payload.appUserVehicleId;
      let vehicleData = await AppUserVehicleResourceAccess.findById(appUserVehicleId);
      if (!vehicleData) {
        reject('failed');
        return;
      }

      const IS_FOR_BUSINESS = vehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;

      vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, PRODUCT_DATA.INSURANCE_FEE.id);
      if (!vehicleData) {
        reject('failed');
        return;
      }

      let totalInsuranceFee = await OrderFunctions.calculateInsuranceFee(
        vehicleData.vehicleCategory,
        vehicleData.vehicleSeatsLimit,
        vehicleData.vehicleTotalWeight,
        IS_FOR_BUSINESS,
      );

      let totalVAT = Math.round(totalInsuranceFee * 0.1);
      let totalFee = totalInsuranceFee + totalVAT;
      let result = {
        totalInsuranceFee,
        totalVAT,
        totalFee,
      };
      resolve(result);
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  getOrderByRef,
  getInspectionFee,
  getRoadFee,
  getInsuranceFee,
};
