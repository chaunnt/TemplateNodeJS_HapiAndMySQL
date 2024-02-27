/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'Order';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { ORDER_STATUS } = require('../OrderConstant');

const insertSchema = {
  accreditationFee: Joi.number().min(0).required(),
  certificateFee: Joi.number().min(0).required(),
  vatFee: Joi.number().min(0).required(),
  otherFee: Joi.number().min(0).required(),
  orderStatus: Joi.string().allow(...Object.values(ORDER_STATUS)),
  orderApproveDate: Joi.string().isoDate(),
  note: Joi.string().max(255),
};

const updateSchema = {
  orderStatus: Joi.string().allow(...Object.values(ORDER_STATUS)),
  note: Joi.string().max(255),
};

const filterSchema = {
  orderStatus: Joi.string().allow(...Object.values(ORDER_STATUS)),
};

const roadFeeSchema = {
  totalPerson: Joi.number().min(-1).max(100),
  vehicleTotalWeight: Joi.number().min(-1).max(1000000),
  vehicleCategory: Joi.number().integer().min(-1).max(20),
};
module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
  find: {
    tags: ['api', `${moduleName}`],
    description: `find ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().isoDate(),
        endDate: Joi.string().isoDate(),
        searchText: Joi.string(),
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
  findById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
  userGetOrderByRef: {
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
        orderRef: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getOrderByRef');
    },
  },
  userGetInspectionFee: {
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
        appUserVehicleId: Joi.number().min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getInspectionFee');
    },
  },
  userGetRoadFee: {
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
        appUserVehicleId: Joi.number().min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getRoadFee');
    },
  },
  userGetInsuranceFee: {
    tags: ['api', `${moduleName}`],
    description: `get insurance fee ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserVehicleId: Joi.number().min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getInsuranceFee');
    },
  },
};
