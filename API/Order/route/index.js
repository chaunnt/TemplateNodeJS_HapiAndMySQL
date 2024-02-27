/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const OrderRoute = require('./OrderRoute');

module.exports = [
  // { method: 'POST', path: '/Order/insert', config: OrderRoute.insert },
  // { method: 'POST', path: '/Order/find', config: OrderRoute.find },
  // { method: 'POST', path: '/Order/findById', config: OrderRoute.findById },
  // { method: 'POST', path: '/Order/updateById', config: OrderRoute.updateById },
  // { method: 'POST', path: '/Order/deleteById', config: OrderRoute.deleteById },

  { method: 'POST', path: '/Order/user/getOrderByRef', config: OrderRoute.userGetOrderByRef },
  { method: 'POST', path: '/Order/user/getInspectionFee', config: OrderRoute.userGetInspectionFee },
  { method: 'POST', path: '/Order/user/getRoadFee', config: OrderRoute.userGetRoadFee },
  { method: 'POST', path: '/Order/user/getInsuranceFee', config: OrderRoute.userGetInsuranceFee },
];
