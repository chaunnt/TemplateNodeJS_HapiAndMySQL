/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { SCHEDULE_TYPE } = require('../CustomerScheduleConstants');

const tableName = 'CustomerSchedule';

const primaryKeyField = 'customerScheduleId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('customerScheduleId').primary();
          table.string('licensePlates');
          table.string('phone');
          table.string('fullnameSchedule');
          table.string('email');
          table.string('dateSchedule');
          table.string('time');
          table.string('notificationMethod');
          table.integer('vehicleType');
          table.integer('licensePlateColor');
          table.integer('stationsId');
          table.integer('scheduleSerial');
          table.string('scheduleCode');
          table.integer('CustomerScheduleStatus').defaultTo(0);
          table.integer('appUserId').nullable();
          table.integer('customerRecordId');
          table.text('scheduleNote').nullable();
          table.integer('createdBy');
          table.integer('customerReviewId');
          table.integer('scheduleType').defaultTo(SCHEDULE_TYPE.VEHICLE_INSPECTION); // loai lich hen
          table.string('scheduleHash');
          table.integer('confirmStatus').defaultTo(0);
          table.string(`scheduleTracking`).nullable();
          table.integer(`appUserVehicleId`);
          table.integer(`customerReceiptId`);
          table.string('partnerName'); // Lưu tên của partner khi partner đặt lịch
          table.string('daySchedule'); // Ngày đặt lịch dung để sort
          timestamps(table);
          table.index('customerScheduleId');
          table.index('licensePlates');
          table.index('phone');
          table.index('email');
          table.index('time');
          table.index('dateSchedule');
          table.index('CustomerScheduleStatus');
          table.index('stationsId');
          table.index('appUserId');
          table.index('vehicleType');
          table.index('scheduleType');
          table.index('appUserVehicleId');
          table.index('daySchedule');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
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

async function updateById(customerScheduleId, data) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleId;
  return await Common.updateById(tableName, dataId, data);
}
async function deleteById(customerScheduleId) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleId;
  return await Common.deleteById(tableName, dataId);
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('licensePlates', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`)
        .orWhere('phone', 'like', `%${searchText}%`)
        .orWhere('fullnameSchedule', 'like', `%${searchText}%`)
        .orWhere('scheduleSerial', 'like', `%${searchText}%`)
        .orWhere('scheduleCode', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  Common.filterHandler(filterData, queryBuilder);

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

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
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

async function findDeletedRecord(skip, limit) {
  let queryBuilder = DB(tableName);

  queryBuilder.where({ isDeleted: 1 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  return new Promise((resole, reject) => {
    try {
      queryBuilder.select().then(records => {
        resole(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function permanentlyDelete(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.permanentlyDelete(tableName, dataId);
}

async function findAllPhoneHasManySchedule() {
  let queryBuilder = await DB.raw(
    'SELECT phone, countSchedule FROM (SELECT phone, count(customerScheduleId) as countSchedule FROM CustomerSchedule WHERE isDeleted = 0 AND CustomerScheduleStatus = 10 GROUP BY phone) tbl WHERE countSchedule > 5 ORDER BY countSchedule DESC',
  );
  return queryBuilder[0];
}

async function findAllVehicleHasManyNewSchedule() {
  let queryBuilder = await DB.raw(
    `SELECT licensePlates, count(*) AS count FROM  ${tableName} WHERE (CustomerScheduleStatus = 0 OR CustomerScheduleStatus = 10) AND isDeleted = 0 GROUP BY licensePlates HAVING count >=  2;`,
  );
  return queryBuilder[0];
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  primaryKeyField,
  customSearch,
  customCount,
  deleteById,
  findDeletedRecord,
  permanentlyDelete,
  findAllPhoneHasManySchedule,
  findAllVehicleHasManyNewSchedule,
};
