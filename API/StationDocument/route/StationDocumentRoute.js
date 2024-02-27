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

const insertSchema = {
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
};

const updateSchema = {
  ...insertSchema,
  isHidden: Joi.number().min(0).max(1),
};

const filterSchema = {
  documentPublishedDay: Joi.string().example(DATE_DISPLAY_FORMAT),
  stationsId: Joi.number().integer(),
  documentCategory: Joi.number().allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
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
        searchText: Joi.string(),
        startDate: Joi.string().example(moment().format(DATE_DISPLAY_FORMAT)),
        endDate: Joi.string().example(moment().add(30, 'days').format(DATE_DISPLAY_FORMAT)),
        skip: Joi.number().default(0),
        limit: Joi.number().default(20),
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
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `deleteById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
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
      Response(req, res, 'deleteById');
    },
  },
  getListStationsNotView: {
    tags: ['api', `${moduleName}`],
    description: `get stations not view document ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
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
      Response(req, res, 'getListStationsNotViewDocument');
    },
  },
  adminUploadDocumentForStation: {
    tags: ['api', `${moduleName}`],
    description: `admin upload ${moduleName} for station`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(1).required(),
        documentExpireDay: Joi.string().allow(['', null]).example(DATE_DISPLAY_FORMAT),
        documentPublishedDay: Joi.string().allow(['', null]).example(DATE_DISPLAY_FORMAT),
        documentPublisherName: Joi.string().allow(['', null]),
        documentTitle: Joi.string().required(),
        documentContent: Joi.string().allow(['', null]),
        documentCode: Joi.string().required(),
        documentCategory: Joi.number().allow(null).allow(null).valid(Object.values(DOCUMENT_CATEGORY)),
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
      Response(req, res, 'adminUploadDocumentForStation');
    },
  },
};
