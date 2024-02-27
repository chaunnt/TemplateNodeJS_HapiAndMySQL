/* Copyright (c) 2022-2024 Reminano */

const MaintainRoute = require('./MaintainRoute');

module.exports = [
  { method: 'POST', path: '/Maintain/getSystemStatus', config: MaintainRoute.getSystemStatus },
  { method: 'POST', path: '/Maintain/maintainAll', config: MaintainRoute.maintainAll },
  { method: 'POST', path: '/Maintain/maintainSignIn', config: MaintainRoute.maintainSignIn },
  { method: 'POST', path: '/Maintain/maintainSignup', config: MaintainRoute.maintainSignup },
  { method: 'POST', path: '/Maintain/maintainLiveGame', config: MaintainRoute.maintainLiveGame },
  { method: 'POST', path: '/Maintain/maintainDeposit', config: MaintainRoute.maintainDeposit },
  { method: 'POST', path: '/Maintain/maintainWithdraw', config: MaintainRoute.maintainWithdraw },
  { method: 'POST', path: '/Maintain/maintainChangePassword', config: MaintainRoute.maintainChangePassword },
  { method: 'POST', path: '/Maintain/maintainForgotPassword', config: MaintainRoute.maintainForgotPassword },
];
