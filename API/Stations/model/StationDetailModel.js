/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';

const Joi = require('joi');
const { STATION_TYPE, SETTING_STATUS, BOOKING_MIXTURE_SCHEDULE } = require('../StationsConstants');
const { isNotEmptyStringValue, getValidValueArray } = require('../../ApiUtils/utilFunctions');

const schema = Joi.object({
  createdAt: Joi.date(),
  isDeleted: Joi.number(),
  isHidden: Joi.number(),
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
  stationCheckingAuto: Joi.number(),
  stationCheckingConfig: Joi.array()
    .items({
      stepIndex: Joi.number(),
      stepVoice: Joi.string().allow(''),
      stepLabel: Joi.string(),
      stepDuration: Joi.number(),
      stepVoiceUrl: Joi.string().allow(''),
    })
    .required(),
  stationCode: Joi.string().allow(''),
  stationContractStatus: Joi.number(),
  stationCustomSMSBrandConfig: Joi.string().allow(''),
  stationCustomSMTPConfig: Joi.string().allow(''),
  stationCustomZNSConfig: Joi.string().allow(''),
  stationEnableUseSMS: Joi.number(),
  stationEnableUseZNS: Joi.number(),
  stationLandingPageUrl: Joi.string().allow(''),
  stationMapSource: Joi.string().allow(''),
  stationsAddress: Joi.string().allow(''),
  stationsBanner: Joi.string().allow(''),
  stationsCertification: Joi.string().allow(''),
  stationsColorset: Joi.string(),
  stationsCustomAdBannerLeft: Joi.string().allow(''),
  stationsCustomAdBannerRight: Joi.string().allow(''),
  stationsEmail: Joi.string().allow('').email(),
  stationsEnableAd: Joi.number(),
  stationsHotline: Joi.string().allow(''),
  stationsId: Joi.number(),
  stationsLicense: Joi.string().allow(''),
  stationsLogo: Joi.string().allow(''),
  stationsManager: Joi.string().allow(''),
  stationsManagerPhone: Joi.string().allow(''),
  stationsName: Joi.string().required(),
  stationsNote: Joi.string().allow(''),
  stationStatus: Joi.number(),
  stationsVerifyStatus: Joi.number(),
  stationTotalMachine: Joi.number().default(2),
  stationType: Joi.number().default(STATION_TYPE.EXTERNAL),
  stationUrl: Joi.string().allow(''),
  stationUseCustomSMSBrand: Joi.number(),
  stationUseCustomSMTP: Joi.number(),
  stationUseCustomZNS: Joi.number(),
  stationWebhookUrl: Joi.string().allow(''),
  enableConfigAllowBookingOverLimit: Joi.number().integer(),
  enableConfigBookingOnToday: Joi.number().integer(),
  enableConfigAutoConfirm: Joi.number().integer(),
  updatedAt: Joi.date(),
  totalSmallCar: Joi.number().integer(),
  totalOtherVehicle: Joi.number().integer(),
  totalRoMooc: Joi.number().integer(),
  totalInspectionLine: Joi.number().integer(),
  limitSchedule: Joi.number().integer().allow(null),
  stationLastActiveAt: Joi.string().allow(['', null]),
  stationPayments: Joi.array().items(Joi.number().integer()),
  stationScheduleNote: Joi.string().allow(''),
  enablePaymentGateway: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  enableMarketingMessages: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  stationEnableUseMomo: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  stationEnableUseEmail: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  stationEnableUseVNPAY: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  enableStationMessage: Joi.number().valid(getValidValueArray(SETTING_STATUS)).default(SETTING_STATUS.DISABLE),
  enableConfigMixtureSchedule: Joi.number().valid(getValidValueArray(BOOKING_MIXTURE_SCHEDULE)),

  enableMarketingMessages: Joi.number().integer().allow(null),
  enableOperateMenu: Joi.number().integer().allow(null),
  enableCustomerMenu: Joi.number().integer().allow(null),
  enableScheduleMenu: Joi.number().integer().allow(null),
  enableInvoiceMenu: Joi.number().integer().allow(null),
  enableDocumentMenu: Joi.number().integer().allow(null),
  enableDeviceMenu: Joi.number().integer().allow(null),
  enableManagerMenu: Joi.number().integer().allow(null),
  enableVehicleRegistrationMenu: Joi.number().integer().allow(null),
  enableChatMenu: Joi.number().integer().allow(null),
  enableContactMenu: Joi.number().integer().allow(null),
  enableNewsMenu: Joi.number().integer().allow(null),
});

