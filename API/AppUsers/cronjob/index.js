/* Copyright (c) 2022-2023 Reminano */

const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const { calculateMemberLevelForAllUser } = require('./updateMemberLevelForAllUser');
const Logger = require('../../../utils/logging');
const weeklyScheduler = () => {
  //cap nhat cap do thu 2 hang tuan luc 00:01 sang
  CronInstance.schedule('2 0 * * 1', async function () {
    calculateMemberLevelForAllUser();
  });
};

async function startUpdateAppUserSchedule() {
  Logger.info('start startUpdateAppUserSchedule: ' + new Date());
  weeklyScheduler();
}

module.exports = {
  startUpdateAppUserSchedule,
};
