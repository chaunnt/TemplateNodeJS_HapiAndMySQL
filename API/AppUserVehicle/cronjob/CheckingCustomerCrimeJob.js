/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerCheckCrimeFunction = require('./AppUserVehicleCheckingCrime');

async function autoCheckingCrime() {
  await CustomerCheckCrimeFunction.checkingCustomerViolations();
  process.exit();
}

autoCheckingCrime();

module.exports = {
  autoCheckingCrime,
};
