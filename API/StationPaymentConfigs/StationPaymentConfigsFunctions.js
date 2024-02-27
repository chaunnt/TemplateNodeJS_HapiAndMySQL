/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationPaymentConfigsResourceAccess = require('./resourceAccess/StationPaymentConfigsResourceAccess');
const StationPaymentConfigsView = require('./resourceAccess/StationPaymentConfigsView');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const { tryJsonParse, tryStringify } = require('./../ApiUtils/utilFunctions');

const { STATION_PAYMENT_ERRORS } = require('./StationPaymentConfigsConstants');

async function addPaymentConfigs(paymentData) {
  const isExistedStation = await StationsResourceAccess.findById(paymentData.stationsId);
  if (!isExistedStation) {
    throw STATION_PAYMENT_ERRORS.STATION_NOT_FOUND;
  }

  const isExistedPayment = await StationPaymentConfigsResourceAccess.findById(paymentData.stationsId);
  if (isExistedPayment) {
    throw STATION_PAYMENT_ERRORS.DUPLICATE_PAYMENT;
  }

  if (paymentData.bankConfigs) {
    paymentData.bankConfigs = tryStringify(paymentData.bankConfigs);
  }
  if (paymentData.momoPersonalConfigs) {
    paymentData.momoPersonalConfigs = tryStringify(paymentData.momoPersonalConfigs);
  }
  if (paymentData.momoBusinessConfigs) {
    paymentData.momoBusinessConfigs = tryStringify(paymentData.momoBusinessConfigs);
  }
  if (paymentData.vnpayPersonalConfigs) {
    paymentData.vnpayPersonalConfigs = tryStringify(paymentData.vnpayPersonalConfigs);
  }
  if (paymentData.vnpayBusinessConfigs) {
    paymentData.vnpayBusinessConfigs = tryStringify(paymentData.vnpayBusinessConfigs);
  }
  if (paymentData.zalopayPersonalConfigs) {
    paymentData.zalopayPersonalConfigs = tryStringify(paymentData.zalopayPersonalConfigs);
  }
  if (paymentData.zalopayBusinessConfigs) {
    paymentData.zalopayBusinessConfigs = tryStringify(paymentData.zalopayBusinessConfigs);
  }

  const result = await StationPaymentConfigsResourceAccess.insert(paymentData);

  return result;
}

async function getDetailPaymentConfigs(stationsId) {
  const stationPayment = await StationPaymentConfigsView.findById(stationsId);

  if (stationPayment) {
    _parsePaymentData(stationPayment);
    return stationPayment;
  }

  return stationPayment;
}

function _parsePaymentData(payment) {
  payment.bankConfigs = tryJsonParse(payment.bankConfigs);
  payment.momoPersonalConfigs = payment.momoPersonalConfigs && JSON.parse(payment.momoPersonalConfigs);
  payment.momoBusinessConfigs = payment.momoBusinessConfigs && JSON.parse(payment.momoBusinessConfigs);
  payment.vnpayPersonalConfigs = payment.vnpayPersonalConfigs && JSON.parse(payment.vnpayPersonalConfigs);
  payment.vnpayBusinessConfigs = payment.vnpayBusinessConfigs && JSON.parse(payment.vnpayBusinessConfigs);
  payment.zalopayPersonalConfigs = payment.zalopayPersonalConfigs && JSON.parse(payment.zalopayPersonalConfigs);
  payment.zalopayBusinessConfigs = payment.zalopayBusinessConfigs && JSON.parse(payment.zalopayBusinessConfigs);
}

module.exports = {
  addPaymentConfigs,
  getDetailPaymentConfigs,
};
