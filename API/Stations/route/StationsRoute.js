/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'Stations';
const Manager = require(`../manager/${moduleName}Manager`);
const moment = require('moment');
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { VEHICLE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { STATIONS_AREA } = require('../data/StationsArea');
const { PAYMENT_TYPES, SETTING_STATUS, STATION_TYPE } = require('../StationsConstants');
const { getValidValueArray } = require('../../ApiUtils/utilFunctions');
const { SERVICE_TYPES } = require('../../StationServices/StationServicesConstants');

const insertSchema = {
  stationsName: Joi.string().required(),
  stationCode: Joi.string().alphanum().required(),
  stationsLogo: Joi.string().allow(['', null]),
  stationsHotline: Joi.string().allow('').default('099999999'),
  stationsAddress: Joi.string().allow('Cục đăng kiểm Việt Nam'),
  stationsEmail: Joi.string().email().allow(['', null]),
  stationsCertification: Joi.string().allow(['', null]),
  stationsVerifyStatus: Joi.number(),
  stationTotalMachine: Joi.number().min(0),
  stationsManager: Joi.string().allow(['', null]),
  stationsManagerPhone: Joi.string().allow(['', null]),
  stationsLicense: Joi.string().allow(['', null]),
  stationsBanner: Joi.string().allow(['', null]),
  stationsNote: Joi.string().allow(['', null]),
  stationArea: Joi.string().allow(['', null]),
  stationType: Joi.number().valid(Object.values(STATION_TYPE)),
  stationsManagerEmail: Joi.string().email().allow(['', null]),
  stationsResponsiblePersonName: Joi.string().allow(['', null]),
};

const updateSchema = {
  stationsName: Joi.string(),
  stationUrl: Joi.string(),
  stationCheckingAuto: Joi.number(),
  stationsEmail: Joi.string().email().allow(['', null]),
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
    day: Joi.number().valid([0, 1, 2, 3, 4, 5, 6]),
  }),
  stationCheckingConfig: Joi.array().items({
    stepIndex: Joi.number().required(),
    stepVoice: Joi.string().allow(['', null]),
    stepLabel: Joi.string().required(),
    stepDuration: Joi.number().required(),
    stepVoiceUrl: Joi.string().allow(['', null]),
  }),
  isDeleted: Joi.number(),
  stationStatus: Joi.number(),
  stationContractStatus: Joi.number(),
  stationsLogo: Joi.string().allow(['', null]),
  stationsColorset: Joi.string().allow(['', null]),
  stationsHotline: Joi.string().allow(['', null]),
  stationsAddress: Joi.string().allow(['', null]),
  stationEnableUseSMS: Joi.number().allow([1, 0]),
  stationUseCustomSMTP: Joi.number().allow([1, 0]),
  stationCustomSMTPConfig: Joi.string().allow(['', null]),
  stationUseCustomSMSBrand: Joi.number().allow([1, 0]),
  stationCustomSMSBrandConfig: Joi.string().allow(['', null]),
  stationEnableUseZNS: Joi.number().allow([1, 0]),
  stationEnableUseSMS: Joi.number().allow([1, 0]),
  stationUseCustomZNS: Joi.number().allow([1, 0]),
  stationCustomZNSConfig: Joi.string().allow(['', null]),
  stationLandingPageUrl: Joi.string().allow(['', null]),
  stationWebhookUrl: Joi.string().allow(['', null]),
  stationMapSource: Joi.string().allow(['', null]),
  isHidden: Joi.number(),
  stationsCertification: Joi.string().allow(['', null]),
  stationsVerifyStatus: Joi.number(),
  stationTotalMachine: Joi.number().min(0),
  stationsManager: Joi.string().allow(['', null]),
  stationsManagerPhone: Joi.string().allow(['', null]),
  stationsManagerEmail: Joi.string().email().allow(['', null]),
  stationsLicense: Joi.string().allow(['', null]),
  stationsBanner: Joi.string().allow(['', null]),
  stationsNote: Joi.string().allow(['', null]),
  stationScheduleNote: Joi.string().allow(['', null]),
  stationArea: Joi.string(),
  totalSmallCar: Joi.number().integer(),
  totalOtherVehicle: Joi.number().integer(),
  totalRoMooc: Joi.number().integer(),
  availableStatus: Joi.number().integer(),
  totalInspectionLine: Joi.number().integer(),
  limitSchedule: Joi.number().integer(),
  enableConfigAllowBookingOverLimit: Joi.number().integer(),
  enableConfigAutoConfirm: Joi.number().integer(),
  enableConfigBookingOnToday: Joi.number().integer(),
  enableConfigMixtureSchedule: Joi.number().integer(),
  stationPayments: Joi.array().items(Joi.number().valid(getValidValueArray(PAYMENT_TYPES))),
  enablePaymentGateway: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableStationMessage: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  stationType: Joi.number().valid(Object.values(STATION_TYPE)),
  enablePriorityMode: Joi.number().min(0),
  enableReceiveScheduleViaSMS: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
};

