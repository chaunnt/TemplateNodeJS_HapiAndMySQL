/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'PaymentDepositTransaction';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const Maintain = require('../../Common/route/response').maintain();
const CommonFunctions = require('../../Common/CommonFunctions');
const { DEPOSIT_TRX_STATUS, DEPOSIT_TRX_UNIT, DEPOSIT_TRX_CATEGORY } = require('../PaymentDepositTransactionConstant');
const { MAINTAIN_ERROR } = require('../../Common/CommonConstant');
const MaintainFunctions = require('../../Maintain/MaintainFunctions');

const insertSchema = {
  appUserId: Joi.number().required(),
  paymentAmount: Joi.number().required().min(0),
};

const updateSchema = {
  id: Joi.number().required(),
  paymentStatus: Joi.string().max(255),
  paymentRef: Joi.string(),
  paymentSecondaryRef: Joi.string(),
};

const filterSchema = {
  appUserId: Joi.number(),
  walletId: Joi.number(),
  referId: Joi.number(),
  paymentPICId: Joi.number(),
  paymentStatus: Joi.string().max(255),
  paymentMethodId: Joi.number(),
  paymentCategory: Joi.string().max(255),
  paymentUnit: Joi.string().max(255),
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
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
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
  depositHistory: {
    tags: ['api', `${moduleName}`],
    description: `deposit history of user`,
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
          paymentStatus: Joi.string().allow([DEPOSIT_TRX_STATUS.NEW, DEPOSIT_TRX_STATUS.COMPLETED, DEPOSIT_TRX_STATUS.CANCELED]),
          paymentMethodId: Joi.number().min(0),
          paymentUnit: Joi.string(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        startDate: Joi.string().max(255),
        endDate: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'depositHistory');
    },
  },
  userRequestDeposit: {
    tags: ['api', `${moduleName}`],
    description: `userRequestDeposit ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(5),
        paymentMethodId: Joi.number().min(0),
        paymentRef: Joi.string(),
        paymentSecondaryRef: Joi.string(),
        paymentUnit: Joi.string().required().default(DEPOSIT_TRX_UNIT.VND),
        paymentOwner: Joi.string(), //ten nguoi gui, ten tai khoan
        paymentCategory: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().all === false || MaintainFunctions.getSystemStatus().deposit === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_DEPOSIT, res);
        return;
      }
      Response(req, res, 'userRequestDeposit');
    },
  },
  userRequestDepositByGateway: {
    tags: ['api', `${moduleName}`],
    description: `userRequestDepositByGateway ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(5),
        // paymentMethodId: Joi.number().required().min(0),
        // paymentRef: Joi.string(),
        // paymentSecondaryRef: Joi.string(),
        paymentUnit: Joi.string().required().default(DEPOSIT_TRX_UNIT.VND),
        paymentCategory: Joi.string().required(),
        // paymentOwner: Joi.string(), //ten nguoi gui, ten tai khoan
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().all === false || MaintainFunctions.getSystemStatus().deposit === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_DEPOSIT, res);
        return;
      }
      Response(req, res, 'userRequestDepositByGateway');
    },
  },
  userRequestDepositByElecMomo: {
    tags: ['api', `${moduleName}`],
    description: `userRequestDepositByElecWallet ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(5),
        paymentUnit: Joi.string().required().default(DEPOSIT_TRX_UNIT.VND),
        paymentCategory: Joi.string().required().allow([DEPOSIT_TRX_CATEGORY.MOMO_QR]),
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().all === false || MaintainFunctions.getSystemStatus().deposit === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_DEPOSIT, res);
        return;
      }
      Response(req, res, 'userRequestDepositByElecWallet');
    },
  },
  userRequestDepositByZalo: {
    tags: ['api', `${moduleName}`],
    description: `userRequestDepositByElecWallet ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(5),
        paymentUnit: Joi.string().required().default(DEPOSIT_TRX_UNIT.VND),
        paymentCategory: Joi.string().required().allow([DEPOSIT_TRX_CATEGORY.ZALO_QR]),
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().all === false || MaintainFunctions.getSystemStatus().deposit === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_DEPOSIT, res);
        return;
      }
      Response(req, res, 'userRequestDepositByElecWallet');
    },
  },
  userRequestDepositByViettel: {
    tags: ['api', `${moduleName}`],
    description: `userRequestDepositByElecWallet ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentAmount: Joi.number().required().min(5),
        paymentUnit: Joi.string().required().default(DEPOSIT_TRX_UNIT.VND),
        paymentCategory: Joi.string().required().allow([DEPOSIT_TRX_CATEGORY.VIETTEL_QR]),
      }),
    },
    handler: function (req, res) {
      if (MaintainFunctions.getSystemStatus().all === false || MaintainFunctions.getSystemStatus().deposit === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_DEPOSIT, res);
        return;
      }
      Response(req, res, 'userRequestDepositByElecWallet');
    },
  },
  approveDepositTransaction: {
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
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'approveDepositTransaction');
    },
  },
  denyDepositTransaction: {
    tags: ['api', `${moduleName}`],
    description: `deny ${moduleName}`,
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
      Response(req, res, 'denyDepositTransaction');
    },
  },
  summaryUser: {
    tags: ['api', `${moduleName}`],
    description: `summaryUser ${moduleName}`,
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
        startDate: Joi.string().default(new Date().toISOString()),
        endDate: Joi.string().default(new Date().toISOString()),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryUser');
    },
  },
  summaryAll: {
    tags: ['api', `${moduleName}`],
    description: `summaryAll ${moduleName}`,
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
        startDate: Joi.string().default(new Date().toISOString()),
        endDate: Joi.string().default(new Date().toISOString()),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryAll');
    },
  },
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `delete ${moduleName} by id`,
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
  addPointForUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - add reward point for user`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required().min(0),
        amount: Joi.number().required(),
        paymentNote: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'addPointForUser');
    },
  },
  exportExcelHistory: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - export excel history reward point for user`,
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
      Response(req, res, 'exportHistoryOfUser');
    },
  },
  exportSalesToExcel: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - export excel sales`,
    // pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      // headers: Joi.object({
      //   authorization: Joi.string(),
      // }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().required(),
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportSalesToExcel');
    },
  },
  getWaitingApproveCount: {
    tags: ['api', `${moduleName}`],
    description: `get count waiting for approve deposit transaction ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        paymentCategory: Joi.string().example(DEPOSIT_TRX_CATEGORY.BANK).valid(Object.values(DEPOSIT_TRX_CATEGORY)),
        paymentUnit: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getWaitingApproveCount');
    },
  },
};
