/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'AppUserClickActivity';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { TARGET_ID } = require('../AppUserClickActivityConstant');

module.exports = {
  userClickActivity: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        listClick: Joi.array().items(
          Joi.object({
            targetId: Joi.number().valid(Object.values(TARGET_ID)).min(1),
            totalClick: Joi.number().min(1),
          }),
        ),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userClickActivity');
    },
  },
};
