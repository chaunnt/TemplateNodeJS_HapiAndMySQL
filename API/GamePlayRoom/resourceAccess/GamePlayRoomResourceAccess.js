/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { GAMEROOM_TYPE, GAMEROOM_STATUS } = require('../GamePlayRoomConstant');
const { GAME_ID } = require('../../GamePlayRecords/GamePlayRecordsConstant');
const { GAME_RECORD_UNIT_BO } = require('../../GamePlayRecords/GamePlayRecordsConstant');
const Logger = require('../../../utils/logging');

const tableName = 'GamePlayRooms';
const primaryKeyField = 'gamePlayRoomId';
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('gameRoomName'); //ten phong
          table.integer('gameRoomType').defaultTo(GAMEROOM_TYPE.HETHONG); //loai phong
          table.float('gameRoomTotalAmountInA', 48, 24).defaultTo(0); //tong choi cua nhom A
          table.float('gameRoomTotalAmountInB', 48, 24).defaultTo(0); //tong choi cua nhom B
          table.float('gameRoomTotalAmountWinA', 48, 24).defaultTo(0); //tong lai cua nhom A
          table.float('gameRoomTotalAmountWinB', 48, 24).defaultTo(0); //tong lai cua nhom B
          table.string('gameRoomLogoUrl'); //logo phong
          table.string('gameRoomPassword'); //mat khau phong
          table.integer('gameRoomTimeLeft'); //link chia se phong
          table.string('gameRoomLink'); //link chia se phong
          table.integer('gameInfoId'); //ma game
          table.string('gameType'); //gameRecordType
          table.integer('gameRoomStatus').defaultTo(GAMEROOM_STATUS.ACTIVE); //trang thai phong
          timestamps(table);
          table.index('gamePlayRoomId');
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
    initObject('Sảnh vinh quang', GAME_ID.TIGERDRAGON1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh phú quý', GAME_ID.TIGERDRAGON1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh kim cương', GAME_ID.TIGERDRAGON1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh vinh quang', GAME_ID.BACARAT1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh phú quý', GAME_ID.BACARAT1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh kim cương', GAME_ID.BACARAT1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh vinh quang', GAME_ID.XOCDIA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh phú quý', GAME_ID.XOCDIA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh kim cương', GAME_ID.XOCDIA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh vinh quang', GAME_ID.BAUCUA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh phú quý', GAME_ID.BAUCUA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Sảnh kim cương', GAME_ID.BAUCUA1P, GAMEROOM_TYPE.HETHONG),
    initObject('Phòng BTC', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.BTC),
    initObject('Sảnh ETH', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.ETH),
    initObject('Sảnh LITECOIN', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.LTC),
    initObject('Sảnh BNB', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.BNB),
    initObject('Sảnh RIPPLE', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.RIPPLE),
    initObject('Sảnh SHIBA', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.SHIBA),
    initObject('Sảnh TRON', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.TRON),
    initObject('Sảnh DOGE', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.DOGE),
    initObject('Sảnh SOLANA', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.SOLANA),
    initObject('Sảnh CARDANO', GAME_ID.BINARYOPTION, GAMEROOM_TYPE.HETHONG, '', GAME_RECORD_UNIT_BO.CARDANO),
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

function initObject(gameRoomName, gameInfoId, gameRoomType, gameRoomLogoUrl = '', gameType = '') {
  return {
    gameRoomName: gameRoomName,
    gameInfoId: gameInfoId,
    gameRoomType: gameRoomType,
    gameRoomLogoUrl: gameRoomLogoUrl,
    gameType: gameType,
  };
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
