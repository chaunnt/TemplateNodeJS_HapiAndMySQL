/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'StationPaymentConfigs';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const insertSchema = {
  stationsId: Joi.number().integer().min(1).required(),
  bankConfigs: Joi.array()
    .items({
      bankName: Joi.string().allow(['', null]),
      accountName: Joi.string().required(),
      accountNumber: Joi.string().required(),
      bankId: Joi.string().required(),
    })
    .max(5),
  momoPersonalConfigs: Joi.object({
    phone: Joi.string().required(),
    QRCode: Joi.string(),
  }),
  momoBusinessConfigs: Joi.object({
    phone: Joi.string(),
    QRCode: Joi.string(),
    partnerCode: Joi.string(),
    momoUrl: Joi.string(),
    secretKey: Joi.string(),
    accessKey: Joi.string(),
  }),
  vnpayPersonalConfigs: Joi.object({
    QRCode: Joi.string().required(),
  }),
  vnpayBusinessConfigs: Joi.object({
    QRCode: Joi.string().required(),
  }),
  zalopayBusinessConfigs: Joi.object({
    QRCode: Joi.string().required(),
  }),
  zalopayPersonalConfigs: Joi.object({
    QRCode: Joi.string().required(),
  }),
};

const updateSchema = {
  ...insertSchema,
};

const filterSchema = {
  stationsId: Joi.number().integer(),
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
    description: `find ${moduleName}`,
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
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
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
  userGetPaymentConfigByStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetPaymentConfigByStation ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationsId: Joi.number().min(0).required(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetPaymentConfigByStation');
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
    description: `Delete ${moduleName}`,
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
  advanceUserDeleteById: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'advanceUserDeleteById');
    },
  },
  advanceUserInsert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        bankConfigs: insertSchema.bankConfigs,
        momoPersonalConfigs: insertSchema.momoPersonalConfigs,
        momoBusinessConfigs: insertSchema.momoBusinessConfigs,
        zalopayPersonalConfigs: insertSchema.zalopayPersonalConfigs,
        zalopayBusinessConfigs: insertSchema.zalopayBusinessConfigs,
        vnpayPersonalConfigs: insertSchema.vnpayPersonalConfigs,
        vnpayBusinessConfigs: insertSchema.vnpayBusinessConfigs,
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserInsert');
    },
  },
  advanceUserGetPaymentConfigs: {
    tags: ['api', `${moduleName}`],
    description: `find ${moduleName}`,
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
      Response(req, res, 'advanceUserGetPaymentConfigs');
    },
  },
  advanceUserUpdateBankConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        bankConfigs: insertSchema.bankConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateMomoPersonalConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        momoPersonalConfigs: insertSchema.momoPersonalConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateMomoBusinessConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        momoBusinessConfigs: insertSchema.momoBusinessConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateZaloPayPersonalConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        zalopayPersonalConfigs: insertSchema.zalopayPersonalConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateZaloPayBusinessConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        zalopayPersonalConfigs: insertSchema.zalopayBusinessConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateVnPayPersonalConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        vnpayPersonalConfigs: insertSchema.vnpayPersonalConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
  advanceUserUpdateVnPayBusinessConfigs: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        vnpayBusinessConfigs: insertSchema.vnpayBusinessConfigs,
      }).required(),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdate');
    },
  },
};
