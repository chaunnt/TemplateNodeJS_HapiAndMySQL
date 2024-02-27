/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'PaymentBonusTransaction';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const Maintain = require('../../Common/route/response').maintain();
const CommonFunctions = require('../../Common/CommonFunctions');
const MaintainFunctions = require('../../Maintain/MaintainFunctions');
const { BONUS_TRX_STATUS, BONUS_TRX_CATEGORY } = require('../PaymentBonusTransactionConstant');
const { MAINTAIN_ERROR } = require('../../Common/CommonConstant');

module.exports = {
  userGetBonusHistory: {
    tags: ['api', `${moduleName}`],
    description: `user get list ${moduleName}`,
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
          paymentStatus: Joi.string().allow([BONUS_TRX_STATUS.NEW, BONUS_TRX_STATUS.COMPLETED, BONUS_TRX_STATUS.CANCELED]),
          paymentMethodId: Joi.number().min(0),
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
      Response(req, res, 'userGetBonusHistory');
    },
  },
  userGetMissionBonusHistory: {
    tags: ['api', `${moduleName}`],
    description: `userGetMissionBonusHistory ${moduleName}`,
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
          paymentStatus: Joi.string().allow(Object.values(BONUS_TRX_STATUS)),
          paymentMethodId: Joi.number().min(0),
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
      Response(req, res, 'userGetMissionBonusHistory');
    },
  },
  userSummaryBonusByStatus: {
    tags: ['api', `${moduleName}`],
    description: `user get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string(),
        endDate: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userSummaryBonusByStatus');
    },
  },
  userRequestWithdraw: {
    tags: ['api', `${moduleName}`],
    description: `userRequestWithdraw ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(0.00001).default(1000000),
        paymentMethodId: Joi.number(),
        paymentCategory: Joi.number().required().default(BONUS_TRX_CATEGORY.WITHDRAW_TO_WALLET),
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().withdraw === false || MaintainFunctions.getSystemStatus().withdraw === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_WITHDRAW_BONUS, res);
        return;
      }
      Response(req, res, 'userRequestWithdraw');
    },
  },
};
