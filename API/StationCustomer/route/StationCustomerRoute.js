/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationCustomer';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  advanceUserGetListCustomer: {
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
        filter: Joi.object(),
        searchText: Joi.string(),
        skip: Joi.number().default(0),
        limit: Joi.number().default(20),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetListCustomer');
    },
  },
};
