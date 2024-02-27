/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationCustomerView';
const rootTableName = 'StationCustomer';
const primaryKeyField = 'stationCustomerId';

async function createAppDevicesView() {
  const AppUsersTable = 'AppUser';
  const AppUserVehicleTable = 'AppUserVehicle';
  const StationsTable = 'Stations';

  let fields = [
    `${rootTableName}.${primaryKeyField}`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.appUserVehicleId`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.isDeleted`,

    `${AppUsersTable}.username`,
    `${AppUsersTable}.firstName`,
    `${AppUsersTable}.lastName`,
    `${AppUsersTable}.phoneNumber`,
    `${AppUsersTable}.email`,

    `${AppUserVehicleTable}.vehicleIdentity`,
    `${AppUserVehicleTable}.vehiclePlateColor`,

    `${StationsTable}.stationsName`,
    `${StationsTable}.stationCode`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(AppUsersTable, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${AppUsersTable}.appUserId`);
    })
    .leftJoin(AppUserVehicleTable, function () {
      this.on(`${rootTableName}.appUserVehicleId`, '=', `${AppUserVehicleTable}.appUserVehicleId`);
    })
    .leftJoin(StationsTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationsTable}.stationsId`);
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
      this.orWhere('vehicleIdentity', 'like', `%${searchText}%`);
      this.orWhere('username', 'like', `%${searchText}%`);
      this.orWhere('firstName', 'like', `%${searchText}%`);
      this.orWhere('lastName', 'like', `%${searchText}%`);
      this.orWhere('email', 'like', `%${searchText}%`);
      this.orWhere('stationsName', 'like', `%${searchText}%`);
      this.orWhere('stationCode', 'like', `%${searchText}%`);
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
