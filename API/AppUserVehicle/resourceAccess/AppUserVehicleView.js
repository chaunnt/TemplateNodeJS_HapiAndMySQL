/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserVehicleView';
const rootTableName = 'AppUserVehicle';
const primaryKeyField = 'appUserVehicleId';
const AppUserVehicleSettingTable = 'AppUserVehicleSetting';

async function createAppUserVehicleView() {
  const StationTable = 'Stations';
  const AppUserTable = 'AppUser';

  let fields = [
    `${rootTableName}.appUserVehicleId`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.vehicleIdentity`,
    `${rootTableName}.vehiclePlateColor`,
    `${rootTableName}.vehicleRegistrationCode`,
    `${rootTableName}.vehicleType`,
    `${rootTableName}.vehicleSubCategory`,
    `${rootTableName}.vehicleBrandName`,
    `${rootTableName}.vehicleBrandModel`,
    `${rootTableName}.vehicleRegistrationImageUrl`,
    `${rootTableName}.vehicleExpiryDate`,
    `${rootTableName}.certificateSeries`,
    `${rootTableName}.extendLicenseUrl`,
    `${rootTableName}.vehicleVerifiedInfo`,
    `${rootTableName}.vehicleHash`,
    `${rootTableName}.vehicleWeight`,
    `${rootTableName}.vehicleGoodsWeight`,
    `${rootTableName}.vehicleTotalWeight`,
    `${rootTableName}.vehicleSeatsLimit`,
    `${rootTableName}.vehicleFootholdLimit`,
    `${rootTableName}.vehicleBerthLimit`,
    `${rootTableName}.equipCruiseControlDevice`,
    `${rootTableName}.equipDashCam`,
    `${rootTableName}.vehicleCycle`,
    `${rootTableName}.vehicleCriminal`,
    `${rootTableName}.vehicleSubType`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.vehicleExpiryDay`,

    `${AppUserTable}.username`,

    `${StationTable}.stationsName`,
    `${StationTable}.stationUrl`,

    `${AppUserVehicleSettingTable}.vehicleExpiryDateBHTNDS`,
    `${AppUserVehicleSettingTable}.vehicleExpiryDateBHTV`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationTable}.stationsId`);
    })
    .leftJoin(AppUserVehicleSettingTable, function () {
      this.on(`${rootTableName}.appUserVehicleId`, '=', `${AppUserVehicleSettingTable}.appUserVehicleId`);
    })
    .leftJoin(AppUserTable, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${AppUserTable}.appUserId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createAppUserVehicleView();
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
async function findById(id, skipCache) {
  return await Common.findById(tableName, primaryKeyField, id, skipCache);
}
function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('vehicleIdentity', 'like', `%${searchText}%`);
      this.orWhere('vehicleRegistrationCode', 'like', `%${searchText}%`);
      this.orWhere('username', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('vehicleExpiryDay', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('vehicleExpiryDay', '<=', endDate);
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
    queryBuilder.orderBy(primaryKeyField, 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);

  if (process.env.ENABLE_OPTIMIZE_QUERYDB * 1 === 1) {
    const records = await query.select(primaryKeyField);
    const updatedRecords = [];
    for (const recordId of records) {
      const record = await findById(recordId[primaryKeyField], true);
      updatedRecords.push(record);
    }
    return updatedRecords;
  } else {
    const records = await query.select();
    return records;
  }
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)}`);
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
