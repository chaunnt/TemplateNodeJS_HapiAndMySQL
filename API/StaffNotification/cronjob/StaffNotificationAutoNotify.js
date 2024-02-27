/* Copyright (c) 2022 Reminano */

const GenerateStaffNotificationJob = require('./GenerateStaffNotificationJob');

async function autoNotify() {
  await GenerateStaffNotificationJob.checkExpiredTask();
  process.exit();
}
autoNotify();
module.exports = {
  autoNotify,
};
