/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'AppUserWorkingHistory';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const moment = require('moment');
const CommonFunctions = require('../../Common/CommonFunctions');
const { REPORT_DATE_DATA_FORMAT } = require('../../StationReport/StationReportConstants');

module.exports = {
  advanceCreateAppUserWorkingHistory: {
    tags: ['api', `${moduleName}`],
    description: `create ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceCreateAppUserWorkingHistory');
    },
  },

  advanceUserGetListWorkingHistory: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      payload: Joi.object({
        filter: Joi.object(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20),
        startDate: Joi.number().example(moment().format(REPORT_DATE_DATA_FORMAT) * 1),
        endDate: Joi.number().example(moment().format(REPORT_DATE_DATA_FORMAT) * 1),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetListWorkingHistory');
    },
  },

  advanceUserGetDetailWorkingHistory: {
    tags: ['api', `${moduleName}`],
    description: `get detail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      payload: Joi.object({
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetDetailWorkingHistory');
    },
  },

  advanceUserApprovedWorkingHistory: {
    tags: ['api', `${moduleName}`],
    description: `Approved ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      payload: Joi.object({
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserApprovedWorkingHistory');
    },
  },

  advanceUserCancelWorkingHistory: {
    tags: ['api', `${moduleName}`],
    description: `Cancel ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      payload: Joi.object({
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserCancelWorkingHistory');
    },
  },
};
