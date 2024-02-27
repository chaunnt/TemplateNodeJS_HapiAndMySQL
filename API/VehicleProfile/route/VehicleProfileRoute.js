/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'VehicleProfile';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const moment = require('moment');
const {
  VEHICLE_PLATE_TYPE,
  VEHICLE_TYPE,
  EQUIP_DASH_CAM_STATUS,
  EQUIP_CRUISE_CONTROL_DEVICE_STATUS,
} = require('../../AppUserVehicle/AppUserVehicleConstant');
const { VEHICLE_FILE_TYPE, VEHICLE_FUEL_TYPE } = require('../VehicleProfileConstants');

const insertSchema = {
  vehiclePlateNumber: Joi.string().required(),
  engineNumber: Joi.string().min(10).max(20),
  chassisNumber: Joi.string().min(10).max(20),
  vehicleType: Joi.number().integer().valid(Object.values(VEHICLE_TYPE)),
  vehiclePlateColor: Joi.string().valid(Object.values(VEHICLE_PLATE_TYPE)).required(),
  vehicleNote: Joi.string().allow(['', null]),
  vehicleForRenovation: Joi.number().valid([0, 1]),
  vehicleForNoStamp: Joi.number().valid([0, 1]),
  vehicleForBusiness: Joi.number().valid([0, 1]),
  truckDimension: Joi.string().allow(['', null]),
  vehicleTires: Joi.string().allow(['', null]),
  vehicleTotalMass: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(3, 'months').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
  vehicleWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleGoodsWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleTotalWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleSeatsLimit: Joi.number().min(0).max(100).integer().allow([null]),
  vehicleFootholdLimit: Joi.number().min(0).max(100).integer().allow([null]),
  vehicleBerthLimit: Joi.number().min(0).max(100).integer().allow([null]),
  equipDashCam: Joi.number().valid([...Object.values(EQUIP_DASH_CAM_STATUS), null]),
  equipCruiseControlDevice: Joi.number().valid([...Object.values(EQUIP_CRUISE_CONTROL_DEVICE_STATUS), null]),
  manufacturedYear: Joi.number().integer(),
  manufacturedCountry: Joi.string().allow(['', null]),
  lifeTimeLimit: Joi.string().allow(['', null]),
  wheelFormula: Joi.string().allow(['', null]),
  wheelTreat: Joi.string().allow(['', null]),
  overallDimension: Joi.string().allow(['', null]),
  wheelBase: Joi.number().min(0),
  vehicleFuelType: Joi.number().valid(Object.values(VEHICLE_FUEL_TYPE)),
  engineDisplacement: Joi.number().min(0),
  maxCapacity: Joi.number().min(0),
  revolutionsPerMinute: Joi.number().min(0),
  fileList: Joi.array().items({
    vehicleFileName: Joi.string(),
    vehicleFileUrl: Joi.string(),
    vehicleFileType: Joi.number().integer().valid(Object.values(VEHICLE_FILE_TYPE)),
  }),
};

const updateSchema = {
  engineNumber: Joi.string(),
  chassisNumber: Joi.string(),
  vehiclePlateColor: Joi.string().valid([Object.values(VEHICLE_PLATE_TYPE)]),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleType: Joi.number().integer().valid(Object.values(VEHICLE_TYPE)),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleNote: Joi.string().allow(['', null]),
  vehicleForBusiness: Joi.number().valid([0, 1]),
  vehicleForRenovation: Joi.number().valid([0, 1]),
  vehicleForNoStamp: Joi.number().valid([0, 1]),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(1, 'year').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
  extendLicenseOriginUrl: Joi.string(),
  extendLicenseUrl: Joi.string(),
  truckDimension: Joi.string(),
  vehicleTires: Joi.string(),
  vehicleTotalMass: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleGoodsWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleTotalWeight: Joi.number().min(0).max(1000000).integer().allow([null]),
  vehicleSeatsLimit: Joi.number().min(0).max(100).integer().allow([null]),
  vehicleFootholdLimit: Joi.number().min(0).max(100).integer().allow([null]),
  vehicleBerthLimit: Joi.number().min(0).max(100).integer().allow([null]),
  equipDashCam: Joi.number().valid([...Object.values(EQUIP_DASH_CAM_STATUS), null]),
  equipCruiseControlDevice: Joi.number().valid([...Object.values(EQUIP_CRUISE_CONTROL_DEVICE_STATUS), null]),
  manufacturedYear: Joi.number().integer(),
  manufacturedCountry: Joi.string(),
  lifeTimeLimit: Joi.string(),
  wheelFormula: Joi.string(),
  wheelTreat: Joi.string(),
  overallDimension: Joi.string(),
  wheelBase: Joi.number().min(0),
  vehicleFuelType: Joi.number().valid([...Object.values(VEHICLE_FUEL_TYPE), null]),
  engineDisplacement: Joi.number().min(0),
  maxCapacity: Joi.number().min(0),
  revolutionsPerMinute: Joi.number().min(0),
  fileList: Joi.array().items({
    vehicleFileId: Joi.number().integer(),
    vehicleFileName: Joi.string(),
    vehicleFileUrl: Joi.string(),
    vehicleFileType: Joi.number().integer().valid(Object.values(VEHICLE_FILE_TYPE)),
  }),
};

const filterSchema = {
  vehicleType: Joi.number().integer(),
  stationsId: Joi.number().integer(),
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
  advanceUserInsert: {
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
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserInsert');
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
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateById');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `find ${moduleName}`,
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
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
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
  advanceUserSearch: {
    tags: ['api', `${moduleName}`],
    description: `search ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSearch');
    },
  },
  advanceUserFind: {
    tags: ['api', `${moduleName}`],
    description: `find ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserFind');
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
  advanceUserDeleteById: {
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
