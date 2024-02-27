/* Copyright (c) 2022-2023 Reminano */

const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const GamePlayRecordsFunctions = require('../../../GamePlayRecords/GamePlayRecordsFunctions');
const utilFunctions = require('../../../ApiUtils/utilFunctions');
const { BET_TYPE, BET_STATUS, BET_VALUE, BET_RESULT, BET_WIN_RATE } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { GAME_RECORD_STATUS } = require('../../GameRecordConstant');
const Logger = require('../../../../utils/logging');

async function updateLatestGameResult(lastGameSection) {
  const gameRecords = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.BAUCUA1P,
      gameRecordStatus: BET_STATUS.NEW,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );
  if (gameRecords && gameRecords.length > 0 && gameRecords[0].gameRecordValue == null) {
    const gameRecord = gameRecords[0];
    const bauCuaValue1 = utilFunctions.randomIntByMinMax(BET_VALUE.BAUCUA.NAI, BET_VALUE.BAUCUA.TOM);
    const bauCuaValue2 = utilFunctions.randomIntByMinMax(BET_VALUE.BAUCUA.NAI, BET_VALUE.BAUCUA.TOM);
    const bauCuaValue3 = utilFunctions.randomIntByMinMax(BET_VALUE.BAUCUA.NAI, BET_VALUE.BAUCUA.TOM);
    const bauCuaValue = `${bauCuaValue1};${bauCuaValue2};${bauCuaValue3}`;
    const updatedResult = await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordValue: bauCuaValue,
      gameRecordStatus: BET_STATUS.PENDING,
    });
    if (!updatedResult) {
      Logger.info(`[Failure]: ${gameRecord.gameRecordSection} - Updated game record baucua failure- ${bauCuaValue}`);
    }
  }
}

async function updateWinLoseResultForBetRecord(lastGameSection) {
  const gameRecordToUpdate = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.BAUCUA1P,
      gameRecordStatus: GAME_RECORD_STATUS.PENDING,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );
  if (gameRecordToUpdate && gameRecordToUpdate.length > 0) {
    const gameRecord = gameRecordToUpdate[0];
    let gamePlayRecordCount = 50;
    let gamePlayRecordSkip = 0;
    while (gamePlayRecordCount > 0) {
      const gamePlayRecords = await GamePlayRecordsResourceAccess.find(
        {
          betRecordSection: gameRecord.gameRecordSection,
          betRecordType: BET_TYPE.BAUCUA1P,
          betRecordStatus: BET_STATUS.NEW,
        },
        gamePlayRecordSkip,
        gamePlayRecordCount,
      );
      if (gamePlayRecords && gamePlayRecords.length > 0) {
        gamePlayRecordSkip += gamePlayRecords.length;
        for (let index = 0; index < gamePlayRecords.length; index++) {
          const gamePlayRecord = gamePlayRecords[index];
          //tinh toan ket qua thang thua => tien
          const moneyReceived = await _checkWinLoseResult(gameRecord, gamePlayRecord);
          //xu ly tra thuong => cap nhat game play record + cong tien wallet + thong bao user
          await GamePlayRecordsFunctions.updateWinLoseForBetGame(gamePlayRecord, moneyReceived);
        }
      } else {
        gamePlayRecordCount = 0;
      }
    }
    await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
    });
  }
}

async function _checkWinLoseResult(gameRecord, gamePlayRecord) {
  const bauCuaValue1 = gameRecord.gameRecordValue.split(';')[0];
  const bauCuaValue2 = gameRecord.gameRecordValue.split(';')[1];
  const bauCuaValue3 = gameRecord.gameRecordValue.split(';')[2];

  //xu ly luu du lieu win lose cho user
  let matchResult = BET_RESULT.LOSE;
  let betWin = 0; //ty le an giai
  let winAmount = 0;

  if (gamePlayRecord.betRecordValue == bauCuaValue1) {
    matchResult = BET_RESULT.WIN;
    betWin += BET_WIN_RATE.BAU_CUA;
  }
  if (gamePlayRecord.betRecordValue == bauCuaValue2) {
    matchResult = BET_RESULT.WIN;
    betWin += BET_WIN_RATE.BAU_CUA;
  }
  if (gamePlayRecord.betRecordValue == bauCuaValue3) {
    matchResult = BET_RESULT.WIN;
    betWin += BET_WIN_RATE.BAU_CUA;
  }
  if (matchResult == BET_RESULT.WIN) {
    winAmount = gamePlayRecord.betRecordAmountIn * (betWin + 1);
  }

  return winAmount;
}

module.exports = {
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
};
