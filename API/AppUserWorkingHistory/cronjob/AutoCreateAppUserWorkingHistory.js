/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserWorkingHistoryAutoCreate = require('./AppUserWorkingHistoryAutoCreate');

async function autoCreateAppUserWorkingHistory() {
  await AppUserWorkingHistoryAutoCreate.autoCreateWorkingHistory();
  process.exit();
}

autoCreateAppUserWorkingHistory();

module.exports = {
  autoCreateAppUserWorkingHistory,
};
