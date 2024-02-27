/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by Huu on 12/31/21.
 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserMembership';
const primaryKeyField = 'appUserMembershipId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('appUserMembershipTitle').nullable();
          table.string('appUserMembershipDescription', 500).nullable();
          table.string('appUserMembershipImage').nullable();
          table.integer('appUserMembershipInvitationRequired').defaultTo(0);
          table.bigInteger('appUserMembershipAssetRequired').defaultTo(0);
          table.bigInteger('appUserMembershipAssetF1Required').defaultTo(0);
          table.float('appUserMembershipBonusRate').defaultTo(0);
          table.string('appUserMembershipBonusPrizeName').nullable();
          table.integer('appUserMembershipBonusPrizeType').defaultTo(0);
          table.integer('appUserMembershipBonusPrize').defaultTo(0);
          table.float('appUserMembershipPlayBonus').defaultTo(0); //% hoa hong tong giao dich
          table.float('appUserMembershipBonusRateF1').defaultTo(0);
          table.float('appUserMembershipBonusRateF2').defaultTo(0);
          table.float('appUserMembershipBonusRateF3').defaultTo(0);
          table.float('appUserMembershipBonusRateF4').defaultTo(0);
          table.float('appUserMembershipBonusRateF5').defaultTo(0);
          table.float('appUserMembershipBonusRateF6').defaultTo(0);
          table.float('appUserMembershipBonusRateF7').defaultTo(0);
          table.float('appUserMembershipBonusRateF8').defaultTo(0);
          table.float('appUserMembershipBonusRateF9').defaultTo(0);
          table.float('appUserMembershipBonusRateF10').defaultTo(0);
          timestamps(table);
          table.index(`${primaryKeyField}`);
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
  let projectStatus = [
    {
      appUserMembershipTitle: 'VIP0',
      appUserMembershipInvitationRequired: 0,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership1.png`,
      appUserMembershipAssetRequired: 100,
      appUserMembershipAssetF1Required: 0,
      appUserMembershipBonusRate: 0,
      appUserMembershipPlayBonus: 0.5,
      appUserMembershipBonusPrize: 500000,
      appUserMembershipBonusRateF1: 0,
      appUserMembershipBonusRateF2: 0,
      appUserMembershipBonusRateF3: 0,
      appUserMembershipBonusRateF4: 0,
      appUserMembershipBonusRateF5: 0,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP1',
      appUserMembershipInvitationRequired: 0,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership2.png`,
      appUserMembershipAssetRequired: 100,
      appUserMembershipAssetF1Required: 100000000,
      appUserMembershipBonusRate: 0,
      appUserMembershipPlayBonus: 0.5,
      appUserMembershipBonusPrize: 500000,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0,
      appUserMembershipBonusRateF3: 0,
      appUserMembershipBonusRateF4: 0,
      appUserMembershipBonusRateF5: 0,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP2',
      appUserMembershipInvitationRequired: 100,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership3.png`,
      appUserMembershipAssetRequired: 1000,
      appUserMembershipAssetF1Required: 200000000,
      appUserMembershipBonusRate: 0.5,
      appUserMembershipPlayBonus: 0.25,
      appUserMembershipBonusPrize: 250000,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0.25,
      appUserMembershipBonusRateF3: 0,
      appUserMembershipBonusRateF4: 0,
      appUserMembershipBonusRateF5: 0,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP3',
      appUserMembershipInvitationRequired: 500,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership4.png`,
      appUserMembershipAssetRequired: 3000,
      appUserMembershipAssetF1Required: 400000000,
      appUserMembershipBonusRate: 1,
      appUserMembershipPlayBonus: 0.125,
      appUserMembershipBonusPrize: 125000,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0.25,
      appUserMembershipBonusRateF3: 0.12,
      appUserMembershipBonusRateF4: 0,
      appUserMembershipBonusRateF5: 0,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP4',
      appUserMembershipInvitationRequired: 1000,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership5.png`,
      appUserMembershipAssetRequired: 10000,
      appUserMembershipAssetF1Required: 800000000,
      appUserMembershipBonusRate: 3,
      appUserMembershipPlayBonus: 0.0625,
      appUserMembershipBonusPrize: 62500,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0.25,
      appUserMembershipBonusRateF3: 0.12,
      appUserMembershipBonusRateF4: 0.06,
      appUserMembershipBonusRateF5: 0,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP5',
      appUserMembershipInvitationRequired: 1000,
      appUserMembershipAssetRequired: 30000,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership6.png`,
      appUserMembershipAssetF1Required: 1600000000,
      appUserMembershipBonusRate: 5,
      appUserMembershipPlayBonus: 0.03125,
      appUserMembershipBonusPrize: 31250,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0.25,
      appUserMembershipBonusRateF3: 0.12,
      appUserMembershipBonusRateF4: 0.06,
      appUserMembershipBonusRateF5: 0.03,
      appUserMembershipBonusRateF6: 0,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
    {
      appUserMembershipTitle: 'VIP6',
      appUserMembershipInvitationRequired: 1000,
      appUserMembershipAssetRequired: 30000,
      appUserMembershipDescription: 'day la thanh vien',
      appUserMembershipImage: `https://${process.env.HOST_NAME}/uploads/sample_membership7.png`,
      appUserMembershipAssetF1Required: 3200000000,
      appUserMembershipBonusRate: 5,
      appUserMembershipPlayBonus: 0.015625,
      appUserMembershipBonusPrize: 15625,
      appUserMembershipBonusRateF1: 0.5,
      appUserMembershipBonusRateF2: 0.25,
      appUserMembershipBonusRateF3: 0.12,
      appUserMembershipBonusRateF4: 0.06,
      appUserMembershipBonusRateF5: 0.03,
      appUserMembershipBonusRateF6: 0.02,
      appUserMembershipBonusRateF7: 0,
      appUserMembershipBonusRateF8: 0,
      appUserMembershipBonusRateF9: 0,
      appUserMembershipBonusRateF10: 0,
    },
  ];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(projectStatus)
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
async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (filterData.appUserMembershipTitle) {
    queryBuilder.where('appUserMembershipTitle', 'like', `%${filterData.appUserMembershipTitle}%`);
    delete filterData.appUserMembershipTitle;
  }

  if (filterData.appUserMembershipDescription) {
    queryBuilder.where('appUserMembershipDescription', 'like', `%${filterData.appUserMembershipDescription}%`);
    delete filterData.appUserMembershipDescription;
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
  deleteById,
  findById,
  initDB,
  customSearch,
  customCount,
};
