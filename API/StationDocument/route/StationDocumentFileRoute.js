/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationDocumentFile';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const Response = require('../../Common/route/response').setup(Manager);

const insertSchema = {
  documentFileName: Joi.string().min(0).max(500),
  documentFileUrl: Joi.string().min(0).max(500).required(),
  documentFileSize: Joi.number(),
  stationDocumentId: Joi.number().min(0).required(),
};

const updateSchema = {
  documentFileName: Joi.string().min(0).max(500),
  documentFileUrl: Joi.string().min(0).max(500),
  documentFileSize: Joi.number(),
};

module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
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
      Response(req, res, 'insert');
    },
  },
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
        id: Joi.number().min(0).required(),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  deleteById: {
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
