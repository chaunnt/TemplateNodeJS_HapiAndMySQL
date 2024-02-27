/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationWorkingHours = require('./StationWorkingHoursRoute');

module.exports = [
  { method: 'POST', path: '/StationWorkingHours/advanceUser/findByStationId', config: StationWorkingHours.findByStationId },
  { method: 'POST', path: '/StationWorkingHours/advanceUser/updateById', config: StationWorkingHours.updateById },
];
