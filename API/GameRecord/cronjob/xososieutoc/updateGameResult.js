/* Copyright (c) 2022-2024 Reminano */
const GameRecordResource = require('../../resourceAccess/GameRecordsResourceAccess');
const GameRecordFunctions = require('../../GameRecordFunctions');
const { BET_TYPE, BET_STATUS } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const Logger = require('../../../../utils/logging');
async function updateLatestGameResult(lastGameSection) {
  const filter = {
    gameRecordSection: lastGameSection,
    gameRecordType: BET_TYPE.XSST1P_DEFAULT,
    gameRecordStatus: BET_STATUS.NEW,
  };
  const order = {
    key: 'gameRecordSection',
    value: 'asc',
  };
  const gameRecords = await GameRecordResource.find(filter, 0, 1, order);
  if (gameRecords && gameRecords.length > 0 && gameRecords[0].gameRecordValue == null) {
    const gameRecordValue = GameRecordFunctions.generateResultXososieutoc();
    await GameRecordResource.updateById(gameRecords[0].gameRecordId, {
      gameRecordValue: gameRecordValue,
      gameRecordStatus: BET_STATUS.PENDING,
    });
  }
}

async function updateWinLoseResultForBetRecord(lastGameSection) {
  try {
    const gameRecords = await GameRecordResource.find(
      {
        gameRecordSection: lastGameSection,
        gameRecordType: BET_TYPE.XSST1P_DEFAULT,
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
        betRecordStatus: BET_STATUS.NEW,
      });
      //if users placed
      if (gamePlayRecords.length != 0) {
        await GameRecordFunctions.checkResultXososieutoc(gamePlayRecords, gameRecord);
      }

      //update status game
      await GameRecordResource.updateById(gameRecord.gameRecordId, {
        gameRecordStatus: BET_STATUS.COMPLETED,
      });
    }
  } catch (error) {
    Logger.error(`[Error]: Check xososieutoc game record error`, error);
  }
}

module.exports = {
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
};