const filterSchema = {
  stationsName: Joi.string(),
  stationUrl: Joi.string(),
  isDeleted: Joi.number(),
  stationStatus: Joi.number(),
  stationContractStatus: Joi.number(),
  stationsEmail: Joi.string().email(),
  stationArea: Joi.string(),
  availableStatus: Joi.number().integer(),
  stationType: Joi.number(),
  enablePriorityMode: Joi.array().items(Joi.number().min(0).max(10)),
};

const updateSettingSchema = {
  stationEnableUseMomo: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  stationEnableUseZNS: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  stationEnableUseSMS: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  stationEnableUseEmail: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  stationEnableUseVNPAY: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableStationMessage: Joi.number().valid(getValidValueArray(SETTING_STATUS)),

  enableOnlineRoadTollPayment: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableOnlineInsurancePayment: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableOnlineRegistrationFeePayment: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableUseAPNSMessages: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableMarketingMessages: Joi.number().valid(getValidValueArray(SETTING_STATUS)),

  enableOperateMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableCustomerMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableScheduleMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableInvoiceMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableDocumentMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableDeviceMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableManagerMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableVehicleRegistrationMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableChatMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableContactMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enableNewsMenu: Joi.number().valid(getValidValueArray(SETTING_STATUS)),
  enablePriorityMode: Joi.number().min(0),
};

