/**
 * Created by A on 7/18/17.
 */
'use strict';

const { CronInstance, executeJob } = require("../ThirdParty/Cronjob/CronInstance");
const Logger = require('../utils/logging');

const CustomerRecordJob = require('../API/CustomerRecord/cronjob/StationsRecordAutoCheck');
const CustomerMessageJob = require('../API/CustomerMessage/cronjob/StationsMessageAutoSend');

async function startSchedule() {
  Logger.info("startSchedule ", new Date());

  //do not run schedule on DEV environments
  if (process.env.NODE_ENV === 'dev') {
    return;
  }

  //every 30 seconds
  setInterval(CustomerMessageJob.autoSendMessageForCustomer, 30 * 1000);

  //every 30 seconds
  // setInterval(CustomerRecordJob.autoUpdateProcessForStation, 30 * 1000);

  // every day - at the end of day
  // CronInstance.schedule('0 23 * * *', async function () {
  //   executeJob('./API/CustomerRecord/cronjob/StationsRecordCompleteJob.js');
  // });
}

module.exports = {
  startSchedule,
};
