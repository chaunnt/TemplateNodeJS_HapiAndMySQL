/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();
const { reloadNewIpLockListJob } = require('../API/AppUsers/data/lockIpAddress');
const { CronInstance, executeJob } = require('../ThirdParty/Cronjob/CronInstance');

function excuteOtherJob() {
  // every 30 minutes
  reloadNewIpLockListJob();

  setInterval(reloadNewIpLockListJob, 5 * 60 * 1000);

  if (process.env.ZALO_AUTO_REFRESH_TOKEN_ENABLE * 1 === 1) {
    const { getAccessTokenByRefreshToken } = require('../ThirdParty/ZaloAPI/ZNS/getAccessTokenByRefreshToken');
    // Lấy OA access token mỗi ngày
    getAccessTokenByRefreshToken();

    CronInstance.schedule('0 * * * *', async function () {
      getAccessTokenByRefreshToken();
    });
  }
}

module.exports = {
  excuteOtherJob,
};
