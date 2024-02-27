/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'CustomerReceipt';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { PAYMENT_METHOD, CUSTOMER_RECEIPT_STATUS } = require('../CustomerReceiptConstant');

const insertSchema = {
  customerReceiptName: Joi.string().max(255),
  customerReceiptEmail: Joi.string().max(255),
  customerReceiptPhone: Joi.string().max(255),
  customerReceiptAmount: Joi.number().min(0),
  customerReceiptContent: Joi.string(),
  customerReceiptNote: Joi.string().max(255),
  paymentMethod: Joi.string().max(255).allow(Object.values(PAYMENT_METHOD)),
  customerReceiptInternalRef: Joi.number().min(0), // schedule id
  customerVehicleIdentity: Joi.string(),
};

const updateSchema = {
  customerReceiptName: Joi.string().max(255),
  customerReceiptEmail: Joi.string().max(255).allow(['', null]),
  customerReceiptPhone: Joi.string().max(255),
  customerReceiptNote: Joi.string().max(255),
  customerReceiptStatus: Joi.string().allow(...Object.values(CUSTOMER_RECEIPT_STATUS)),
};

const filterSchema = {
  customerReceiptStatus: Joi.string().max(255),
  paymentApproveDate: Joi.string(),
  createdAt: Joi.string(),
  customerReceiptInternalRef: Joi.number().min(0),
};

module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string(),
        endDate: Joi.string(),
        searchText: Joi.string(),
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
  userGetListOneUser: {
    tags: ['api', `${moduleName}`],
    description: `user find by ID ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string(),
        endDate: Joi.string(),
        searchText: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListOneUser');
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
    description: `delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdminToken }],
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
  userCreateReceipt: {
    tags: ['api', `${moduleName}`],
    description: `create ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerReceiptInternalRef: Joi.number().required(),
        customerReceiptNote: Joi.string(),
        paymentMethod: Joi.string()
          .allow(PAYMENT_METHOD.ATM, PAYMENT_METHOD.CREDIT_CARD, PAYMENT_METHOD.DIRECT, PAYMENT_METHOD.MOMO, PAYMENT_METHOD.VNPAY)
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateReceipt');
    },
  },
  advanceUserCreateReceipt: {
    tags: ['api', `${moduleName}`],
    description: `create ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserCreateReceipt');
    },
  },
  userGetList: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetList');
    },
  },
  advanceUserGetList: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetList');
    },
  },
  getDetailById: {
    tags: ['api', `${moduleName}`],
    description: `get detail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'getDetailById');
    },
  },
  advanceUserGetDetail: {
    tags: ['api', `${moduleName}`],
    description: `get detail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'getDetailById');
    },
  },
  getDetailByExternalRef: {
    tags: ['api', `${moduleName}`],
    description: `get detail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerReceiptExternalRef: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getDetailByExternalRef');
    },
  },
  advanceUserGetDetailByRef: {
    tags: ['api', `${moduleName}`],
    description: `get detail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerReceiptRef: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getDetailByRef');
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
        id: Joi.number().min(0).required(),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateById');
    },
  },
  advanceUserUpdateById: {
    tags: ['api', `${moduleName}`],
    description: `user update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'userUpdateById');
    },
  },
  advanceUserPayById: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserPayById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'advanceUserPayById');
    },
  },
  advanceUserCancelById: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserCancelById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'advanceUserCancelById');
    },
  },
  // exportReceiptExcel: {
  //   tags: ['api', `${moduleName}`],
  //   description: `export to excel ${moduleName}`,
  //   pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
  //   auth: {
  //     strategy: 'jwt',
  //   },
  //   validate: {
  //     headers: Joi.object({
  //       authorization: Joi.string(),
  //     }).unknown(),
  //     payload: Joi.object({
  //       filter: Joi.object({
  //         ...filterSchema,
  //         stationsId: Joi.number().min(1),
  //       }),
  //       searchText: Joi.string().allow(''),
  //       startDate: Joi.string(),
  //       endDate: Joi.string(),
  //       order: Joi.object({
  //         key: Joi.string().default('createdAt').allow(''),
  //         value: Joi.string().default('desc').allow(''),
  //       }),
  //     }),
  //   },
  //   handler: function (req, res) {
  //     Response(req, res, 'exportReceiptExcel');
  //   },
  // },
  // advanceUserExportReceiptExcel: {
  //   tags: ['api', `${moduleName}`],
  //   description: `export to excel ${moduleName}`,
  //   pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
  //   auth: {
  //     strategy: 'jwt',
  //   },
  //   validate: {
  //     headers: Joi.object({
  //       authorization: Joi.string(),
  //     }).unknown(),
  //     payload: Joi.object({
  //       filter: Joi.object(filterSchema),
  //       searchText: Joi.string().allow(''),
  //       startDate: Joi.string(),
  //       endDate: Joi.string(),
  //       order: Joi.object({
  //         key: Joi.string().default('createdAt').allow(''),
  //         value: Joi.string().default('desc').allow(''),
  //       }),
  //     }),
  //   },
  //   handler: function (req, res) {
  //     Response(req, res, 'advanceUserExportReceiptExcel');
  //   },
  // },
};
