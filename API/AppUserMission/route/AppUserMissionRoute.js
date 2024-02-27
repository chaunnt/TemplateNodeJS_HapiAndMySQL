/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const moduleName = 'AppUserMission';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { BET_TYPE, GAME_RECORD_UNIT_BO, GAME_RECORD_UNIT_CRYPTO_IDX } = require('../../GamePlayRecords/GamePlayRecordsConstant');

const insertSchema = {
  appUserMembershipTitle: Joi.string().required(),
  appUserMembershipDescription: Joi.string().allow([null, '']),
  appUserMembershipImage: Joi.string().allow([null, '']),
  appUserMembershipInvitationRequired: Joi.number().min(0),
  appUserMembershipAssetRequired: Joi.number().min(0),
  appUserMembershipAssetF1Required: Joi.number().min(0),
  appUserMembershipBonusPrize: Joi.number().min(0),
  appUserMembershipPlayBonus: Joi.number().min(0),
  appUserMembershipBonusRate: Joi.number().min(0),
  appUserMembershipBonusRateF1: Joi.number().min(0),
  appUserMembershipBonusRateF2: Joi.number().min(0),
  appUserMembershipBonusRateF3: Joi.number().min(0),
  appUserMembershipBonusRateF4: Joi.number().min(0),
  appUserMembershipBonusRateF5: Joi.number().min(0),
  appUserMembershipBonusRateF6: Joi.number().min(0),
  appUserMembershipBonusRateF7: Joi.number().min(0),
  appUserMembershipBonusRateF8: Joi.number().min(0),
  appUserMembershipBonusRateF9: Joi.number().min(0),
  appUserMembershipBonusRateF10: Joi.number().min(0),
};

const updateSchema = {
  appUserMembershipTitle: Joi.string(),
  appUserMembershipDescription: Joi.string(),
  appUserMembershipImage: Joi.string(),
  appUserMembershipAssetRequired: Joi.number().min(0),
  appUserMembershipAssetF1Required: Joi.number().min(0),
  appUserMembershipInvitationRequired: Joi.number().min(0),
  appUserMembershipBonusRate: Joi.number().min(0),
  appUserMembershipPlayBonus: Joi.number().min(0),
  appUserMembershipBonusPrize: Joi.number().min(0),
  appUserMembershipBonusRateF1: Joi.number().min(0),
  appUserMembershipBonusRateF2: Joi.number().min(0),
  appUserMembershipBonusRateF3: Joi.number().min(0),
  appUserMembershipBonusRateF4: Joi.number().min(0),
  appUserMembershipBonusRateF5: Joi.number().min(0),
  appUserMembershipBonusRateF6: Joi.number().min(0),
  appUserMembershipBonusRateF7: Joi.number().min(0),
  appUserMembershipBonusRateF8: Joi.number().min(0),
  appUserMembershipBonusRateF9: Joi.number().min(0),
  appUserMembershipBonusRateF10: Joi.number().min(0),
};

const filterSchema = {
  missionStatus: Joi.number(),
};

module.exports = {
  userPlayMission: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        betRecordAmountIn: Joi.number().min(5).max(100000000).default(1000).required(),
        betRecordType: Joi.string().example(BET_TYPE.BINARYOPTION_UPDOWN).required().valid(Object.values(BET_TYPE)),
        betRecordUnit: Joi.string()
          .valid(Object.values({ ...GAME_RECORD_UNIT_BO, ...GAME_RECORD_UNIT_CRYPTO_IDX }))
          .required(),
        betRecordValue: Joi.string().required().max(255),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userPlayMission');
    },
  },
  userGetMissionHistory: {
    tags: ['api', `${moduleName}`],
    description: `Get List ${moduleName}`,
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetMissionHistory');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `find ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          appUserId: Joi.number(),
          memberReferIdF1: Joi.number(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  lockUserMissionPlay: {
    tags: ['api', `${moduleName}`],
    description: `lock ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0).required(),
        enableMissionPlay: Joi.number().min(0).max(1).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'lockUserMissionPlay');
    },
  },

  lockUserMissionBonus: {
    tags: ['api', `${moduleName}`],
    description: `lock ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0).required(),
        enableAddMissionBonus: Joi.number().min(0).max(1).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'lockUserMissionBonus');
    },
  },
  resetMissionByUserId: {
    tags: ['api', `${moduleName}`],
    description: `lock ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
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
      Response(req, res, 'resetMissionByUserId');
    },
  },
};
