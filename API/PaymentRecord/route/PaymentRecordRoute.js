/**
 * Created by A on 7/18/17.
 */
"use strict";
const moduleName = 'PaymentRecord';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require("joi");
const Response = require("../../Common/route/response").setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const insertSchema = {
  paymentUserId: Joi.number().required().min(0),
  paymentTargetId: Joi.number().required().min(0),
  paymentTitle: Joi.string(),
  paymentDetail: Joi.string(),
  paymentTargetType: Joi.string(),
  paymentTargetTypeName: Joi.string(),
  walletId: Joi.number(),
  paymentAmount: Joi.number(),
  walletBalanceBefore: Joi.number(),
  walletBalanceAfter: Joi.number(),
  paymentNote: Joi.string(),
  paymentRefNote: Joi.string()
}

const filterSchema = {
  paymentUserId: Joi.number(),
  paymentTargetId: Joi.number(),
  walletId: Joi.number(),
  paymentTargetType: Joi.string()
};

module.exports = {
  find: {
    tags: ["api", `${moduleName}`],
    description: `update ${moduleName}`,
    validate: {
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string()
            .default("createdAt")
            .allow(""),
          value: Joi.string()
            .default("desc")
            .allow("")
        })
      })
    },
    handler: function (req, res) {
      Response(req, res, "find");
    }
  },
  findById: {
    tags: ["api", `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0)
      })
    },
    handler: function (req, res) {
      Response(req, res, "findById");
    }
  },
};
