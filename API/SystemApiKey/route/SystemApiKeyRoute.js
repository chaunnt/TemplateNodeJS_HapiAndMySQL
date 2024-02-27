/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'SystemApiKey';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { SETTING } = require('../SystemApiKeyConstants');

const updateSchema = {
  apiKeyEnable: Joi.number().valid(Object.values(SETTING)).default(SETTING.DISABLE),
};

const insertSchema = {
  apiKeyName: Joi.string(),
  stationsId: Joi.number().allow(null),
  apiKeyEnable: Joi.number().valid(Object.values(SETTING)).default(SETTING.DISABLE),
};

const filterSchema = {
  apiKeyName: Joi.string(),
  stationsId: Joi.number().allow(null),
  apiKey: Joi.string(),
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
        id: Joi.string().trim().min(30).max(40),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
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
        id: Joi.string().trim().min(30).max(40),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
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
        id: Joi.string().trim().min(30).max(40),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
