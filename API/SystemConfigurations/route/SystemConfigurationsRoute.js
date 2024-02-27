/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const moduleName = 'SystemConfigurations';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
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
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  updateConfigs: {
    tags: ['api', `${moduleName}`],
    description: `Update configs`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        data: Joi.object({
          telegramGroupUrl: Joi.string(),
          fbMessengerUrl: Joi.string(),
          zaloUrl: Joi.string(),
          playStoreUrl: Joi.string(),
          appStoreUrl: Joi.string(),
          instagramUrl: Joi.string(),
          facebookUrl: Joi.string(),
          twitterUrl: Joi.string(),
          youtubeUrl: Joi.string(),
          websiteUrl: Joi.string(),
          hotlineNumber: Joi.string(),
          address: Joi.string(),
          systemVersion: Joi.string(),
          exchangeVNDPrice: Joi.number(),
          bannerImage1: Joi.string().allow(''),
          bannerImage2: Joi.string().allow(''),
          bannerImage3: Joi.string().allow(''),
          bannerImage4: Joi.string().allow(''),
          bannerImage5: Joi.string().allow(''),
          bannerImageUrl1: Joi.string().allow(''),
          bannerImageUrl2: Joi.string().allow(''),
          bannerImageUrl3: Joi.string().allow(''),
          bannerImageUrl4: Joi.string().allow(''),
          bannerImageUrl5: Joi.string().allow(''),
          bannerImage1EN: Joi.string().allow(''),
          bannerImage2EN: Joi.string().allow(''),
          bannerImage3EN: Joi.string().allow(''),
          bannerImage1CN: Joi.string().allow(''),
          bannerImage2CN: Joi.string().allow(''),
          bannerImage3CN: Joi.string().allow(''),
          supportChatUrlEN: Joi.string().allow(''),
          supportChatUrlVI: Joi.string().allow(''),
          supportChatUrlCN: Joi.string().allow(''),
          missionBonusAmount: Joi.number().min(0),
          missionBonusHalfAmount: Joi.number().min(0),
          missionReferBonusHalfPercentage: Joi.number().min(0),
          missionReferBonusPercentage: Joi.number().min(0),
          maxLimitedMissionPerDay: Joi.number().min(0),
          maxLimitedPaymentBank: Joi.number().min(1),
          maxLimitedPaymentUSDT: Joi.number().min(1),
          bonusMissionForReferUser: Joi.number().min(0),
          lockMissionAllUser: Joi.number().min(0),
          cancelDepositEnable: Joi.number().min(0).max(1),
          cancelDepositTime: Joi.number().min(5).max(100),
          approveWithdrawEnable: Joi.number().min(0).max(1),
          approveWithdrawAmount: Joi.number().min(0).max(100000000),
          minWithdrawTransaction: Joi.number().min(100000).max(500000000),
          betAmountMax: Joi.number().min(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },

  userGetDetail: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string().allow(''),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetail');
    },
  },
};
