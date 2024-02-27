/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const moduleName = 'AppUserVehicle';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const {
  VEHICLE_PLATE_TYPE,
  VEHICLE_TYPE,
  EQUIP_DASH_CAM_STATUS,
  EQUIP_CRUISE_CONTROL_DEVICE_STATUS,
  VEHICLE_SUB_CATEGORY,
  VEHICLE_SUB_TYPE,
} = require('../AppUserVehicleConstant');
const { getValidValueArray } = require('../../ApiUtils/utilFunctions');

const insertSchema = {
  vehicleIdentity: Joi.string().required(),
  vehiclePlateColor: Joi.string().valid(getValidValueArray(VEHICLE_PLATE_TYPE)).required(),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleType: Joi.number().integer().valid(getValidValueArray(VEHICLE_TYPE)),
  vehicleSubType: Joi.number().integer().valid(getValidValueArray(VEHICLE_SUB_TYPE)).required(),
  vehicleSubCategory: Joi.number().integer().valid(getValidValueArray(VEHICLE_SUB_CATEGORY)),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(3, 'months').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
  vehicleWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleGoodsWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleTotalWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleSeatsLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  vehicleFootholdLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  vehicleBerthLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  equipDashCam: Joi.number().valid([EQUIP_DASH_CAM_STATUS.HAVE, EQUIP_DASH_CAM_STATUS.NOT_HAVE, null]),
  equipCruiseControlDevice: Joi.number().valid([EQUIP_CRUISE_CONTROL_DEVICE_STATUS.HAVE, EQUIP_CRUISE_CONTROL_DEVICE_STATUS.NOT_HAVE, null]),
  vehicleCycle: Joi.number().min(1),
};

const updateSchema = {
  vehicleIdentity: Joi.string(),
  vehiclePlateColor: Joi.string().valid(getValidValueArray(VEHICLE_PLATE_TYPE)),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleType: Joi.number().integer().valid(getValidValueArray(VEHICLE_TYPE)),
  vehicleSubType: Joi.number().integer().valid(getValidValueArray(VEHICLE_SUB_TYPE)),
  vehicleSubCategory: Joi.number().integer().valid(getValidValueArray(VEHICLE_SUB_CATEGORY)),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(1, 'year').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
  extendLicenseOriginUrl: Joi.string(),
  extendLicenseUrl: Joi.string(),
  vehicleVerifiedInfo: Joi.number().integer(),
  vehicleWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleGoodsWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleTotalWeight: Joi.number().min(-1).max(1000000).integer().allow([null]),
  vehicleSeatsLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  vehicleFootholdLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  vehicleBerthLimit: Joi.number().min(-1).max(100).integer().allow([null]),
  equipDashCam: Joi.number().valid([EQUIP_DASH_CAM_STATUS.HAVE, EQUIP_DASH_CAM_STATUS.NOT_HAVE, null]),
  equipCruiseControlDevice: Joi.number().valid([EQUIP_CRUISE_CONTROL_DEVICE_STATUS.HAVE, EQUIP_CRUISE_CONTROL_DEVICE_STATUS.NOT_HAVE, null]),
  vehicleCycle: Joi.number().min(1),
  vehicleCategory: Joi.number(),
};

const filterSchema = {
  vehicleType: Joi.number().integer(),
  vehicleSubCategory: Joi.number().integer(),
  appUserId: Joi.number(),
  vehicleExpiryDate: Joi.string(),
  vehicleExpiryDay: Joi.number(),
  vehicleVerifiedInfo: Joi.number().integer(),
};

module.exports = {
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
        id: Joi.number().min(0).required(),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
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
        searchText: Joi.string().allow(''),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
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
  count: {
    tags: ['api', `${moduleName}`],
    description: `count ${moduleName} match filters`,
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
        searchText: Joi.string().allow(''),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'count');
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
  userDeleteVehicle: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'userDeleteVehicle');
    },
  },
  userGetList: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(500),
        startDate: Joi.default(undefined),
        endDate: Joi.default(undefined),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetList');
    },
  },
  userGetDetail: {
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetail');
    },
  },
  userRegisterVehicle: {
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
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'userRegisterVehicle');
    },
  },
  userUpdateVehicle: {
    tags: ['api', `${moduleName}`],
    description: `userUpdateVehicle ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0).required(),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateVehicle');
    },
  },
  userCheckLicensePlate: {
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
        licensePlates: Joi.string(),
        certificateSeries: Joi.string(),
        vehiclePlateColor: Joi.string().valid(['T', 'V', 'X']),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCheckLicensePlate');
    },
  },
  getVehicleInfoByHash: {
    tags: ['api', `${moduleName}`],
    description: `get vehicle info ${moduleName}`,
    validate: {
      payload: Joi.object({
        vehicleHash: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getVehicleInfoByHash');
    },
  },
};