function fromData(data) {
  delete data.vnpayQRSecret;
  delete data.vnpayQRTMNCode;
  delete data.vnpayQRRedirectURL;
  delete data.vnpayQRBankCode;

  delete data.vnpayQROfflineURL;
  delete data.vnpayQROfflineMerchantCode;
  delete data.vnpayQROfflineMerchantName;
  delete data.vnpayQROfflineMerchantType;
  delete data.vnpayQROfflineTerminalId;
  delete data.vnpayQROfflineAppId;
  delete data.vnpayQROfflineMasterCode;
  delete data.vnpayQROfflineCreateQRSecret;
  delete data.vnpayQROfflineUpdatePaymentSecret;
  delete data.vnpayQROfflineChecktransSecret;
  delete data.vnpayQROfflineRefundSecret;

  let modelData = {
    enableConfigMixtureSchedule: data.enableConfigMixtureSchedule,
    stationBookingConfig: data.stationBookingConfig === '' ? {} : JSON.parse(data.stationBookingConfig),
    stationWorkTimeConfig: isNotEmptyStringValue(data.stationWorkTimeConfig) ? JSON.parse(data.stationWorkTimeConfig) : [],
    stationCheckingAuto: data.stationCheckingAuto,
    stationCheckingConfig: data.stationCheckingConfig === '' ? {} : JSON.parse(data.stationCheckingConfig),
    stationCode: data.stationCode === null ? '' : data.stationCode,
    stationContractStatus: data.stationContractStatus,
    stationCustomSMSBrandConfig: data.stationCustomSMSBrandConfig === null ? '' : data.stationCustomSMSBrandConfig,
    stationCustomSMTPConfig: data.stationCustomSMTPConfig === null ? '' : data.stationCustomSMTPConfig,
    stationCustomZNSConfig: data.stationCustomZNSConfig === null ? '' : data.stationCustomZNSConfig,
    stationEnableUseSMS: data.stationEnableUseSMS,
    stationEnableUseZNS: data.stationEnableUseZNS,
    stationLandingPageUrl: data.stationLandingPageUrl === null ? '' : `https://${data.stationLandingPageUrl}`,
    stationMapSource: data.stationMapSource === null ? '' : data.stationMapSource,
    stationsAddress: data.stationsAddress === null ? '' : data.stationsAddress,
    stationsBanner: data.stationsBanner === null ? '' : data.stationsBanner,
    stationsCertification: data.stationsCertification === null ? '' : data.stationsCertification,
    stationsColorset: data.stationsColorset,
    stationsCustomAdBannerLeft: data.stationsCustomAdBannerLeft === null ? '' : data.stationsCustomAdBannerLeft,
    stationsCustomAdBannerRight: data.stationsCustomAdBannerRight === null ? '' : data.stationsCustomAdBannerRight,
    stationsEmail: data.stationsEmail === null ? '' : data.stationsEmail,
    stationsEnableAd: data.stationsEnableAd,
    stationsHotline: data.stationsHotline === null ? '' : data.stationsHotline,
    stationsId: data.stationsId,
    stationsLicense: data.stationsLicense === null ? '' : data.stationsLicense,
    stationsLogo: data.stationsLogo === null ? '' : data.stationsLogo,
    stationsManager: data.stationsManager === null ? '' : data.stationsManager,
    stationsManagerPhone: data.stationsManagerPhone === null ? '' : data.stationsManagerPhone,
    stationsName: data.stationsName,
    stationsNote: data.stationsNote === null ? '' : data.stationsNote,
    stationStatus: data.stationStatus,
    stationsVerifyStatus: data.stationsVerifyStatus === null ? '' : data.stationsVerifyStatus,
    stationType: data.stationType,
    stationUrl: data.stationUrl === null ? '' : `https://${data.stationUrl}`,
    stationUseCustomSMSBrand: data.stationUseCustomSMSBrand,
    stationUseCustomSMTP: data.stationUseCustomSMTP,
    stationUseCustomZNS: data.stationUseCustomZNS,
    stationWebhookUrl: data.stationWebhookUrl === null ? '' : `https://${data.stationWebhookUrl}/CustomerRecord/robotInsert`,
    totalSmallCar: data.totalSmallCar * 1,
    totalOtherVehicle: data.totalOtherVehicle * 1,
    totalRoMooc: data.totalRoMooc * 1,
    totalInspectionLine: data.totalInspectionLine,
    limitSchedule: data.limitSchedule,
    stationLastActiveAt: data.stationLastActiveAt,
    enableConfigAllowBookingOverLimit: data.enableConfigAllowBookingOverLimit,
    enableConfigBookingOnToday: data.enableConfigBookingOnToday,
    enableConfigAutoConfirm: data.enableConfigAutoConfirm,
    stationPayments: !data.stationPayments ? [] : data.stationPayments.split(','),
    stationScheduleNote: data.stationScheduleNote == null ? '' : data.stationScheduleNote,
    enablePaymentGateway: Number(data.enablePaymentGateway),
    enableMarketingMessages: Number(data.enableMarketingMessages),
    stationEnableUseMomo: Number(data.stationEnableUseMomo),
    stationEnableUseEmail: Number(data.stationEnableUseEmail),
    stationEnableUseVNPAY: Number(data.stationEnableUseVNPAY),
    enableStationMessage: Number(data.enableStationMessage),

    enableMarketingMessages: data.enableMarketingMessages,
    enableOperateMenu: data.enableOperateMenu,
    enableCustomerMenu: data.enableCustomerMenu,
    enableScheduleMenu: data.enableScheduleMenu,
    enableInvoiceMenu: data.enableInvoiceMenu,
    enableDocumentMenu: data.enableDocumentMenu,
    enableDeviceMenu: data.enableDeviceMenu,
    enableManagerMenu: data.enableManagerMenu,
    enableVehicleRegistrationMenu: data.enableVehicleRegistrationMenu,
    enableChatMenu: data.enableChatMenu,
    enableContactMenu: data.enableContactMenu,
    enableNewsMenu: data.enableNewsMenu,
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
