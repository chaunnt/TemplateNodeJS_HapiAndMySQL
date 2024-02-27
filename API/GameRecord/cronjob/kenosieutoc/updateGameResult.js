/* Copyright (c) 2022-2024 Reminano */
const GameRecordResource = require('../../resourceAccess/GameRecordsResourceAccess');
const GameRecordFunctions = require('../../GameRecordFunctions');
const { BET_TYPE, BET_STATUS } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { checkKeno1P } = require('./checkKeno1P');

async function updateLatestGameResult(lastGameSection) {
  const filter = {
    gameRecordSection: lastGameSection,
    gameRecordType: BET_TYPE.KENO1P,
    gameRecordStatus: BET_STATUS.NEW,
  };
  const order = {
    key: 'gameRecordSection',
    value: 'asc',
  };
  const gameRecords = await GameRecordResource.find(filter, 0, 1, order);
  if (gameRecords && gameRecords.length > 0 && gameRecords[0].gameRecordValue == null) {
    const gameRecordValue = GameRecordFunctions.generateResultKeno();
    await GameRecordResource.updateById(gameRecords[0].gameRecordId, {
      gameRecordValue: gameRecordValue,
      gameRecordStatus: BET_STATUS.PENDING,
    });
  }
}

async function updateWinLoseResultForBetRecord(lastGameSection) {
  await checkKeno1P(lastGameSection);
}

module.exports = {
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
};
