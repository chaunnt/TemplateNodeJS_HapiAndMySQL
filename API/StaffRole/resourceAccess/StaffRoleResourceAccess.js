/* Copyright (c) 2021-2023 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StaffRole';
const primaryKeyField = 'staffRoleId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('staffRoleId').primary();
          table.string('staffRoleName');
          table.string('permissions', 2000);
          timestamps(table);
          table.index('staffRoleId');
          table.index('staffRoleName');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(result => {
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

async function seeding() {
  return new Promise(async (resolve, reject) => {
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
    let initialStaffRoles = [
      {
        staffRoleName: 'Super Admin',
        permissions: initialStaffPermissions.join(','),
      },
      {
        staffRoleName: 'CSKH',
        permissions: 'VIEW_USERS,VIEW_SUPPORTS,VIEW_ALL_USERS,VIEW_ALL_WITHDRAW,VIEW_ALL_DEPOSIT',
      },
      {
        staffRoleName: 'Quản trị viên',
        permissions:
          'VIEW_DASHBOARD,VIEW_USERS,VIEW_TRANSACTION_DEPOSIT_BANK,VIEW_TRANSACTION_DEPOSIT_USDT,VIEW_TRANSACTION_WITHDRAW_BANK,VIEW_TRANSACTION_WITHDRAW_USDT,VIEW_TRANSACTION_BONUS,VIEW_TRANSACTION,VIEW_EVENTS,VIEW_SUPPORTS,VIEW_STAFFS,VIEW_SYSTEM_CONFIG,VIEW_PAYMENT_METHOD,VIEW_MEMBERSHIP_LEVEL,VIEW_MISSION_CONFIG,VIEW_GAMES,VIEW_AGENTS,VIEW_CONFIG_MAINTAIN,EDIT_USERS,VIEW_ALL_DEPOSIT,VIEW_ALL_WITHDRAW,VIEW_ALL_USERS,VIEW_PAYMENT_METHOD_BANK,VIEW_PAYMENT_METHOD_USDT,EDITS_PAYMENT_METHOD_BANK,EDITS_PAYMENT_METHOD_USDT',
      },
      {
        staffRoleName: 'Đối tác nạp tiền',
        permissions:
          'VIEW_TRANSACTION,VIEW_TRANSACTION_DEPOSIT_BANK, VIEW_TRANSACTION_WITHDRAW_BANK, VIEW_ALL_DEPOSIT, VIEW_ALL_WITHDRAW, APPROVE_DEPOSIT, APPROVE_WITHDRAW,VIEW_PAYMENT_METHOD_BANK,EDITS_PAYMENT_METHOD_BANK,VIEW_PAYMENT_METHOD',
      },
      {
        staffRoleName: 'Tổng đại lý',
        permissions: 'VIEW_DASHBOARD, VIEW_USERS,EDIT_USERS',
      },
    ];
    DB(`${tableName}`)
      .insert(initialStaffRoles)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (filterData.staffRoleName) {
    queryBuilder.where('staffRoleName', 'like', `%${filter.staffRoleName}%`);
    delete filterData.staffRoleName;
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
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return await query.count(`${primaryKeyField} as count`);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  customSearch,
  customCount,
};
