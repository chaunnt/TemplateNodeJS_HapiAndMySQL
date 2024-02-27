/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'AppUserVehicleSetting';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const moment = require('moment');

const updateSchema = {
  appUserId: Joi.number().required().min(0),
  vehicleIdentity: Joi.string().required(),
  vehicleExpiryDateBHTNDS: Joi.number().min(0),
  vehicleExpiryDateBHTV: Joi.number().min(0),
};

module.exports = {
  userUpdateSettingVehicle: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateSettingVehicle');
    },
  },
};
