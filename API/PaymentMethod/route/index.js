/* Copyright (c) 2022-2024 Reminano */

const PaymentMethod = require('./PaymentMethodRoute');

module.exports = [
  //PaymentMethod APIs
  { method: 'POST', path: '/PaymentMethod/insert', config: PaymentMethod.insert },
  { method: 'POST', path: '/PaymentMethod/find', config: PaymentMethod.find },
  { method: 'POST', path: '/PaymentMethod/findById', config: PaymentMethod.findById },
  { method: 'POST', path: '/PaymentMethod/updateById', config: PaymentMethod.updateById },
  { method: 'POST', path: '/PaymentMethod/deleteById', config: PaymentMethod.deleteById },
  { method: 'POST', path: '/PaymentMethod/user/getSystemPaymentMethods', config: PaymentMethod.getList },
  { method: 'POST', path: '/PaymentMethod/user/getPublicBankList', config: PaymentMethod.userGetPublicBankList },
  { method: 'POST', path: '/PaymentMethod/user/checkBankInfo', config: PaymentMethod.userCheckBankInfo },
  { method: 'POST', path: '/PaymentMethod/user/insert', config: PaymentMethod.userInsert },
  { method: 'POST', path: '/PaymentMethod/user/getUserPaymentMethods', config: PaymentMethod.getUserPaymentMethod },
  { method: 'POST', path: '/PaymentMethod/user/updateById', config: PaymentMethod.userUpdateById },
  { method: 'POST', path: '/PaymentMethod/user/deleteById', config: PaymentMethod.userDeleteById },
];
