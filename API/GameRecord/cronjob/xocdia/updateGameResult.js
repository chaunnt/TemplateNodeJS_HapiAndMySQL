/* Copyright (c) 2022-2023 Reminano */

const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const GamePlayRecordsFunctions = require('../../../GamePlayRecords/GamePlayRecordsFunctions');
const utilFunctions = require('../../../ApiUtils/utilFunctions');
const { BET_TYPE, BET_STATUS, GAME_VALUE, BET_RESULT, BET_WIN_RATE, BET_VALUE } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { GAME_RECORD_STATUS } = require('../../GameRecordConstant');
const Logger = require('../../../../utils/logging');

async function updateLatestGameResult(lastGameSection) {
  const gameRecords = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.XOCDIA1P,
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
    const xocdiaValue = _generateResultXocDia();
    const updatedResult = await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordValue: xocdiaValue,
      gameRecordStatus: BET_STATUS.PENDING,
    });
    if (!updatedResult) {
      Logger.info(`[Failure]: ${gameRecord.gameRecordSection} - Updated game record xocdia failure- ${xocdiaValue}`);
    }
  }
}

function _generateResultXocDia() {
  const gameResults = [
    GAME_VALUE.XOCDIA.SAP4,
    GAME_VALUE.XOCDIA.NGUA4,
    GAME_VALUE.XOCDIA.SAP_NGUA_SAP_NGUA,
    GAME_VALUE.XOCDIA.SAP_SAP_NGUA_NGUA,
    GAME_VALUE.XOCDIA.SAP_NGUA_NGUA_SAP,
    GAME_VALUE.XOCDIA.SAP_SAP_NGUA_SAP,
    GAME_VALUE.XOCDIA.SAP_NGUA_SAP_SAP,
    GAME_VALUE.XOCDIA.NGUA_SAP_NGUA_NGUA,
    GAME_VALUE.XOCDIA.NGUA_NGUA_SAP_NGUA,
  ];
  for (let i = 1; i < 100; i++) {
    gameResults.push(
      gameResults[0],
      gameResults[1],
      gameResults[2],
      gameResults[3],
      gameResults[4],
      gameResults[5],
      gameResults[6],
      gameResults[7],
      gameResults[8],
    );
  }
  const index = utilFunctions.randomIntByMinMax(0, 699);
  const resultValue = gameResults[index];
  return resultValue;
}

async function updateWinLoseResultForBetRecord(lastGameSection) {
  const gameRecordToUpdate = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.XOCDIA1P,
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
          betRecordType: BET_TYPE.XOCDIA1P,
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
  const gameValue = gameRecord.gameRecordValue; //ket qua cua game
  const betValue = gamePlayRecord.betRecordValue; //nguoi choi dat cuoc

  //2 ngửa + 2 sấp | 4 ngửa | 4 sấp = chẵn
  let chan =
    gameValue == GAME_VALUE.XOCDIA.NGUA4 ||
    gameValue == GAME_VALUE.XOCDIA.SAP4 ||
    gameValue == GAME_VALUE.XOCDIA.SAP_NGUA_SAP_NGUA ||
    gameValue == GAME_VALUE.XOCDIA.SAP_SAP_NGUA_NGUA ||
    gameValue == GAME_VALUE.XOCDIA.SAP_NGUA_NGUA_SAP;
  //1 ngửa +3 sấp | 3 ngửa + 1 sấp = lẻ
  let le =
    gameValue == GAME_VALUE.XOCDIA.SAP_SAP_NGUA_SAP ||
    gameValue == GAME_VALUE.XOCDIA.SAP_NGUA_SAP_SAP ||
    gameValue == GAME_VALUE.XOCDIA.NGUA_SAP_NGUA_NGUA ||
    gameValue == GAME_VALUE.XOCDIA.NGUA_NGUA_SAP_NGUA;
  let sap4 = gameValue == GAME_VALUE.XOCDIA.SAP4;
  let ngua4 = gameValue == GAME_VALUE.XOCDIA.NGUA4;
  let ngua3sap1 = gameValue == GAME_VALUE.XOCDIA.NGUA_SAP_NGUA_NGUA || gameValue == GAME_VALUE.XOCDIA.NGUA_NGUA_SAP_NGUA;
  let sap3ngua1 = gameValue == GAME_VALUE.XOCDIA.SAP_SAP_NGUA_SAP || gameValue == GAME_VALUE.XOCDIA.SAP_NGUA_SAP_SAP;

  //xu ly luu du lieu win lose cho user
  let matchResult = BET_RESULT.LOSE;
  let betWin = 0; //ty le an giai
  let winAmount = 0;

  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.CHAN && chan) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.CHAN;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.LE && le) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.LE;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.SAP4 && sap4) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.SAP4;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.NGUA4 && ngua4) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.NGUA4;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.NGUA3SAP1 && ngua3sap1) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.NGUA3SAP1;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.XOCDIA.SAP3NGUA1 && sap3ngua1) {
    matchResult = BET_RESULT.WIN;
    betWin = BET_WIN_RATE.XOC_DIA.SAP3NGUA1;
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
