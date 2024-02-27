/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'CustomerSchedule';
const Manager = require(`../manager/${moduleName}Manager`);
const moment = require('moment');
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { MESSAGE_CATEGORY } = require('../../CustomerMessage/CustomerMessageConstant');
const { VEHICLE_TYPE, SCHEDULE_TYPE, SCHEDULE_STATUS, VEHICLE_TYPES, COST_TYPES, FOR_BUSINESS } = require('../CustomerScheduleConstants');
const {
  DATE_DB_FORMAT,
  CHECKING_TIME_07_09,
  CHECKING_TIME_0930_1130,
  CHECKING_TIME_1530_1730,
  CHECKING_TIME_1330_1500,
} = require('../../CustomerRecord/CustomerRecordConstants');

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
};

const updateSchema = {
  licensePlates: Joi.string(),
  phone: Joi.string(),
  fullnameSchedule: Joi.string(),
  email: Joi.string().email().allow([null, '']),
  stationsId: Joi.number(),
  isDeleted: Joi.number(),
  vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
  licensePlateColor: Joi.number(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]),
  scheduleNote: Joi.string(),
  CustomerScheduleStatus: Joi.number().valid([SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CANCELED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.CLOSED]),
};

const filterSchema = {
  dateSchedule: Joi.string(),
  time: Joi.string(),
  stationsId: Joi.number(),
  vehicleType: Joi.number(),
  isDeleted: Joi.number(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]),
  CustomerScheduleStatus: Joi.number(),
  appUserId: Joi.number().integer().min(1),
  scheduleType: Joi.number().integer(),
};

module.exports = {
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
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
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
        customerScheduleId: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          dateSchedule: Joi.string(),
          time: Joi.string(),
          CustomerScheduleStatus: Joi.number().allow([SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.CANCELED]),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateSchedule');
    },
  },

  adminUpdateById: {
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
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          dateSchedule: Joi.string(),
          time: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUpdateById');
    },
  },

  find: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(DATE_DB_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(DATE_DB_FORMAT)),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  getList: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(DATE_DB_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(DATE_DB_FORMAT)),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  advanceUserGetListSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().trim(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(DATE_DB_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(DATE_DB_FORMAT)),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetList');
    },
  },
  advanceUserSearchSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().trim(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSearchSchedule');
    },
  },
  userGetListSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object({
          CustomerScheduleStatus: Joi.number().integer(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        // order: Joi.object({
        //   key: Joi.string().default('createdAt').allow(''),
        //   value: Joi.string().default('desc').allow(''),
        // }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListSchedule');
    },
  },
  userGetDetailSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailSchedule');
    },
  },
  advanceUserGetDetailSchedule: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetListSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetDetailSchedule');
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  advanceUserInsertSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        stationsId: Joi.number().integer(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserInsertSchedule');
    },
  },
  userCreateConsultant: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        consultantRequest: Joi.string().required(),
        scheduleType: Joi.string()
          .allow([SCHEDULE_TYPE.CONSULTANT_MAINTENANCE, SCHEDULE_TYPE.CONSULTANT_INSURANCE, SCHEDULE_TYPE.CONSULTANT_RENOVATION])
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateConsultant');
    },
  },
  userCreateSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        scheduleNote: Joi.string(),
        stationServicesList: Joi.array().items(Joi.number().min(0)),
        certificateSeries: Joi.string().allow(['', null]),
        attachmentList: Joi.array().items({
          attachmentName: Joi.string(),
          attachmentUrl: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateSchedule');
    },
  },
  userCreateRoadFeeSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert road fee ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        appUserVehicleId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateRoadFeeSchedule');
    },
  },
  userCreateInspectionFeeSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert Inspection Fee ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        appUserVehicleId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateInspectionFeeSchedule');
    },
  },
  userCreateInsuranceFeeSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert Inspection Fee ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        appUserVehicleId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateInsuranceFeeSchedule');
    },
  },
  userCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userCancelSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0).required(),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCancelSchedule');
    },
  },
  reportTotalByDay: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationsId: Joi.number(),
          stationArea: Joi.string(),
        }),
        startDate: Joi.string().default(moment().subtract(10, 'days').format('DD/MM/YYYY')),
        endDate: Joi.string().default(moment().format('DD/MM/YYYY')),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalByDay');
    },
  },
  reportTotalScheduleByStation: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')),
        endDate: Joi.string().example(moment().add(10, 'days').format('DD/MM/YYYY')),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalScheduleByStation');
    },
  },
  reportTotalScheduleByStationArea: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().example(moment().format(DATE_DB_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(DATE_DB_FORMAT)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalScheduleByStationArea');
    },
  },
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
  advanceUserCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserCancelSchedule');
    },
  },
  exportExcelCustomerSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Export excel ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportExcelCustomerSchedule');
    },
  },
  advanceUserExportSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Export excel ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportExcelCustomerSchedule');
    },
  },
  getScheduleByHash: {
    tags: ['api', `${moduleName}`],
    description: `get schedule detail ${moduleName}`,
    validate: {
      payload: Joi.object({
        scheduleHash: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getScheduleByHash');
    },
  },
  staffCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `staffCancelSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0).required(),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'staffCancelSchedule');
    },
  },
  calculateInsurance: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        costType: Joi.number().valid([COST_TYPES.GROSS_COST, COST_TYPES.NET_COST]).default(COST_TYPES.NET_COST),
        vehicleId: Joi.number().integer().min(0).required(),
        // isForBusiness: Joi.number().valid([FOR_BUSINESS.HAVE, FOR_BUSINESS.NOT_HAVE]).default(FOR_BUSINESS.NOT_HAVE),
        // vehicleType: Joi.number().valid([VEHICLE_TYPES.CAR, VEHICLE_TYPES.TRUCK, VEHICLE_TYPES.MIX]).required(),
        // seatsCount: Joi.number().integer().min(1).max(100),
        // tonnage: Joi.number().min(0)
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'calculateInsurance');
    },
  },

  reportCustomerSchedule: {
    tags: ['api', `${moduleName}`],
    description: `report customer schedule ${moduleName}`,
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
      Response(req, res, 'reportCustomerSchedule');
    },
  },
};
