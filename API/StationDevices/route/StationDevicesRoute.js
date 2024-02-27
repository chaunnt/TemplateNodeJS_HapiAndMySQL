/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moment = require('moment');
const moduleName = 'StationDevices';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { STATION_DEVICES_STATUS } = require('../StationDevicesConstants');

const insertSchema = {
  stationsId: Joi.number().integer(),
  deviceType: Joi.number().integer(),
  deviceNumber: Joi.number().integer(),
  deviceBrand: Joi.string(),
  purchaseYear: Joi.number().integer(),
  liquidationYear: Joi.number().integer(),
  originalPrice: Joi.number().integer(),
  supplyCompany: Joi.string(),
  purchaseOrigin: Joi.string(),
  deviceArea: Joi.string(),

  deviceName: Joi.string(),
  deviceSeri: Joi.string(),
  deviceManufactureYear: Joi.number().integer(),
  deviceStatus: Joi.string().valid(Object.values(STATION_DEVICES_STATUS)),

  deviceTestedDate: Joi.string().example(moment().format('DD/MM/YYYY')),
  deviceExpiredTestedDate: Joi.string().example(moment().format('DD/MM/YYYY')),
};

const updateSchema = {
  ...insertSchema,
};

const filterSchema = {
  deviceBrand: Joi.string(),
  purchaseYear: Joi.number().integer(),
  liquidationYear: Joi.number().integer(),
  stationsId: Joi.number().integer(),
  deviceStatus: Joi.string().valid(Object.values(STATION_DEVICES_STATUS)),
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
  advanceUserInsertStationDevice: {
    tags: ['api', `${moduleName}`],
    description: `advanceUser insert ${moduleName}`,
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
      Response(req, res, 'advanceUserInsertStationDevice');
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
  advanceUserUpdateStationDeviceById: {
    tags: ['api', `${moduleName}`],
    description: `advanceUser update ${moduleName}`,
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
      Response(req, res, 'advanceUserUpdateStationDeviceById');
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
  advanceUserGetListStationDevices: {
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
      Response(req, res, 'advanceUserGetListStationDevices');
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
  advanceUserGetStationDeviceById: {
    tags: ['api', `${moduleName}`],
    description: ` avanceUser find by id ${moduleName}`,
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
  advanceUserDeleteStationDeviceById: {
    tags: ['api', `${moduleName}`],
    description: `avanceUser delete ${moduleName}`,
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
      Response(req, res, 'advanceUserDeleteStationDeviceById');
    },
  },
};
