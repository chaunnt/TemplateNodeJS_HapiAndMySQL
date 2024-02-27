/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'SystemConfigurations';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const updateSchema = {
  systemLeftBannerAd: Joi.string().allow('', null),
  systemRightBannerAd: Joi.string().allow('', null),
  pricePerSMS: Joi.number().min(0),
  pricePerEmail: Joi.number().min(0),
  pricePerTenant: Joi.number().min(0),

  bannerUrl1: Joi.string().allow('', null),
  bannerUrl2: Joi.string().allow('', null),
  bannerUrl3: Joi.string().allow('', null),
  bannerUrl4: Joi.string().allow('', null),
  bannerUrl5: Joi.string().allow('', null),

  linkBanner1: Joi.string().allow('', null),
  linkBanner2: Joi.string().allow('', null),
  linkBanner3: Joi.string().allow('', null),
  linkBanner4: Joi.string().allow('', null),
  linkBanner5: Joi.string().allow('', null),
};

module.exports = {
  updateById: {
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
        //only support for 1 system configuration, then no need to specify id
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
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
        id: Joi.number().min(1).max(1).default(1), //only support for 1 system configuration
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },

  getPublicSystemConfigurations: {
    tags: ['api', `${moduleName}`],
    description: `get all ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'getPublicSystemConfigurations');
    },
  },

  getMetaData: {
    tags: ['api', `${moduleName}`],
    description: `get all metadata ${moduleName}`,
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'getMetaData');
    },
  },
};
