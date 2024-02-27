/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const StationPayment = require('./StationPaymentConfigsRoute');

module.exports = [
  { method: 'POST', path: '/StationPaymentConfigs/findById', config: StationPayment.findById },
  { method: 'POST', path: '/StationPaymentConfigs/find', config: StationPayment.find },
  // { method: 'POST', path: '/StationPaymentConfigs/insert', config: StationPayment.insert }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationPaymentConfigs/updateById', config: StationPayment.updateById }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationPaymentConfigs/deleteById', config: StationPayment.deleteById }, // Tạm thời chưa được sử dụng

  { method: 'POST', path: '/StationPaymentConfigs/user/getPaymentConfigByStation', config: StationPayment.userGetPaymentConfigByStation },

  { method: 'POST', path: '/StationPaymentConfigs/advanceUser/detail', config: StationPayment.advanceUserGetPaymentConfigs },
  { method: 'POST', path: '/StationPaymentConfigs/advanceUser/updateBankConfigs', config: StationPayment.advanceUserUpdateBankConfigs },
  {
    method: 'POST',
    path: '/StationPaymentConfigs/advanceUser/updateMomoPersonalConfigs',
    config: StationPayment.advanceUserUpdateMomoPersonalConfigs,
  },
  {
    method: 'POST',
    path: '/StationPaymentConfigs/advanceUser/updateMomoBusinessConfigs',
    config: StationPayment.advanceUserUpdateMomoBusinessConfigs,
  },

  // { method: 'POST', path: '/StationPaymentConfigs/advanceUser/insert', config: StationPayment.advanceUserInsert }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationPaymentConfigs/advanceUser/delete', config: StationPayment.advanceUserDeleteById },  // Tạm thời chưa được sử dụng
  //// Tạm thời chưa được sử dụng
  // {
  //   method: 'POST',
  //   path: '/StationPaymentConfigs/advanceUser/updateZaloPayPersonalConfigs',
  //   config: StationPayment.advanceUserUpdateZaloPayPersonalConfigs,
  // },
  // {
  //   method: 'POST',
  //   path: '/StationPaymentConfigs/advanceUser/updateZaloPayBusinessConfigs',
  //   config: StationPayment.advanceUserUpdateZaloPayBusinessConfigs,
  // },
  // {
  //   method: 'POST',
  //   path: '/StationPaymentConfigs/advanceUser/updateVnPayPersonalConfigs',
  //   config: StationPayment.advanceUserUpdateVnPayPersonalConfigs,
  // },
  // {
  //   method: 'POST',
  //   path: '/StationPaymentConfigs/advanceUser/updateVnPayBusinessConfigs',
  //   config: StationPayment.advanceUserUpdateVnPayBusinessConfigs,
  // },
];
