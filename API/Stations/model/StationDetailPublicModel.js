/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
//This model is use to display info of Stations in public.
//BEWARE !! DO NOT SEND INFO THAT RELATED TO SYSTEM INSIDE MODEL
const Joi = require('joi');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');

const schema = Joi.object({
  stationsId: Joi.number(),
  stationsName: Joi.string().required(),
  stationUrl: Joi.string().allow(''),
  stationsLogo: Joi.string().allow(''),
  stationsHotline: Joi.string().allow(''),
  stationsAddress: Joi.string().allow(''),
  stationsEmail: Joi.string().allow(''),
  stationsColorset: Joi.string().allow(''),
  stationBookingConfig: Joi.array().items({
    index: Joi.number(),
    time: Joi.string(),
    limitSmallCar: Joi.number(),
    limitOtherVehicle: Joi.number(),
    limitRoMooc: Joi.number(),
    enableBooking: Joi.number(),
  }),
  stationWorkTimeConfig: Joi.array().items({
    index: Joi.number(),
    time: Joi.string(),
    day: Joi.number(),
  }),
  stationMapSource: Joi.string().allow('').allow(null),
  stationsCertification: Joi.string().allow(''),
  stationsVerifyStatus: Joi.number(),
  stationsManager: Joi.string().allow(''),
  stationsLicense: Joi.string().allow(''),
  stationLandingPageUrl: Joi.string().allow(''),
  stationCode: Joi.string().allow(),
  stationStatus: Joi.number(),
  availableStatus: Joi.number().allow(null),
  totalSmallCar: Joi.number(),
  totalOtherVehicle: Joi.number(),
  totalRoMooc: Joi.number(),
  enablePaymentGateway: Joi.number(),
  stationScheduleNote: Joi.string().allow(''),
  stationArea: Joi.string().allow(''),
  stationPayments: Joi.array().items(Joi.number().integer()),
  stationsBanner: Joi.string().allow(''),
  stationType: Joi.number(),
});

function fromData(data) {
  let modelData = {
    stationsId: data.stationsId,
    stationsName: data.stationsName,
    stationUrl: data.stationUrl,
    stationsLogo: data.stationsLogo === null ? '' : data.stationsLogo,
    stationsBanner: !data.stationsBanner ? '' : data.stationsBanner,
    stationsColorset: data.stationsColorset,
    stationsHotline: data.stationsHotline === null ? '' : data.stationsHotline,
    stationsAddress: data.stationsAddress === null ? '' : data.stationsAddress,
    stationsEmail: data.stationsEmail === null ? '' : data.stationsEmail,
    stationBookingConfig: data.stationBookingConfig === '' ? {} : JSON.parse(data.stationBookingConfig),
    stationWorkTimeConfig: isNotEmptyStringValue(data.stationWorkTimeConfig) ? JSON.parse(data.stationWorkTimeConfig) : [],
    stationMapSource: data.stationMapSource,
    stationsCertification: data.stationsCertification === null ? '' : data.stationsCertification,
    stationsVerifyStatus: data.stationsVerifyStatus === null ? '' : data.stationsVerifyStatus,
    stationsManager: data.stationsManager === null ? '' : data.stationsManager,
    stationsLicense: data.stationsLicense === null ? '' : data.stationsLicense,
    stationLandingPageUrl: data.stationLandingPageUrl === null ? '' : data.stationLandingPageUrl,
    stationCode: data.stationCode === null ? '' : data.stationCode,
    stationStatus: data.stationStatus,
    availableStatus: data.availableStatus,
    totalSmallCar: Number(data.totalSmallCar),
    totalOtherVehicle: Number(data.totalOtherVehicle),
    totalRoMooc: Number(data.totalRoMooc),
    enablePaymentGateway: Number(data.enablePaymentGateway),
    stationScheduleNote: data.stationScheduleNote == null ? '' : data.stationScheduleNote,
    stationArea: data.stationArea,
    stationPayments: !data.stationPayments ? [] : data.stationPayments.split(','),
    stationType: data.stationType,
  };

  let outputModel = schema.validate(modelData);
  if (outputModel.error === undefined || outputModel.error === null || outputModel.error === '') {
    return outputModel.value;
  } else {
    console.error(outputModel.error);
    return undefined;
  }
}

module.exports = {
  fromData,
};
