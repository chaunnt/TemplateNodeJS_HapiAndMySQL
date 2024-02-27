/* Copyright (c) 2022-2024 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../utils/logging');
async function startLeaderBoardSchedule() {
  Logger.info(`startLeaderBoardSchedule ${new Date()}`);

  //every 3 phut
  CronInstance.schedule('59 23 * * *', async function () {
    const { updateTotalPlayForAllUser, updateTotalWithdrawForAllUser, updateTotalDepositForAllUser } = require('../LeaderFunction');
    await Promise.all([updateTotalPlayForAllUser(), updateTotalWithdrawForAllUser(), updateTotalDepositForAllUser()]);
  });
}

module.exports = {
  startLeaderBoardSchedule,
};
