/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const moduleName = 'MessageCustomerMarketingReport';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const Response = require('../../Common/route/response').setup(Manager);

module.exports = {
  advanceUserGetTodayReport: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetTodayReport ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetTodayReport');
    },
  },

  advanceUserGetStationReport: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetStationReport ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().example(DATE_DISPLAY_FORMAT).required(),
        endDate: Joi.string().example(DATE_DISPLAY_FORMAT).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetStationReport');
    },
  },
};
