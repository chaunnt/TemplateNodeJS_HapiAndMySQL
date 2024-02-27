/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const GameRecordResource = require('../resourceAccess/GameRecordsResourceAccess');
const GameFunction = require('../GameRecordFunctions');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const { GAME_RECORD_STATUS, GAME_RECORD_TYPE } = require('../GameRecordConstant');
const { ERROR, POPULAR_ERROR } = require('../../Common/CommonConstant');
const { GAME_ID, GAME_RECORD_UNIT_BO } = require('../../GamePlayRecords/GamePlayRecordsConstant');
const Logger = require('../../../utils/logging');
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

      let gameRecords = await GameRecordResource.customSearch(filter, skip, limit, searchText, startDate, endDate, order);

      if (gameRecords && gameRecords.length > 0) {
        let gameRecordsCount = await GameRecordResource.customCount(filter, searchText, startDate, endDate);
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

async function adminGetAssignedResult(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;
      let _gameRecordSection = GameFunction.getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, GAME_RECORD_UNIT_BO.BTC);
      let _assignedRecord = GameFunction.getAssignedGameRecordFromCached(_gameRecordSection);
      if (_assignedRecord) {
        resolve(_assignedRecord);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(`error update by id ${gameRecordId} game record:`, e);
      reject('failed');
    }
  });
}

async function adminAssignResult(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordValue = req.payload.gameRecordValue;
      let gameRecordType = req.payload.gameRecordType;
      let _orderLatest = {
        key: 'gameRecordSection',
        value: 'desc',
      };
      let _lastRecord = await GameRecordResource.customSearch(
        {
          gameRecordType: gameRecordType,
        },
        0,
        1,
        undefined,
        undefined,
        undefined,
        _orderLatest,
      );
      if (_lastRecord && _lastRecord.length > 0) {
        let _gameRecord = {
          gameRecordType: gameRecordType,
          gameRecordResult: gameRecordValue,
          gameRecordSection: GameFunction.getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, GAME_RECORD_UNIT_BO.BTC),
          lastGameRecordValue: _lastRecord[0].gameRecordValue,
        };
        GameFunction.addAssignedGameRecordToCached(_gameRecord);
        resolve('success');
      } else {
        reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(`error update by id ${gameRecordId} game record:`, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordId = req.payload.id;
      let gameRecordData = req.payload.data;
      let result = await GameRecordResource.updateById(gameRecordId, gameRecordData);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`error updateById game record: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error update by id ${gameRecordId} game record:`, e);
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

        result = await GameFunction.addNewGameRecord(gameSection, 0, gameData.gameRecordUnit, gameRecordType);
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

async function userGetListGameRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let order = {
        key: 'gameRecordSection',
        value: 'desc',
      };

      filter.gameRecordStatus = GAME_RECORD_STATUS.COMPLETED;
      let gameRecords = await GameRecordResource.find(filter, skip, limit, order, startDate, endDate);
      // console.log('gameRecords: ', gameRecords);

      if (gameRecords && gameRecords.length > 0) {
        resolve({ data: gameRecords });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(`error user Get List Game Record`, e);
      reject('failed');
    }
  });
}

async function userGetListResult(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let order = {
        key: 'gameRecordSection',
        value: 'desc',
      };

      filter.isPlayGameRecord = 1;
      let gameRecords = await GameRecordResource.find(filter, skip, limit, order, startDate, endDate);

      if (gameRecords && gameRecords.length > 0) {
        let gameRecordsCount = await GameRecordResource.count(filter, order);
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

async function getCurrentGameRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getCurrentGameRecord(gameRecordType);

      if (gameRecords) {
        resolve(gameRecords);
      } else {
        Logger.error(`error getCurrentGameRecord with gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error get Current GameRecord`, e);
      reject('failed');
    }
  });
}

async function userGetCurrentGameRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getCurrentGameRecord(gameRecordType);

      if (gameRecords) {
        let currentGameRecordData = {
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
        currentGameRecordData.finishTime = finishTime;

        resolve(currentGameRecordData);
      } else {
        Logger.error(`error userGetCurrentGameRecord gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error user Get Current Game Record`, e);
      reject('failed');
    }
  });
}

async function userGetLatestGameRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRecordType = req.payload.gameRecordType;

      let gameRecords = await GameFunction.getLatestGameRecord(gameRecordType);

      if (gameRecords) {
        let currentGameRecordData = {
          gameRecordSection: gameRecords.gameRecordSection,
          gameRecordValue: gameRecords.gameRecordValue,
        };

        resolve(currentGameRecordData);
      } else {
        Logger.error(`error userGetLatestGameRecord gameRecordType:${gameRecordType} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error user get latest Game Record`, e);
      reject('failed');
    }
  });
}
module.exports = {
  adminAssignResult,
  adminGetAssignedResult,
  find,
  updateById,
  findById,
  insertMany,
  userGetListGameRecord,
  userGetListResult,
  userGetCurrentGameRecord,
  getCurrentGameRecord,
  userGetLatestGameRecord,
};
