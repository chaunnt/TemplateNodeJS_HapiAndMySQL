/* Copyright (c) 2022-2023 Reminano */

const AppUserMonthlyReport = require('./AppUserMonthlyReportRoute');

module.exports = [
  //Payment Deposit  APIs
  { method: 'POST', path: '/AppUserMonthlyReport/insert', config: AppUserMonthlyReport.insert },
  { method: 'POST', path: '/AppUserMonthlyReport/find', config: AppUserMonthlyReport.find },
  { method: 'POST', path: '/AppUserMonthlyReport/updateById', config: AppUserMonthlyReport.updateById },
  { method: 'POST', path: '/AppUserMonthlyReport/findById', config: AppUserMonthlyReport.findById },
  { method: 'POST', path: '/AppUserMonthlyReport/deleteById', config: AppUserMonthlyReport.deleteById },
  { method: 'POST', path: '/AppUserMonthlyReport/approveBonusTransaction', config: AppUserMonthlyReport.approveBonusTransaction },
  { method: 'POST', path: '/AppUserMonthlyReport/denyBonusTransaction', config: AppUserMonthlyReport.denyBonusTransaction },
  {
    method: 'POST',
    path: '/AppUserMonthlyReport/getWaitingApproveCount',
    config: AppUserMonthlyReport.getWaitingApproveCount,
  },
  // { method: 'POST', path: '/AppUserMonthlyReport/user/summaryBonusByStatus', config: PaymentBonusTransaction_UserRoute.userSummaryBonusByStatus },
];
