/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const OrderResourceAccess = require('./resourceAccess/OrderResourceAccess');
const OrderItemResourceAccess = require('./resourceAccess/OrderItemResourceAccess');
const VRORGFunctions = require('../../ThirdParty/VRORGAPI/VRORGFunctions');
const { PRODUCT_DATA, ORDER_PAYMENT_STATUS, TAX_PERCENT } = require('./OrderConstant');
const VehicleFeeCalculationModel = require('./model/VehicleFeeCalculationModel');
const AppUserVehicleResourceAccess = require('../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const { VEHICLE_PLATE_TYPE } = require('../AppUserVehicle/AppUserVehicleConstant');

async function getRoadFeeOrderItem(orderId, vehicleData, isForBusiness) {
  const price = await calculateRoadFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);
  return {
    productId: PRODUCT_DATA['ROAD_FEE'].id,
    orderItemName: PRODUCT_DATA['ROAD_FEE'].name,
    productPrice: price,
    discountAmount: 0,
    taxAmount: 0,
    payAmount: price,
    orderId: orderId,
    quantity: 1,
  };
}

async function getStampPrintingFeeOrderItem(orderId, vehicleData) {
  const price = await calculateCertificateFee(vehicleData.totalPerson);
  return {
    productId: PRODUCT_DATA['STAMP_PRINTING_FEE'].id,
    orderItemName: PRODUCT_DATA['STAMP_PRINTING_FEE'].name,
    productPrice: price,
    discountAmount: 0,
    taxAmount: 0,
    payAmount: price,
    orderId: orderId,
    quantity: 1,
  };
}

async function getAccreditationInsuranceFeeOrderItem(orderId, vehicleData, isForBusiness) {
  const price = await calculateInsuranceFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);

  return {
    productId: PRODUCT_DATA['INSURANCE_FEE'].id,
    orderItemName: PRODUCT_DATA['INSURANCE_FEE'].name,
    productPrice: price,
    discountAmount: 0,
    taxAmount: 0,
    payAmount: price,
    orderId: orderId,
    quantity: 1,
  };
}

async function getAccreditationFeeOrderItem(orderId, vehicleData) {
  const price = await calculateVehicleInspectionFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleGoodsWeight);
  return {
    productId: PRODUCT_DATA['ACCREDITATION_FEE'].id,
    orderItemName: PRODUCT_DATA['ACCREDITATION_FEE'].name,
    productPrice: price,
    discountAmount: 0,
    taxAmount: 0,
    payAmount: price,
    orderId: orderId,
    quantity: 1,
  };
}

/**
 *
 * @typedef {object} OrderData
 *  @property {integer} customerScheduleId
 *  @property {integer} appUserVehicleId
 *  @property {integer} appUserId
 *  @property {integer} stationsId
 *
 * @typedef {object} VehicleData AppUserVehicleResourceAccess
 * @param {OrderData} data
 * @param {VehicleData} vehicleData
 * @param {boolean} isForBusiness
 */
