/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const { BET_TYPE, GAME_ID, GAME_RECORD_UNIT_BO } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const moment = require('moment');
const Logger = require('../../../../utils/logging');

async function addNewGameSection() {
  // let currentSection = new Date();
  // try {
  //   let addNewRecords = [];
  //   for (let index = 0; index < 5; index++) {
  //     const newGameSection = moment(currentSection).add(index, 'minutes').format('YYYYMMDDHHmm');
  //     let btcNewGameSection = `${newGameSection}-${GAME_ID.BINARYOPTION}-${GAME_RECORD_UNIT_BO.BTC}`;
  //     addNewRecords.push(_addNewRecord(newGameSection, btcNewGameSection, GAME_RECORD_UNIT_BO.BTC, BET_TYPE.BINARYOPTION_UPDOWN));
  //     let dogeNewGameSection = `${newGameSection}-${GAME_ID.BINARYOPTION}-${GAME_RECORD_UNIT_BO.DOGE}`;
  //     addNewRecords.push(_addNewRecord(newGameSection, dogeNewGameSection, GAME_RECORD_UNIT_BO.DOGE, BET_TYPE.BINARYOPTION_UPDOWN));
  //     let xrpNewGameSection = `${newGameSection}-${GAME_ID.BINARYOPTION}-${GAME_RECORD_UNIT_BO.XRP}`;
  //     addNewRecords.push(_addNewRecord(newGameSection, xrpNewGameSection, GAME_RECORD_UNIT_BO.XRP, BET_TYPE.BINARYOPTION_UPDOWN));
  //     let trxNewGameSection = `${newGameSection}-${GAME_ID.BINARYOPTION}-${GAME_RECORD_UNIT_BO.BNB}`;
  //     addNewRecords.push(_addNewRecord(newGameSection, trxNewGameSection, GAME_RECORD_UNIT_BO.BNB, BET_TYPE.BINARYOPTION_UPDOWN));
  //   }
  //   await Promise.all(addNewRecords)
  //     .then()
  //     .catch(error => Logger.error(`[Error]: ${currentSection} - Inserted binaryoption up/down game record error`, error));
  // } catch (error) {
  //   Logger.error(`[Error]: ${currentSection} - Inserted binaryoption up/down game record error`, error);
  // }
}

async function _addNewRecord(newSection, gameSection, unit, betType) {
  //check existed game record
  const existedGameRecord = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: gameSection,
      gameRecordType: betType,
      gameRecordUnit: unit,
    },
    0,
    1,
  );
  if (existedGameRecord && existedGameRecord.length > 0) {
    return;
  }
  const newRecordData = {
    gameRecordSection: gameSection,
    gameRecordType: betType,
    gameRecordUnit: unit,
    gameRecordValue: null,
    gameRecordNote: `Auto tạo`,
  };
  //FEATURE: KYGAME_2PHUT // Mỗi kỳ game là 2 phút
  if ((newSection[newSection.length - 1] * 1) % 2 === 0) {
    newRecordData.isPlayGameRecord = 1;
  }
  let result = await GameRecordsResourceAccess.insert(newRecordData);
  if (!result) {
    Logger.info(`[Failure]: ${gameSection} -  Inserted binaryoption up/down ${unit} game record failure`);
  }
}

module.exports = {
  addNewGameSection,
};
