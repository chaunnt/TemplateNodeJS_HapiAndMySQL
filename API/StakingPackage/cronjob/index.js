const { calculateProfit } = require("./updateStakingPackagesJob");

const { CronInstance, executeJob } = require("../../../ThirdParty/Cronjob/CronInstance");

const dailyPayment = () => {
  //every monday at 1:00
  CronInstance.schedule('0 2 * * *', async function() {
    calculateProfit();
  });
};

async function startSchedule(){
  console.log("start StakingPackage schedule");
  dailyPayment();
}

module.exports = {
  startSchedule,
};
