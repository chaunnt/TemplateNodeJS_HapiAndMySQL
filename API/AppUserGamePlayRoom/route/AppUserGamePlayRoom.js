/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'AppUserGamePlayRoom';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  userJoinRoom: {
    tags: ['api', `${moduleName}`],
    description: `user join room ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gameRoomId: Joi.number().required(),
        gameRoomPassword: Joi.string(),
        joinRoomA: Joi.bool().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userJoinRoom');
    },
  },
  userExitRoom: {
    tags: ['api', `${moduleName}`],
    description: `user exit room ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        gameRoomId: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userExitRoom');
    },
  },
};
