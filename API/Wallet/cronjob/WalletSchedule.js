/* Copyright (c) 2022-2024 Reminano */

const { CronInstance, executeJob } = require('../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../utils/logging');

async function startSchedule() {
  Logger.info('start WalletSchedule');
  if (process.env.NODE_ENV === 'dev') {
    return;
  }
}

module.exports = {
  startSchedule,
};
