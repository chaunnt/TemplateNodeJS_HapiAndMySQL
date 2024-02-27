/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserWorkingHistory = require('./AppUserWorkingHistoryRoute');

module.exports = [
  {
    method: 'POST',
    path: '/AppUserWorkingHistory/advanceUser/createAppUserWorkingHistory',
    config: AppUserWorkingHistory.advanceCreateAppUserWorkingHistory,
  },
  {
    method: 'POST',
    path: '/AppUserWorkingHistory/advanceUser/getListWorkingHistory',
    config: AppUserWorkingHistory.advanceUserGetListWorkingHistory,
  },
  {
    method: 'POST',
    path: '/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory',
    config: AppUserWorkingHistory.advanceUserGetDetailWorkingHistory,
  },
  {
    method: 'POST',
    path: '/AppUserWorkingHistory/advanceUser/approvedWorkingHistory',
    config: AppUserWorkingHistory.advanceUserApprovedWorkingHistory,
  },
  { method: 'POST', path: '/AppUserWorkingHistory/advanceUser/cancelWorkingHistory', config: AppUserWorkingHistory.advanceUserCancelWorkingHistory },
];
