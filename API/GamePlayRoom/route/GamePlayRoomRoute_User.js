/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'GamePlayRoom';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const filterSchema = {
  gamePlayRoomId: Joi.number(),
  gameType: Joi.string(),
  gameInfoId: Joi.number(),
};

const insertSchema = {
  gameRoomName: Joi.string().required(),
  gameRoomPassword: Joi.string(),
  gameRoomType: Joi.string().required(),
  gameType: Joi.string(),
  gameInfoId: Joi.number().required(),
};

const updateSchema = {
  gameRoomName: Joi.string().max(255),
  gameRoomPassword: Joi.string().max(255),
};

module.exports = {
  getList: {
    tags: ['api', `${moduleName}`],
    description: `getList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListGameRoom');
    },
  },
  userJoinAsLeader: {
    tags: ['api', `${moduleName}`],
    description: `user join as leader ${moduleName}`,
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
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userJoinAsLeader');
    },
  },
  userInsert: {
    tags: ['api', `${moduleName}`],
    description: `user insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateGameRoom');
    },
  },
  userUpdateById: {
    tags: ['api', `${moduleName}`],
    description: `user update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateGameRoomById');
    },
  },
  userDeleteById: {
    tags: ['api', `${moduleName}`],
    description: `user deleteById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userDeleteGameRoomById');
    },
  },
};
