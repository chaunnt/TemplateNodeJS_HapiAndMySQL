/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { GAME_GROUP, GAME_PLAYERTYPE, USER_INROM } = require('../../GamePlayRoom/GamePlayRoomConstant');
const Logger = require('../../../utils/logging');

const tableName = 'AppUserGamePlayRooms';
const primaryKeyField = 'appUserGamePlayRoomId';
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('appUserId'); //ma nguoi choi
          table.integer('gameRoomId'); //ma phong
          table.integer('gameRoomPlayerType').defaultTo(GAME_PLAYERTYPE.PLAYER); //la leader | nguoi choi
          table.bigInteger('gameRoomTotalAmountIn').defaultTo(0); //so tien choi
          table.bigInteger('gameRoomTotalAmountWin').defaultTo(0); //so tien thang
          table.integer('group').defaultTo(GAME_GROUP.NHOMA); //nhom A = 0 | B = 1
          table.integer('userInRoomStatus').defaultTo(USER_INROM.PLAYING); //dang choi = 1 | da thoat = 0
          timestamps(table);
          table.index('appUserGamePlayRoomId');
          table.index('gameRoomPlayerType');
          table.index('userInRoomStatus');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve('ok');
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

async function find(filter, skip, limit, order, startDate, endDate) {
  return await Common.find(tableName, filter, skip, limit, order, startDate, endDate);
}

async function findById(id) {
  let dataId = { [primaryKeyField]: id };
  return await Common.findById(tableName, dataId, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function sum(field, filter, order) {
  return await Common.sum(tableName, field, filter, order);
}

async function updateAll(filter, data) {
  return await Common.updateAll(tableName, data, filter);
}

async function increment(id, key, amount) {
  const data = await findById(id);
  let gameValue = parseInt(data[key]);
  gameValue += amount;
  await updateById(id, {
    [key]: gameValue,
  });
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  sum,
  updateAll,
  increment,
  findById,
};
