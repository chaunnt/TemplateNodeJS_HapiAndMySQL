/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationsView';
const rootTableName = 'Stations';
const primaryKeyField = 'stationsId';

async function createView() {
  const StationServicesTable = 'StationServices';

  let fields = [
    `${rootTableName}.stationsId`,
    `${rootTableName}.stationsName`,
    `${rootTableName}.stationCode`,
    `${rootTableName}.stationUrl`,
    `${rootTableName}.stationsLogo`,
    `${rootTableName}.stationsBanner`,
    `${rootTableName}.stationsColorset`,
    `${rootTableName}.stationsHotline`,
    `${rootTableName}.stationsAddress`,
    `${rootTableName}.stationsEmail`,
    `${rootTableName}.stationBookingConfig`,
    `${rootTableName}.stationWorkTimeConfig`,
    `${rootTableName}.stationMapSource`,
    `${rootTableName}.stationsCertification`,
    `${rootTableName}.stationsVerifyStatus`,
    `${rootTableName}.stationsManager`,
    `${rootTableName}.stationsLicense`,
    `${rootTableName}.stationLandingPageUrl`,
    `${rootTableName}.stationStatus`,
    `${rootTableName}.availableStatus`,
    `${rootTableName}.totalSmallCar`,
    `${rootTableName}.totalOtherVehicle`,
    `${rootTableName}.totalRoMooc`,
    `${rootTableName}.enablePaymentGateway`,
    `${rootTableName}.stationScheduleNote`,
    `${rootTableName}.stationArea`,
    `${rootTableName}.stationPayments`,
    `${rootTableName}.stationType`,
    `${rootTableName}.enablePriorityMode`,

    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.isDeleted as isDeletedStation`,

    `${StationServicesTable}.stationServicesId`,
    `${StationServicesTable}.serviceType`,
    `${StationServicesTable}.servicePrice`,
    `${StationServicesTable}.serviceName`,
    `${StationServicesTable}.isDeleted`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationServicesTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationServicesTable}.stationsId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createView();
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, searchText, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('stationsName', 'like', `%${searchText}%`)
        .orWhere('stationCode', 'like', `%${searchText}%`)
        .orWhere('stationsAddress', 'like', `%${searchText}%`)
        .orWhere('stationArea', 'like', `%${searchText}%`);
    });
  }

  Common.filterHandler(filterData, queryBuilder);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('updatedAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, searchText, skip, limit, order) {
  let query = _makeQueryBuilderByFilter(filter, searchText, skip, limit, order);
  return await query.select();
}

async function customCount(filter, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, searchText, undefined, undefined, order);
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
  findById,
  customSearch,
  customCount,
};
