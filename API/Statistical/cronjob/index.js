/* Copyright (c) 2022-2024 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../utils/logging');
const { insertStatistical } = require('./insertStatistical');
async function startInsertStatistical() {
  Logger.info(`Start statistical: ${new Date()}`);

  // //do not run schedule on DEV environments
  // if (process.env.NODE_ENV === 'dev') {
  //   return;
  // }

  // everyday day at 00:01
  CronInstance.schedule('1 0 * * *', function () {
    insertStatistical().then(() => {
      Logger.info(`insertStatistical done`);
    });
  });
}

module.exports = {
  startInsertStatistical,
};
