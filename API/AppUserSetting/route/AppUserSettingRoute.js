/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'AppUserSetting';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const updateSchema = {
  enableAutoCheckAppointment: Joi.number().valid(0, 1),
  enableAutoCheckDUI: Joi.number().valid(0, 1),
  enableAutoCheckRegistry: Joi.number().valid(0, 1),
  enableAutoCheckRoadFee: Joi.number().valid(0, 1),
  enableAutoCheckBHTDS: Joi.number().valid(0, 1),
  enableAutoCheckBHTV: Joi.number().valid(0, 1),
};

module.exports = {
  userUpdateSettingById: {
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
        id: Joi.number().required().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateSettingById');
    },
  },

  findById: {
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
};
