/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { GAME_STATUS, GAME_NAME, GAME_INFO_CATEGORY } = require('../GameInfoConstant');
const Logger = require('../../../utils/logging');

const tableName = 'GameInfo';
const primaryKeyField = 'gameInfoId';
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('gameName');
          table.string('gameInfoCategory');
          table.string('gameLogoUrl');
          table.string('gameBackgroundUrl');
          table.string('gameSplashBackgroundUrl');
          table.string('gameDirectLink');
          table.string('gameConfigWinRate');
          table.integer('gameStatus').defaultTo(GAME_STATUS.ACTIVE);
          timestamps(table);
          table.index('gameInfoId');
          table.index('gameStatus');
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
      gameName: GAME_NAME.TIGERDRAGON1P,
      gameInfoCategory: GAME_INFO_CATEGORY.GAMBLING,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/ban-ca.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.KENO10P,
      gameInfoCategory: GAME_INFO_CATEGORY.LOTTERY,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/quay-so.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.XSTT,
      gameInfoCategory: GAME_INFO_CATEGORY.LOTTERY,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/lo-de.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.XSST1P,
      gameInfoCategory: GAME_INFO_CATEGORY.LOTTERY,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/slots.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.BACARAT1P,
      gameInfoCategory: GAME_INFO_CATEGORY.GAMBLING,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/game-bai.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.XOCDIA1P,
      gameInfoCategory: GAME_INFO_CATEGORY.UP_DOWN,
      gameLogoUrl: `https://${process.env.HOST_NAME}/uploads/media/xocdia.mp4`,
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.BAUCUA1P,
      gameInfoCategory: GAME_INFO_CATEGORY.UP_DOWN,
      gameLogoUrl: `https://${process.env.HOST_NAME}/uploads/media/baucua.mp4`,
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
    },
    {
      gameName: GAME_NAME.BINARYOPTION,
      gameInfoCategory: GAME_INFO_CATEGORY.UP_DOWN,
      gameLogoUrl: 'https://t1.ta88.com/img/assets/images/components/mobile/home/banner-sport/video/quay-so.mp4',
      gameBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
      gameSplashBackgroundUrl: `https://${process.env.HOST_NAME}/uploads/Sample_GameBackground.png`,
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
  modelName: tableName,
};
