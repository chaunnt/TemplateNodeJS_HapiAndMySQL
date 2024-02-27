/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Role';
const primaryKeyField = 'roleId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('roleId').primary();
          table.string('roleName');
          table.text('permissions');
          timestamps(table);
          table.index('roleId');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let roles = ['Admin', , ,];
          let rolesArr = [];
          let adminPermissions = await DB(`Permission`).select();
          let permissionList = [];
          for (let i = 0; i < adminPermissions.length; i++) {
            const permission = adminPermissions[i];
            permissionList.push(permission.permissionKey);
          }
          permissionList = permissionList.join(',');
          rolesArr.push({
            roleName: 'Admin',
            permissions: permissionList,
          });
          rolesArr.push({
            roleName: 'Quản trị phòng ban',
            permissions:
              'VIEW_STATIONS,VIEW_STATIONS_USERS,VIEW_STATIONS_STAFFS,VIEW_STATIONS_VEHICLES,VIEW_STATIONS_DOCUMENT,VIEW_STATIONS_SCHEDULE,VIEW_STATIONS_REPORT,VIEW_STATIONS_DEVICES',
          });
          rolesArr.push({
            roleName: 'Quản trị viên',
            permissions:
              'VIEW_STATIONS,VIEW_STATIONS_USERS,VIEW_STATIONS_STAFFS,VIEW_STATIONS_VEHICLES,VIEW_STATIONS_DOCUMENT,VIEW_STATIONS_SCHEDULE,VIEW_STATIONS_REPORT,VIEW_STATIONS_DEVICES,VIEW_APP_USERS,VIEW_STAFFS,VIEW_CHAT,VIEW_NOTIFICATION,VIEW_DOCUMENTS,VIEW_NEWS,VIEW_PAYMENTS,VIEW_INTEGRATIONS ,VIEW_SYSTEM_CONFIGURATIONS',
          });
          rolesArr.push({
            roleName: 'Nhân viên hành chính',
            permissions:
              'VIEW_STATIONS,VIEW_STATIONS_USERS,VIEW_STATIONS_STAFFS,VIEW_VEHICLE,VIEW_STATIONS_VEHICLES,VIEW_STATIONS_DOCUMENT,VIEW_STATIONS_SCHEDULE,VIEW_STATIONS_REPORT,VIEW_STATIONS_DEVICES',
          });

          DB(`${tableName}`)
            .insert(rolesArr)
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
};
