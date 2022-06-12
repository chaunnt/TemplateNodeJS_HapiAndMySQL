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
};

const updateSchema = {
  id: Joi.number().required(),
  paymentStatus: Joi.string(),
  paymentRef: Joi.string(),
}

const filterSchema = {
  appUserId: Joi.number(),
  username: Joi.string(),
  walletId: Joi.number(),
  referId: Joi.number(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string(),
  paymentPICId: Joi.number(),
  phoneNumber: Joi.string(),
  paymentStatus: Joi.string(),
  paymentRef: Joi.string(),
  paymentApproveDate: Joi.string(),
  paymentMethodId: Joi.number(),
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
        paymentServicePackageId: Joi.number().required().default(1),
        paymentMethodId: Joi.number().required().default(1),
      })
    },
    handler: function (req, res) {
      Response(req, res, "userRequestDeposit");
    }
  },
  userViewRequestDeposit: {
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
        id: Joi.number().min(0),
        paymentTransactionCode: Joi.string()
      })
    },
    handler: function (req, res) {
      Response(req, res, "userViewRequestDeposit");
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
        paymentNote: Joi.string(),
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
        paymentNote: Joi.string(),
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
  addRewardPointForUser: {
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
        amount: Joi.number().required().min(0),
        paymentNote: Joi.string(),
      })
    },
    handler: function (req, res) {
      Response(req, res, "addRewardPointForUser");
    }
  },

  exportExcelHistory: {
    tags: ["api", `${moduleName}`],
    description: `${moduleName} - export excel history reward point for user`,
    pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
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
      Response(req, res, "exportHistoryOfUser");
    }
  },
  exportSalesToExcel: {
    tags: ["api", `${moduleName}`],
    description: `${moduleName} - export excel sales`,
    pre: [{ method: CommonFunctions.verifyToken },{ method: CommonFunctions.verifyStaffToken } ],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().required(),
        endDate: Joi.string().required(),
      })
    },
    handler: function (req, res) {
      Response(req, res, "exportSalesToExcel");
    }
  },
};