async function createOrderBySchedule(data, vehicleData, isForBusiness) {
  vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, undefined);
  if (!vehicleData) {
    vehicleData = {};
    data.total = 0;
    data.taxAmount = 0;
    data.discountAmount = 0;
    data.totalPayment = 0;
    data.paymentStatus = ORDER_PAYMENT_STATUS.PROCESSING;
  } else {
    data.total = await calculateAllFee(vehicleData, isForBusiness);
    const taxPercentage = TAX_PERCENT.VAT;
    data.taxAmount = Math.round((data.total / 100) * taxPercentage);
    data.discountAmount = 0;
    data.totalPayment = data.total + data.taxAmount - data.discountAmount;
  }

  const result = await OrderResourceAccess.insert(data);
  // tạo order item
  await OrderItemResourceAccess.insert([
    // await getRoadFeeOrderItem(result[0], vehicleData, isForBusiness),
    await getStampPrintingFeeOrderItem(result[0], vehicleData),
    // await getAccreditationInsuranceFeeOrderItem(result[0], vehicleData, isForBusiness),
    await getAccreditationFeeOrderItem(result[0], vehicleData),
  ]);
  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function createOrderInspectionFeeBySchedule(data, vehicleData, isForBusiness) {
  vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, undefined);
  if (!vehicleData) {
    vehicleData = {};
    data.total = 0;
    data.taxAmount = 0;
    data.discountAmount = 0;
    data.totalPayment = 0;
    data.paymentStatus = ORDER_PAYMENT_STATUS.PROCESSING;
  } else {
    data.total = await calculateInspectionAllFee(vehicleData, isForBusiness);
    const taxPercentage = TAX_PERCENT.VAT;
    data.taxAmount = Math.round((data.total / 100) * taxPercentage);
    data.discountAmount = 0;
    data.totalPayment = data.total + data.taxAmount - data.discountAmount;
  }

  const result = await OrderResourceAccess.insert(data);
  // tạo order item
  await OrderItemResourceAccess.insert([
    await getStampPrintingFeeOrderItem(result[0], vehicleData),
    await getAccreditationFeeOrderItem(result[0], vehicleData),
  ]);
  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function createOrderInsuranceFeeBySchedule(data, vehicleData, isForBusiness) {
  vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, undefined);
  if (!vehicleData) {
    vehicleData = {};
    data.total = 0;
    data.taxAmount = 0;
    data.discountAmount = 0;
    data.totalPayment = 0;
    data.paymentStatus = ORDER_PAYMENT_STATUS.PROCESSING;
  } else {
    data.total = await calculateInsuranceAllFee(vehicleData, isForBusiness);
    const taxPercentage = TAX_PERCENT.VAT;
    data.taxAmount = Math.round((data.total / 100) * taxPercentage);
    data.discountAmount = 0;
    data.totalPayment = data.total + data.taxAmount - data.discountAmount;
  }

  const result = await OrderResourceAccess.insert(data);
  // tạo order item
  await OrderItemResourceAccess.insert([await getAccreditationInsuranceFeeOrderItem(result[0], vehicleData, isForBusiness)]);
  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function createOrderRoadFeeBySchedule(data, vehicleData, isForBusiness) {
  vehicleData = VehicleFeeCalculationModel.fromData(vehicleData, undefined);
  if (!vehicleData) {
    vehicleData = {};
    data.total = 0;
    data.taxAmount = 0;
    data.discountAmount = 0;
    data.totalPayment = 0;
    data.paymentStatus = ORDER_PAYMENT_STATUS.PROCESSING;
  } else {
    data.total = await calculateAllRoadFee(vehicleData, isForBusiness);
    const taxPercentage = TAX_PERCENT.VAT;
    data.taxAmount = Math.round((data.total / 100) * taxPercentage);
    data.discountAmount = 0;
    data.totalPayment = data.total + data.taxAmount - data.discountAmount;
  }

  const result = await OrderResourceAccess.insert(data);
  // tạo order item
  await OrderItemResourceAccess.insert([
    await getRoadFeeOrderItem(result[0], vehicleData, isForBusiness),
    await getStampPrintingFeeOrderItem(result[0], vehicleData),
  ]);
  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function updateOrderStatus(scheduleId, newStatus) {
  const orderData = await OrderResourceAccess.find({ customerScheduleId: scheduleId });
  if (orderData && orderData.length > 0) {
    await OrderResourceAccess.updateById(orderData[0].orderId, { orderStatus: newStatus });
  }
}

async function calculateAllFee(vehicleData, isForBusiness) {
  let inspectionFee = 0;
  let certificateFee = 0;
  let roadFee = 0;
  let insuranceFee = 0;
  if (vehicleData.vehicleCategory) {
    inspectionFee = await calculateVehicleInspectionFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleGoodsWeight);
    certificateFee = await calculateCertificateFee(vehicleData.totalPerson);
    // roadFee = await calculateRoadFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);
    // insuranceFee = await calculateInsuranceFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);
    return inspectionFee + certificateFee + roadFee + insuranceFee;
  } else {
    return 0;
  }
}

async function calculateInspectionAllFee(vehicleData, isForBusiness) {
  let inspectionFee = 0;
  let certificateFee = 0;
  if (vehicleData.vehicleCategory) {
    inspectionFee = await calculateVehicleInspectionFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleGoodsWeight);
    certificateFee = await calculateCertificateFee(vehicleData.totalPerson);
    return inspectionFee + certificateFee;
  } else {
    return 0;
  }
}

async function calculateInsuranceAllFee(vehicleData, isForBusiness) {
  let insuranceFee = 0;
  if (vehicleData.vehicleCategory) {
    insuranceFee = await calculateInsuranceFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);
    return insuranceFee;
  } else {
    return 0;
  }
}

async function calculateAllRoadFee(vehicleData, isForBusiness) {
  let certificateFee = 0;
  let roadFee = 0;
  if (vehicleData.vehicleCategory) {
    certificateFee = await calculateCertificateFee(vehicleData.totalPerson);
    roadFee = await calculateRoadFee(vehicleData.vehicleCategory, vehicleData.totalPerson, vehicleData.vehicleTotalWeight, isForBusiness);
    return certificateFee + roadFee;
  } else {
    return 0;
  }
}

