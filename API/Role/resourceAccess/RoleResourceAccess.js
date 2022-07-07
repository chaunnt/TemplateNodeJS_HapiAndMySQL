"use strict";
require("dotenv").config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require("../../../config/database");
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = "Role";
const primaryKeyField = "roleId";
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('roleId').primary();
          table.string('roleName');
          table.string('permissions');
          timestamps(table);
          table.index('roleId');
          table.index('permissions');
          table.index('roleName');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then((result) => {
            Logger.info(`${tableName}`, `init ${tableName}` + result);
            resolve();
          })
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function seeding() {
  return new Promise(async (resolve, reject) => {
    let initialRoles = [
      {
        roleName: "Super Admin",
        permissions: "VIEW_DASHBOARD,VIEW_USERS,VIEW_STAFF,VIEW_STATION,VIEW_MENU,VIEW_SERVICE,VIEW_SCHEDULE,VIEW_CONFIGURATION,EDIT_USERS,EDIT_STAFF,VIEW_SERVICE_PACKAGE"
      },
      {
        roleName: "Station Admin",
        permissions: "VIEW_DASHBOARD,VIEW_USERS,VIEW_STAFF,EDIT_STAFF,VIEW_SCHEDULE"
      },
      {
        roleName: "Station Support",
        permissions: "VIEW_USERS,VIEW_STAFF,VIEW_SCHEDULE"
      },
      {
        roleName: "Station Operator",
        permissions: "VIEW_SCHEDULE"
      },
      {
        roleName: "Station Trainer",
        permissions: "VIEW_SCHEDULE"
      },
    ]
    DB(`${tableName}`).insert(initialRoles).then((result) => {
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

function _makeQueryBuilderByFilter(filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (filterData.roleName) {
    queryBuilder.where('roleName', 'like', `%${filter.roleName}%`);
    delete filterData.roleName
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
    queryBuilder.orderBy("createdAt", "desc")
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, order);
  return await query.select();
}

async function customCount(filter, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, order);
  return await query.count(`${primaryKeyField} as count`);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  customSearch,
  customCount
};
