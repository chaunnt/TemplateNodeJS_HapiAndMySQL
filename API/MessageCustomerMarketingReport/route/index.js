/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const MessageCustomerMarketingReportRouter = require('./MessageCustomerMarketingReportRoute');

module.exports = [
  //API danh cho nhan vien tram
  {
    method: 'POST',
    path: '/MessageCustomerMarketingReport/advanceUser/getTodayReport',
    config: MessageCustomerMarketingReportRouter.advanceUserGetTodayReport,
  },

  {
    method: 'POST',
    path: '/MessageCustomerMarketingReport/advanceUser/getStationReport',
    config: MessageCustomerMarketingReportRouter.advanceUserGetStationReport,
  },
];
