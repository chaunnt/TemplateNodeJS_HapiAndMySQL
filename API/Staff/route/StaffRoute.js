/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'Staff';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const insertSchema = {
  lastName: Joi.string().max(255),
  firstName: Joi.string().max(255),
  username: Joi.string().alphanum().min(6).max(30).required(),
  email: Joi.string().email().max(255),
  password: Joi.string().required(),
  phoneNumber: Joi.string().min(8).max(15),
  staffAvatar: Joi.string().max(2000),
  referCode: Joi.string().max(20),
  sotaikhoan: Joi.string().allow(['', null]),
  tentaikhoan: Joi.string().allow(['', null]),
  tennganhang: Joi.string().allow(['', null]),
  diachivitienao: Joi.string().allow(['', null]),
  tenmangtienao: Joi.string().allow(['', null]),
  tenloaitienao: Joi.string().allow(['', null]),
};

const updateSchema = {
  lastName: Joi.string().max(255),
  firstName: Joi.string().max(255),
  phoneNumber: Joi.string().min(8).max(15),
  active: Joi.number().min(0).max(1),
  twoFACode: Joi.string().max(255),
  telegramId: Joi.string(),
  staffRoleId: Joi.number(),
  email: Joi.string().email().max(255),
  isDeleted: Joi.number(),
  stationsId: Joi.number(),
  staffAvatar: Joi.string().max(2000),
  referCode: Joi.string().max(20),
  sotaikhoan: Joi.string().allow(['', null]),
  tentaikhoan: Joi.string().allow(['', null]),
  tennganhang: Joi.string().allow(['', null]),
  diachivitienao: Joi.string().allow(['', null]),
  tenmangtienao: Joi.string().allow(['', null]),
  tenloaitienao: Joi.string().allow(['', null]),
};

const filterSchema = {
  active: Joi.number().min(0).max(1),
  staffRoleId: Joi.number(),
  stationsId: Joi.number(),
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
      payload: Joi.object({
        ...insertSchema,
        staffRoleId: Joi.number().default(0),
      }),
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
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
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
  loginStaff: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().alphanum().min(6).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'loginStaff');
    },
  },
  registerStaff: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'registerStaff');
    },
  },
  resetPasswordStaff: {
    tags: ['api', `${moduleName}`],
    description: `reset password ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().alphanum().min(6).max(30).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'resetPasswordStaff');
    },
  },
  changePasswordStaff: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        newPassword: Joi.string().required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'changePasswordStaff');
    },
  },
  adminChangePasswordStaff: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminChangePasswordStaff');
    },
  },

  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteStaffById');
    },
  },
  changePasswordUserStaff: {
    tags: ['api', `${moduleName}`],
    description: `change password User${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'changePasswordUserOfStaff');
    },
  },
  getUserRefer: {
    tags: ['api', `${moduleName}`],
    description: `get user refer by agent${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          staffId: Joi.number().default(0).min(0),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getUserRefer');
    },
  },
};
