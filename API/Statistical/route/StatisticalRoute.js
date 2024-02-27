/* Copyright (c) 2022-2023 Reminano */

'use strict';
const moduleName = 'Statistical';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const areaFilterSchema = {
  areaCountryId: Joi.number().min(0),
  areaProvinceId: Joi.number().min(0),
  areaDistrictId: Joi.number().min(0),
};

const filterUserDetailReport = {
  appUserId: Joi.number(),
};

module.exports = {
  generalReport: {
    tags: ['api', `${moduleName}`],
    description: `statistical general report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().example(new Date().toISOString()),
        endDate: Joi.string().example(new Date().toISOString()),
        filter: Joi.object({
          staffId: Joi.number(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'generalReport');
    },
  },
  getUserDetailReport: {
    tags: ['api', `${moduleName}`],
    description: `statistical general report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterUserDetailReport),
        startDate: Joi.string().example(new Date().toISOString()),
        endDate: Joi.string().example(new Date().toISOString()),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getUserDetailReport');
    },
  },
  summaryUserPayment: {
    tags: ['api', `${moduleName}`],
    description: `summaryUserPayment ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().required().min(1),
        startDate: Joi.string().default(new Date().toISOString()),
        endDate: Joi.string().default(new Date().toISOString()),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryUserPayment');
    },
  },
  summaryUserReport: {
    tags: ['api', `${moduleName}`],
    description: `statistical general report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryUserReport');
    },
  },
  getPaymentStatisticCount: {
    tags: ['api', `${moduleName}`],
    description: `getPaymentStatisticCount ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'getPaymentStatisticCount');
    },
  },
};
