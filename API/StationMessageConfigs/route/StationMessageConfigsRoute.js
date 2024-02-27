/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationMessageConfigs';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const moment = require('moment');
const { SETTING_STATUS } = require('../StationMessageConfigsConstant');

const updateSchema = {
  enableAutoSentNotiBefore30Days: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableAutoSentNotiBefore15Days: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableAutoSentNotiBefore7Days: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableAutoSentNotiBefore3Days: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableAutoSentNotiBefore1Days: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableAutoSentNotiBeforeOtherDays: Joi.number().min(0).allow(null),

  enableNotiByAPNS: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableNotiBySmsCSKH: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableNotiByZaloCSKH: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableNotiBySMSRetry: Joi.number().valid(Object.values(SETTING_STATUS)),
  enableNotiByAutoCall: Joi.number().valid(Object.values(SETTING_STATUS)),

  messageTemplateAPNS: Joi.number().min(0).allow(null),
  messageTemplateSmsCSKH: Joi.number().min(0).allow(null),
  messageTemplateZaloCSKH: Joi.number().min(0).allow(null),
  messageTemplateSMSRetry: Joi.number().min(0).allow(null),
  messageTemplateAutoCall: Joi.number().min(0).allow(null),
};

module.exports = {
  advanceUserGetStationMessageConfigs: {
    tags: ['api', `${moduleName}`],
    description: `get configs ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'advanceUserGetStationMessageConfigs');
    },
  },

  advanceUserUpdateStationMessageConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update configs ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateStationMessageConfigs');
    },
  },
};
