/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const StationPaymentConfigsResourceAccess = require('../resourceAccess/StationPaymentConfigsResourceAccess');
const StationPaymentConfigsView = require('../resourceAccess/StationPaymentConfigsView');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationPaymentConfigsFunctions = require('../StationPaymentConfigsFunctions');
const { createQuickLinkVietQR } = require('../../../ThirdParty/VietQR/VietQRFunction');

const { POPULAR_ERROR, NOT_FOUND, UNKNOWN_ERROR, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const { STATION_PAYMENT_ERRORS } = require('../StationPaymentConfigsConstants');
const { tryJsonParse, tryStringify, isNotValidValue, isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = req.payload;

      const isExistedStation = await StationsResourceAccess.findById(paymentData.stationsId);
      if (!isExistedStation) {
        return STATION_PAYMENT_ERRORS.STATION_NOT_FOUND;
      }

      const isExistedPayment = await StationPaymentConfigsResourceAccess.findById(paymentData.stationsId);
      if (isExistedPayment) {
        return reject(STATION_PAYMENT_ERRORS.DUPLICATE_PAYMENT);
      }

      const result = await StationPaymentConfigsFunctions.addPaymentConfigs(paymentData);
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

      let paymentList = await StationPaymentConfigsView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (paymentList && paymentList.length > 0) {
        _parsePaymentConfigsData(paymentList);
        let paymentCount = await StationPaymentConfigsView.customCount(filter, startDate, endDate, searchText, order);
        if (paymentCount > 0) {
          return resolve({ data: paymentList, total: paymentCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

function _parsePaymentConfigsData(paymentConfigs) {
  paymentConfigs.forEach(payment => {
    payment.bankConfigs = tryJsonParse(payment.bankConfigs);
    payment.momoPersonalConfigs = tryJsonParse(payment.momoPersonalConfigs);
    payment.momoBusinessConfigs = tryJsonParse(payment.momoBusinessConfigs);
    payment.vnpayPersonalConfigs = tryJsonParse(payment.vnpayPersonalConfigs);
    payment.vnpayBusinessConfigs = tryJsonParse(payment.vnpayBusinessConfigs);
    payment.zalopayPersonalConfigs = tryJsonParse(payment.zalopayPersonalConfigs);
    payment.zalopayBusinessConfigs = tryJsonParse(payment.zalopayBusinessConfigs);
  });
}

function _stringifyPaymentConfigsData(paymentConfigs) {
  if (paymentConfigs.bankConfigs) {
    paymentConfigs.bankConfigs = tryStringify(paymentConfigs.bankConfigs);
  }
  if (paymentConfigs.momoPersonalConfigs) {
    paymentConfigs.momoPersonalConfigs = tryStringify(paymentConfigs.momoPersonalConfigs);
  }
  if (paymentConfigs.momoBusinessConfigs) {
    paymentConfigs.momoBusinessConfigs = tryStringify(paymentConfigs.momoBusinessConfigs);
  }
  if (paymentConfigs.vnpayPersonalConfigs) {
    paymentConfigs.vnpayPersonalConfigs = tryStringify(paymentConfigs.vnpayPersonalConfigs);
  }
  if (paymentConfigs.vnpayBusinessConfigs) {
    paymentConfigs.vnpayBusinessConfigs = tryStringify(paymentConfigs.vnpayBusinessConfigs);
  }
  if (paymentConfigs.zalopayPersonalConfigs) {
    paymentConfigs.zalopayPersonalConfigs = tryStringify(paymentConfigs.zalopayPersonalConfigs);
  }
  if (paymentConfigs.zalopayBusinessConfigs) {
    paymentConfigs.zalopayBusinessConfigs = tryStringify(paymentConfigs.zalopayBusinessConfigs);
  }
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      _stringifyPaymentConfigsData(data);

      let updateResult = await StationPaymentConfigsResourceAccess.updateById(id, data);
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

      let stationPayment = await StationPaymentConfigsFunctions.getDetailPaymentConfigs(id);

      if (stationPayment) {
        return resolve(stationPayment);
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

      let result = await StationPaymentConfigsResourceAccess.deleteById(id);
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
      let paymentData = req.payload;
      const userStationsId = req.currentUser.stationsId;
      paymentData.stationsId = userStationsId;

      const result = await StationPaymentConfigsFunctions.addPaymentConfigs(paymentData);

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

async function advanceUserDeleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      const userStationId = req.currentUser.stationsId;

      const targetPayment = await StationPaymentConfigsResourceAccess.findById(id);
      if (!targetPayment || targetPayment.stationsId !== userStationId) {
        return reject(NOT_FOUND);
      }

      let result = await StationPaymentConfigsResourceAccess.deleteById(id);
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

async function advanceUserGetPaymentConfigs(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const userStationId = req.currentUser.stationsId;

      let stationPayment = await StationPaymentConfigsFunctions.getDetailPaymentConfigs(userStationId);

      if (stationPayment) {
        return resolve(stationPayment);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function advanceUserUpdate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.currentUser.stationsId;
      const data = req.payload || {};

      const tagetPayment = await StationPaymentConfigsResourceAccess.findById(id);
      if (!tagetPayment) {
        const insertResult = await StationPaymentConfigsResourceAccess.insert({
          stationsId: id,
        });
        if (!insertResult) {
          return reject('failed');
        }
      }

      if (data.bankConfigs) {
        let bankConfigs = data.bankConfigs[0];
        let qrCodeLink = await createQuickLinkVietQR(bankConfigs);
        data.bankConfigs[0].qrCodeBanking = qrCodeLink;
      }
      _stringifyPaymentConfigsData(data);

      let updateResult = await StationPaymentConfigsResourceAccess.updateById(id, data);
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

//!!!! Can than khong duoc dua thong tin secret ra ngoai public
function parseToPublicPaymentConfig(paymentConfig) {
  return {
    bankConfigs: paymentConfig.bankConfigs,
    momoPersonalConfigs: paymentConfig.momoPersonalConfigs,
    momoBusinessConfigs: isNotEmptyStringValue(paymentConfig.momoBusinessConfigs) ? 1 : 0,
    vnpayPersonalConfigs: paymentConfig.vnpayPersonalConfigs,
    zalopayPersonalConfigs: paymentConfig.zalopayPersonalConfigs,
    vnpayBusinessConfigs: isNotEmptyStringValue(paymentConfig.vnpayBusinessConfigs) ? 1 : 0,
    zalopayBusinessConfigs: isNotEmptyStringValue(paymentConfig.zalopayBusinessConfigs) ? 1 : 0,
  };
}

async function userGetPaymentConfigByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      if (isNotValidValue(filter)) {
        return reject(MISSING_AUTHORITY);
      }

      let paymentList = await StationPaymentConfigsResourceAccess.customSearch(filter);
      if (paymentList && paymentList.length > 0) {
        _parsePaymentConfigsData(paymentList);
        paymentList[0] = parseToPublicPaymentConfig(paymentList[0]);
        return resolve(paymentList[0]);
      }
      return resolve({});
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
  advanceUserInsert,
  advanceUserDeleteById,
  advanceUserGetPaymentConfigs,
  advanceUserUpdate,
  userGetPaymentConfigByStation,
};
