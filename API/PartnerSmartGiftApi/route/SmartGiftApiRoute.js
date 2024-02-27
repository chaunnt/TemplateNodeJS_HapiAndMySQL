/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'SmartGiftApi';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  getSmartGiftAccessToken: {
    tags: ['api', `${moduleName}`],
    description: `userCancelSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifySystemApiKey }],
    handler: function (req, res) {
      Response(req, res, 'getSmartGiftAccessToken');
    },
  },
  sendSmartGiftTestZNSMessage: {
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
        token: Joi.number().min(0),
        message: Joi.string(),
        phoneNumber: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
};
