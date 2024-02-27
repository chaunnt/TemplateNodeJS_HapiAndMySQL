/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const moduleName = 'AppUserMembership';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const insertSchema = {
  appUserMembershipTitle: Joi.string().required(),
  appUserMembershipDescription: Joi.string().allow([null, '']),
  appUserMembershipImage: Joi.string().allow([null, '']),
  appUserMembershipInvitationRequired: Joi.number().min(0),
  appUserMembershipAssetRequired: Joi.number().min(0),
  appUserMembershipAssetF1Required: Joi.number().min(0),
  appUserMembershipBonusPrize: Joi.number().min(0),
  appUserMembershipPlayBonus: Joi.number().min(0),
  appUserMembershipBonusRate: Joi.number().min(0),
  appUserMembershipBonusRateF1: Joi.number().min(0),
  appUserMembershipBonusRateF2: Joi.number().min(0),
  appUserMembershipBonusRateF3: Joi.number().min(0),
  appUserMembershipBonusRateF4: Joi.number().min(0),
  appUserMembershipBonusRateF5: Joi.number().min(0),
  appUserMembershipBonusRateF6: Joi.number().min(0),
  appUserMembershipBonusRateF7: Joi.number().min(0),
  appUserMembershipBonusRateF8: Joi.number().min(0),
  appUserMembershipBonusRateF9: Joi.number().min(0),
  appUserMembershipBonusRateF10: Joi.number().min(0),
};

const updateSchema = {
  appUserMembershipTitle: Joi.string(),
  appUserMembershipDescription: Joi.string(),
  appUserMembershipImage: Joi.string(),
  appUserMembershipAssetRequired: Joi.number().min(0),
  appUserMembershipAssetF1Required: Joi.number().min(0),
  appUserMembershipInvitationRequired: Joi.number().min(0),
  appUserMembershipBonusRate: Joi.number().min(0),
  appUserMembershipPlayBonus: Joi.number().min(0),
  appUserMembershipBonusPrize: Joi.number().min(0),
  appUserMembershipBonusRateF1: Joi.number().min(0),
  appUserMembershipBonusRateF2: Joi.number().min(0),
  appUserMembershipBonusRateF3: Joi.number().min(0),
  appUserMembershipBonusRateF4: Joi.number().min(0),
  appUserMembershipBonusRateF5: Joi.number().min(0),
  appUserMembershipBonusRateF6: Joi.number().min(0),
  appUserMembershipBonusRateF7: Joi.number().min(0),
  appUserMembershipBonusRateF8: Joi.number().min(0),
  appUserMembershipBonusRateF9: Joi.number().min(0),
  appUserMembershipBonusRateF10: Joi.number().min(0),
};

const filterSchema = {};

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
  find: {
    tags: ['api', `${moduleName}`],
    description: `Get List ${moduleName}`,
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
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
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

  updateById: {
    tags: ['api', `${moduleName}`],
    description: `Update ${moduleName} By Id`,
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
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName} By Id`,
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
      Response(req, res, 'deleteById');
    },
  },
  userGetListMemberShip: {
    tags: ['api', `${moduleName}`],
    description: `Get List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'userGetListMemberShip');
    },
  },
};
