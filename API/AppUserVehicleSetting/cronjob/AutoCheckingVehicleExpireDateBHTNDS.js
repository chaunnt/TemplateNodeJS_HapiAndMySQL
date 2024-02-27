/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerCheckExpireDateBHTNDSFunction = require('./UserVehicleCheckingExpireDateBHTNDS');

async function autoCheckingExpireDateBHTNDS() {
  await CustomerCheckExpireDateBHTNDSFunction.checkingUserVehicleExpireDateBHTNDS();
  process.exit();
}

autoCheckingExpireDateBHTNDS();

module.exports = {
  autoCheckingExpireDateBHTNDS,
};
