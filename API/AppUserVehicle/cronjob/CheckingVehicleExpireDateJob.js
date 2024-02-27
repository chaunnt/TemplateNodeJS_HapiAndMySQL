/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerCheckExpireDateFunction = require('./UserVehicleCheckingExpireDate');

async function autoCheckingExpireDate() {
  await CustomerCheckExpireDateFunction.checkingUserVehicleExpireDate();
  process.exit();
}

autoCheckingExpireDate();

module.exports = {
  autoCheckingExpireDate,
};
