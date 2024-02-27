/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');
const { DB, timestamps } = require('../../../config/database');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE } = require('../AppUserVehicleConstant');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserVehicleDeleted';
const primaryKeyField = 'appUserVehicleDeletedId';
async function createTable() {
  console.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('appUserVehicleId');
          table.integer('stationsId');
          table.integer('appUserId');
          table.string('vehicleIdentity'); // bien so xe
          table.string('vehiclePlateColor').defaultTo(VEHICLE_PLATE_TYPE.WHITE); // mau bien so
          table.string('vehicleRegistrationCode'); // so quan ly
          table.integer('vehicleType').defaultTo(VEHICLE_TYPE.CAR); // loai phuong tien
          table.integer('vehicleSubCategory').nullable();
          table.string('vehicleBrandName'); // nhan hieu xe
          table.string('vehicleBrandModel'); // so loai
          table.text('vehicleRegistrationImageUrl').nullable(); // link anh giay dang kiem
          table.string('vehicleExpiryDate'); // ngay het han
          table.string('certificateSeries'); // so GCN moi nhat
          table.string('extendLicenseUrl', 500);
          table.string('extendLicenseOriginUrl', 500);
          table.integer('vehicleVerifiedInfo');
          table.string('vehicleExpiryDay');
          table.integer('vehicleSubType').nullable();
          table.string('vehicleHash'); // ma phuong tien
          table.boolean('vehicleSmall').defaultTo(1); // phuong tien nho
          table.integer('vehicleWeight'); // Khối lượng bản thân
          table.integer('vehicleGoodsWeight'); // Khối lượng hàng CC theo TK/CP TGGT
          table.integer('vehicleTotalWeight'); // Khối lượng toàn bộ theo TK/CP TGGT
          table.integer('vehicleSeatsLimit'); // Số lượng chỗ ngồi cho phép
          table.integer('vehicleFootholdLimit'); // Số lượng chỗ đứng cho phép
          table.integer('vehicleBerthLimit'); // Số lượng chỗ nằm cho phép
          table.integer('vehicleExtendLicense').nullable(); // gia han
          table.integer('vehicleCategory').nullable(); // loai phuong tien
          table.integer('vehicleCriminal').nullable(); // phat nguoi
          table.integer('equipDashCam'); // Có camera giám sát hành trình
          table.integer('vehicleForBusiness').nullable(); // co kinh doanh van tai
          table.integer('equipCruiseControlDevice'); // Có thiết bị giám sát hành trình
          table.integer('vehicleCycle'); // chu kỳ đăng kiểm
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('vehicleIdentity');
          table.index('vehicleType');
          table.index('vehicleSubCategory');
          table.index('appUserId');
          table.index('vehicleBrandName');
          table.index('stationsId');
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(AppDevicesId) {
  let dataId = {};
  dataId[primaryKeyField] = AppDevicesId;
  return await Common.deleteById(tableName, dataId);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  const queryBuilder = DB(tableName);
  const filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('vehicleIdentity', 'like', `%${searchText}%`);
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
    queryBuilder.where('vehicleExpiryDate', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('vehicleExpiryDate', '<=', endDate);
  }

  if (order && order.key !== '' && ['desc', 'asc'].includes(order.value)) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

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
  find,
  findById,
  insert,
  updateById,
  deleteById,
  count,
  initDB,
  customSearch,
  customCount,
};
