/* Copyright (c) 2023-2024 Reminano */

const { BET_TYPE } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const moment = require('moment');
const Logger = require('../../../../utils/logging');

async function autoDeleteOldGameRecord() {
  let _gameTypeList = Object.keys(BET_TYPE);
  for (let i = 0; i < _gameTypeList.length; i++) {
    const _gameType = _gameTypeList[i];
    await deleteOldGameRecordByType(_gameType);
  }
}

async function deleteOldGameRecordByType(gameRecordType) {
  Logger.info(`deleteOldGameRecordByType ${gameRecordType} ${new Date()}`);
  let _filter = {
    gameRecordType: gameRecordType,
  };
  let endDate = moment().add(-2, 'day').format('YYYY-MM-DD HH:mm');
  await GameRecordsResourceAccess.permanentlyDelete(_filter, undefined, endDate);
  Logger.info(`Completed deleteOldGameRecordByType ${gameRecordType} ${new Date()}`);
}

module.exports = {
  autoDeleteOldGameRecord,
};
