/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { STATION_DEVICES_STATUS } = require('../StationDevicesConstants');
const tableName = 'StationDevices';
const primaryKeyField = 'stationDevicesId';
async function createTable() {
  console.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('stationsId');
          table.integer('deviceType'); // day chuyen loai
          table.integer('deviceNumber'); // day chuyen so
          table.string('deviceBrand'); // hang
          table.integer('purchaseYear'); // nam mua lap dat
          table.integer('liquidationYear'); // nam thang ly
          table.bigInteger('originalPrice'); // nguyen gia truoc thue
          table.string('supplyCompany'); // cong ty cung cap
          table.string('purchaseOrigin'); // co so mua sam
          table.string('deviceArea'); // dia ban

          table.string('deviceName'); // Tên thiết bị
          table.string('deviceSeri'); // Số seri của thiết bị
          table.integer('deviceManufactureYear'); // Ngày sản xuất
          table.string('deviceStatus').defaultTo(STATION_DEVICES_STATUS.NEW); // Trạng thái của thiết bị

          table.string('deviceTestedDate').nullable(); //  "Ngày kiểm chuẩn thiết bị"
          table.string('deviceExpiredTestedDate').nullable(); //"Ngày hết hạn kiểm chuẩn thiết bị"

          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('stationsId');
          table.index('deviceBrand');

          table.index('deviceName');
          table.index('deviceSeri');
        })
        .then(() => {
          console.info(`${tableName} table created done`);
          resolve();
        });
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
  initDB,
  deleteById,
  customCount,
  customSearch,
};
