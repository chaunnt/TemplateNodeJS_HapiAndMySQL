/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const {
  VEHICLE_PLATE_TYPE,
  VEHICLE_TYPE,
  EQUIP_CRUISE_CONTROL_DEVICE_STATUS,
  EQUIP_DASH_CAM_STATUS,
} = require('../../AppUserVehicle/AppUserVehicleConstant');
const tableName = 'VehicleProfile';
const primaryKeyField = 'vehicleProfileId';

async function createTable() {
  console.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('stationsId'); // don vi quan ly
          table.string('vehiclePlateNumber'); // bien so xe
          table.string('vehiclePlateColor').defaultTo(VEHICLE_PLATE_TYPE.WHITE); // mau bien so
          table.string('engineNumber'); // so may
          table.string('chassisNumber'); // so khung
          table.integer('manufacturedYear'); // nam san xuat
          table.string('manufacturedCountry'); // nuoc san xuat
          table.string('lifeTimeLimit'); // nien han su dung
          table.string('wheelFormula'); // cong thuc banh xe
          table.string('wheelTreat'); // vet banh xe
          table.string('overallDimension'); // kich thuoc bao
          table.integer('wheelBase'); // chieu dai co so
          table.string('vehicleFuelType'); // loai nhien lieu
          table.integer('engineDisplacement'); // the tich dong co
          table.integer('maxCapacity'); // cong suat lon nhat (kW)
          table.integer('revolutionsPerMinute'); // toc do quay (vph)
          table.string('truckDimension'); // kich thuoc long thung xe
          table.integer('vehicleTotalMass'); // khoi luong keo theo TK/CP TGGT
          table.string('vehicleTires'); //  so luong lop, co lop, truc
          table.string('vehicleNote', 500); //  ghi chu
          table.string('vehicleForRenovation'); // cai tao
          table.string('vehicleForNoStamp'); //  khong cap tem kiem dinh
          table.string('subCategory').nullable();

          table.string('vehicleRegistrationCode'); // so quan ly
          table.string('vehicleType').nullable().defaultTo(null); // loai phuong tien
          table.string('vehicleBrandName').nullable(); // nhan hieu xe
          table.string('vehicleBrandModel').nullable(); // so loai
          table.text('vehicleRegistrationImageUrl').nullable(); // link anh giay dang kiem
          table.string('vehicleExpiryDate').nullable(); // ngay het han
          table.string('certificateSeries').nullable(); // so GCN moi nhat
          table.string('extendLicenseOriginUrl', 500).nullable(); // giay gia han ben cuc
          table.string('extendLicenseUrl', 500);
          table.integer('vehicleWeight').nullable(); // Khối lượng bản thân
          table.integer('vehicleGoodsWeight').nullable(); // Khối lượng hàng CC theo TK/CP TGGT
          table.integer('vehicleTotalWeight').nullable(); // Khối lượng toàn bộ theo TK/CP TGGT
          table.integer('vehicleSeatsLimit').nullable(); // Số lượng chỗ ngồi cho phép
          table.integer('vehicleFootholdLimit').nullable(); // Số lượng chỗ đứng cho phép
          table.integer('vehicleBerthLimit').nullable(); // Số lượng chỗ nằm cho phép
          table.integer('vehicleExtendLicense').nullable(); // gia han
          table.integer('vehicleCategory').nullable(); // loai phuong tien
          table.integer('vehicleCriminal').nullable(); // phat nguoi
          table.integer('vehicleForBusiness').nullable(); // co kinh doanh van tai
          table.integer('equipCruiseControlDevice').defaultTo(EQUIP_CRUISE_CONTROL_DEVICE_STATUS.HAVE); // Có thiết bị giám sát hành trình
          table.integer('equipDashCam').defaultTo(EQUIP_DASH_CAM_STATUS.HAVE); // Có camera giám sát hành trình

          timestamps(table);
          table.index(primaryKeyField);
          table.index('stationsId');
          table.index('vehicleType');
          table.index('vehicleCategory');
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
      this.orWhere('vehiclePlateNumber', 'like', `%${searchText}%`);
      this.orWhere('engineNumber', 'like', `%${searchText}%`);
      this.orWhere('chassisNumber', 'like', `%${searchText}%`);
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
  modelName: tableName,
};
