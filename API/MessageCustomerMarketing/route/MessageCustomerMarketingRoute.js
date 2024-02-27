/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'MessageCustomerMarketing';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { EMAIL_PROVIDER, MARKETING_MESSAGE_SEND_STATUS, MARKETING_MESSAGE_CATEGORY } = require('../MessageCustomerMarketingConstant');

const insertSchema = {
  customerMessageCategories: Joi.number(),
  customerMessageContent: Joi.string(),
  customerRecordPhone: Joi.string(),
};

const updateSchema = {
  ...insertSchema,
  isDeleted: Joi.number(),
};

const filterSchema = {
  messageSendStatus: Joi.number().allow(Object.values(MARKETING_MESSAGE_SEND_STATUS)),
  customerMessageCategories: Joi.number().allow(Object.values(MARKETING_MESSAGE_CATEGORY)),
};

const customerSchema = {
  customerMessageContent: Joi.string().required(),
  customerMessageEmail: Joi.string().email().allow([null, '']),
  customerMessagePhone: Joi.string().trim().required().min(9).max(12),
  customerRecordPlatenumber: Joi.string().min(5).max(15).required(),
  customerId: Joi.number().min(0).allow([null]),
  customerRecordCheckExpiredDate: Joi.string().example('DD/MM/YYYY').length(10),
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
        customerMessageTemplateId: Joi.number().min(0),
        customerMessagePhone: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendsms');
    },
  },
  advanceUserSendZNS: {
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
        customerMessageTemplateId: Joi.number().min(0),
        customerMessagePhone: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendZns');
    },
  },
  advanceUserGetMessageMarketingConfig: {
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
        stationsId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getMessageMarketingConfig');
    },
  },
  advanceUserSendZNSToCustomerList: {
    tags: ['api', `${moduleName}`],
    description: `sendZNS to CustomerList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerList: Joi.array().items(Joi.object(customerSchema)).required(),
        messageZNSTemplateId: Joi.string().required(),
        messageTemplateData: Joi.object(),
        messageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSendZNSMessageToCustomerList');
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
  advanceUserCancelSMSMessage: {
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
        messageMarketingId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserCancelSMSMessage');
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
        customerMessageCategories: Joi.number().default(MARKETING_MESSAGE_CATEGORY.EMAIL).allow(Object.values(MARKETING_MESSAGE_CATEGORY)),
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
        customerMessageCategories: Joi.number().default(MARKETING_MESSAGE_CATEGORY.EMAIL).allow(Object.values(MARKETING_MESSAGE_CATEGORY)),
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
        customerMessageCategories: Joi.number().default(MARKETING_MESSAGE_CATEGORY.EMAIL).allow(Object.values(MARKETING_MESSAGE_CATEGORY)),
        customerRecordIdList: Joi.array().items(Joi.number()),
        customerMessageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendMessageByCustomerList');
    },
  },
  advanceUserSendSMSMessageToCustomerList: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserSendSMSMessageToCustomerList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerList: Joi.array().items(Joi.object(customerSchema)).required(),
        messageTemplateId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSendSMSMessageToCustomerList');
    },
  },
  advanceUserSendZNSMessageToCustomerList: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserSendZNSMessageToCustomerList ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerMessageCategories: Joi.number().default(MARKETING_MESSAGE_CATEGORY.ZALO_CSKH).allow([MARKETING_MESSAGE_CATEGORY.ZALO_CSKH]),
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
  sendTestZNS: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} - send test zns to client`,
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
        znsConfig: Joi.object({
          znsUrl: Joi.string(),
          znsUserName: Joi.string(),
          znsPassword: Joi.string(),
          znsBrand: Joi.string(),
          znsToken: Joi.string(),
          znsCPCode: Joi.string(),
          znsServiceId: Joi.string(),
          znsProvider: Joi.string().required(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'sendTestZNS');
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
  configQuantityMessageMarketing: {
    tags: ['api', `${moduleName}`],
    description: `config Quantity ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        quantityConfig: Joi.object({
          remainingQtyMessageSmsCSKH: Joi.number().min(0),
          remainingQtyMessageZaloCSKH: Joi.number().min(0),
          remainingQtyMessageAPNS: Joi.number().min(0),
          remainingQtyMessageEmail: Joi.number().min(0),
          remainingQtyMessageSmsPromotion: Joi.number().min(0),
          remainingQtyMessageZaloPromotion: Joi.number().min(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'configQuantityMessageMarketing');
    },
  },
  getMessageMarketingConfig: {
    tags: ['api', `${moduleName}`],
    description: `config Quantity ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getMessageMarketingConfig');
    },
  },
  advanceUserGetFailedMessage: {
    tags: ['api', `${moduleName}`],
    description: `config Quantity ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        customerMessageCategories: Joi.number().default(MARKETING_MESSAGE_CATEGORY.ZALO_CSKH).allow(Object.values(MARKETING_MESSAGE_CATEGORY)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetFailedMessage');
    },
  },

  getReportOfStation: {
    tags: ['api', `${moduleName}`],
    description: `get report of ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().integer().required(),
        startDate: Joi.string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .required(),
        endDate: Joi.string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getReportOfStation');
    },
  },
};
