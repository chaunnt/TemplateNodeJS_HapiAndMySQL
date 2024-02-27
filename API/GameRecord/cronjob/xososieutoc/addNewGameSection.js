/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const GameFunction = require('../../GameRecordFunctions');
const { BET_TYPE, GAME_ID } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const Logger = require('../../../../utils/logging');
async function addNewGameSection() {
  try {
    // create 5 periods in 1 minute
    for (let i = 0; i <= 5; i++) {
      let newGameSection = moment().add(i, 'minute');
      newGameSection = moment(newGameSection).format('YYYYMMDDHHmm') + `-${GAME_ID.XSST1P}`;
      let result = await GameFunction.addNewGameRecord(newGameSection, BET_TYPE.XSST1P_DEFAULT, null, false);
      if (!result) {
        Logger.error(`[Error]: Inserted xososieutoc game record error`);
      }
    }
  } catch (error) {
    Logger.error(`[Error]: Inserted xososieutoc game record error`, e);
  }
}

module.exports = {
  addNewGameSection,
};
