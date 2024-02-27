/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { OTP_CONFIRM_STATUS, DEFAULT_EXPIRED_MINUTE } = require('../OTPMessageConstant');
const tableName = 'OTPMessage';
const primaryKeyField = 'otpMessageId';
const Logger = require('../../../utils/logging');

async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('otp'); // ma otp
          table.string('id'); // luu (email/sdt)
          table.integer('expiredTime').defaultTo(DEFAULT_EXPIRED_MINUTE);
          table.integer('confirmStatus').defaultTo(OTP_CONFIRM_STATUS.NOT_CONFIRMED);
          table.integer('otpType').nullable();
          table.timestamp('confirmedAt', { useTz: true }).nullable();
          table.timestamp('expiredAt', { useTz: true }).nullable();
          timestamps(table);
          table.index('confirmStatus');
          table.index('otpType');
          table.index('expiredTime');
        })
        .then(() => {
          Logger.info(`${tableName} table created done`);
          resolve();
        });
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
  return await Common.find(tableName, filter, skip, limit, order);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  deleteById,
  modelName: tableName,
};
