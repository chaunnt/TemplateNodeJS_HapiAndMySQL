/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerStatistical = require('./CustomerStatisticalRoute');

module.exports = [
  { method: 'POST', path: '/CustomerStatistical/report', config: CustomerStatistical.reportCustomer },
  { method: 'POST', path: '/CustomerStatistical/advanceUser/report', config: CustomerStatistical.advanceUserReportCustomer },
  { method: 'POST', path: '/CustomerStatistical/reportAllStation', config: CustomerStatistical.reportAllStation },
];