module.exports = {
  getAreaByIP: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'getAreaByIP');
    },
  },

  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'insert');
    },
  },
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }], //TODO Remove later
    // pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  advanceUserUpdateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          totalSmallCar: Joi.number().integer().min(0), // limit min totalVehicle per day
          totalOtherVehicle: Joi.number().integer().min(0),
          totalRoMooc: Joi.number().integer().min(0),
          stationSetting: Joi.object({
            chatLinkEmployeeToUser: Joi.string().allow(['', null]),
            chatLinkUserToEmployee: Joi.string().allow(['', null]),
          }),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },

  advanceUserUpdateSettingStation: {
    tags: ['api', `${moduleName}`],
    description: `update setting ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSettingSchema,
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateSettingStation');
    },
  },

  find: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(['', null]),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(['', null]),
          value: Joi.string().default('desc').allow(['', null]),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  exportStationExcel: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(['', null]),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(['', null]),
          value: Joi.string().default('desc').allow(['', null]),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportStationExcel');
    },
  },
  userGetListStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetList  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          serviceType: Joi.number().valid(Object.values(SERVICE_TYPES)),
        }),
        searchText: Joi.string().allow(['', null]),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(350),
        order: Joi.object({
          key: Joi.string().default('enablePriorityMode').allow(['', null]),
          value: Joi.string().default('desc').allow(['', null]),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListStation');
    },
  },
  userGetAllExternalStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetList  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(['', null]),
        filter: Joi.object({
          stationArea: Joi.string(),
          availableStatus: Joi.number().integer(),
          enablePriorityMode: Joi.number().integer().min(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetAllExternalStation');
    },
  },
  findById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  advanceUserFindById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  findByUrl: {
    tags: ['api', `${moduleName}`],
    description: `find by url ${moduleName}`,
    validate: {
      payload: Joi.object({
        stationsUrl: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findByUrl');
    },
  },
  findByStationCode: {
    tags: ['api', `${moduleName}`],
    description: `findByStationCode ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      payload: Joi.object({
        stationCode: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findByStationCode');
    },
  },
  resetAllDefaultMp3: {
    tags: ['api', `${moduleName}`],
    description: `resetAllDefaultMp3 ${moduleName}`,
    validate: {},
    handler: function (req, res) {
      Response(req, res, 'resetAllDefaultMp3');
    },
  },

  reportAllInactiveStation: {
    tags: ['api', `${moduleName}`],
    description: `reportAllInactiveStation  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(['', null]),
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportAllInactiveStation');
    },
  },
  reportAllActiveStation: {
    tags: ['api', `${moduleName}`],
    description: `reportAllActiveStation  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(['', null]),
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportAllActiveStation');
    },
  },
  updateConfigSMS: {
    tags: ['api', `${moduleName}`],
    description: `Config SMS`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        smsUrl: Joi.string(),
        smsUserName: Joi.string(),
        smsPassword: Joi.string(),
        smsBrand: Joi.string(),
        smsToken: Joi.string(),
        smsCPCode: Joi.string(), //<<use for SOAP Client
        smsServiceId: Joi.string(), //<<use for SOAP Client
        smsProvider: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigSMS');
    },
  },
  updateConfigZNS: {
    tags: ['api', `${moduleName}`],
    description: `Config ZNS`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        znsUrl: Joi.string(),
        znsUserName: Joi.string(),
        znsPassword: Joi.string(),
        znsBrand: Joi.string(),
        znsToken: Joi.string(),
        znsCPCode: Joi.string(), //<<use for SOAP Client
        znsServiceId: Joi.string(), //<<use for SOAP Client
        znsProvider: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigZNS');
    },
  },
  updateConfigSMTP: {
    tags: ['api', `${moduleName}`],
    description: `Config SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        smtpHost: Joi.string().required(),
        smtpServiceName: Joi.string(),
        smtpPort: Joi.number().required(),
        smtpSecure: Joi.string().required(),
        smtpAuth: Joi.object({
          user: Joi.string().required(),
          pass: Joi.string().required(),
        }).required(),
        smtpTls: Joi.object({
          rejectUnauthorized: Joi.boolean().required(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigSMTP');
    },
  },
  updateCustomSMTP: {
    tags: ['api', `${moduleName}`],
    description: `CusTom SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        CustomSMTP: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateCustomSMTP');
    },
  },
  updateCustomSMSBrand: {
    tags: ['api', `${moduleName}`],
    description: `CusTom SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationUseCustomSMSBrand: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateCustomSMSBrand');
    },
  },
  enableAdsForStation: {
    tags: ['api', `${moduleName}`],
    description: `turn on/off for Ad of station`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsEnableAd: Joi.number().min(0).max(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'enableAdsForStation');
    },
  },
  updateRightAdBanner: {
    tags: ['api', `${moduleName}`],
    description: `update Right Ad Banner`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsCustomAdBannerRight: Joi.string().allow('').required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateRightAdBanner');
    },
  },
  updateLeftAdBanner: {
    tags: ['api', `${moduleName}`],
    description: `update Left Ad Banner`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsCustomAdBannerLeft: Joi.string().allow('').required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateLeftAdBanner');
    },
  },
  userGetListScheduleDate: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleDate ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleDate');
    },
  },

  adminGetListScheduleDate: {
    tags: ['api', `${moduleName}`],
    description: `adminGetListScheduleDate ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleDate');
    },
  },

  advanceUserGetListWorkStep: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetListWorkStep ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetListWorkStep');
    },
  },

  userGetListScheduleTime: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleTime ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        date: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleTime');
    },
  },

  adminGetListScheduleTime: {
    tags: ['api', `${moduleName}`],
    description: `adminGetListScheduleTime ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        date: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleTime');
    },
  },

  getAllStationArea: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'getAllStationArea');
    },
  },
  userGetAllStationArea: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'getAllStationArea');
    },
  },
  userGetDetailStation: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailStation');
    },
  },
  findAvailableSchedule: {
    tags: ['api', `${moduleName}`],
    description: `find available schedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationArea: Joi.string()
            .valid(STATIONS_AREA.map(area => area.value))
            .required(),
          vehicleType: Joi.number().valid(Object.values(VEHICLE_TYPE)).required(),
        }).required(),
        startDate: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'listAllAvailableScheduleDate');
    },
  },
};
