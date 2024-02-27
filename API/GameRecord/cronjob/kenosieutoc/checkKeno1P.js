/* Copyright (c) 2023-2024 Reminano */

const GameRecordResource = require('../../resourceAccess/GameRecordsResourceAccess');
const { BET_TYPE, BET_STATUS } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const GamePlayRecordsView = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsView');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const GameRecordFunctions = require('../../GameRecordFunctions');
const Logger = require('../../../../utils/logging');
async function checkKeno1P(lastGameSection) {
  try {
    const gameRecords = await GameRecordResource.find(
      {
        gameRecordSection: lastGameSection,
        gameRecordType: BET_TYPE.KENO1P,
        gameRecordStatus: BET_STATUS.PENDING,
      },
      0,
      1,
      {
        key: 'gameRecordSection',
        value: 'asc',
      },
    );
    if (gameRecords && gameRecords.length > 0) {
      if (gameRecords[0].gameRecordValue == null) {
        //update status game
        await GameRecordResource.updateById(gameRecord.gameRecordId, {
          gameRecordStatus: BET_STATUS.CANCELED,
        });
        return;
      }
      const gameRecord = gameRecords[0];
      //get records that users placed
      const gamePlayRecords = await GamePlayRecordsResourceAccess.find({
        betRecordSection: gameRecord.gameRecordSection,
        betRecordType: BET_TYPE.KENO1P,
        betRecordStatus: BET_STATUS.NEW,
      });
      // no users placed
      if (gamePlayRecords.length == 0) {
        await GameRecordResource.updateById(gameRecord.gameRecordId, {
          gameRecordStatus: BET_STATUS.COMPLETED,
        });
        return;
      }
      await GameRecordFunctions.checkResultKeno1P(gamePlayRecords, gameRecord);
      //update status game
      await GameRecordResource.updateById(gameRecord.gameRecordId, {
        gameRecordStatus: BET_STATUS.COMPLETED,
      });
    }
  } catch (error) {
    Logger.error(`[Error]: Check kenosieutoc game record error`, error);
  }
}

module.exports = {
  checkKeno1P,
};
