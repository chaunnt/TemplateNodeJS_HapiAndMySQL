/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { PAYMENT_TYPE } = require('../PaymentMethodConstant');
const tableName = 'PaymentMethod';
const primaryKeyField = 'paymentMethodId';
const Logger = require('../../../utils/logging');

async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('paymentMethodId').primary();
          table.integer('appUserId');
          table.string('paymentMethodName');
          table.integer('paymentMethodType').defaultTo(PAYMENT_TYPE.USDT);
          table.string('paymentMethodIdentityNumber').nullable();
          table.string('paymentMethodReferName').nullable();
          table.string('paymentMethodReceiverName').nullable();
          table.string('paymentMethodImageUrl').nullable();
          table.string('paymentMethodQrCodeUrl').nullable();
          timestamps(table);
          table.index('paymentMethodId');
          table.index('paymentMethodType');
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
      paymentMethodName: 'VCB',
      paymentMethodIdentityNumber: '53723472393',
      paymentMethodReferName: '',
      paymentMethodReceiverName: 'Nguyen Van A',
      paymentMethodType: PAYMENT_TYPE.ATM_BANK,
    },
    {
      paymentMethodName: 'MBB',
      paymentMethodIdentityNumber: '211222334512',
      paymentMethodReferName: '',
      paymentMethodReceiverName: 'Tran van B',
      paymentMethodType: PAYMENT_TYPE.ATM_BANK,
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

async function find(filter, skip, limit, order) {
  filter.isDeleted = 0;
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
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
};
