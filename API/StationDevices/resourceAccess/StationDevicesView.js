/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationDevicesView';
const rootTableName = 'StationDevices';
const primaryKeyField = 'stationDevicesId';

async function createStationDevicesView() {
  const StationTableName = 'Stations';

  let fields = [
    `${rootTableName}.stationDevicesId`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.deviceType`,
    `${rootTableName}.deviceNumber`,
    `${rootTableName}.deviceBrand`,
    `${rootTableName}.purchaseYear`,
    `${rootTableName}.liquidationYear`,
    `${rootTableName}.originalPrice`,
    `${rootTableName}.supplyCompany`,
    `${rootTableName}.purchaseOrigin`,
    `${rootTableName}.deviceArea`,

    `${rootTableName}.deviceName`,
    `${rootTableName}.deviceSeri`,
    `${rootTableName}.deviceManufactureYear`,
    `${rootTableName}.deviceStatus`,

    `${rootTableName}.deviceTestedDate`,
    `${rootTableName}.deviceExpiredTestedDate`,

    `${rootTableName}.updatedAt`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.isDeleted`,

    `${StationTableName}.stationsName`,
    `${StationTableName}.stationCode`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationTableName, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationTableName}.stationsId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createStationDevicesView();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

function findById(id) {
  return Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  const queryBuilder = DB(tableName);
  const filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('purchaseYear', 'like', `%${searchText}%`);
      this.orWhere('liquidationYear', 'like', `%${searchText}%`);
      this.orWhere('deviceName', 'like', `%${searchText}%`);
      this.orWhere('deviceSeri', 'like', `%${searchText}%`);
      this.orWhere('deviceBrand', 'like', `%${searchText}%`);
    });
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
  insert,
  find,
  findById,
  count,
  updateById,
  initViews,
  deleteById,
  customCount,
  customSearch,
};
