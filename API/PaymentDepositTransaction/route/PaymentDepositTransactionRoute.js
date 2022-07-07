/**
 * Created by A on 7/18/17.
 */
"use strict";
const moduleName = 'PaymentDepositTransaction';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require("joi");
const Response = require("../../Common/route/response").setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { DEPOSIT_TRX_STATUS } = require("../PaymentDepositTransactionConstant");

const insertSchema = {
  appUserId: Joi.number().required(),
  paymentAmount: Joi.number().required().min(0),
  paymentCategory: Joi.string(),
};

const updateSchema = {
  id: Joi.number().required(),
  paymentStatus: Joi.string(),
  paymentRef: Joi.string(),
}

const filterSchema = {
  appUserId: Joi.number(),
  walletId: Joi.number(),
  referId: Joi.number(),
  paymentPICId: Joi.number(),
  paymentStatus: Joi.string(),
  paymentMethodId: Joi.number(),
  paymentCategory: Joi.string(),
};

module.exports = {
  insert: {
    tags: ["api", `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(insertSchema)
    },
    handler: function (req, res) {
      Response(req, res, "insert");
    }
  },
  updateById: {
    tags: ["api", `${moduleName}`],
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
      })
    },
    handler: function (req, res) {
      Response(req, res, "updateById");
    }
  },
  find: {
    tags: ["api", `${moduleName}`],
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        order: Joi.object({
          key: Joi.string()
            .default("createdAt")
            .allow(""),
          value: Joi.string()
            .default("desc")
            .allow("")
        })
      })
    },
    handler: function (req, res) {
      Response(req, res, "find");
    }
  },
  findById: {
    tags: ["api", `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0)
      })
    },
    handler: function (req, res) {
      Response(req, res, "findById");
    }
  },
  depositHistory: {
    tags: ["api", `${moduleName}`],
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
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string()
            .default("createdAt")
            .allow(""),
          value: Joi.string()
            .default("desc")
            .allow("")
        })
      })
    },
    handler: function (req, res) {
      Response(req, res, "depositHistory");
    }
  },
  userRequestDeposit: {
    tags: ["api", `${moduleName}`],
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
        paymentAmount: Joi.number().required().min(0),
        // //<< Cho nay la dia chi transaction, khong phai dia chi vi. 
        //paymentRef = ma hoa don / ma giao dich ben ngoai he thong
        paymentRef: Joi.string(),
        paymentCategory: Joi.string(),
        paymentRefAmount: Joi.number().min(0),
      })
    },
    handler: function (req, res) {
      Response(req, res, "userRequestDeposit");
    }
  },
  approveDepositTransaction: {
    tags: ["api", `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        paymentNote: Joi.string()
      })
    },
    handler: function (req, res) {
      Response(req, res, "approveDepositTransaction");
    }
  },
  denyDepositTransaction: {
    tags: ["api", `${moduleName}`],
    description: `deny ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        paymentNote: Joi.string()
      })
    },
    handler: function (req, res) {
      Response(req, res, "denyDepositTransaction");
    }
  },
  summaryUser: {
    tags: ["api", `${moduleName}`],
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
      })
    },
    handler: function (req, res) {
      Response(req, res, "summaryUser");
    }
  },
  summaryAll: {
    tags: ["api", `${moduleName}`],
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
      })
    },
    handler: function (req, res) {
      Response(req, res, "summaryAll");
    }
  },
  deleteById: {
    tags: ["api", `${moduleName}`],
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
        id: Joi.number().min(0)
      })
    },
    handler: function (req, res) {
      Response(req, res, "deleteById");
    }
  },
  addPointForUser: {
    tags: ["api", `${moduleName}`],
    description: `${moduleName} - add reward point for user`,
    pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
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
      })
    },
    handler: function (req, res) {
      Response(req, res, "addPointForUser");
    }
  },
  exportData: {
    tags: ["api", `${moduleName}`],
    description: `exportData ${moduleName}`,
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        order: Joi.object({
          key: Joi.string()
            .default("createdAt")
            .allow(""),
          value: Joi.string()
            .default("desc")
            .allow("")
        })
      })
    },
    handler: function (req, res) {
      Response(req, res, "exportData");
    }
  },
};
