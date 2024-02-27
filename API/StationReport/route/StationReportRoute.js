/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const moduleName = 'StationReport';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const { STATION_TYPE } = require('../../Stations/StationsConstants');

const Response = require('../../Common/route/response').setup(Manager);

const insertSchema = {};

const updateSchema = {};

const filterSchema = {
  reportDay: Joi.string().example('DD/MM/YYYY'),
  stationId: Joi.number().min(0).max(99999),
  stationType: Joi.number().valid(Object.values(STATION_TYPE)),
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
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  find: {
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
        filter: Joi.object(filterSchema),
        stationCode: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().max(500),
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')),
        endDate: Joi.string().example(moment().add(30, 'days').format('DD/MM/YYYY')),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `deleteById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().integer(),
      }),
    },
    handler(req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
