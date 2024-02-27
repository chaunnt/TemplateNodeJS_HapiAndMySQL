/* Copyright (c) 2022-2024 Reminano */

const Logger = require('../../../utils/logging');
const { CronInstance, executeJob } = require('../../../ThirdParty/Cronjob/CronInstance');
const { reloadMissionWalletForAllUser } = require('./reloadMissionWalletForAllUser');
const { updateMissionForAllUser } = require('./updateMissionForAllUser');

function startAppUserMissionSchedule() {
  Logger.info('start startAppUserMissionSchedule: ' + new Date());
  //cap nhat hang ngay luc 00:01 sang
  CronInstance.schedule('5 0 * * *', function () {
    updateMissionForAllUser().then(() => {
      reloadMissionWalletForAllUser();
    });
  });
  Logger.info('finish startAppUserMissionSchedule: ' + new Date());
}

module.exports = {
  startAppUserMissionSchedule,
};
