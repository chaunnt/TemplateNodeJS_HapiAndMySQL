/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerCheckExpireDateBHTVFunction = require('./UserVehicleCheckingExpireDateBHTV');

async function autoCheckingExpireDateBHTV() {
  await CustomerCheckExpireDateBHTVFunction.checkingUserVehicleExpireDateBHTV();
  process.exit();
}

autoCheckingExpireDateBHTV();

module.exports = {
  autoCheckingExpireDateBHTV,
};
