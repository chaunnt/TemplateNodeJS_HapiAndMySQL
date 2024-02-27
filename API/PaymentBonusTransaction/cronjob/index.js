/* Copyright (c) 2022-2023 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const { updateMissionBonusDailyForAllUser } = require('./updateMissionBonusDailyForAllUser');
const Logger = require('../../../utils/logging');

async function _startCronSchedule() {
  Logger.info('_startCronSchedule ', new Date());

  //thanh toan hoa hong moi ngay 02:01 (luôn chậm hơn 2 tiếng với việc cập nhật level)
  CronInstance.schedule('1 2 * * *', async function () {
    // const { updateBonusDailyForAllUser } = require('./updateBonusDailyByBetRecords');
    // await updateBonusDailyForAllUser();
    await updateMissionBonusDailyForAllUser();
  });
}

async function startPaymentBonusTransactionSchedule() {
  Logger.info(`START startPaymentBonusTransactionSchedule: ${new Date()}`);
  _startCronSchedule();
  Logger.info(`FINISH startPaymentBonusTransactionSchedule: ${new Date()}`);
}

module.exports = {
  startPaymentBonusTransactionSchedule,
};
