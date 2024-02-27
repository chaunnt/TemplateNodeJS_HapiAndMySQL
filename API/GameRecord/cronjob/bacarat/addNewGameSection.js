/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GameFunction = require('../../GameRecordFunctions');
const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const { BET_TYPE, GAME_ID } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const moment = require('moment');
const Logger = require('../../../../utils/logging');

async function addNewGameSection() {
  let currentSection = new Date();
  try {
    let resultData = [];
    for (let index = 0; index < 10; index++) {
      let newGameSection = moment(currentSection).add(index, 'minutes').format('YYYYMMDDHHmm');
      newGameSection += `-${GAME_ID.BACARAT1P}`;
      let gameRecordValue = null; //cronjob tạo các bản ghi game record với giá trị null
      let result = await GameFunction.addNewGameRecord(newGameSection, BET_TYPE.BACARAT1P, gameRecordValue, false);
      if (result) {
        resultData.push(result);
      } else {
        Logger.info(`[Failure]: ${newGameSection}-${index + 1} -  Inserted bacarat game record failure`);
      }
    }
  } catch (error) {
    Logger.error(`[Error]: ${currentSection} - Inserted bacarat game record error`, error);
  }
}

module.exports = {
  addNewGameSection,
};
