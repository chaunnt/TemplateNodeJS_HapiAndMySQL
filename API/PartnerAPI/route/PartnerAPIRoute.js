/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'PartnerAPI';
const CustomerScheduleManager = require(`../../CustomerSchedule/manager/CustomerScheduleManager`);
const StationsManager = require(`../../Stations/manager/StationsManager`);
const SystemConfigurationsManager = require(`../../SystemConfigurations/manager/SystemConfigurationsManager`);
const moment = require('moment');
const Joi = require('joi');
const StationResponse = require('../../Common/route/response').setup(StationsManager);
const SystemConfigurationsResponse = require('../../Common/route/response').setup(SystemConfigurationsManager);
const CustomerScheduleResponse = require('../../Common/route/response').setup(CustomerScheduleManager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { MESSAGE_CATEGORY } = require('../../CustomerMessage/CustomerMessageConstant');
const { VEHICLE_TYPE, SCHEDULE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { SETTING_STATUS } = require('../../Stations/StationsConstants');
const { VEHICLE_SUB_TYPE, VEHICLE_SUB_CATEGORY } = require('../../AppUserVehicle/AppUserVehicleConstant');

const insertSchema = {
  licensePlates: Joi.string().required(),
  phone: Joi.string().required(),
  fullnameSchedule: Joi.string().default('-'),
  email: Joi.string().email().allow([null, '']),
  dateSchedule: Joi.string().required(),
  time: Joi.string().required(),
  stationsId: Joi.number().required(),
  vehicleType: Joi.number().default(VEHICLE_TYPE.CAR).required(),
  licensePlateColor: Joi.number().required(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]).default(null).allow(null),
  scheduleType: Joi.number().valid(Object.values(SCHEDULE_TYPE)),
  vehicleSubType: Joi.number().valid(Object.values(VEHICLE_SUB_TYPE)),
  vehicleSubCategory: Joi.number().valid(Object.values(VEHICLE_SUB_CATEGORY)),
  certificateSeries: Joi.string().allow(['', null]).default(null),
};

module.exports = {
  //Lich hen
  userGetListSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          CustomerScheduleStatus: Joi.number().integer(),
          phone: Joi.string().trim().required(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
      }),
    },
    handler: function (req, res) {
      CustomerScheduleResponse(req, res, 'userPartnerGetListSchedule');
    },
  },
  userGetDetailSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      CustomerScheduleResponse(req, res, 'userPartnerGetDetailSchedule');
    },
  },
  userCreateSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        ...insertSchema,
        scheduleNote: Joi.string(),
        stationServicesList: Joi.array().items(Joi.number().min(0)),
        attachmentList: Joi.array().items({
          attachmentName: Joi.string(),
          attachmentUrl: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      CustomerScheduleResponse(req, res, 'partnerCreateSchedule');
    },
  },
  userCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userCancelSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0).required(),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      CustomerScheduleResponse(req, res, 'userPartnerMomoCancelSchedule');
    },
  },

  //Trung tam
  userGetAllExternalStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetList  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
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
      StationResponse(req, res, 'userGetAllExternalStation');
    },
  },
  userGetListScheduleDate: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleDate ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      StationResponse(req, res, 'userGetListScheduleDate');
    },
  },
  userGetListScheduleTime: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleTime ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        date: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      StationResponse(req, res, 'userGetListScheduleTime');
    },
  },
  userGetAllStationArea: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
    },
    handler: function (req, res) {
      StationResponse(req, res, 'getAllStationArea');
    },
  },
  userGetDetailStation: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      StationResponse(req, res, 'userGetDetailStation');
    },
  },

  partnerGetMetaData: {
    tags: ['api', `${moduleName}`],
    description: `get all metadata`,
    pre: [{ method: CommonFunctions.verifyPartnerApiKey }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(),
    },
    handler: function (req, res) {
      SystemConfigurationsResponse(req, res, 'getMetaData');
    },
  },
};
