/* Copyright (c) 2022-2023 Reminano */

const Statistical = require('./StatisticalRoute');

module.exports = [
  { method: 'POST', path: '/Statistical/generalReport', config: Statistical.generalReport },
  { method: 'POST', path: '/Statistical/getUserDetailReport', config: Statistical.getUserDetailReport },
  // { method: 'POST', path: '/Statistical/summaryUserPayment', config: Statistical.summaryUserPayment },
  // { method: 'POST', path: '/Statistical/summaryUserReport', config: Statistical.summaryUserReport },
  // { method: 'POST', path: '/Statistical/paymentStatisticCount', config: Statistical.getPaymentStatisticCount },
];
