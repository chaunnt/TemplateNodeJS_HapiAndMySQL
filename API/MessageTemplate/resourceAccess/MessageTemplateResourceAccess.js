/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { TEMPLATE_TYPE, getParamAttributeByName } = require('../MessageTemplateConstant');
const templateData = require('../data/templateData');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const tableName = 'MessageTemplate';
const primaryKeyField = 'messageTemplateId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('messageTemplateName', 500).nullable();
          table.string('messageTemplateContent', 500).nullable();
          table.string('messageDemo', 500).nullable();
          table.string('messageTemplateScope').nullable();
          table.string('messageTemplateType').defaultTo(TEMPLATE_TYPE.SMS_CSKH);
          table.integer('messageZNSTemplateId').nullable();
          table.integer('messageTemplateEnabled').defaultTo(0);
          table.integer('stationsId').nullable();
          table.integer('messageTemplatePrice').defaultTo(0);
          table.string('messageTemplateImage').nullable();
          table.text('messageTemplateData').nullable();
          table.integer('id').nullable();
          timestamps(table);
          table.index(primaryKeyField);
          table.index('stationsId');
          table.index('messageTemplateType');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

function _extractTemplateDataFromTemplateContent(templateContent) {
  let _paramList = [];
  let _tempSplitList = templateContent.split('{{');
  for (let i = 0; i < _tempSplitList.length; i++) {
    const _tempData = _tempSplitList[i];
    let _param = _tempData.split('}}')[0];
    if (isNotEmptyStringValue(_param) && _param !== 'TTDK ') {
      _paramList.push(getParamAttributeByName(_param));
    }
  }
  return _paramList;
}
async function seeding() {
  const seedData = [
    ...templateData.SMS_CSKH,
    ...templateData.SMS_PROMOTION,
    ...templateData.ZALO_CSKH,
    ...templateData.ZALO_PROMOTION,
    ...templateData.REPORT,
    ...templateData.STATION_SMS_CSKH,
  ];
  seedData.forEach(_seedDataItem => {
    _seedDataItem.messageTemplateData = JSON.stringify(_extractTemplateDataFromTemplateContent(_seedDataItem.messageTemplateContent));
  });
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedData)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('messageTemplateName', 'like', `%${searchText}%`)
        .orWhere('messageTemplateContent', 'like', `%${searchText}%`)
        .orWhere('messageTemplateScope', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.messageTemplateName) {
      queryBuilder.where('messageTemplateName', 'like', `%${searchText}%`);
      delete filterData.messageTemplateName;
    }

    if (filterData.messageTemplateContent) {
      queryBuilder.where('messageTemplateContent', 'like', `%${searchText}%`);
      delete filterData.messageTemplateContent;
    }

    if (filterData.messageTemplateScope) {
      queryBuilder.where('messageTemplateScope', 'like', `%${searchText}%`);
      delete filterData.messageTemplateScope;
    }
  }
  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, order);
  return await query.select();
}

async function customCount(filter, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  updateAll,
};
