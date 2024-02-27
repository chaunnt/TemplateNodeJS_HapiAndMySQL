/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationSetting';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const updateSchema = {
  chatLinkEmployeeToUser: Joi.string().allow(['', null]),
  chatLinkUserToEmployee: Joi.string().allow(['', null]),
};

module.exports = {
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
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateById');
    },
  },

  advanceUserFindById: {
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
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserFindById');
    },
  },
};
