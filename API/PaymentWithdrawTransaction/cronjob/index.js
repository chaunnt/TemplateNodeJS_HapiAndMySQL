/* Copyright (c) 2022-2023 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../utils/logging');
const { autoApproveWithdraw } = require('./autoApproveWithdraw');
async function startSchedulePaymentWithdraw() {
  Logger.info(`Start autoApproveWithdraw: ${new Date()}`);

  // //do not run schedule on DEV environments
  // if (process.env.NODE_ENV === 'dev') {
  //   return;
  // }

  // everyday 5 minute
  CronInstance.schedule('*/1 * * * *', function () {
    console.log('yesss');
    autoApproveWithdraw().then(() => {
      Logger.info(`autoApproveWithdraw done`);
    });
  });
}

module.exports = {
  startSchedulePaymentWithdraw,
};
