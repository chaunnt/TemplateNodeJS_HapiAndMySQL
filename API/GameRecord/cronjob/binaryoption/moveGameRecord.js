/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GameRecordHistoryResourceAccess = require('../../resourceAccess/GameRecordHistoryResourceAccess');
const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const { BET_STATUS } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const moment = require('moment');
const Logger = require('../../../../utils/logging');

async function moveToGameRecordHistory(betType) {
  Logger.info(`moveToGameRecordHistory ${betType} ${new Date()}`);
  let currentSection = new Date();
  try {
    let batchCount = 50;
    let skipBatch = 0;
    const endDate = moment().add(-2, 'day').format();

    let _filter = {};
    if (betType) {
      _filter.gameRecordType = betType;
    }
    while (batchCount > 0) {
      const gameRecords = await GameRecordsResourceAccess.customSearch(_filter, skipBatch, batchCount, undefined, endDate);
      if (gameRecords && gameRecords.length > 0) {
        skipBatch += gameRecords.length;
        for (let index = 0; index < gameRecords.length; index++) {
          const gameRecord = gameRecords[index];
          const gameRecordHistory = {
            gameRecordId: gameRecord.gameRecordId,
            gameRecordSection: gameRecord.gameRecordSection,
            gameRecordType: gameRecord.gameRecordType,
            gameRecordValue: gameRecord.gameRecordValue,
            gameRecordUnit: gameRecord.gameRecordUnit,
            isPlayGameRecord: gameRecord.isPlayGameRecord,
            gameRecordResult: gameRecord.gameRecordResult,
            gameRecordStatus: gameRecord.gameRecordStatus,
          };
          //tao ban ghi tren GameRecordHistory
          const insertResult = await GameRecordHistoryResourceAccess.insert(gameRecordHistory);
          if (insertResult) {
            // insert thanh cong thi xoa ban ghi tren GameRecord
            await GameRecordsResourceAccess.permanentlyDeleteById(gameRecord.gameRecordId);
          }
        }
      } else {
        batchCount = 0;
      }
    }
  } catch (error) {
    Logger.error(`[Error]: ${currentSection} - move to GameRecordHistory binaryoption up/down game record error`, error);
  }
}

module.exports = {
  moveToGameRecordHistory,
};
