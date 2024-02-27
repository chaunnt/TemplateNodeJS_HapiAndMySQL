/* Copyright (c) 2022-2023 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../utils/logging');
const { autoCancelDeposit } = require('./autoCancelDeposit');
async function startSchedulePaymentDeposit() {
  Logger.info(`Start autoCancelDeposit: ${new Date()}`);

  // //do not run schedule on DEV environments
  // if (process.env.NODE_ENV === 'dev') {
  //   return;
  // }

  // everyday 5 minute
  CronInstance.schedule('*/5 * * * *', function () {
    autoCancelDeposit().then(() => {
      Logger.info(`autoCancelDeposit done`);
    });
  });
}

module.exports = {
  startSchedulePaymentDeposit,
};
