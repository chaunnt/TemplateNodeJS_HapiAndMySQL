/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const moduleName = 'SystemConfigurations';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { STATUS } = require('../SystemConfigurationConstant');

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
          telegramGroupUrl: Joi.string().allow('').max(255),
          fbMessengerUrl: Joi.string().allow('').max(255),
          zaloUrl: Joi.string().allow('').max(255),
          playStoreUrl: Joi.string().allow('').max(255),
          appStoreUrl: Joi.string().allow('').max(255),
          instagramUrl: Joi.string().allow('').max(255),
          facebookUrl: Joi.string().allow('').max(255),
          twitterUrl: Joi.string().allow('').max(255),
          youtubeUrl: Joi.string().allow('').max(255),
          websiteUrl: Joi.string().allow('').max(255),
          hotlineNumber: Joi.string().allow('').max(25),
          address: Joi.string().allow('').max(255),
          systemVersion: Joi.string().allow('').max(255),
          exchangeVNDPrice: Joi.number().min(0),
          packageCurrentStage: Joi.number().min(0),
          packageStageTimeCheck: Joi.string().max(255),
          bannerImage1: Joi.string().allow(''),
          bannerImage2: Joi.string().allow(''),
          bannerImage3: Joi.string().allow(''),
          bannerImage4: Joi.string().allow(''),
          bannerImage5: Joi.string().allow(''),
          linkBannerImage1: Joi.string().allow(''),
          linkBannerImage2: Joi.string().allow(''),
          linkBannerImage3: Joi.string().allow(''),
          linkBannerImage4: Joi.string().allow(''),
          linkBannerImage5: Joi.string().allow(''),
          introAboutUs: Joi.string().allow('').max(2500),
          introPolicy: Joi.string().allow('').max(2500),
          introTermUsage: Joi.string().allow('').max(2500),
          introOverview: Joi.string().allow('').max(2500),
          introQuestionAndAnswer: Joi.string().allow('').max(2500),
          supportChatUrlEN: Joi.string().allow('').max(255),
          supportChatUrlVI: Joi.string().allow('').max(255),
          supportChatUrlCN: Joi.string().allow('').max(255),
          supportChatUrlPL: Joi.string().allow('').max(255),
          enableStakingModule: Joi.number().allow([0, 1]),
          enableBonusModule: Joi.number().allow([0, 1]),
          supportEmail: Joi.string().allow('').max(255),
          totalUserExploitFAC: Joi.number(),
          totalExploitFAC: Joi.number(),
          currentPhaseNumber: Joi.number(),
          stage1LastDate: Joi.string().allow('').max(255),
          stage2LastDate: Joi.string().allow('').max(255),
          stage3LastDate: Joi.string().allow('').max(255),
          stage4LastDate: Joi.string().allow('').max(255),
          stage5LastDate: Joi.string().allow('').max(255),
          totalBetRecordWinAmount: Joi.number(),
          totalWorkingServicePackages: Joi.number(),
          totalSystemUser: Joi.number(),
          totalBetAmount: Joi.number(),
          totalActiveUser: Joi.number(),
          storedFee: Joi.number(),
          ticketPrice: Joi.number(),
          discountPercentage: Joi.number(),
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
  getExchangeRate: {
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
        phaseNumber: Joi.number().valid([1, 2, 3, 4, 5]),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getExchangeRate');
    },
  },
};
