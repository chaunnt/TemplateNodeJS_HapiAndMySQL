/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'GameRecord';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { GAME_RECORD_UNIT_BO, BET_STATUS, GAME_RECORD_UNIT_CRYPTO_IDX } = require('../../GamePlayRecords/GamePlayRecordsConstant');

const filterSchema = {
  gameRecordStatus: Joi.string().max(255).example(BET_STATUS.COMPLETED),
  gameRecordType: Joi.string().required().max(255),
  gameRecordSection: Joi.string().max(255),
  gameRecordUnit: Joi.string()
    .example(GAME_RECORD_UNIT_BO.BTC)
    .valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX })),
  isPlayGameRecord: Joi.number(),
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
        filter: Joi.object(filterSchema).required(),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(150).min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListGameRecord');
    },
  },
  userGetListResult: {
    tags: ['api', `${moduleName}`],
    description: `getList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          isPlayGameRecord: Joi.number().default(1),
        }).required(),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(150).min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListResult');
    },
  },
  userGetCurrentGameRecord: {
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
      Response(req, res, 'userGetCurrentGameRecord');
    },
  },
  userGetLatestGameRecord: {
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
      Response(req, res, 'userGetLatestGameRecord');
    },
  },
};
