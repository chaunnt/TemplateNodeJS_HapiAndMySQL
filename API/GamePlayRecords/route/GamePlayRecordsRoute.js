/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'GamePlayRecords';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { BET_TYPE, GAME_RECORD_UNIT_BO, GAME_RECORD_UNIT_CRYPTO_IDX, BET_RESULT } = require('../GamePlayRecordsConstant');

const insertSchema = {
  betRecordAmountIn: Joi.number().min(-100000000).max(100000000).default(1000).required(),
  betRecordType: Joi.string().example(BET_TYPE.BINARYOPTION_UPDOWN).required().valid(Object.values(BET_TYPE)),
  betRecordUnit: Joi.string()
    .valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX }))
    .required(),
  betRecordValue: Joi.string().required().max(255),
};

const filterSchema = {
  betRecordType: Joi.string().valid(Object.values(BET_TYPE)),
  betRecordUnit: Joi.string().valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX })),
  gameInfoId: Joi.number().min(0),
  appUserId: Joi.number().min(0),
  betRecordResult: Joi.string().valid(Object.values(BET_RESULT)),
};

module.exports = {
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
        filter: Joi.object(filterSchema).required(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255),
          value: Joi.string().max(255),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  getMissionPlayHistory: {
    tags: ['api', `${moduleName}`],
    description: `getMissionPlayHistory ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema).required(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getMissionPlayHistory');
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  userPlaceBetRecord: {
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
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'userPlaceBetRecord');
    },
  },
  userPlaceBetRecordTemp: {
    tags: ['api', `${moduleName}`],
    description: `userPlaceBetRecordTemp ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'userPlaceBetRecordTemp');
    },
  },
  userPlaceMissionRecordTemp: {
    tags: ['api', `${moduleName}`],
    description: `userPlaceMissionRecordTemp ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'userPlaceMissionRecordTemp');
    },
  },
  userCancelAllMissionRecordTemp: {
    tags: ['api', `${moduleName}`],
    description: `userCancelAllMissionRecordTemp ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().example(BET_TYPE.BINARYOPTION_UPDOWN).required().valid(Object.values(BET_TYPE)),
        betRecordUnit: Joi.string()
          .valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX }))
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCancelAllMissionRecordTemp');
    },
  },
  userCancelAllRecordTemp: {
    tags: ['api', `${moduleName}`],
    description: `userCancelAllRecordTemp ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().example(BET_TYPE.BINARYOPTION_UPDOWN).required().valid(Object.values(BET_TYPE)),
        betRecordUnit: Joi.string()
          .valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX }))
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCancelAllRecordTemp');
    },
  },

  userGetListPlayRecord: {
    tags: ['api', `${moduleName}`],
    description: `userGetListPlayRecord ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListPlayRecord');
    },
  },
  sumTotalSystemBetByDate: {
    tags: ['api', `${moduleName}`],
    description: `get statistical ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sumTotalSystemBetByDate');
    },
  },
  userGetTotalBetAmountInByGameId: {
    tags: ['api', `${moduleName}`],
    description: `userGetTotalBetAmountInByGameId ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gameInfoId: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetTotalBetAmountInByGameId');
    },
  },
  userGetTotalBetAmountInByBetType: {
    tags: ['api', `${moduleName}`],
    description: `userGetTotalBetAmountInByBetType ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetTotalBetAmountInByBetType');
    },
  },
  userGetUserPlayMissionAmountByBetType: {
    tags: ['api', `${moduleName}`],
    description: `userGetUserPlayMissionAmountByBetType ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetUserPlayMissionAmountByBetType');
    },
  },
  userGetUserPlayAmountByBetType: {
    tags: ['api', `${moduleName}`],
    description: `userGetUserPlayAmountByBetType ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetUserPlayAmountByBetType');
    },
  },

  getTotalPlayOfAllRealUserByBetType: {
    tags: ['api', `${moduleName}`],
    description: `getTotalPlayOfAllRealUserByBetType ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordType: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getTotalPlayOfAllRealUserByBetType');
    },
  },
  userGetTotalAmountInByRoom: {
    tags: ['api', `${moduleName}`],
    description: `userGetTotalAmountInByRoom ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gamePlayRoomId: Joi.number().required(),
        gameRoomType: Joi.number().required(),
        group: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetTotalAmountInByRoom');
    },
  },
  userGetTotalAmountWinByRoom: {
    tags: ['api', `${moduleName}`],
    description: `userGetTotalAmountWinByRoom ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gamePlayRoomId: Joi.number().required(),
        gameRoomType: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetTotalAmountWinByRoom');
    },
  },
};
