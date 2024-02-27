/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationMessageReport';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  advanceUserGetReportList: {
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
        month: Joi.number().min(1).max(12).required(),
        year: Joi.number().required(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(50).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
        stationId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetReportList');
    },
  },
  getReportList: {
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
      payload: Joi.object({
        month: Joi.number().min(1).max(12).required(),
        year: Joi.number().required(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(50).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getReportList');
    },
  },
};
