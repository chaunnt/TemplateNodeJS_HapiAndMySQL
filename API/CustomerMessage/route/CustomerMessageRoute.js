/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'CustomerMessage';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { MESSAGE_CATEGORY, SMS_PROVIDER, EMAIL_PROVIDER, MESSAGE_SEND_STATUS } = require('../CustomerMessageConstant');

const insertSchema = {
  customerMessageCategories: Joi.string(),
  customerMessageContent: Joi.string(),
  customerRecordPhone: Joi.string(),
};

const updateSchema = {
  ...insertSchema,
  isDeleted: Joi.number(),
};

const filterSchema = {
  messageSendStatus: Joi.string().allow(Object.values(MESSAGE_SEND_STATUS)),
  customerMessageCategories: Joi.string(),
  customerId: Joi.number().optional(),
};
const customerSchema = {
  customerMessageContent: Joi.string().required(),
  customerMessageEmail: Joi.string().email().allow([null, '']),
  customerMessagePhone: Joi.string(),
  customerRecordPlatenumber: Joi.string().min(5).max(15).alphanum().required(),
  customerId: Joi.number().min(0).allow([null]),
  customerRecordCheckExpiredDate: Joi.string().example('DD/MM/YYYY').length(10).default('').allow([null, '']),
};
module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
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
      Response(req, res, 'insert');
    },
  },
  sendsms: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    validate: {
      payload: Joi.object({
        message: Joi.string(),
        phoneNumber: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendsms');
    },
  },
  advanceUserSendSMS: {
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
        message: Joi.string(),
        phoneNumber: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendsms');
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
  advanceUserUpdateById: {
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
        startDate: Joi.string(),
        endDate: Joi.string(),
        searchText: Joi.string(),
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
  advanceUserGetList: {
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
        filter: Joi.object(filterSchema),
        startDate: Joi.string(),
        endDate: Joi.string(),
        searchText: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
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
  advanceUserGetReport: {
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
        startDate: Joi.string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .required(),
        endDate: Joi.string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetReport');
    },
  },
  userGetListMessage: {
    tags: ['api', `${moduleName}`],
    description: `userGetListMessage ${moduleName}`,
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
          isRead: Joi.number().valid([0, 1]),
        }),
        // startDate: Joi.string(),
        // endDate: Joi.string(),
        // searchText: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        // order: Joi.object({
        //   key: Joi.string().default('createdAt').allow(''),
        //   value: Joi.string().default('desc').allow(''),
        // }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListMessage');
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
  advanceUserGetDetail: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
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
      Response(req, res, 'findById');
    },
  },
  summaryView: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    validate: {
      payload: Joi.object({
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'summaryView');
    },
  },
  sendMessageByFilter: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerMessageContent: Joi.string(),
        customerMessageCategories: Joi.string().default(MESSAGE_CATEGORY.EMAIL).allow([MESSAGE_CATEGORY.EMAIL, MESSAGE_CATEGORY.SMS]),
        customerMessageTemplateId: Joi.number().min(0),
        filter: Joi.object({
          startDate: Joi.string(),
          endDate: Joi.string(),
          searchText: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageByFilter');
    },
  },
  advanceUserSendMessageByFilter: {
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
        customerMessageContent: Joi.string(),
        customerMessageCategories: Joi.string().default(MESSAGE_CATEGORY.EMAIL).allow([MESSAGE_CATEGORY.EMAIL, MESSAGE_CATEGORY.SMS]),
        customerMessageTemplateId: Joi.number().min(0),
        filter: Joi.object({
          startDate: Joi.string(),
          endDate: Joi.string(),
          searchText: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageByFilter');
    },
  },
  sendMessageByCustomerList: {
    tags: ['api', `${moduleName}`],
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
        customerMessageContent: Joi.string(),
        customerMessageCategories: Joi.string().default(MESSAGE_CATEGORY.EMAIL).allow([MESSAGE_CATEGORY.EMAIL, MESSAGE_CATEGORY.SMS]),
        customerRecordIdList: Joi.array().items(Joi.number()),
        customerMessageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageByCustomerList');
    },
  },
  advanceUserSendMessage: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerMessageContent: Joi.string(),
        customerMessageCategories: Joi.string().default(MESSAGE_CATEGORY.EMAIL).allow([MESSAGE_CATEGORY.EMAIL, MESSAGE_CATEGORY.SMS]),
        customerRecordIdList: Joi.array().items(Joi.number()),
        customerMessageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageByCustomerList');
    },
  },
  advanceUserSendMessageToCustomerList: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        // customerMessageContent: Joi.string(),
        customerMessageCategories: Joi.string()
          .default(MESSAGE_CATEGORY.SMS)
          .allow([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.APNS, MESSAGE_CATEGORY.ZNS, MESSAGE_CATEGORY.EMAIL]),
        customerList: Joi.array().items(Joi.object(customerSchema)).required(),
        customerMessageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageToCustomerList');
    },
  },
  findTemplates: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
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
      Response(req, res, 'findTemplates');
    },
  },
  advanceUserFindTemplates: {
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
        filter: Joi.object({
          messageTemplateType: Joi.string(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findTemplates');
    },
  },
  sendTestEmail: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - send test email to client`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        testEmail: Joi.string().required().email(),
        emailUsername: Joi.string().required(),
        emailPassword: Joi.string().required(),
        emailConfig: Joi.object({
          emailHost: Joi.string(),
          emailPort: Joi.number(),
          emailSecure: Joi.number(),
        }),
        emailProvider: Joi.string().default(EMAIL_PROVIDER.CUSTOM).allow([EMAIL_PROVIDER.GMAIL, EMAIL_PROVIDER.CUSTOM]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendTestEmail');
    },
  },
  sendTestSMS: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - send test sms to client`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().required(),
        smsConfig: Joi.object({
          smsUrl: Joi.string(),
          smsUserName: Joi.string(),
          smsPassword: Joi.string(),
          smsBrand: Joi.string(),
          smsToken: Joi.string(),
          smsCPCode: Joi.string(),
          smsServiceId: Joi.string(),
          smsProvider: Joi.string().required(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendTestSMS');
    },
  },
  receiveVMGResult: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - webhook to receive zns signal from VMG`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        msisdn: Joi.string(),
        requestId: Joi.string(),
        sendTime: Joi.string(),
        responseTimeTelco: Joi.string(),
        status: Joi.number(),
        referentId: Joi.string(),
        retryCount: Joi.number(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'receiveVMGResult');
    },
  },
  reportTotalSMSByStation: {
    tags: ['api', `${moduleName}`],
    description: `get SMS report by station ${moduleName}`,
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
          stationId: Joi.number().min(0),
        }),
        startDate: Joi.string(),
        endDate: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalSMSByStation');
    },
  },
  userGetDetailMessageById: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailMessageById ${moduleName}`,
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
      Response(req, res, 'userGetDetailMessageById');
    },
  },
  userGetDetailMessageById: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailMessageById ${moduleName}`,
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
      Response(req, res, 'userGetDetailMessageById');
    },
  },
  sendScheduleMessage: {
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
        customerScheduleId: Joi.number().integer().required(),
        message: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendScheduleMessage');
    },
  },
  sendVinaphoneSMS: {
    tags: ['api', `${moduleName}`],
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
        templateId: Joi.string(),
        requestId: Joi.string(),
        params: Joi.string(),
        phoneNumber: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendVinaphoneSMS');
    },
  },
  createVinaphoneSMSTemplate: {
    tags: ['api', `${moduleName}`],
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
        content: Joi.string(),
        requestId: Joi.string(),
        totalPrams: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'createVinaphoneSMSTemplate');
    },
  },
  advanceUserSendMessageToCustomer: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        title: Joi.string(),
        content: Joi.string().required(),
        appUserId: Joi.number().integer().min(1).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSendMessageToCustomer');
    },
  },
};
