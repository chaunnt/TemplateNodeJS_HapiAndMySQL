/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const moduleName = 'StationDocument';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const { MAX_LIMIT_FILE_PER_DOCUMENT, DOCUMENT_CATEGORY } = require('../StationDocumentConstants');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const Response = require('../../Common/route/response').setup(Manager);

module.exports = {
  advanceUserGetAdminDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetAdminDocument ${moduleName}`,
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
          documentPublishedDay: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)),
          documentCategory: Joi.number().allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
        }),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)),
        searchText: Joi.string(),
        skip: Joi.number().default(0),
        limit: Joi.number().default(20),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetAdminDocument');
    },
  },
  advanceUserGetListDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetListDocument ${moduleName}`,
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
          documentPublishedDay: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)),
          documentCategory: Joi.number().allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
        }),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)),
        searchText: Joi.string(),
        skip: Joi.number().default(0),
        limit: Joi.number().default(20),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetListDocument');
    },
  },
  advanceUserGetDetailDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetDetailDocument ${moduleName}`,
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
      Response(req, res, 'advanceUserGetDetailDocument');
    },
  },
  advanceUserAddDocument: {
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
        documentExpireDay: Joi.string().allow(['', null]).example(DATE_DISPLAY_FORMAT),
        documentPublishedDay: Joi.string().allow(['', null]).example(DATE_DISPLAY_FORMAT),
        documentPublisherName: Joi.string().allow(['', null]),
        documentTitle: Joi.string().required(),
        documentContent: Joi.string().allow(['', null]),
        documentCode: Joi.string().required(),
        documentCategory: Joi.number().allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
        documentFileUrlList: Joi.array()
          .items(
            Joi.object({
              documentFileName: Joi.string().min(0).max(500),
              documentFileUrl: Joi.string().min(0).max(500),
              documentFileSize: Joi.number(),
            }),
          )
          .max(MAX_LIMIT_FILE_PER_DOCUMENT),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserAddDocument');
    },
  },
  advanceUserRemoveDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserRemoveDocument ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
      Response(req, res, 'advanceUserRemoveDocument');
    },
  },
  advanceUserUpdateDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserRemoveDocument ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().integer(),
        data: Joi.object({
          documentExpireDay: Joi.string().allow(['', null]).example(DATE_DISPLAY_FORMAT),
          documentTitle: Joi.string().required(),
          documentContent: Joi.string().allow(['', null]),
          documentCode: Joi.string().required(),
          documentCategory: Joi.number().allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
          documentFileUrlList: Joi.array()
            .items(
              Joi.object({
                documentFileName: Joi.string().min(0).max(500),
                documentFileUrl: Joi.string().min(0).max(500),
                documentFileSize: Joi.number(),
              }),
            )
            .max(MAX_LIMIT_FILE_PER_DOCUMENT),
        }),
      }),
    },
    handler(req, res) {
      Response(req, res, 'advanceUserUpdateDocument');
    },
  },
};
