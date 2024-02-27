/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const PaymentGateway = require('./PaymentGatewayRoute');

module.exports = [
  { method: 'POST', path: '/PaymentGateway/vnpay/makePaymentRequestVNPAY', config: PaymentGateway.makePaymentRequestVNPAY },
  { method: 'GET', path: '/PaymentGateway/vnpay/receivePaymentVNPAY', config: PaymentGateway.receivePaymentVNPAY },

  { method: 'POST', path: '/PaymentGateway/momo/makePaymentRequestMOMO', config: PaymentGateway.makePaymentRequestMOMO },
  { method: 'POST', path: '/PaymentGateway/momo/receivePaymentMOMO', config: PaymentGateway.receivePaymentMOMO },

  { method: 'POST', path: '/PaymentGateway/vnpay/advanceUser/makePaymentRequestVNPAY', config: PaymentGateway.advanceUserMakePaymentRequestVNPAY },
];
