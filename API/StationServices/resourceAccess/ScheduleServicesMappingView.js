/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'ScheduleServicesMappingView';
const rootTableName = 'ScheduleServicesMapping';
const primaryKeyField = 'scheduleServicesMappingId';

async function createAppDevicesView() {
  const StationServicesTable = 'StationServices';

  let fields = [
    `${rootTableName}.${primaryKeyField}`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.customerScheduleId`,
    `${rootTableName}.stationServicesId`,
    `${rootTableName}.isDeleted`,

    `${StationServicesTable}.serviceType`,
    `${StationServicesTable}.servicePrice`,
    `${StationServicesTable}.serviceName`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationServicesTable, function () {
      this.on(`${rootTableName}.stationServicesId`, '=', `${StationServicesTable}.stationServicesId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createAppDevicesView();
}
async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  return await Common.updateById(tableName, { userId: id }, data);
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
async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}
function _makeQueryBuilderByFilter(filter, skip, limit, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('serviceName', 'like', `%${searchText}%`);
    });
  }

  queryBuilder.where({ isDeleted: 0 });

  Common.filterHandler(filterData, queryBuilder);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
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
  count,
  updateById,
  initViews,
  updateAll,
  findById,
  customSearch,
  customCount,
};
