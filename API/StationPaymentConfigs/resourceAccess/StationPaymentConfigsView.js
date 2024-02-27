/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationPaymentConfigsView';
const rootTableName = 'StationPaymentConfigs';
const primaryKeyField = 'stationsId';

async function stationPaymentView() {
  const StationTable = 'Stations';

  let fields = [
    `${rootTableName}.stationsId`,

    `${rootTableName}.bankConfigs`,
    `${rootTableName}.momoPersonalConfigs`,
    `${rootTableName}.momoBusinessConfigs`,
    `${rootTableName}.vnpayPersonalConfigs`,
    `${rootTableName}.vnpayBusinessConfigs`,
    `${rootTableName}.zalopayBusinessConfigs`,
    `${rootTableName}.zalopayPersonalConfigs`,

    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,

    `${StationTable}.stationCode`,
    `${StationTable}.stationPayments`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationTable}.stationsId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  stationPaymentView();
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  const queryBuilder = DB(tableName);
  const filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {});
  }

  queryBuilder.where({ isDeleted: 0 });

  queryBuilder.where(filterData);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  if (order && order.key !== '' && ['desc', 'asc'].includes(order.value)) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

function findById(id) {
  return Common.findById(tableName, primaryKeyField, id);
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);

  let count;

  try {
    const [record] = await query.count(`${primaryKeyField} as count`);
    if (record || record === 0) {
      count = record.count;
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
    Logger.error('ResourceAccess', e);
  }

  return count;
}

module.exports = {
  initViews,
  customSearch,
  customCount,
  findById,
};
