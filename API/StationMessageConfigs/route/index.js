/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationMessageConfigs = require('./StationMessageConfigsRoute');

module.exports = [
  {
    method: 'POST',
    path: '/StationMessageConfigs/advanceUser/getStationMessageConfigs',
    config: StationMessageConfigs.advanceUserGetStationMessageConfigs,
  },
  {
    method: 'POST',
    path: '/StationMessageConfigs/advanceUser/updateStationMessageConfigs',
    config: StationMessageConfigs.advanceUserUpdateStationMessageConfigs,
  },
];
