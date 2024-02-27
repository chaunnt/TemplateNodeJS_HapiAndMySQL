/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const GameInfoResource = require('../resourceAccess/GameInfoResourceAccess');
const GameFunction = require('../GameInfoFunctions');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const { GAME_RECORD_STATUS, GAME_RECORD_TYPE } = require('../GameInfoConstant');
const { ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { logAppDataChanged } = require('../../SystemAppChangedLog/SystemAppChangedLogFunctions');
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameData = req.payload;
      let newGameSection = gameData.gameRecordSection;
      let currentSection = new Date();
      currentSection.setHours(newGameSection.split(':')[0]);
      currentSection.setMinutes(newGameSection.split(':')[1]);

      const moment = require('moment');
      newGameSection = moment(currentSection).format('YYYYMMDDHHmm00'); //`${currentSection.getHours()}:${currentSection.getMinutes()}:00`;

      let gameRecordType = {
        gameRecordTypeUp: gameData.gameRecordTypeUp,
        gameRecordTypeDown: gameData.gameRecordTypeDown,
        gameRecordTypeOdd: gameData.gameRecordTypeOdd,
        gameRecordTypeEven: gameData.gameRecordTypeEven,
      };

      let result = await GameFunction.addNewGameInfo(newGameSection, gameData.gameRecordPrice, gameData.gameRecordUnit, gameRecordType);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`error insert game record: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error insert game record:`, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      if (searchText) {
        filter.gameRecordSection = searchText;
      }

      let gameRecords = await GameInfoResource.find(filter, skip, limit, order, startDate, endDate);

      if (gameRecords && gameRecords.length > 0) {
        let gameRecordsCount = await GameInfoResource.count(filter, order);
        for (let index = 0; index < gameRecords.length; index++) {
          gameRecords[index].gameConfigWinRate = JSON.parse(gameRecords[index].gameConfigWinRate);
        }
        resolve({ data: gameRecords, total: gameRecordsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(`error find game record:`, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordId = req.payload.id;
      let gameRecordData = req.payload.data;
      gameRecordData.gameConfigWinRate = JSON.stringify(gameRecordData.gameConfigWinRate);
      let dataBefore = {};
      let dataAfter = {};
      let gameInfo = await GameInfoResource.findById(gameRecordId);
      if (gameRecordData.gameConfigWinRate) {
        dataAfter.gameConfigWinRate = gameRecordData.gameConfigWinRate;
        dataBefore.gameConfigWinRate = gameInfo.gameConfigWinRate;
      } else {
        for (let i = 0; i < Object.keys(gameRecordData).length; i++) {
          const element = Object.keys(gameRecordData)[i];
          if (element == 'gameConfigWinRate') {
            continue;
          }
          dataBefore[element] = gameInfo[element];
        }
        dataAfter = gameRecordData;
        delete dataAfter.gameConfigWinRate;
      }
      let result = await GameInfoResource.updateById(gameRecordId, gameRecordData);
      if (result) {
        await logAppDataChanged(dataBefore, dataAfter, req.currentUser, GameInfoResource.modelName);
        resolve(result);
      } else {
        Logger.error(`error updateById game record: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error update by id game record:`, e);
      // Logger.error(`error update by id ${gameRecordId} game record:`, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(`error findById game record: `, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(`error`, e);
      reject('failed');
    }
  });
}

async function insertMany(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameData = req.payload;
      let gameRecordCount = req.payload.gameRecordCount;

      let result = undefined;
      let newGameSection = gameData.gameRecordSection;

      let currentSection = new Date();
      currentSection.setHours(newGameSection.split(':')[0]);
      currentSection.setMinutes(newGameSection.split(':')[1]);

      let _countPerType = parseInt(gameRecordCount / 4) + 1;
      let _randomList = [];
      for (let i = 0; i < _countPerType; i++) {
        _randomList.push('1010');
        _randomList.push('1001');
        _randomList.push('0110');
        _randomList.push('0101');
        _randomList = UtilsFunction.shuffleArray(_randomList);
      }

      const moment = require('moment');
      for (let i = 0; i < gameRecordCount; i++) {
        currentSection = currentSection - 1 + 1000 * 60 + 1;
        currentSection = new Date(currentSection);
        let gameSection = moment(currentSection).format('YYYYMMDDHHmm00'); //`${currentSection.getHours()}:${currentSection.getMinutes()}:00`;

        let _betValues = _randomList[i].split('');

        let gameRecordType = {
          gameRecordTypeUp: _betValues[0] * 1,
          gameRecordTypeDown: _betValues[1] * 1,
          gameRecordTypeOdd: _betValues[2] * 1,
          gameRecordTypeEven: _betValues[3] * 1,
        };

        result = await GameFunction.addNewGameInfo(gameSection, 0, gameData.gameRecordUnit, gameRecordType);
      }

      if (result) {
        resolve(result);
      } else {
        Logger.error(`error insert many: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error insert many:`, e);
      reject('failed');
    }
  });
}

