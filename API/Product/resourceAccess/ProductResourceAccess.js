/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Product';
const primaryKeyField = 'productId';
const Logger = require('../../../utils/logging');
const { PRODUCT_STATUS } = require('../ProductConstant');

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  console.info(`create table ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('producName'); // Bộ số (string)
          table.string('productTitle');
          table.text('productDescription');
          table.text('productShortDescription');
          table.integer('quantity'); // số lượng nhập
          table.string('productChannel').defaultTo(''); //Đài (kênh)
          table.string('productCategory').defaultTo(''); //Nội dung giao dịch
          table.string('productType').defaultTo(''); //đơn, cặp
          table.integer('stockQuantity').defaultTo(0); //Số lượng tồn kho
          table.string('productStatus').defaultTo(PRODUCT_STATUS.NEW); //Trạng thái
          table.float('price', 20, 5).defaultTo(0); //Giá bán
          table.string('expireDate'); //Ngày xổ
          table.integer('staffId');
          timestamps(table);
          table.index('staffId'); // Nhân viên nhập
          table.index('productChannel');
          table.index('producName');
          table.index('productTitle');
          table.index('productStatus');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

async function seeding() {
  let seedingData = [
    {
      producName: '336713',
      quantity: 11,
      productChannel: 'TPHCM',
      productType: 'SINGLE',
      stockQuantity: 11,
      expireDate: '2022/01/20',
      price: 10500,
    },
    {
      producName: '36713',
      quantity: 110,
      productChannel: 'TPHCM',
      productType: 'BATCH',
      stockQuantity: 1,
      expireDate: '2022/01/20',
      price: 10500 * 110,
    },
  ];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedingData)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}
async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}
function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('producName', 'like', `%${searchText}%`)
        .orWhere('productTitle', 'like', `%${searchText}%`)
        .orWhere('productChannel', 'like', `%${searchText}%`)
        .orWhere('productType', 'like', `%${searchText}%`)
        .orWhere('productStatus', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
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
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error(
        'ResourceAccess',
        `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function find(filter, skip, limit, order) {
  filter.isDeleted = 0;
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  deleteById,
  customSearch,
  customCount,
};
