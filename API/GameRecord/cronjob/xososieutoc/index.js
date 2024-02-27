/* Copyright (c) 2022-2023 Reminano */

const moment = require('moment');

const { CronInstance, executeJob } = require('../../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../../utils/logging');
const addNewGameSection = require('./addNewGameSection').addNewGameSection;
const { updateLatestGameResult, updateWinLoseResultForBetRecord } = require('./updateGameResult');
const { GAME_ID } = require('../../../GamePlayRecords/GamePlayRecordsConstant');

async function startSchedule() {
  Logger.info(`Start XSST Jobs: ${new Date()}`);
  //do not run schedule on DEV environments
  if (process.env.NODE_ENV === 'dev') {
    return;
  }

  // every monday
  CronInstance.schedule('* * * * *', async function () {
    let lastGameSection = moment().add(-1, 'minutes').format('YYYYMMDDHHmm');
    lastGameSection += `-${GAME_ID.XSST1P}`;
    await updateLatestGameResult(lastGameSection);
    await updateWinLoseResultForBetRecord(lastGameSection);
    await addNewGameSection();
  });
}

module.exports = {
  startSchedule,
};