async function userGetListGameInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let gameRecords = await GameInfoResource.find(filter);

      if (gameRecords && gameRecords.length > 0) {
        let gameRecordsCount = await GameInfoResource.count(filter);
        for (let index = 0; index < gameRecords.length; index++) {
          gameRecords[index].gameConfigWinRate = JSON.parse(gameRecords[index].gameConfigWinRate);
        }
        resolve({ data: gameRecords, total: gameRecordsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(`error user Get List Game Record`, e);
      reject('failed');
    }
  });
}

async function getCurrentGameInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getCurrentGameInfo(gameRecordType);

      if (gameRecords) {
        resolve(gameRecords);
      } else {
        Logger.error(`error getCurrentGameInfo with gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error get Current GameInfo`, e);
      reject('failed');
    }
  });
}

async function userGetCurrentGameInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getCurrentGameInfo(gameRecordType);

      if (gameRecords) {
        let currentGameInfoData = {
          gameRecordSection: gameRecords.gameRecordSection,
        };

        let _finishSection = gameRecords.gameRecordSection;
        let finishTime = moment(_finishSection, 'YYYYMMDDHHmm').format('YYYYMMDDHHmm');

        switch (gameRecordType) {
          case GAME_RECORD_TYPE.GAMEWINGO1:
          case GAME_RECORD_TYPE.GAME5D1:
          case GAME_RECORD_TYPE.GAMEK31:
            finishTime = moment(_finishSection.substring(0, _finishSection.length - 2), 'YYYYMMDDHHmm').format('YYYYMMDDHHmm');
            break;
          case GAME_RECORD_TYPE.GAMEWINGO3:
          case GAME_RECORD_TYPE.GAME5D3:
          case GAME_RECORD_TYPE.GAMEK33:
            finishTime = moment(_finishSection.substring(0, _finishSection.length - 2), 'YYYYMMDDHHmm').format('YYYYMMDDHHmm');
            break;
          case GAME_RECORD_TYPE.GAMEWINGO5:
          case GAME_RECORD_TYPE.GAME5D5:
          case GAME_RECORD_TYPE.GAMEK35:
            finishTime = moment(_finishSection.substring(0, _finishSection.length - 2), 'YYYYMMDDHHmm').format('YYYYMMDDHHmm');
            break;
          case GAME_RECORD_TYPE.GAMEWINGO10:
          case GAME_RECORD_TYPE.GAMEWINGO10:
          case GAME_RECORD_TYPE.GAMEK310:
            finishTime = moment(_finishSection.substring(0, _finishSection.length - 2), 'YYYYMMDDHHmm').format('YYYYMMDDHHmm');
            break;
          default:
            break;
        }
        currentGameInfoData.finishTime = finishTime;

        resolve(currentGameInfoData);
      } else {
        Logger.error(`error userGetCurrentGameInfo gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error user Get Current Game Record`, e);
      reject('failed');
    }
  });
}

async function userGetLatestGameInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getLatestGameInfo(gameRecordType);

      if (gameRecords) {
        let currentGameInfoData = {
          gameRecordSection: gameRecords.gameRecordSection,
          gameRecordValue: gameRecords.gameRecordValue,
          gameConfigWinRate: JSON.parse(gameRecords.gameConfigWinRate),
        };
        resolve(currentGameInfoData);
      } else {
        Logger.error(`error userGetLatestGameInfo gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error user get latest Game Record`, e);
      reject('failed');
    }
  });
}
module.exports = {
  insert,
  find,
  updateById,
  findById,
  insertMany,
  userGetListGameInfo,
  userGetCurrentGameInfo,
  getCurrentGameInfo,
  userGetLatestGameInfo,
};
