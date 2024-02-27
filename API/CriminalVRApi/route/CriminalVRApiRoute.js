/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'CriminalVRApi';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  checkCriminalFromVr: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyApiKeyVR }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        data: Joi.object({
          licensePlates: Joi.string()
            .trim()
            .regex(/^[A-Z0-9]+$/)
            .min(1)
            .required(),
          certificateSeries: Joi.string().trim().min(1).required(),
          plateColor: Joi.string().default('T'),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'checkCriminalFromVr');
    },
  },

  userCheckCriminalFromVr: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    validate: {
      headers: Joi.object({}).unknown(),
      payload: Joi.object({
        data: Joi.object({
          licensePlates: Joi.string()
            .trim()
            .regex(/^[A-Z0-9]+$/)
            .min(1)
            .required(),
          certificateSeries: Joi.string().trim().min(1).required(),
          plateColor: Joi.string().default('T'),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCheckCriminalFromVr');
    },
  },
};
