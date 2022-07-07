const { CronInstance, executeJob } = require("../../../ThirdParty/Cronjob/CronInstance");

async function _startCronSchedule() {
  console.info("_startCronSchedule ", new Date());

  // weekly task
  CronInstance.schedule('0 0 * * 1', async function () {
    console.log("CronInstance.schedule PaymentBonusTransaction")
    const { updateBonusDailyForAllUser } = require("./updateBonusDailyByBetRecords");
    await updateBonusDailyForAllUser();
  });
}

async function startSchedule() {
  console.log("startSchedule PaymentBonusTransaction");

  _startCronSchedule();
}

module.exports = {
  startSchedule,
};
