/* Copyright (c) 2021-2024 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StaffPermission';
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
          let initialStaffPermissions = [
            'VIEW_DASHBOARD', //Thấy menu thống kê
            'VIEW_USERS', //Thấy menu danh sách user
            'VIEW_TRANSACTION_DEPOSIT_BANK', //Thấy tab nạp tiền bank
            'VIEW_TRANSACTION_DEPOSIT_USDT', //Thấy tab nạp tiền usdt
            'VIEW_TRANSACTION_WITHDRAW_BANK', //Thấy tab rút tiền bank
            'VIEW_TRANSACTION_WITHDRAW_USDT', //thấy tab rút tiền usdt
            'VIEW_TRANSACTION_BONUS', //thấy tab hoa hồng
            'VIEW_TRANSACTION', //thấy menu lịch sử giao dịch
            'VIEW_EVENTS', //thấy menu sự kiện
            'VIEW_SUPPORTS', //thấy menu hỗ trợ (Chat)
            'VIEW_STAFFS', //thấy menu nhân viên
            'VIEW_SYSTEM_CONFIG', //thấy menu thiết lập
            'VIEW_PAYMENT_METHOD', //thấy menu phương thức thanh toán
            'VIEW_MEMBERSHIP_LEVEL', //thấy menu cấp bậc
            'VIEW_MISSION_CONFIG', //thấy menu cấu hình nhiệm vụ
            'VIEW_GAMES', //thấy menu điều khiển game
            'VIEW_AGENTS', //thấy menu đại lý
            'VIEW_CONFIG_MAINTAIN', //thấy menu bảo trì
            'EDIT_USERS', //được phép sửa thông tin user
            'APPROVE_DEPOSIT', //được phép duyệt nạp tiền
            'APPROVE_WITHDRAW', //được phép duyệt rút tiền
            'VIEW_ALL_DEPOSIT', //được phép xem toàn bộ giao dịch nạp tiền của toàn hệ thống
            'VIEW_ALL_WITHDRAW', //được phép xem toàn bộ giao dịch rút tiền của toàn hệ thống
            'VIEW_ALL_USERS', //được phép xem user toàn bộ hệ thống (dành cho CSKH)
            'VIEW_PAYMENT_METHOD_BANK', // => thấy danh sách bank
            'VIEW_PAYMENT_METHOD_USDT', // => thấy danh sách tiền ảo
            'EDITS_PAYMENT_METHOD_BANK', // => edit được bank
            'EDITS_PAYMENT_METHOD_USDT', // => edit được tiền ảo
            'VIEW_SYSTEM_APP_LOG', // được phép xem lịch sử sửa đổi
          ];
          let permissionArr = [];
          for (let i = 0; i < initialStaffPermissions.length; i++) {
            const permission = initialStaffPermissions[i];
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