// phí đăng kiểm check thêm số người hoặc khối lượng chở hàng
async function calculateVehicleInspectionFee(vehicleCategory, totalPerson, vehicleGoodsWeight) {
  switch (vehicleCategory) {
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_HANG:
      if (vehicleGoodsWeight > 20000) {
        return 570000;
      } else if (vehicleGoodsWeight > 7000) {
        return 360000;
      } else if (vehicleGoodsWeight > 2000) {
        return 330000;
      } else {
        return 290000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_DAU_KEO:
      if (vehicleGoodsWeight > 20000) {
        return 570000;
      } else {
        return 360000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHUYEN_DUNG:
      if (vehicleGoodsWeight > 20000) {
        return 560000;
      } else if (vehicleGoodsWeight > 7000) {
        return 350000;
      } else if (vehicleGoodsWeight > 2000) {
        return 320000;
      } else {
        return 280000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.RO_MOOC:
      return 190000;
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_NGUOI:
      if (totalPerson > 40) {
        return 360000;
      } else if (totalPerson >= 25) {
        return 330000;
      } else if (totalPerson >= 10) {
        return 290000;
      } else {
        return 250000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CO_DONG_CO:
      return 190000;
    default:
      return 0;
  }
}

// dựa vào số người
async function calculateCertificateFee(totalPerson) {
  if (totalPerson < 10) {
    return 45000;
  } else {
    return 20000;
  }
}

// phí đường bộ có thêm check số chỗ ngồi hoặc tổng khối lượng
async function calculateRoadFee(vehicleCategory, totalPerson, vehicleTotalWeight, isForBusiness) {
  switch (vehicleCategory) {
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_NGUOI:
      if (totalPerson >= 4 && totalPerson <= 7) {
        if (isForBusiness) {
          return 2160000;
        } else {
          return 1560000;
        }
      } else if (totalPerson <= 16) {
        return 3240000;
      } else if (totalPerson >= 25 && totalPerson <= 29) {
        return 4680000;
      } else if (totalPerson >= 45) {
        return 7080000;
      }
      return 0;
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_DAU_KEO:
      if (vehicleTotalWeight < 19000) {
        return 7080000;
      } else if (vehicleTotalWeight >= 19000 && vehicleTotalWeight < 27000) {
        return 8640000;
      } else if (vehicleTotalWeight >= 27000 && vehicleTotalWeight < 40000) {
        return 12480000;
      } else {
        return 17160000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHUYEN_DUNG:
      if (vehicleTotalWeight < 4000) {
        return 2160000;
      } else if (vehicleTotalWeight >= 4000 && vehicleTotalWeight < 8500) {
        return 3240000;
      } else if (vehicleTotalWeight >= 8500 && vehicleTotalWeight < 13000) {
        return 4680000;
      } else if (vehicleTotalWeight >= 13000 && vehicleTotalWeight < 19000) {
        return 7080000;
      } else if (vehicleTotalWeight >= 19000 && vehicleTotalWeight < 27000) {
        return 8640000;
      } else {
        return 17160000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_HANG:
      if (vehicleTotalWeight < 4000) {
        return 2160000;
      } else if (vehicleTotalWeight >= 4000 && vehicleTotalWeight < 8500) {
        return 3240000;
      } else if (vehicleTotalWeight >= 8500 && vehicleTotalWeight < 13000) {
        return 4680000;
      } else if (vehicleTotalWeight >= 13000 && vehicleTotalWeight < 19000) {
        return 7080000;
      } else if (vehicleTotalWeight >= 19000 && vehicleTotalWeight < 27000) {
        return 8640000;
      } else {
        return 12480000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CO_DONG_CO:
      return 2160000;
    default:
      return 0;
  }
}

async function calculateInsuranceFee(vehicleCategory, totalSeat, vehicleTotalWeight, isForBusiness) {
  switch (vehicleCategory) {
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_NGUOI:
      if (!isForBusiness) {
        if (totalSeat < 6) {
          return 437000;
        } else if (totalSeat >= 6 && totalSeat < 11) {
          return 794000;
        } else if (totalSeat >= 12 && totalSeat <= 24) {
          return 1270000;
        } else {
          return 1825000;
        }
      } else {
        if (totalSeat < 6) {
          return 756000;
        } else if (totalSeat === 6) {
          return 929000;
        } else if (totalSeat === 7) {
          return 1080000;
        } else if (totalSeat === 8) {
          return 1253000;
        } else if (totalSeat === 9) {
          return 1404000;
        } else if (totalSeat === 10) {
          return 1512000;
        } else if (totalSeat === 11) {
          return 1656000;
        } else if (totalSeat === 12) {
          return 1822000;
        } else if (totalSeat === 13) {
          return 2049000;
        } else if (totalSeat === 14) {
          return 2221000;
        } else if (totalSeat === 15) {
          return 2394000;
        } else if (totalSeat === 16) {
          return 3054000;
        } else if (totalSeat === 17) {
          return 2718000;
        } else if (totalSeat === 18) {
          return 2869000;
        } else if (totalSeat === 19) {
          return 3041000;
        } else if (totalSeat === 20) {
          return 3191000;
        } else if (totalSeat === 21) {
          return 3364000;
        } else if (totalSeat === 22) {
          return 3515000;
        } else if (totalSeat === 23) {
          return 3688000;
        } else if (totalSeat === 24) {
          return 4632000;
        } else if (totalSeat === 25) {
          return 4813000;
        } else {
          return Number((4813000 + 30000) * (totalSeat - 25));
        }
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_HANG:
      if (vehicleTotalWeight < 3000) {
        return 853000;
      } else if (vehicleTotalWeight >= 3000 && vehicleTotalWeight <= 8000) {
        return 1660000;
      } else if (vehicleTotalWeight > 8000 && vehicleTotalWeight <= 15000) {
        return 2746000;
      } else {
        return 3200000;
      }
    case VRORGFunctions.VR_VEHICLE_TYPE.RO_MOOC:
      return 4800000;
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_DAU_KEO:
      return 5823600;
    case VRORGFunctions.VR_VEHICLE_TYPE.XE_CHUYEN_DUNG:
      return 1023600;
    default:
      return 0;
  }
}

/**
 * @typedef ScheduleData
 * @property {number} customerScheduleId
 * @property {number} appUserVehicleId
 * @property {number} appUserId
 * @property {number} stationsId
 *
 * @param {ScheduleData} scheduleData
 * @returns orderData
 */
async function getOrderDetail(scheduleData) {
  let orderData = await OrderResourceAccess.find({ customerScheduleId: scheduleData.customerScheduleId });
  if (orderData && orderData.length > 0) {
    orderData = orderData[0];
    if (orderData.paymentStatus === ORDER_PAYMENT_STATUS.PROCESSING) {
      // create new order
      const _newOrderId = await reCalculateAllFee(scheduleData, orderData.orderId);
      if (_newOrderId) {
        orderData = await OrderResourceAccess.findById(_newOrderId);
      }
    }
    const orderItem = await OrderItemResourceAccess.find({ orderId: orderData.orderId });
    orderData.orderItem = orderItem;
    return orderData;
  } else {
    const userVehicleData = await AppUserVehicleResourceAccess.findById(scheduleData.appUserVehicleId);
    if (!userVehicleData) {
      return {};
    }
    await createOrderBySchedule(
      {
        customerScheduleId: scheduleData.customerScheduleId,
        appUserVehicleId: scheduleData.appUserVehicleId,
        appUserId: scheduleData.appUserId,
        stationsId: scheduleData.stationsId,
      },
      userVehicleData,
      !!userVehicleData.vehicleForBusiness,
    );
    return await getOrderDetail(scheduleData);
  }
}

async function reCalculateAllFee(scheduleData, orderId) {
  const userVehicleData = await AppUserVehicleResourceAccess.findById(scheduleData.appUserVehicleId);
  if (!userVehicleData) {
    return undefined;
  }

  const _strictUserVehicleData = VehicleFeeCalculationModel.fromData(userVehicleData, undefined);
  if (!_strictUserVehicleData) {
    return undefined;
  }

  await OrderResourceAccess.deleteById(orderId);
  await OrderItemResourceAccess.deleteByOrderId(orderId);

  const _isForBusiness = userVehicleData.vehiclePlateColor === VEHICLE_PLATE_TYPE.YELLOW;
  const res = await createOrderBySchedule(scheduleData, userVehicleData, _isForBusiness);
  if (res && res.length > 0) {
    return res[0];
  } else {
    return undefined;
  }
}

module.exports = {
  createOrderBySchedule,
  updateOrderStatus,
  getOrderDetail,
  calculateVehicleInspectionFee,
  calculateCertificateFee,
  calculateRoadFee,
  calculateAllFee,
  calculateInsuranceFee,
  createOrderRoadFeeBySchedule,
  createOrderInspectionFeeBySchedule,
  createOrderInsuranceFeeBySchedule,
};
