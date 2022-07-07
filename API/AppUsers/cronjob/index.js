const {CronInstance, executeJob} = require("../../ThirdParty/Cronjob/CronInstance");

const weeklyScheduler = () => {
  CronInstance.schedule('1 0 * * 1', async function() {
    executeJob('./User/cronjob/updateMemberLevelForAllUser.js');
  });
};

async function startSchedule(){
  console.log("start UserSchedule");
  weeklyScheduler();
}

module.exports = {
  startSchedule,
};
