/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'GameInfo';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const filterSchema = {
  gameInfoCategory: Joi.string().max(255),
};

module.exports = {
  getList: {
    tags: ['api', `${moduleName}`],
    description: `getList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        // startDate: Joi.string().max(255),
        // endDate: Joi.string().max(255),
        // skip: Joi.number().default(0).min(0),
        // limit: Joi.number().default(20).max(100),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListGameInfo');
    },
  },
  userGetCurrentGameInfo: {
    tags: ['api', `${moduleName}`],
    description: `getList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gameRecordType: Joi.string().required().max(255),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetCurrentGameInfo');
    },
  },
  userGetLatestGameInfo: {
    tags: ['api', `${moduleName}`],
    description: `getList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gameRecordType: Joi.string().required().max(255),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetLatestGameInfo');
    },
  },
};
