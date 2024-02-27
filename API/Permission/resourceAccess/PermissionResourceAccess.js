/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Permission';
const primaryKeyField = 'permissionId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('permissionName');
          table.string('permissionKey');
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('permissionName');
          table.index('permissionKey');
          table.unique('permissionKey');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let initialPermissions = [
            'VIEW_DASHBOARD', // Trang chủ
            'VIEW_STATIONS', // Danh sách TTDK
            'VIEW_STATIONS_USERS', // Nhân viên
            'VIEW_STATIONS_STAFFS', // Đăng kiểm viên
            'VIEW_STATIONS_VEHICLES', // Hồ sơ phương tiện
            'VIEW_VEHICLE', //Danh sách phương tiện
            'VIEW_STATIONS_DOCUMENT', // Tài liệu
            'VIEW_STATIONS_SCHEDULE', // Lịch hẹn
            'VIEW_STATIONS_REPORT', // Báo cáo
            'VIEW_STATIONS_DEVICES', // Thiết bị
            'VIEW_APP_USERS', // Người dùng
            'VIEW_STAFFS', // Quản trị viên
            'VIEW_CHAT', // Chat
            'VIEW_NOTIFICATION', // Thông báo
            'VIEW_DOCUMENTS', // Công văn
            'VIEW_NEWS', // Tin Tức
            'VIEW_PAYMENTS', // Thanh toán
            'VIEW_INTEGRATIONS', // Tích hợp
            'VIEW_SYSTEM_CONFIGURATIONS', // Cài đặt
          ];
          let permissionArr = [];
          for (let i = 0; i < initialPermissions.length; i++) {
            const permission = initialPermissions[i];
            permissionArr.push({
              permissionName: permission,
              permissionKey: permission.toUpperCase().replace(/\s/gi, '_'),
            });
          }

          DB(`${tableName}`)
            .insert(permissionArr)
            .then(result => {
              Logger.info(`${tableName}`, `init ${tableName}` + result);
              resolve();
            });
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
};
