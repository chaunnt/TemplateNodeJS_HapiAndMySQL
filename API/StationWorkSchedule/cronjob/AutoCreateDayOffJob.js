/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CreateDayOffFunction = require('./StationWorkAutoCreateDayOff');

async function autoCreateDayOff() {
  await CreateDayOffFunction.autoCreateDayOffForStation();
  process.exit();
}

autoCreateDayOff();

module.exports = {
  autoCreateDayOff,
};
