/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationMessageReportRoute = require('./StationMessageReportRoute');

module.exports = [
  // { method: 'POST', path: '/StationMessageReportRoute/update', config: StationMessageReportRoute.update },
  { method: 'POST', path: '/StationMessageReportRoute/getReportList', config: StationMessageReportRoute.getReportList },
  { method: 'POST', path: '/StationMessageReportRoute/advanceUser/getReportList', config: StationMessageReportRoute.advanceUserGetReportList },
];
