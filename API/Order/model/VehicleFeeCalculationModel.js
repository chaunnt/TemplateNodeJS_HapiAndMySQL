/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const { VR_VEHICLE_TYPE } = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const { PRODUCT_DATA } = require('../OrderConstant');

/**
 *
 * @param {*} modelData AppUserVehicleResourceAccess
 * @param {*} feeType PRODUCT_DATA[<type>].id, null => tính phí thất cả
 * @returns
 */
function fromData(modelData, feeType) {
  const result = {};
  if (!modelData.vehicleCategory) {
    // category bắt buộc
    return undefined;
  }
  result.vehicleCategory = modelData.vehicleCategory;

  switch (feeType) {
    case PRODUCT_DATA.ACCREDITATION_FEE.id:
      // xe cho hang => validate vehicleGoodsWeight
      if (
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CHO_NGUOI &&
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CO_DONG_CO &&
        !modelData.vehicleGoodsWeight
      ) {
        return undefined;
      }
      result.vehicleGoodsWeight = modelData.vehicleGoodsWeight || 0;
      result.vehicleSeatsLimit = modelData.vehicleSeatsLimit || 0;
      result.vehicleBerthLimit = modelData.vehicleBerthLimit || 0;
      result.vehicleFootholdLimit = modelData.vehicleFootholdLimit || 0;
      result.totalPerson = result.vehicleSeatsLimit + result.vehicleBerthLimit + result.vehicleFootholdLimit;
      // xe cho nguoi => validate total person
      if (modelData.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && result.totalPerson === 0) {
        return undefined;
      }
      return result;
    case PRODUCT_DATA.ROAD_FEE.id:
      // xe cho hang => validate vehicleTotalWeight
      if (
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CHO_NGUOI &&
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CO_DONG_CO &&
        !modelData.vehicleTotalWeight
      ) {
        return undefined;
      }
      result.vehicleTotalWeight = modelData.vehicleTotalWeight || 0;
      result.vehicleGoodsWeight = modelData.vehicleGoodsWeight || 0;
      result.vehicleSeatsLimit = modelData.vehicleSeatsLimit || 0;
      result.vehicleBerthLimit = modelData.vehicleBerthLimit || 0;
      result.vehicleFootholdLimit = modelData.vehicleFootholdLimit || 0;
      result.totalPerson = result.vehicleSeatsLimit + result.vehicleBerthLimit + result.vehicleFootholdLimit;
      // xe cho nguoi => validate total person
      if (modelData.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && result.totalPerson === 0) {
        return undefined;
      }
      return result;
    case PRODUCT_DATA.INSURANCE_FEE.id:
      // xe cho hang => validate vehicleTotalWeight
      if (
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CHO_NGUOI &&
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CO_DONG_CO &&
        !modelData.vehicleTotalWeight
      ) {
        return undefined;
      }
      result.vehicleTotalWeight = modelData.vehicleTotalWeight;
      result.vehicleSeatsLimit = modelData.vehicleSeatsLimit || 0;
      result.vehicleBerthLimit = modelData.vehicleBerthLimit || 0;
      result.vehicleFootholdLimit = modelData.vehicleFootholdLimit || 0;
      result.totalPerson = result.vehicleSeatsLimit + result.vehicleBerthLimit + result.vehicleFootholdLimit;
      // xe cho nguoi => validate total person
      if (modelData.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && result.totalPerson === 0) {
        return undefined;
      }
      return result;
    default:
      // calculate all => validate all
      if (modelData.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && !modelData.vehicleSeatsLimit) {
        return undefined;
      }
      if (
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CHO_NGUOI &&
        modelData.vehicleCategory !== VR_VEHICLE_TYPE.XE_CO_DONG_CO &&
        !modelData.vehicleGoodsWeight /* || !modelData.vehicleTotalWeight */
      ) {
        return undefined;
      }

      result.vehicleGoodsWeight = modelData.vehicleGoodsWeight;
      result.vehicleTotalWeight = modelData.vehicleTotalWeight;
      result.vehicleSeatsLimit = modelData.vehicleSeatsLimit || 0;
      result.vehicleBerthLimit = modelData.vehicleBerthLimit || 0;
      result.vehicleFootholdLimit = modelData.vehicleFootholdLimit || 0;
      result.totalPerson = result.vehicleSeatsLimit + result.vehicleBerthLimit + result.vehicleFootholdLimit;
      // sum total person
      if (modelData.vehicleCategory === VR_VEHICLE_TYPE.XE_CHO_NGUOI && result.totalPerson === 0) {
        return undefined;
      }
      return result;
  }
}

module.exports = { fromData };
