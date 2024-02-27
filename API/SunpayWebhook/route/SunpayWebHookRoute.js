/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'SunpayWebhook';
// const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
// const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const {
  webhookReceivePayment,
  webhookReceivePayoutPayment,
  webhookReceivePaymentUSDT,
  webhookReceivePaymentElecWallet,
} = require('../../SunpayWebhook/manager/SunpayWebHookManager');

module.exports = {
  webhookReceivePayment: {
    tags: ['api', `${moduleName}`],
    description: `webhookReceivePayment ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object().unknown(),
    },
    handler: async function (req, res) {
      let outputData = await webhookReceivePayment(req);
      console.log(`outputData`);
      console.log(outputData);
      res(outputData).code(200);
    },
  },
  webhookReceivePayoutPayment: {
    tags: ['api', `${moduleName}`],
    description: `webhookReceivePayoutPayment ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object().unknown(),
    },
    handler: async function (req, res) {
      let outputData = await webhookReceivePayoutPayment(req);
      console.log(`outputData`);
      console.log(outputData);
      res(outputData).code(200);
    },
  },
  webhookReceivePaymentUSDT: {
    tags: ['api', `${moduleName}`],
    description: `webhookReceivePaymentUSDT ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object().unknown(),
    },
    handler: async function (req, res) {
      let outputData = await webhookReceivePaymentUSDT(req);
      console.log(`outputData`);
      console.log(outputData);
      res(outputData).code(200);
    },
  },
  webhookReceivePaymentElecWallet: {
    tags: ['api', `${moduleName}`],
    description: `webhookReceivePaymentElecWallet ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object().unknown(),
    },
    handler: async function (req, res) {
      let outputData = await webhookReceivePaymentElecWallet(req);
      console.log(`outputData`);
      console.log(outputData);
      res(outputData).code(200);
    },
  },
};
