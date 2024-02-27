/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'AppUserExperts';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { COPY_TRADE_STATUS } = require('../AppUserExpertConstants');

module.exports = {
  userGetFollowingExperts: {
    tags: ['api', `${moduleName}`],
    description: `Danh sách expert của tôi ${moduleName} | copyStatus: 1-đang copy | 0: tạm dừng copy | 2: unfollow`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          copyTradeStatus: Joi.array()
            .items(Joi.number().valid([COPY_TRADE_STATUS.PENDING, COPY_TRADE_STATUS.RUNNING, COPY_TRADE_STATUS.UNFOLLOW]))
            .example([COPY_TRADE_STATUS.PENDING, COPY_TRADE_STATUS.RUNNING]),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetFollowingExperts');
    },
  },
  followExpert: {
    tags: ['api', `${moduleName}`],
    description: `Copy trade chuyên gia ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        expertId: Joi.number().required(),
        investingAmount: Joi.number().required().default(5000),
        maximumInvestmentAmount: Joi.number().required().default(0),
        minimumInvestmentAmount: Joi.number().required().default(0),
        stopLossRate: Joi.number().required().default(0),
        profitRate: Joi.number().required().default(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'followExpert');
    },
  },
  userUpdateFollowInfo: {
    tags: ['api', `${moduleName}`],
    description: `cập nhật thông tin Copy trade chuyên gia ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required(),
        data: Joi.object({
          investingAmount: Joi.number().required().default(5000),
          maximumInvestmentAmount: Joi.number().required().default(0),
          minimumInvestmentAmount: Joi.number().required().default(0),
          stopLossRate: Joi.number().required().default(0),
          profitRate: Joi.number().required().default(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateFollowInfo');
    },
  },
  stopCopyTrade: {
    tags: ['api', `${moduleName}`],
    description: `Tạm dừng copy trade ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserFollowerId: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'stopCopyTrade');
    },
  },
  unfollowExpert: {
    tags: ['api', `${moduleName}`],
    description: `Bỏ theo dõi - dừng hẳn copy trade ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserFollowerId: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'unfollowExpert');
    },
  },
};
