/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'AppUsers';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const moment = require('moment');

module.exports = {
  userFindReferedUserByUserId: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        appUserMembershipId: Joi.number(),
        startDate: Joi.string(),
        endDate: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userFindReferedUserByUserId');
    },
  },
  findReferedUserByUserId: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        filter: Joi.object({
          appUserMembershipId: Joi.number(),
          appUserId: Joi.number(),
          staffId: Joi.number(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findReferedUserByUserId');
    },
  },
  summaryReferedUserByUserId: {
    tags: ['api', `${moduleName}`],
    description: `summaryReferedUserByUserId ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        startDate: Joi.string(),
        endDate: Joi.string(),
        filter: Joi.object({
          appUserMembershipId: Joi.number(),
          appUserId: Joi.number(),
          staffId: Joi.number(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryReferedUserByUserId');
    },
  },
  userSummaryCurrentRefer: {
    tags: ['api', `${moduleName}`],
    description: `userSummaryCurrentRefer ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userSummaryCurrentRefer');
    },
  },
  userSummaryPlayAmount: {
    tags: ['api', `${moduleName}`],
    description: `userSummaryPlayAmount ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userSummaryPlayAmount');
    },
  },
  userSummaryBonusAmount: {
    tags: ['api', `${moduleName}`],
    description: `Lấy danh sách giao dịch hoa hồng ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        bonusType: Joi.number().default(1).min(1),
        startDate: Joi.string().required(),
        endDate: Joi.string().required(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userSummaryBonusAmount');
    },
  },
  userSummaryTotalUserReferF1: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferF1 ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserReferF1');
    },
  },
  userSummaryTotalUserReferF1InMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferF1InMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserReferF1InMonth');
    },
  },
  userSummaryTotalUserReferF1LastMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferF1LastMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserReferF1LastMonth');
    },
  },
  userSummaryTotalUserRefer: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserRefer ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserRefer');
    },
  },
  userSummaryTotalUserReferInMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferInMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserReferInMonth');
    },
  },
  userSummaryTotalUserReferLastMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferLastMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalUserReferLastMonth');
    },
  },
  userSummaryTotalAgentRefer: {
    tags: ['api', `${moduleName}`],
    description: `getTotalAgentRefer ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalAgentRefer');
    },
  },
  userSummaryTotalAgentReferInMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalUserReferInMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalAgentReferInMonth');
    },
  },
  userSummaryTotalAgentReferLastMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalAgentReferLastMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalAgentReferLastMonth');
    },
  },
  userSummaryTotalReferBonus: {
    tags: ['api', `${moduleName}`],
    description: `getTotalReferBonus ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalReferBonus');
    },
  },
  userSummaryTotalReferBonusInMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalReferBonusInMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalReferBonusInMonth');
    },
  },
  userSummaryTotalReferBonusLastMonth: {
    tags: ['api', `${moduleName}`],
    description: `getTotalReferBonusLastMonth ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userTotalReferBonusLastMonth');
    },
  },
};
